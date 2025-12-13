# Getting Started - Inventory Management System

This guide will help you set up and run the Inventory Management System on your local machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher) or **yarn**
- **MySQL** (v8.0 or higher) or **MariaDB** (v10.5 or higher)
- **Git** (for cloning the repository)

---

## Project Structure

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
│   │   └── ecosystem.config.js          # PM2 configuration
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

---

## Step 1: Backend Setup

### 1.1 Navigate to Backend Directory

```bash
cd Ethernet-CRM-pr-executive-management/server
```

### 1.2 Install Dependencies

```bash
npm install
```

### 1.3 Configure Environment Variables

Create a `.env` file in the `server` directory:

```bash
cp PRODUCTION_ENV.md .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inventory_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_refresh_key_min_32_characters_long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# File Upload Configuration
MAX_FILE_SIZE=52428800
UPLOAD_DIR=./uploads
```

**Important**: 
- Replace database credentials with your actual MySQL credentials
- Generate secure JWT secrets (see below)

### 1.4 Generate Secure JWT Secrets

```bash
# Generate JWT secret (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate refresh secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 1.5 Create Database

Connect to MySQL and create the database:

```sql
CREATE DATABASE inventory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 1.6 Start Backend Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will automatically run database migrations on startup. The API will be available at:
- `http://localhost:3000`
- Health check: `http://localhost:3000/api/v1/health`

---

## Step 2: Frontend Setup

### 2.1 Navigate to Frontend Directory

```bash
cd inventory_module
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Configure Environment Variables

Create a `.env` file in the `inventory_module` directory:

```bash
cp PRODUCTION_ENV.md .env
```

Edit the `.env` file:

```env
# API Base URL - Your backend API URL
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Application Configuration
VITE_APP_NAME=Inventory Management System
VITE_APP_VERSION=1.0.0
```

**Note**: Make sure the `VITE_API_BASE_URL` matches your backend server URL.

### 2.4 Start Development Server

```bash
npm run dev
```

The frontend will be available at:
- `http://localhost:5173` (default Vite port)

---

## Step 3: Verify Installation

### 3.1 Check Backend Health

Open your browser or use curl:

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### 3.2 Access Frontend

Open your browser and navigate to:
```
http://localhost:5173
```

### 3.3 Login

Use your admin credentials to log in. If you need to create an admin user, you can:

1. Use the registration endpoint (if enabled)
2. Or manually insert a user in the database

---

## Step 4: First Login & Setup

### 4.1 Create Admin User (if needed)

If you need to create an admin user manually:

```sql
INSERT INTO users (username, email, password_hash, role, is_active, created_at)
VALUES (
  'admin',
  'admin@example.com',
  '$2b$10$YourHashedPasswordHere', -- Use bcrypt to hash your password
  'admin',
  true,
  NOW()
);
```

### 4.2 Initial Setup Steps

After logging in:

1. **Create Stock Areas** - Go to Stock Area Management and create your warehouse locations
2. **Add Materials** - Go to Material Management and add your inventory items
3. **Add Business Partners** - Go to Business Partner Management and add suppliers
4. **Configure Settings** - Go to Settings and configure system preferences

---

## Common Issues & Solutions

### Issue: Database Connection Error

**Solution**:
- Verify MySQL is running: `mysql -u root -p`
- Check database credentials in `.env` file
- Ensure database exists: `SHOW DATABASES;`

### Issue: Port Already in Use

**Solution**:
- Change `PORT` in backend `.env` file
- Update `VITE_API_BASE_URL` in frontend `.env` file accordingly
- Or kill the process using the port:
  ```bash
  # Find process using port 3000
  lsof -i :3000
  # Kill the process
  kill -9 <PID>
  ```

### Issue: CORS Error

**Solution**:
- Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL
- For development: `CORS_ORIGIN=http://localhost:5173`
- Restart the backend server after changing `.env`

### Issue: JWT Token Errors

**Solution**:
- Verify JWT secrets are at least 32 characters long
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set in `.env`
- Clear browser localStorage and try logging in again

### Issue: Migration Errors

**Solution**:
- Check database connection
- Verify database user has CREATE/ALTER permissions
- Check server logs for specific error messages
- Manually run migrations if needed (check migration scripts)

---

## Development Workflow

### Running Both Servers

**Option 1: Separate Terminals**

Terminal 1 (Backend):
```bash
cd Ethernet-CRM-pr-executive-management/server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd inventory_module
npm run dev
```

**Option 2: Using PM2 (Production-like)**

```bash
# Backend
cd Ethernet-CRM-pr-executive-management/server
pm2 start ecosystem.config.js

# Frontend (build first)
cd inventory_module
npm run build
pm2 serve dist 5173 --name inventory-frontend
```

---

## Building for Production

### Backend

```bash
cd Ethernet-CRM-pr-executive-management/server
npm run build  # If you have a build step
npm start      # Uses production mode
```

### Frontend

```bash
cd inventory_module
npm run build
```

The production build will be in the `dist/` folder. Deploy this to your web server (nginx, Apache, etc.).

---

## Next Steps

1. **Read the Flow Documentation**: See [FLOW.md](./FLOW.md) for system flow details
2. **Read the App Documentation**: See [APP_DOCUMENTATION.md](./APP_DOCUMENTATION.md) for complete feature documentation
3. **Explore the API**: Use the Postman collection or check API endpoints in the backend routes
4. **Customize**: Configure settings, add your materials, stock areas, and business partners

---

## Support

If you encounter issues:

1. Check the server logs for error messages
2. Verify all environment variables are set correctly
3. Ensure database is accessible and migrations ran successfully
4. Check browser console for frontend errors
5. Review the documentation files

---

**Status**: Production Ready ✅  
**Version**: 1.0  
**Last Updated**: December 2025
