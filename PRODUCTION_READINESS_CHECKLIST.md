# Production Readiness Checklist

## ✅ Completed Features

### Frontend
- [x] Purchase Order UI completely redesigned
- [x] PR dropdown to select Purchase Request
- [x] Auto-generated PO number based on PR (format: PO-{PR details})
- [x] All PR details fetched and editable
- [x] Document upload functionality
- [x] Submit button to send PO to vendor via email
- [x] Edit functionality for items
- [x] Proper error handling and user feedback

### Backend
- [x] Email service configured with nodemailer
- [x] Professional HTML email template for PO
- [x] Document upload endpoint with validation
- [x] PO number generation based on PR format
- [x] Database migration for documents field
- [x] Proper error handling and logging
- [x] File validation (type and size)
- [x] Security enhancements

## 🔧 Configuration Required

### 1. Environment Variables
Create `.env` file in `Ethernet-CRM-pr-executive-management/server/` directory:

```bash
# Copy from ENV_EXAMPLE.md and configure:
- SMTP settings for email
- Database credentials
- JWT secret (use strong random string)
- Company name for emails
```

### 2. Database Migration
Run the migration script to add documents column:

```bash
cd Ethernet-CRM-pr-executive-management/server
node src/scripts/addDocumentsColumnToPO.js
```

Or the column will be added automatically on next server start if using the updated migration script.

### 3. Email Setup (Gmail Example)
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password in `SMTP_PASS` (not regular password)

### 4. File Upload Directory
Ensure upload directory exists with write permissions:

```bash
mkdir -p Ethernet-CRM-pr-executive-management/server/uploads/purchase-orders
chmod 755 Ethernet-CRM-pr-executive-management/server/uploads/purchase-orders
```

### 5. Install Dependencies
```bash
cd Ethernet-CRM-pr-executive-management/server
npm install
```

## 🚀 Deployment Steps

### 1. Pre-deployment
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Configure production database
- [ ] Set up production SMTP (email service)
- [ ] Configure CORS_ORIGIN for production domain
- [ ] Generate strong JWT_SECRET
- [ ] Set up file storage (consider cloud storage for production)

### 2. Security
- [ ] Change all default passwords
- [ ] Use HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting (if not already)
- [ ] Review and restrict file upload types
- [ ] Set up proper logging and monitoring

### 3. Testing
- [ ] Test PO creation from PR
- [ ] Test document upload
- [ ] Test email sending
- [ ] Test edit functionality
- [ ] Test submit functionality
- [ ] Test error scenarios

### 4. Monitoring
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Set up application monitoring
- [ ] Set up email delivery monitoring
- [ ] Set up file upload monitoring

## 📋 API Endpoints Summary

### Purchase Orders
- `GET /api/inventory/purchase-orders` - List all POs
- `GET /api/inventory/purchase-orders/:id` - Get PO details
- `POST /api/inventory/purchase-orders` - Create PO (standalone)
- `POST /api/inventory/purchase-orders/from-pr/:prId` - Create PO from PR
- `PUT /api/inventory/purchase-orders/:id` - Update PO
- `POST /api/inventory/purchase-orders/:id/documents` - Upload documents
- `POST /api/inventory/purchase-orders/:id/submit` - Submit PO (sends email)
- `POST /api/inventory/purchase-orders/:id/send` - Mark as SENT
- `POST /api/inventory/purchase-orders/:id/receive` - Mark as RECEIVED
- `DELETE /api/inventory/purchase-orders/:id` - Delete PO

## 🔍 Verification

### Test Email Configuration
The server will automatically verify email configuration on startup. Check logs for:
- ✅ Email service configured and ready
- ⚠️ Email service configuration issue (if any)

### Test Document Upload
1. Create a PO
2. Upload documents (images/PDFs)
3. Verify files are saved in `/uploads/purchase-orders/`
4. Verify documents array is updated in database

### Test PO Submission
1. Create PO from PR
2. Add items and documents
3. Click "Submit to Vendor"
4. Check vendor's email inbox
5. Verify PO status changed to SENT

## 📝 Notes

- Email service is optional - PO will still be marked as SENT even if email fails
- Documents are stored locally - consider cloud storage (S3, etc.) for production
- File size limit: 10MB per file (configurable via MAX_FILE_SIZE)
- Maximum files: 10 per PO (configurable via MAX_FILES)
- PO number format: `PO-{PR details}` when created from PR

## 🐛 Troubleshooting

### Email not sending
- Check SMTP credentials in `.env`
- Verify email service on startup logs
- Check spam folder
- Review server logs for email errors

### Documents not uploading
- Check file permissions on upload directory
- Verify file size (max 10MB)
- Check file type (only images and PDFs)
- Review server logs for errors

### PO number not generating
- Ensure PR is selected
- Check PR has valid pr_number
- Review server logs for errors
