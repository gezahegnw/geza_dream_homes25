import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchListings } from '@/lib/listings';
import { sendEmail } from '@/lib/resend';

export async function GET(req: Request) {
  // Secure the endpoint
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const savedSearches = await prisma.savedSearch.findMany({ include: { user: true } });

    for (const search of savedSearches) {
      const filters = search.filters as any;
      
      // Fetch new listings based on the saved search filters
      const listings = await fetchListings({
        q: filters.q,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        beds: filters.beds,
        baths: filters.baths,
        // We only want listings created since the last run
        // This requires a 'created_since' filter in fetchListings, which we'll add.
      });

      if (listings.length > 0) {
        // Send email to the user
        await sendEmail({
          to: search.user.email,
          subject: `New Listings for Your '${search.name}' Search!`,
          html: `<h1>New Listings Found!</h1>
                 <p>We found ${listings.length} new properties that match your saved search '${search.name}'.</p>
                 <ul>
                   ${listings.map(l => `<li><a href="https://gezadreamhomes.com/listings/${l.id}">${l.address}</a> - $${l.price?.toLocaleString()}</li>`).join('')}
                 </ul>
                 <p>Visit Geza Dream Homes to see more!</p>`,
        });
      }

      // Update the last_run timestamp
      await prisma.savedSearch.update({
        where: { id: search.id },
        data: { last_run: new Date() },
      });
    }

    return NextResponse.json({ ok: true, message: `Processed ${savedSearches.length} saved searches.` });
  } catch (error) {
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
