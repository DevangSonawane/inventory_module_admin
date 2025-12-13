# Inventory Management System - Complete Application Documentation

**Version:** 1.0  
**Date:** January 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [API Documentation](#api-documentation)
5. [Frontend Pages](#frontend-pages)
6. [Database Schema](#database-schema)
7. [Security](#security)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Inventory Management System is a comprehensive solution for tracking inventory across multiple warehouses, managing purchase requests and orders, handling material requests, tracking stock transfers, and recording consumption. The system supports both bulk (non-serialized) and serialized items with full traceability.

### Key Capabilities

- **Multi-Warehouse Management**: Track inventory across multiple stock areas
- **Purchase Workflow**: Complete PR/PO workflow with approvals
- **Material Requests**: Technician requests with approval workflow
- **Stock Transfers**: Warehouse-to-warehouse and warehouse-to-person transfers
- **Person Stock Tracking**: Track inventory assigned to technicians
- **Consumption Recording**: Record material usage at customer sites
- **Return Management**: Handle returns with approval workflow
- **Serial Number Tracking**: Full traceability for serialized items
- **Audit Trail**: Complete audit logging of all operations
- **Role-Based Access Control**: Secure access with user roles and permissions

---

## Features

### ✅ Core Features

#### 1. Materials Management
- Create and manage inventory materials
- Support for bulk and serialized items
- Material properties and attributes
- Product codes and categorization
- Unit of measure (UOM) management

#### 2. Stock Areas (Warehouses)
- Create and manage warehouse locations
- Assign store keepers to stock areas
- Physical location tracking
- Stock level monitoring

#### 3. Purchase Requests (PR)
- Create purchase requests
- Multi-item support
- Approval workflow
- Status tracking (DRAFT, PENDING, APPROVED, REJECTED)
- Link to Purchase Orders

#### 4. Purchase Orders (PO)
- Create purchase orders from approved PRs
- Supplier selection
- PO status management (DRAFT, SENT, RECEIVED)
- Link to Inward Entries

#### 5. Inward Entry (Goods Receipt)
- Record goods received at warehouse
- Link to Purchase Orders
- Support for bulk and serialized items
- Excel upload for bulk serialized items
- Automatic stock addition to warehouse

#### 6. Material Requests
- Create material requests by technicians
- Link to tickets/work orders
- Approval workflow
- Bulk selection and deletion
- Status tracking

#### 7. Stock Transfers
- Warehouse-to-warehouse transfers
- Warehouse-to-person transfers
- Link to material requests
- Transfer slip generation
- Real-time stock updates

#### 8. Person Stock
- View inventory assigned to technicians
- Track stock by ticket/work order
- Bulk selection support
- Return/transfer functionality

#### 9. Consumption Recording
- Record material consumption at customer sites
- Serial number validation
- Ticket/work order linking
- Customer information capture
- Automatic stock deduction

#### 10. Return Stock
- Return unused or faulty items
- Approval workflow
- Return reason tracking (UNUSED, FAULTY, CANCELLED)
- Automatic stock return to warehouse

#### 11. Business Partners
- Supplier and vendor management
- Contact information
- Integration with PR/PO and Inward Entries

#### 12. Reports & Analytics
- Inventory reports
- Stock level reports
- Consumption reports
- Transfer reports
- Export capabilities (CSV, Excel)

#### 13. Audit Trail
- Complete audit logging
- User action tracking
- Change history
- Timestamp tracking

#### 14. Notifications
- System notifications
- Approval notifications
- Status change notifications

#### 15. Bulk Operations
- Bulk material import
- Bulk inward entry import
- CSV/Excel file support

#### 16. File Management
- Document upload
- File attachment support
- Document organization

#### 17. Admin Features
- User management
- Role management
- Page permissions
- System settings
- Approval center

---

## Architecture

### Technology Stack

**Backend:**
- Node.js with Express.js
- Sequelize ORM
- MySQL/MariaDB database
- JWT authentication
- Express Validator for input validation

**Frontend:**
- React 18
- Vite build tool
- React Router for navigation
- Axios for API calls
- React Toastify for notifications
- Lucide React for icons

### System Architecture

```
┌─────────────────┐
│   React Frontend │
│   (Vite)        │
└────────┬────────┘
         │ HTTP/REST API
         │ (JWT Auth)
┌────────▼────────┐
│  Express Backend │
│  (Node.js)      │
└────────┬────────┘
         │ Sequelize ORM
┌────────▼────────┐
│   MySQL Database │
└─────────────────┘
```

### Key Components

**Backend Structure:**
- `controllers/` - Business logic and request handling
- `models/` - Database models and relationships
- `routes/` - API route definitions
- `middleware/` - Authentication, validation, error handling
- `utils/` - Utility functions and helpers

**Frontend Structure:**
- `pages/` - Page components
- `components/` - Reusable UI components
- `services/` - API service layer
- `utils/` - Utility functions, hooks, constants
- `hooks/` - Custom React hooks

---

## API Documentation

### Base URL

- Development: `http://localhost:3000/api/v1`
- Production: `https://your-domain.com/api/v1`

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Authentication Endpoints

- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get current user profile

### Inventory Endpoints

#### Materials
- `GET /inventory/materials` - List all materials
- `POST /inventory/materials` - Create material
- `GET /inventory/materials/:id` - Get material by ID
- `PUT /inventory/materials/:id` - Update material
- `DELETE /inventory/materials/:id` - Delete material

#### Stock Areas
- `GET /inventory/stock-areas` - List all stock areas
- `POST /inventory/stock-areas` - Create stock area
- `PUT /inventory/stock-areas/:id` - Update stock area
- `DELETE /inventory/stock-areas/:id` - Delete stock area

#### Purchase Requests
- `GET /inventory/purchase-requests` - List purchase requests
- `POST /inventory/purchase-requests` - Create purchase request
- `GET /inventory/purchase-requests/:id` - Get purchase request details
- `PUT /inventory/purchase-requests/:id/approve` - Approve/reject PR

#### Purchase Orders
- `GET /inventory/purchase-orders` - List purchase orders
- `POST /inventory/purchase-orders` - Create purchase order
- `GET /inventory/purchase-orders/:id` - Get purchase order details

#### Inward Entries
- `GET /inventory/inward` - List inward entries
- `POST /inventory/inward` - Create inward entry
- `GET /inventory/inward/:id` - Get inward entry details
- `PUT /inventory/inward/:id` - Update inward entry
- `POST /inventory/inward/bulk-delete` - Bulk delete inward entries

#### Material Requests
- `GET /inventory/material-request` - List material requests
- `POST /inventory/material-request` - Create material request
- `GET /inventory/material-request/:id` - Get material request details
- `PUT /inventory/material-request/:id/approve` - Approve/reject MR
- `POST /inventory/material-request/bulk-delete` - Bulk delete material requests

#### Stock Transfers
- `GET /inventory/stock-transfer` - List stock transfers
- `POST /inventory/stock-transfer` - Create stock transfer
- `GET /inventory/stock-transfer/:id` - Get stock transfer details

#### Person Stock
- `GET /inventory/person-stock` - Get person stock (technician inventory)

#### Consumption
- `GET /inventory/consumption` - List consumption records
- `POST /inventory/consumption` - Record consumption
- `GET /inventory/consumption/:id` - Get consumption details

#### Returns
- `GET /inventory/returns` - List return records
- `POST /inventory/returns` - Create return record
- `PUT /inventory/returns/:id/approve` - Approve return

#### Business Partners
- `GET /inventory/business-partners` - List business partners
- `POST /inventory/business-partners` - Create business partner

### Admin Endpoints

- `GET /admin/users` - List all users
- `POST /admin/users` - Create user
- `PUT /admin/users/:id` - Update user
- `DELETE /admin/users/:id` - Delete user
- `GET /admin/dashboard` - Admin dashboard data
- `GET /admin/approvals` - Get pending approvals

### Health Check

- `GET /health` - Server health check

---

## Frontend Pages

### Main Pages

1. **Login** (`/login`) - User authentication
2. **Dashboard** (`/`) - Main dashboard (role-based)
3. **Inventory Stock** (`/inventory-stock`) - View current stock levels
4. **Add Inward** (`/add-inward`) - Create inward entry
5. **Inward List** (`/inward-list`) - List all inward entries
6. **Material Request** (`/material-request`) - Create/view material requests
7. **Stock Transfer** (`/stock-transfer`) - Create stock transfers
8. **Person Stock** (`/person-stock`) - View technician stock
9. **Record Consumption** (`/record-consumption`) - Record material consumption
10. **Return Stock** (`/return-stock`) - Return items to warehouse

### Management Pages

11. **Purchase Request** (`/purchase-request`) - Manage purchase requests
12. **Purchase Order** (`/purchase-order`) - Manage purchase orders
13. **Business Partner** (`/business-partner`) - Manage suppliers/vendors
14. **Material Management** (`/material-management`) - Manage materials
15. **Stock Area Management** (`/stock-area-management`) - Manage warehouses
16. **Stock Levels** (`/stock-levels`) - View stock levels

### Reports & Other

17. **Reports** (`/reports`) - View and export reports
18. **Audit Trail** (`/audit-trail`) - View audit logs
19. **Notifications** (`/notifications`) - View system notifications
20. **Bulk Operations** (`/bulk-operations`) - Bulk import operations

### Admin Pages

21. **Admin Dashboard** (`/admin/dashboard`) - Admin overview
22. **User Management** (`/admin/users`) - Manage users
23. **Approval Center** (`/admin/approvals`) - Manage approvals
24. **Admin Settings** (`/admin/settings`) - System settings
25. **Page Permissions** (`/admin/page-permissions`) - Manage page access

---

## Database Schema

### Core Tables

- `users` - User accounts and authentication
- `materials` - Product/material definitions
- `stock_areas` - Warehouse locations
- `business_partners` - Suppliers and vendors
- `purchase_requests` - Purchase request headers
- `purchase_request_items` - Purchase request line items
- `purchase_orders` - Purchase order headers
- `purchase_order_items` - Purchase order line items
- `inward_entries` - Goods receipt headers
- `inward_items` - Goods receipt line items
- `material_requests` - Material request headers
- `material_request_items` - Material request line items
- `material_allocation` - Material allocation records
- `stock_transfers` - Stock transfer headers
- `stock_transfer_items` - Stock transfer line items
- `inventory_master` - Current inventory location tracking
- `consumption_records` - Consumption headers
- `consumption_items` - Consumption line items
- `return_records` - Return headers
- `return_items` - Return line items
- `audit_logs` - Audit trail records
- `notifications` - System notifications

### Key Relationships

- Materials → Inward Items → Inventory Master
- Material Requests → Material Allocation → Stock Transfers
- Stock Transfers → Inventory Master (location updates)
- Consumption → Inventory Master (status updates)
- Returns → Inventory Master (location updates)

---

## Security

### Authentication & Authorization

- **JWT Tokens**: Access tokens and refresh tokens
- **Role-Based Access Control**: Admin, Store Keeper, Technician roles
- **Page Permissions**: Granular page-level access control
- **Token Refresh**: Automatic token refresh on expiry

### Data Protection

- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Express Validator for all inputs
- **SQL Injection Protection**: Sequelize ORM parameterized queries
- **XSS Protection**: Input sanitization
- **CORS**: Configurable CORS policies
- **Rate Limiting**: Request rate limiting (configurable)

### Network Security

- **HTTPS**: Required in production
- **Secure Headers**: Helmet.js for security headers
- **Environment Variables**: Sensitive data in `.env` files

---

## Deployment

### Backend Deployment

1. Set production environment variables
2. Build the application (if needed)
3. Use PM2 for process management:
   ```bash
   pm2 start ecosystem.config.js
   ```
4. Configure reverse proxy (nginx/Apache)
5. Set up SSL certificates

### Frontend Deployment

1. Build for production:
   ```bash
   npm run build
   ```
2. Deploy `dist/` folder to web server
3. Configure nginx/Apache to serve static files
4. Set up API proxy if needed

### Database

- Run migrations on first deployment
- Set up database backups
- Configure connection pooling
- Monitor database performance

---

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database credentials
   - Verify database is running
   - Check network connectivity

2. **Authentication Issues**
   - Verify JWT secrets are set
   - Check token expiry settings
   - Clear browser localStorage

3. **CORS Errors**
   - Verify CORS_ORIGIN matches frontend URL
   - Check backend CORS configuration

4. **File Upload Issues**
   - Check file size limits
   - Verify upload directory permissions
   - Check disk space

5. **Performance Issues**
   - Check database indexes
   - Review query performance
   - Monitor server resources
   - Enable caching if needed

---

## Additional Resources

- **Flow Documentation**: See [FLOW.md](./FLOW.md)
- **Getting Started**: See [GETTING_STARTED.md](./GETTING_STARTED.md)
- **Postman Collection**: Available in project root
- **API Health Check**: `/api/v1/health`

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Production Ready ✅
