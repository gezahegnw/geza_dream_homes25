import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchListings, fetchListingById } from '@/lib/listings';
import { sendEmail } from '@/lib/resend';

// Default price drop threshold if user hasn't set preferences
const DEFAULT_PRICE_DROP_THRESHOLD = 0.05; // 5%

async function getUserPreferences(userId: string) {
  const prefs = await prisma.notificationPreference.findUnique({
    where: { user_id: userId },
  });
  
  // Return defaults if no preferences exist
  return {
    email_new_listings: prefs?.email_new_listings ?? true,
    email_price_drops: prefs?.email_price_drops ?? true,
    email_status_changes: prefs?.email_status_changes ?? true,
    price_drop_threshold: (prefs?.price_drop_threshold ?? 5) / 100, // Convert percentage to decimal
    digest_mode: prefs?.digest_mode ?? 'immediate',
  };
}

export async function GET(req: Request) {
  // Secure the endpoint
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = {
      newListings: 0,
      priceDrops: 0,
      statusChanges: 0,
      emailsSent: 0,
      skipped: 0,
    };

    // 1. Check for new listings from saved searches
    const savedSearches = await prisma.savedSearch.findMany({ 
      include: { user: true } 
    });

    for (const search of savedSearches) {
      // Get user preferences
      const prefs = await getUserPreferences(search.userId);
      
      // Skip if user doesn't want new listing notifications
      if (!prefs.email_new_listings) {
        results.skipped++;
        // Still update last_run so we don't check again unnecessarily
        await prisma.savedSearch.update({
          where: { id: search.id },
          data: { last_run: new Date() },
        });
        continue;
      }
      
      const filters = search.filters as any;
      
      const listings = await fetchListings({
        q: filters.q,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        beds: filters.beds,
        baths: filters.baths,
      });

      // Filter for new listings (not seen before)
      const newListings = listings.filter(l => !search.last_run || new Date(l.id) > search.last_run);

      if (newListings.length > 0) {
        await sendEmail({
          to: search.user.email,
          subject: `🏠 New Listings for Your '${search.name}' Search!`,
          html: `<h1>New Listings Found!</h1>
                 <p>We found ${newListings.length} new properties that match your saved search '${search.name}'.</p>
                 <ul>
                   ${newListings.map(l => `<li><a href="https://gezadreamhomes.com/listings/${l.id}">${l.address}</a> - $${l.price?.toLocaleString()}</li>`).join('')}
                 </ul>
                 <p>Visit <a href="https://gezadreamhomes.com">Geza Dream Homes</a> to see more!</p>`,
        });
        
        // Record notifications
        for (const listing of newListings) {
          await prisma.notification.create({
            data: {
              user_id: search.userId,
              type: 'new_listing',
              property_id: listing.id,
              title: 'New Listing Alert',
              message: `${listing.address} - $${listing.price?.toLocaleString()}`,
            },
          });
        }
        
        results.newListings += newListings.length;
        results.emailsSent++;
      }

      // Update the last_run timestamp
      await prisma.savedSearch.update({
        where: { id: search.id },
        data: { last_run: new Date() },
      });
    }

    // 2. Check for price drops and status changes on favorited properties
    // Group favorites by user to respect their individual preferences
    const favorites = await prisma.favorite.findMany({
      include: { user: true },
    });

    // Group by user
    const favoritesByUser = favorites.reduce((acc, fav) => {
      if (!acc[fav.user_id]) acc[fav.user_id] = [];
      acc[fav.user_id].push(fav);
      return acc;
    }, {} as Record<string, typeof favorites>);

    for (const [userId, userFavorites] of Object.entries(favoritesByUser)) {
      // Get user preferences
      const prefs = await getUserPreferences(userId);
      
      // Skip processing if user disabled all favorite-related notifications
      if (!prefs.email_price_drops && !prefs.email_status_changes) {
        results.skipped += userFavorites.length;
        continue;
      }

      for (const favorite of userFavorites) {
        const currentListing = await fetchListingById(favorite.property_id);
        if (!currentListing) continue;

        // Get last tracked state
        const lastTracking = await prisma.propertyTracking.findFirst({
          where: { property_id: favorite.property_id },
          orderBy: { tracked_at: 'desc' },
        });

        // Track current state
        await prisma.propertyTracking.create({
          data: {
            property_id: favorite.property_id,
            price: currentListing.price,
            status: currentListing.status,
          },
        });

        if (lastTracking) {
          // Check for price drop (if user enabled)
          if (prefs.email_price_drops && lastTracking.price && currentListing.price) {
            const priceDrop = lastTracking.price - currentListing.price;
            const dropPercentage = priceDrop / lastTracking.price;

            // Use user's custom threshold
            if (priceDrop > 0 && dropPercentage >= prefs.price_drop_threshold) {
              await sendEmail({
                to: favorite.user.email,
                subject: `💰 Price Drop Alert: ${currentListing.address}`,
                html: `<h1>Price Drop Alert!</h1>
                       <p>Good news! A property you're interested in has dropped in price.</p>
                       <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                         <h2>${currentListing.address}</h2>
                         <p><strong>Previous Price:</strong> $${lastTracking.price.toLocaleString()}</p>
                         <p><strong>New Price:</strong> $${currentListing.price.toLocaleString()}</p>
                         <p style="color: #059669; font-size: 1.2em;"><strong>You save: $${priceDrop.toLocaleString()} (${Math.round(dropPercentage * 100)}%)</strong></p>
                         <a href="https://gezadreamhomes.com/listings/${currentListing.id}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Property</a>
                       </div>
                       <p>Visit <a href="https://gezadreamhomes.com">Geza Dream Homes</a> to see more details!</p>`,
              });

              await prisma.notification.create({
                data: {
                  user_id: favorite.user_id,
                  type: 'price_drop',
                  property_id: favorite.property_id,
                  title: 'Price Drop Alert',
                  message: `${currentListing.address} dropped from $${lastTracking.price.toLocaleString()} to $${currentListing.price.toLocaleString()}`,
                },
              });

              results.priceDrops++;
              results.emailsSent++;
            }
          }

          // Check for status change (if user enabled)
          if (prefs.email_status_changes && lastTracking.status && currentListing.status && lastTracking.status !== currentListing.status) {
            await sendEmail({
              to: favorite.user.email,
              subject: `📊 Status Update: ${currentListing.address}`,
              html: `<h1>Property Status Changed</h1>
                     <p>A property you're following has a status update.</p>
                     <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                       <h2>${currentListing.address}</h2>
                       <p><strong>Previous Status:</strong> ${lastTracking.status}</p>
                       <p><strong>New Status:</strong> ${currentListing.status}</p>
                       <a href="https://gezadreamhomes.com/listings/${currentListing.id}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">View Property</a>
                     </div>
                     <p>Visit <a href="https://gezadreamhomes.com">Geza Dream Homes</a> to see more details!</p>`,
            });

            await prisma.notification.create({
              data: {
                user_id: favorite.user_id,
                type: 'status_change',
                property_id: favorite.property_id,
                title: 'Status Change Alert',
                message: `${currentListing.address} changed from ${lastTracking.status} to ${currentListing.status}`,
              },
            });

            results.statusChanges++;
            results.emailsSent++;
          }
        }
      }
    }

    return NextResponse.json({ 
      ok: true, 
      message: `Processed ${savedSearches.length} saved searches, ${favorites.length} favorites.`,
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Cron job failed', details: String(error) }, { status: 500 });
  }
}
