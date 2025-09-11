# Geza Dream Homes - Admin User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Admin Dashboard Access](#admin-dashboard-access)
3. [Managing Reviews](#managing-reviews)
4. [Managing Users](#managing-users)
5. [Managing Leads](#managing-leads)
6. [Content Management](#content-management)
7. [Environment Configuration](#environment-configuration)
8. [Database Management](#database-management)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## Getting Started

### Prerequisites
- Admin access credentials
- Understanding of basic web administration
- Access to hosting platform (Vercel, Netlify, etc.)
- Database access (if needed)

### Admin Login
1. Navigate to your website's admin login page: `https://yourdomain.com/admin/login`
2. Enter your admin credentials
3. You'll be redirected to the admin dashboard

---

## Admin Dashboard Access

### Setting Up Admin Access
Your admin system uses token-based authentication. To set up admin access:

1. **Set Admin Token** in your environment variables:
   ```
   ADMIN_TOKEN=your-secure-admin-token-here
   ```

2. **Access Admin Areas**:
   - Admin Dashboard: `/admin`
   - User Management: `/admin/users`
   - Review Management: `/admin/reviews`
   - Lead Management: `/admin/leads`

### Admin Authentication
- Admin areas require the `ADMIN_TOKEN` to be set in environment variables
- Users must be authenticated and approved to access most features
- Admin areas are protected by additional token verification

---

## Managing Reviews

### Review Approval System
Reviews require admin approval before appearing publicly when `REVIEW_REQUIRE_APPROVAL=true`.

#### Approving Reviews
1. Go to `/admin/reviews`
2. View pending reviews (marked as "Not Approved")
3. Click "Approve" to make reviews public
4. Click "Delete" to remove inappropriate reviews

#### Review Management Features
- **View All Reviews**: See both approved and pending reviews
- **Bulk Actions**: Approve or delete multiple reviews at once
- **Review Details**: View full review content, ratings, and user information
- **Moderation**: Remove spam or inappropriate content

#### Review Settings
Configure in environment variables:
```
REVIEW_REQUIRE_APPROVAL=true  # Require admin approval
```

---

## Managing Users

### User Approval System
New user registrations require admin approval before they can access listings.

#### Approving Users
1. Navigate to `/admin/users`
2. View pending user registrations
3. Review user information (name, email, etc.)
4. Click "Approve" to grant access
5. Click "Delete" to remove unwanted registrations

#### User Management Features
- **View All Users**: See approved and pending users
- **User Details**: View registration information
- **Access Control**: Grant or revoke user access
- **User Activity**: Monitor user engagement

---

## Managing Leads

### Lead Management System
Contact form submissions and inquiries are captured as leads.

#### Viewing Leads
1. Go to `/admin/leads`
2. View all contact form submissions
3. See lead details: name, email, phone, message
4. Track lead status and follow-up actions

#### Lead Features
- **Contact Information**: Full contact details
- **Message Content**: View inquiry messages
- **Timestamps**: See when leads were submitted
- **Export Options**: Download lead data for CRM systems

---

## Content Management

### Photo Management
Your website displays property photos from the `/public/Photos/` directory.

#### Adding New Photos
1. Upload images to `/public/Photos/` directory
2. Use descriptive filenames (e.g., `home75.jpg`)
3. Supported formats: JPG, PNG, AVIF
4. Recommended size: 1200x800px or larger

#### Photo Organization
- **Hero Slider**: Photos automatically appear in the homepage slider
- **Property Listings**: Photos are used in listing displays
- **Optimization**: Compress images for faster loading

### Personal Photos
Your agent photos are stored in `/public/MyPhotos/`:
- `geza.jpg` - Main profile photo
- `geza2.jpg`, `geza3.jpg`, etc. - Additional photos

---

## Environment Configuration

### Production Environment Variables
Configure these in your hosting platform:

#### Required Settings
```
# Database
DATABASE_URL=your-production-database-url

# Authentication
AUTH_JWT_SECRET=your-long-random-jwt-secret
ADMIN_TOKEN=your-secure-admin-token

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Reviews
REVIEW_REQUIRE_APPROVAL=true

# reCAPTCHA (for spam protection)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key

# Real Estate API (choose one)
LISTINGS_PROVIDER=rapidapi_redfin
RAPIDAPI_REDFIN_KEY=your-api-key
RAPIDAPI_REDFIN_HOST=redfin-com-data.p.rapidapi.com
REDFIN_SEARCH_TYPE=sale
REDFIN_DEFAULT_LOCATION=Kansas City, MO

# Email Notifications
RESEND_API_KEY=your-resend-api-key
LEAD_NOTIFICATION_EMAIL=your-email@example.com
```

#### Optional Settings
```
# Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your-maps-api-key

# Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

---

## Database Management

### Database Operations
Your website uses Prisma with SQLite (development) or PostgreSQL (production).

#### Common Database Tasks
1. **View Data**: Use database management tools or Prisma Studio
2. **Backup Data**: Regular database backups are essential
3. **Migrations**: Database schema changes are handled automatically

#### Database Schema
- **Users**: User accounts and approval status
- **Reviews**: Customer reviews and ratings
- **Favorites**: User-saved property listings
- **Leads**: Contact form submissions

### Backup Strategy
1. **Automated Backups**: Set up regular database backups
2. **Export Data**: Regularly export important data
3. **Version Control**: Keep database migrations in version control

---

## Troubleshooting

### Common Issues

#### Users Can't Access Listings
- **Check**: User approval status in `/admin/users`
- **Solution**: Approve pending users

#### Reviews Not Appearing
- **Check**: `REVIEW_REQUIRE_APPROVAL` setting
- **Solution**: Approve reviews in `/admin/reviews`

#### API Errors (Listings Not Loading)
- **Check**: API key validity and quota
- **Check**: Environment variables are set correctly
- **Solution**: Verify API credentials and endpoints

#### reCAPTCHA Issues
- **Check**: Site key and secret key are correct
- **Check**: Domain is registered with reCAPTCHA
- **Solution**: Verify reCAPTCHA configuration

### Error Monitoring
1. **Check Server Logs**: Monitor application logs
2. **Database Errors**: Check database connection and queries
3. **API Failures**: Monitor third-party API responses

---

## Security Best Practices

### Environment Security
1. **Never commit `.env.local`** to version control
2. **Use strong passwords** for admin tokens
3. **Regularly rotate API keys** and secrets
4. **Enable HTTPS** in production

### User Data Protection
1. **Secure user information** in the database
2. **Implement proper authentication** for all admin areas
3. **Regular security updates** for dependencies
4. **Monitor for suspicious activity**

### Access Control
1. **Limit admin access** to necessary personnel only
2. **Use strong admin tokens** (32+ characters)
3. **Regular access reviews** and user cleanup
4. **Monitor admin activity** logs

---

## Daily Operations Checklist

### Daily Tasks
- [ ] Check new user registrations (`/admin/users`)
- [ ] Review and approve new reviews (`/admin/reviews`)
- [ ] Check new leads (`/admin/leads`)
- [ ] Monitor website performance

### Weekly Tasks
- [ ] Review user activity and engagement
- [ ] Check API usage and quotas
- [ ] Update property photos if needed
- [ ] Review security logs

### Monthly Tasks
- [ ] Database backup verification
- [ ] Security updates and patches
- [ ] Performance optimization review
- [ ] Analytics and traffic review

---

## Support and Maintenance

### Getting Help
1. **Documentation**: Refer to this manual and code comments
2. **Logs**: Check application and server logs for errors
3. **Community**: Next.js and Prisma documentation
4. **Professional Support**: Contact your developer for complex issues

### Maintenance Schedule
- **Daily**: Monitor operations and respond to leads
- **Weekly**: Content updates and user management
- **Monthly**: Security updates and performance review
- **Quarterly**: Full system review and optimization

---

## Contact Information

**Website**: https://yourdomain.com
**Admin Panel**: https://yourdomain.com/admin
**Support Email**: gworku@remax.net
**Phone**: +1-913-407-8620

---

*This manual covers the essential administrative functions of your Geza Dream Homes website. Keep this document updated as you add new features or make changes to the system.*
