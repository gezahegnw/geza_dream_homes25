import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchListings, fetchListingById } from '@/lib/listings';
import { sendEmail } from '@/lib/resend';

const PRICE_DROP_THRESHOLD = 0.05; // 5% price drop threshold

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
    };

    // 1. Check for new listings from saved searches
    const savedSearches = await prisma.savedSearch.findMany({ include: { user: true } });

    for (const search of savedSearches) {
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
    const favorites = await prisma.favorite.findMany({
      include: { user: true },
      distinct: ['property_id'],
    });

    for (const favorite of favorites) {
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
        // Check for price drop
        if (lastTracking.price && currentListing.price) {
          const priceDrop = lastTracking.price - currentListing.price;
          const dropPercentage = priceDrop / lastTracking.price;

          if (priceDrop > 0 && dropPercentage >= PRICE_DROP_THRESHOLD) {
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

        // Check for status change (e.g., Pending, Sold)
        if (lastTracking.status && currentListing.status && lastTracking.status !== currentListing.status) {
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
