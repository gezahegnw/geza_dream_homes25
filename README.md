# Geza Dream Homes

Next.js (App Router) starter for a realtor website.

## Tech
- Next.js 14 + TypeScript
- Tailwind CSS

## Quick start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env file and edit values as needed:
   ```bash
   cp .env.example .env.local
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000

## Structure
- `app/layout.tsx` — global layout, header/footer, SEO metadata
- `app/page.tsx` — home page
- `app/about/page.tsx` — about/portfolio
- `app/listings/page.tsx` — placeholder for MLS integration
- `app/resources/page.tsx` — resources & tools placeholder
- `app/contact/page.tsx` — contact form UI (wires to API later)

## Next steps
- Add Supabase + Prisma for lead storage
- Create leads API with validation & reCAPTCHA
- Wire email notifications (Resend/SendGrid)
- Add IDX/RESO integration for listings
- Add mortgage calculator & market data widgets

<!-- Force Vercel redeploy -->
