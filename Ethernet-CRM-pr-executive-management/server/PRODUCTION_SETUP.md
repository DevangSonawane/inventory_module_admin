# Production Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd Ethernet-CRM-pr-executive-management/server
npm install
```

### 2. Configure Environment
Create `.env` file in the server root directory. Copy configuration from `ENV_EXAMPLE.md`.

**Required variables:**
- Database credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
- JWT_SECRET (use a strong random string)
- SMTP settings (for email functionality)

### 3. Run Database Migration
The migration will run automatically on server start, or run manually:

```bash
node src/scripts/addDocumentsColumnToPO.js
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## Email Configuration

### Gmail Setup (Recommended for Development)
1. Enable 2-Factor Authentication
2. Go to: https://myaccount.google.com/apppasswords
3. Generate App Password for "Mail"
4. Use in `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-char-app-password
   ```

### Production Email Services
- **SendGrid**: Professional email service
- **AWS SES**: Scalable email service
- **Mailgun**: Developer-friendly email API
- **Custom SMTP**: Use your company's SMTP server

## File Upload Configuration

### Local Storage (Current)
Files are stored in: `./uploads/purchase-orders/`

Ensure directory exists:
```bash
mkdir -p uploads/purchase-orders
chmod 755 uploads/purchase-orders
```

### Cloud Storage (Recommended for Production)
Consider migrating to:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- DigitalOcean Spaces

## Security Checklist

- [ ] Change JWT_SECRET to strong random string
- [ ] Set NODE_ENV=production
- [ ] Configure CORS_ORIGIN for your domain only
- [ ] Use HTTPS in production
- [ ] Set up rate limiting
- [ ] Configure proper file upload limits
- [ ] Set up monitoring and logging
- [ ] Regular security updates

## Monitoring

### Health Check
```bash
curl http://localhost:3000/api/v1/health
```

### Email Verification
Check server startup logs for:
- ✅ Email service configured and ready
- ⚠️ Email service configuration issue

### Logs
- Application logs: Console output
- Error logs: Check for ❌ symbols
- Email logs: Check for ✅ or ⚠️ email status

## Troubleshooting

### Server won't start
- Check database connection
- Verify .env file exists
- Check port availability

### Email not sending
- Verify SMTP credentials
- Check spam folder
- Review server logs
- Test SMTP connection manually

### Documents not uploading
- Check file permissions
- Verify upload directory exists
- Check file size limits
- Review file type restrictions

## Support

For issues or questions, check:
1. Server logs for error messages
2. `PRODUCTION_READINESS_CHECKLIST.md` for feature status
3. `ENV_EXAMPLE.md` for configuration examples
