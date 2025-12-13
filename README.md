# Inventory Management System

Production-ready inventory management system with complete frontend and backend integration.

## 📚 Documentation

- **Getting Started**: See [GETTING_STARTED.md](./GETTING_STARTED.md) for setup and installation guide
- **System Flow**: See [FLOW.md](./FLOW.md) for complete system flow and phases
- **Complete Documentation**: See [APP_DOCUMENTATION.md](./APP_DOCUMENTATION.md) for full application documentation
- **Flow Diagram**: See [flowchartG.png](./flowchartG.png) for visual representation of the system flow

## 🏗️ Project Structure

```
inventory_module-main/
├── Ethernet-CRM-pr-executive-management/  # Backend & Main CRM
│   ├── server/                            # Backend API (Node.js/Express)
│   │   ├── src/
│   │   │   ├── controllers/              # API controllers
│   │   │   ├── models/                   # Database models
│   │   │   ├── routes/                   # API routes
│   │   │   ├── middleware/               # Express middleware
│   │   │   └── utils/                    # Utility functions
│   │   ├── scripts/                      # Deployment scripts
│   │   └── ecosystem.config.js           # PM2 configuration
│   └── client/                           # Main CRM Frontend
│
└── inventory_module/                      # Inventory Frontend (React/Vite)
    ├── src/
    │   ├── pages/                        # React pages
    │   ├── services/                     # API service layer
    │   ├── components/                   # Reusable components
    │   └── utils/                        # Utility functions
    └── dist/                             # Production build output
```

## 🚀 Quick Start

### Backend Setup

```bash
cd Ethernet-CRM-pr-executive-management/server

# Install dependencies
npm install

# Create .env file (see PRODUCTION_ENV.md)
cp PRODUCTION_ENV.md .env
# Edit .env with your configuration

# Start server (migrations run automatically)
npm start
```

### Frontend Setup

```bash
cd inventory_module

# Install dependencies
npm install

# Create .env file
cp PRODUCTION_ENV.md .env
# Edit .env with your API URL

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔧 Configuration

### Backend Environment Variables

See `Ethernet-CRM-pr-executive-management/server/PRODUCTION_ENV.md`

**Required:**
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `CORS_ORIGIN`
- `NODE_ENV`

### Frontend Environment Variables

See `inventory_module/PRODUCTION_ENV.md`

**Required:**
- `VITE_API_BASE_URL` (your backend API URL)

## 📦 Features

### ✅ Implemented Features

- **Materials Management** - Define and manage inventory materials
- **Stock Areas** - Warehouse and storage location management
- **Purchase Requests & Orders** - Complete PR/PO workflow
- **Inward Entry** - Goods receipt with file uploads
- **Material Requests** - Request materials with approval workflow
- **Stock Transfers** - Warehouse-to-warehouse and warehouse-to-person transfers
- **Person Stock** - Track technician/employee inventory
- **Consumption** - Record material consumption
- **Returns** - Return stock workflow with approval
- **Business Partners** - Supplier and vendor management
- **Reports & Analytics** - Various inventory reports
- **Audit Trail** - Complete audit logging
- **File Management** - Document upload and management

## 🔒 Security

- JWT authentication with refresh tokens
- Role-based access control
- Input sanitization and validation
- CORS protection
- Rate limiting
- SQL injection protection (Sequelize ORM)
- XSS protection

## 🗄️ Database

The system uses automatic migrations that run on server startup:
- Creates all required tables
- Adds missing columns
- Creates indexes
- Sets up foreign keys

## 📡 API Endpoints

All APIs are prefixed with `/api/v1`

- `/api/v1/health` - Health check
- `/api/v1/auth/*` - Authentication
- `/api/v1/inventory/*` - Inventory operations
- `/api/v1/admin/*` - Admin operations
- `/api/v1/users/*` - User management

## 🚀 Deployment

### Backend Deployment

```bash
cd Ethernet-CRM-pr-executive-management/server
bash scripts/deploy.sh
```

### Frontend Deployment

```bash
cd inventory_module
npm run build
# Deploy dist/ folder to your web server
```

## 📊 Monitoring

- Health check endpoint: `/api/v1/health`
- PM2 process management
- Request logging
- Error tracking

## 🛠️ Development

### Running Tests

See `Ethernet-CRM-pr-executive-management/tests/TEST_PLAN.md` for test guidelines.

### Code Structure

- **Backend**: Express.js with Sequelize ORM
- **Frontend**: React with Vite
- **Database**: MySQL/MariaDB
- **Authentication**: JWT tokens

## 📝 Additional Resources

- **Getting Started**: [GETTING_STARTED.md](./GETTING_STARTED.md)
- **System Flow**: [FLOW.md](./FLOW.md)
- **Complete Documentation**: [APP_DOCUMENTATION.md](./APP_DOCUMENTATION.md)
- **Flow Diagram**: [flowchartG.png](./flowchartG.png)
- **Postman Collection**: [Inventory_Management_API_Complete.postman_collection.json](./Inventory_Management_API_Complete.postman_collection.json)

## ✅ Production Readiness

The system is **production-ready** with:
- ✅ All major features implemented
- ✅ Complete frontend-backend integration
- ✅ Authentication and authorization
- ✅ Error handling and validation
- ✅ File uploads and management
- ✅ Database migrations
- ✅ Deployment scripts

## 📞 Support

For issues:
1. Check PM2 logs: `pm2 logs inventory-api`
2. Review error messages in logs
3. Verify environment variables
4. Check database connectivity

---

**Status**: Production Ready ✅  
**Version**: 1.0  
**Last Updated**: January 2025

