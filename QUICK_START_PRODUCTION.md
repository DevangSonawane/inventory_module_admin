# ⚡ Quick Start - Production Deployment

## 🎯 5-Minute Production Setup

### Step 1: Backend Setup (2 minutes)

```bash
cd Ethernet-CRM-pr-executive-management/server

# 1. Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DB_HOST=your_db_host
DB_PORT=3306
DB_NAME=your_database
DB_USER=your_db_user
DB_PASSWORD=your_db_password

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

CORS_ORIGIN=https://your-frontend-domain.com
EOF

# 2. Install and deploy
npm install --production
bash scripts/deploy.sh
```

### Step 2: Frontend Setup (2 minutes)

```bash
cd inventory_module

# 1. Create .env.production file
cat > .env.production << EOF
VITE_API_BASE_URL=https://api.your-domain.com/api/v1
EOF

# 2. Build
npm install
npm run deploy
```

### Step 3: Deploy Frontend (1 minute)

```bash
# Copy dist/ folder to your web server
# Or upload to your hosting service (Vercel, Netlify, etc.)
```

## ✅ Verify Installation

```bash
# Check backend
curl https://api.your-domain.com/api/v1/health

# Check PM2
pm2 status

# Check frontend
# Open https://your-frontend-domain.com in browser
```

## 🔧 Common Commands

```bash
# Backend
pm2 logs inventory-api    # View logs
pm2 restart inventory-api # Restart
pm2 monit                 # Monitor

# Frontend
npm run build:prod        # Rebuild
```

## 📚 Full Documentation

- `PRODUCTION_DEPLOYMENT.md` - Complete deployment guide
- `PRODUCTION_README.md` - Full production documentation
- `CONNECTION_VERIFICATION.md` - API connections

---

**✅ System is ready for production!**

