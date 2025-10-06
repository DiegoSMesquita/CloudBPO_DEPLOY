# Financial Management System - Deployment Guide

## Overview
This guide provides complete technical instructions for deploying the Financial Management System to your own domain (www.cloudbpo.com) and setting up development/production environments.

## System Architecture

### Current Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database + Authentication + Storage)
- **Build Tool**: Vite
- **Deployment**: Static hosting compatible

## Deployment Options

### Option 1: Static Hosting (Recommended)
Since this is a React SPA (Single Page Application), you can deploy to:
- **Vercel** (Recommended - Easy integration with GitHub)
- **Netlify** 
- **AWS S3 + CloudFront**
- **Traditional Web Hosting** (cPanel/Shared hosting)

### Option 2: VPS/Dedicated Server
- **DigitalOcean Droplet**
- **AWS EC2**
- **Google Cloud Compute**
- **Traditional VPS providers**

## Step-by-Step Deployment Process

### Phase 1: Prepare the Application

#### 1.1 Environment Configuration
Create production environment file:
```bash
# .env.production
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
VITE_APP_ENV=production
```

#### 1.2 Build the Application
```bash
# Install dependencies
npm install

# Build for production
npm run build

# This creates a 'dist' folder with all static files
```

### Phase 2: Domain Setup

#### 2.1 DNS Configuration
Point your domain to your hosting provider:
```
Type: A Record
Name: @
Value: [Your server IP]

Type: CNAME
Name: www
Value: cloudbpo.com
```

#### 2.2 SSL Certificate
- Most hosting providers offer free SSL (Let's Encrypt)
- Ensure HTTPS is enabled for security

### Phase 3: Deployment Methods

#### Method A: Vercel Deployment (Easiest)
1. Push code to GitHub repository
2. Connect Vercel to your GitHub account
3. Import the repository
4. Configure environment variables in Vercel dashboard
5. Set custom domain to www.cloudbpo.com
6. Deploy automatically

#### Method B: Traditional Web Hosting
1. Build the application locally (`npm run build`)
2. Upload contents of `dist` folder to your hosting's public_html
3. Configure .htaccess for SPA routing:
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

#### Method C: VPS Server Setup
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt update
sudo apt install nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/cloudbpo.com
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name cloudbpo.com www.cloudbpo.com;
    
    root /var/www/cloudbpo/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Development & Production Environment Setup

### Development Environment
```bash
# Clone repository
git clone [your-repo-url]
cd financial-management-system

# Install dependencies
npm install

# Create development environment file
cp .env.example .env.local

# Start development server
npm run dev
```

### Staging Environment
Create a staging branch and deploy to subdomain:
- staging.cloudbpo.com
- test.cloudbpo.com

### Production Environment
- Main domain: www.cloudbpo.com
- Automated deployment from main branch

## Database Setup (Supabase)

### Production Database
1. Create new Supabase project for production
2. Import your database schema
3. Configure Row Level Security (RLS)
4. Set up database backups

### Environment Separation
```
Development: Local Supabase or Dev project
Staging: Staging Supabase project  
Production: Production Supabase project
```

## CI/CD Pipeline Setup

### GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## Monitoring & Maintenance

### Application Monitoring
- **Error Tracking**: Sentry integration
- **Analytics**: Google Analytics
- **Performance**: Web Vitals monitoring
- **Uptime**: UptimeRobot or similar

### Backup Strategy
- **Database**: Automated Supabase backups
- **Code**: Git repository
- **Assets**: Cloud storage backup

## Security Considerations

### Production Security Checklist
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database RLS configured
- [ ] API rate limiting
- [ ] CORS properly configured
- [ ] Security headers implemented

### Security Headers (Nginx)
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

## Cost Estimation

### Monthly Costs (Approximate)
- **Vercel Pro**: $20/month
- **Supabase Pro**: $25/month  
- **Domain**: $10-15/year
- **Total**: ~$45-50/month

### VPS Alternative
- **DigitalOcean Droplet**: $5-10/month
- **Domain**: $10-15/year
- **Total**: ~$5-10/month (requires more technical management)

## Support & Updates Workflow

### Making Changes
1. **Development**: Make changes in dev branch
2. **Testing**: Deploy to staging environment
3. **Review**: Code review process
4. **Production**: Deploy to main branch → auto-deploy to production

### Emergency Updates
- Hotfix branch → Direct production deployment
- Rollback capability through hosting provider

## Technical Requirements Summary

### Server Requirements (if using VPS)
- **OS**: Ubuntu 20.04 LTS or newer
- **RAM**: Minimum 1GB (2GB recommended)
- **Storage**: 20GB SSD
- **CPU**: 1 vCPU minimum
- **Bandwidth**: Unmetered preferred

### Domain Requirements
- Domain registrar access
- DNS management capability
- SSL certificate support

## Next Steps

1. **Choose deployment method** (Vercel recommended for simplicity)
2. **Set up production Supabase project**
3. **Configure domain DNS**
4. **Deploy application**
5. **Set up monitoring**
6. **Create development workflow**

## Support Contacts

For technical assistance with deployment:
- Create GitHub issues for code-related problems
- Contact hosting provider for infrastructure issues
- Supabase support for database issues

---

This guide provides everything needed to deploy your Financial Management System to www.cloudbpo.com with proper development and production environments.