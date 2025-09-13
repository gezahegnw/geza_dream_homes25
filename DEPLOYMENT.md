# Deployment Guide - Geza Dream Homes

## Phase 1: Production Deployment to Vercel

### Prerequisites
1. GitHub repository with your code
2. Vercel account (free)
3. Production database (Neon/Supabase recommended)

### Step 1: Environment Variables Setup

Create these environment variables in Vercel dashboard:

#### Required Variables
```
# Base URL (replace with your domain)
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Database (PostgreSQL)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# Admin Authentication
ADMIN_TOKEN=your-secure-admin-token-32-characters-minimum
AUTH_JWT_SECRET=your-jwt-secret-64-characters-minimum

# Real Estate API (Redfin)
LISTINGS_PROVIDER=rapidapi_redfin
RAPIDAPI_REDFIN_KEY=your-redfin-api-key
RAPIDAPI_REDFIN_HOST=redfin-com-data.p.rapidapi.com
REDFIN_SEARCH_TYPE=sale
REDFIN_DEFAULT_LOCATION=Kansas City, MO

# Email Notifications
RESEND_API_KEY=your-resend-api-key
LEAD_NOTIFICATION_EMAIL=your-email@example.com

# Google reCAPTCHA (optional but recommended)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SECRET_KEY=your-secret-key

# Review Moderation
REVIEW_REQUIRE_APPROVAL=true
```

### Step 2: Database Setup

#### Option A: Neon (Recommended - Free tier available)
1. Sign up at https://neon.tech
2. Create new project
3. Copy connection string to DATABASE_URL

#### Option B: Supabase
1. Sign up at https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy connection string to DATABASE_URL

### Step 3: Deploy to Vercel

1. **Connect GitHub Repository**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Add Environment Variables**
   - Go to Project Settings > Environment Variables
   - Add all variables from Step 1

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Step 4: Database Migration

After first deployment:
1. Go to Vercel project dashboard
2. Open Functions tab
3. Run database migration (or use Prisma Studio)

### Step 5: Domain Setup (Optional)

1. **Custom Domain**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **SSL Certificate**
   - Automatically provided by Vercel
   - No additional setup required

### Step 6: Post-Deployment Checklist

- [ ] Test homepage loads correctly
- [ ] Test property listings (API working)
- [ ] Test contact form submission
- [ ] Test admin login (/admin)
- [ ] Test photo upload system
- [ ] Test review submission with reCAPTCHA
- [ ] Verify email notifications working

### Monitoring & Maintenance

#### Performance Monitoring
- Use Vercel Analytics (free)
- Monitor function execution times
- Check error logs in Vercel dashboard

#### Regular Tasks
- Monitor API usage quotas
- Review and approve user registrations
- Backup database regularly
- Update dependencies monthly

### Troubleshooting

#### Common Issues
1. **Build Failures**: Check environment variables are set
2. **Database Connection**: Verify DATABASE_URL format
3. **API Errors**: Check API keys and quotas
4. **Image Loading**: Ensure proper Next.js Image configuration

#### Support Resources
- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Prisma Documentation: https://www.prisma.io/docs

### Cost Estimation

#### Monthly Costs (Phase 1)
- Vercel Hobby: $0/month
- Database (Neon): $0-10/month
- Email (Resend): $0-20/month
- APIs (RapidAPI): $0-10/month
- **Total: $0-40/month**

#### Scaling Costs (Phase 2)
- Vercel Pro: $20/month
- Database: $10-25/month
- CDN/Storage: $5-15/month
- **Total: $35-60/month**
