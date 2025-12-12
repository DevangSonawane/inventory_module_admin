# Deployment Guide - Inventory Management System

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Database Configuration](#database-configuration)
5. [Environment Configuration](#environment-configuration)
6. [Production Deployment](#production-deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- PM2 (for production process management)
- Git

### Required Accounts/Services
- Database server access
- SMTP email account (optional, for email notifications)
- Domain/server for hosting (for production)

---

## Backend Setup

### 1. Install Dependencies
```bash
cd Ethernet-CRM-pr-executive-management/server
npm install
```

### 2. Environment Configuration
```bash
# Copy environment example
cp ENV_EXAMPLE.md .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
- `DB_HOST` - Database host (e.g., localhost)
- `DB_PORT` - Database port (default: 3306)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT tokens (min 32 characters)
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens (min 32 characters)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Frontend URL(s), comma-separated

**Optional Environment Variables:**
- `SMTP_HOST` - SMTP server for emails
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_FROM_EMAIL` - Sender email address
- `COMPANY_NAME` - Company name for email templates

### 3. Database Migration
The migration script runs automatically on server startup. To run manually:
```bash
npm run migrate
```

### 4. Start Server

**Development:**
```bash
npm run dev
```

**Production (with PM2):**
```bash
npm run pm2:start
```

**Check Status:**
```bash
npm run pm2:status
npm run pm2:logs
```

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd inventory_module
npm install
```

### 2. Environment Configuration
```bash
# Copy environment example
cp .env.example .env

# Edit .env with your API URL
nano .env
```

**Required Environment Variables:**
- `VITE_API_BASE_URL` - Backend API URL (e.g., http://localhost:3000/api/v1)

### 3. Build for Production
```bash
npm run build:prod
```

The build output will be in the `dist/` directory.

### 4. Serve Frontend

**Development:**
```bash
npm run dev
```

**Production:**
Deploy the `dist/` folder to your web server (nginx, Apache, or static hosting service).

---

## Database Configuration

### 1. Create Database
```sql
CREATE DATABASE your_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Create Database User (Recommended)
```sql
CREATE USER 'your_db_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON your_database_name.* TO 'your_db_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Run Migrations
Migrations run automatically on server startup. The system will:
- Create all required tables
- Add necessary columns
- Create indexes
- Set up foreign keys

**Note:** Migrations are idempotent - safe to run multiple times.

---

## Environment Configuration

### Backend (.env)
```env
# Server
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database
DB_USER=your_db_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_min_32_characters_long
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_characters_long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS (comma-separated for multiple origins)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=Inventory System
SMTP_REJECT_UNAUTHORIZED=true

# File Upload
MAX_FILE_SIZE=10485760
MAX_FILES=10

# Company
COMPANY_NAME=Your Company Name
```

### Frontend (.env)
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

---

## Production Deployment

### Backend Deployment

#### Option 1: PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start application
cd Ethernet-CRM-pr-executive-management/server
npm run pm2:start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

#### Option 2: Systemd Service
Create `/etc/systemd/system/inventory-api.service`:
```ini
[Unit]
Description=Inventory Management API
After=network.target mysql.service

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/Ethernet-CRM-pr-executive-management/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable inventory-api
sudo systemctl start inventory-api
sudo systemctl status inventory-api
```

### Frontend Deployment

#### Option 1: Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/inventory_module/dist;
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

#### Option 2: Apache
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /path/to/inventory_module/dist

    <Directory /path/to/inventory_module/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api
</VirtualHost>
```

#### Option 3: Static Hosting (Vercel, Netlify, etc.)
1. Build the frontend: `npm run build:prod`
2. Deploy the `dist/` folder
3. Configure environment variables in hosting platform
4. Set up API proxy if needed

---

## Post-Deployment Verification

### 1. Health Check
```bash
curl http://localhost:3000/api/v1/inventory/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Inventory routes OK",
  "timestamp": "2025-01-XX...",
  "uptime": 123.45
}
```

### 2. Database Verification
```sql
-- Check if tables exist
SHOW TABLES;

-- Verify key tables
SELECT COUNT(*) FROM purchase_requests;
SELECT COUNT(*) FROM purchase_orders;
SELECT COUNT(*) FROM materials;
```

### 3. API Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test protected endpoint
curl http://localhost:3000/api/v1/inventory/materials \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Frontend Testing
1. Open frontend URL in browser
2. Test login
3. Navigate through all pages
4. Test critical workflows:
   - Create Purchase Request
   - Create Purchase Order
   - Create Inward Entry
   - Material Request workflow

---

## Troubleshooting

### Backend Issues

#### Server Won't Start
1. Check database connection:
   ```bash
   mysql -u your_user -p your_database
   ```
2. Verify environment variables:
   ```bash
   cat .env
   ```
3. Check logs:
   ```bash
   npm run pm2:logs
   # or
   tail -f logs/err.log
   ```

#### Database Connection Errors
- Verify database credentials in `.env`
- Check database server is running
- Verify user has proper permissions
- Check firewall settings

#### Migration Errors
- Check database user has CREATE/ALTER permissions
- Verify database exists
- Check for existing tables that might conflict
- Review migration logs

### Frontend Issues

#### API Connection Errors
1. Verify `VITE_API_BASE_URL` in `.env`
2. Check CORS configuration in backend
3. Verify backend is running
4. Check browser console for errors

#### Build Errors
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
2. Check Node.js version (v18+)
3. Review build error messages

### Email Issues

#### Emails Not Sending
1. Verify SMTP credentials
2. Check SMTP server allows connections
3. For Gmail: Use App Password, not regular password
4. Check email service logs
5. System works without email - PO submission still works

### File Upload Issues

1. Verify upload directory exists and has write permissions:
   ```bash
   mkdir -p uploads/inward uploads/purchase-orders uploads/materials
   chmod 755 uploads
   ```
2. Check file size limits in `.env`
3. Verify file types are allowed (images, PDFs)
4. Check disk space

---

## Security Checklist

- [ ] Change default JWT secrets to strong random strings
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up firewall rules
- [ ] Use strong database passwords
- [ ] Enable database SSL if available
- [ ] Set up rate limiting
- [ ] Configure Helmet security headers
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Monitor logs for suspicious activity

---

## Backup and Recovery

### Database Backup
```bash
# Create backup
mysqldump -u your_user -p your_database > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u your_user -p your_database < backup_20250101.sql
```

### File Backup
```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

### Automated Backups
Set up cron job for daily backups:
```bash
0 2 * * * /path/to/backup-script.sh
```

---

## Monitoring

### PM2 Monitoring
```bash
npm run pm2:monit
```

### Log Monitoring
```bash
# View logs
npm run pm2:logs

# Follow logs
pm2 logs inventory-api --lines 100
```

### Health Monitoring
Set up monitoring service to check:
- `/api/v1/inventory/health` endpoint
- Database connectivity
- Disk space
- Memory usage

---

## Rollback Procedure

If deployment fails:

1. **Stop new version:**
   ```bash
   npm run pm2:stop
   ```

2. **Restore previous version:**
   ```bash
   git checkout previous-version-tag
   npm install
   npm run pm2:restart
   ```

3. **Restore database (if needed):**
   ```bash
   mysql -u your_user -p your_database < backup_before_deployment.sql
   ```

---

## Support

For issues or questions:
1. Check logs first
2. Review this documentation
3. Check error messages in browser console (frontend)
4. Check server logs (backend)
5. Verify environment configuration

---

**Last Updated:** 2025-01-XX
**Version:** 1.0.0
