# 🚀 Production Deployment Guide

Complete guide for deploying the Inventory Management System to production.

## 📋 Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ database
- PM2 installed globally (`npm install -g pm2`)
- Domain name and SSL certificate (for HTTPS)
- Server with at least 2GB RAM

## 🔧 Backend Setup

### 1. Install Dependencies

```bash
cd Ethernet-CRM-pr-executive-management/server
npm install --production
```

### 2. Configure Environment Variables

```bash
# Copy the example file
cp PRODUCTION_ENV.md .env

# Edit .env with your production values
nano .env
```

**Required variables:**
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (generate secure random strings)
- `CORS_ORIGIN` (your frontend domain)
- `NODE_ENV=production`

### 3. Create Database

```sql
CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4. Run Migrations

Migrations run automatically on server startup, but you can also run manually:

```bash
npm run migrate
```

### 5. Start with PM2

```bash
# Start the application
npm run pm2:start

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Monitor
npm run pm2:monit
```

### 6. Setup Nginx (Reverse Proxy)

Create `/etc/nginx/sites-available/inventory-api`:

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/inventory-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
cd inventory_module
npm install
```

### 2. Configure Environment

```bash
# Create production environment file
cp PRODUCTION_ENV.md .env.production

# Edit with your backend API URL
nano .env.production
```

Set `VITE_API_BASE_URL=https://api.your-domain.com/api/v1`

### 3. Build for Production

```bash
npm run build:prod
```

This creates optimized production build in `dist/` folder.

### 4. Deploy Frontend

#### Option A: Static Hosting (Nginx)

```bash
# Copy build files
sudo cp -r dist/* /var/www/inventory/

# Configure Nginx
sudo nano /etc/nginx/sites-available/inventory-frontend
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/inventory;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Option B: CDN/Cloud Hosting

Upload `dist/` folder contents to:
- AWS S3 + CloudFront
- Vercel
- Netlify
- Cloudflare Pages

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly (only your domains)
- [ ] Set up firewall (only allow 80, 443, 22)
- [ ] Enable database SSL connections
- [ ] Regular security updates
- [ ] Set up log rotation
- [ ] Configure rate limiting
- [ ] Enable helmet security headers
- [ ] Regular database backups

## 📊 Monitoring

### PM2 Monitoring

```bash
# View real-time monitoring
npm run pm2:monit

# View logs
npm run pm2:logs

# Check status
npm run pm2:status
```

### Health Checks

```bash
# Backend health
curl https://api.your-domain.com/api/v1/health

# Metrics
curl https://api.your-domain.com/api/v1/metrics
```

## 🔄 Updates & Maintenance

### Update Backend

```bash
cd Ethernet-CRM-pr-executive-management/server
git pull
npm install --production
npm run pm2:restart
```

### Update Frontend

```bash
cd inventory_module
git pull
npm install
npm run build:prod
# Deploy dist/ folder
```

## 🗄️ Database Backups

### Automated Backup Script

Create `/usr/local/bin/backup-inventory-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/inventory"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="your_database_name"
DB_USER="your_db_user"
DB_PASS="your_db_password"

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-inventory-db.sh
```

## 🚨 Troubleshooting

### Server won't start

```bash
# Check logs
npm run pm2:logs

# Check database connection
mysql -u your_user -p -h your_host

# Verify environment variables
cat .env
```

### Frontend can't connect to API

1. Check CORS configuration in backend
2. Verify `VITE_API_BASE_URL` in frontend
3. Check browser console for errors
4. Verify API is accessible: `curl https://api.your-domain.com/api/v1/health`

### Database connection issues

1. Verify database credentials in `.env`
2. Check database is running: `systemctl status mysql`
3. Verify network connectivity
4. Check firewall rules

## 📝 Post-Deployment Checklist

- [ ] Backend API accessible
- [ ] Frontend loads correctly
- [ ] Login works
- [ ] Database migrations completed
- [ ] All API endpoints responding
- [ ] SSL certificate valid
- [ ] PM2 running and monitoring
- [ ] Logs being generated
- [ ] Backups configured
- [ ] Monitoring alerts set up

## 🎯 Performance Optimization

1. **Enable Gzip compression** (already in app.js)
2. **Use CDN for static assets**
3. **Enable database query caching**
4. **Optimize database indexes**
5. **Use Redis for session storage** (optional)
6. **Enable HTTP/2**
7. **Minify and bundle frontend assets** (Vite does this)

## 📞 Support

For issues or questions:
1. Check logs: `npm run pm2:logs`
2. Review error messages
3. Check database connectivity
4. Verify environment variables

---

**Production Ready! 🚀**

