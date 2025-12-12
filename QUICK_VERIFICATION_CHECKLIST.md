# ⚡ Quick Verification Checklist

A condensed checklist for rapid verification of the entire project connection.

---

## 🚀 Quick Start (5 minutes)

### 1. Start Backend
```bash
cd Ethernet-CRM-pr-executive-management/server
npm install  # If not already done
npm start
```
**Expected**: ✅ Server running on http://localhost:3000

### 2. Start Frontend
```bash
cd inventory_module
npm install  # If not already done
npm run dev
```
**Expected**: ✅ Frontend running on http://localhost:5173

### 3. Verify Connection
- Open browser: http://localhost:5173
- Open DevTools Console (F12)
- **Expected**: ✅ "Frontend connected to backend successfully!"

---

## ✅ Essential Checks

### Backend Health
```bash
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/inventory/health
```
**Expected**: JSON response with `"success": true`

### Frontend-Backend Connection
- Browser console should show: ✅ Connection success
- No CORS errors in console
- Network tab shows successful API calls

### Authentication
- [ ] Can login with valid credentials
- [ ] Token stored in localStorage (`accessToken`)
- [ ] Protected routes require authentication
- [ ] Logout clears token

---

## 🔍 Critical Path Tests

### Test 1: Material Request Flow
1. Login → ✅ Success
2. Navigate to Material Request → ✅ Page loads
3. Click "Add New" → ✅ Form opens
4. Fill required fields → ✅ Validation works
5. Submit → ✅ MR created, redirected to list
6. View MR in list → ✅ MR appears
7. Open MR details → ✅ Details load correctly

### Test 2: Stock Transfer Flow
1. Navigate to Stock Transfer → ✅ Page loads
2. Click "Add New" → ✅ Form opens
3. Select material, quantity, from/to → ✅ Dropdowns work
4. Submit → ✅ Transfer created
5. Check stock levels → ✅ Updated correctly

### Test 3: Purchase Request → PO → Inward
1. Create Purchase Request → ✅ PR created
2. Create PO from PR → ✅ PO created
3. Send PO → ✅ Status updated
4. Create Inward from PO → ✅ Inward created
5. Check stock → ✅ Stock updated

---

## 🐛 Common Issues & Fixes

### Issue: Backend won't start
**Check**:
- [ ] Database is running
- [ ] `.env` file exists with correct DB credentials
- [ ] Port 3000 is not in use
- [ ] Dependencies installed (`npm install`)

### Issue: Frontend can't connect to backend
**Check**:
- [ ] Backend is running on port 3000
- [ ] `VITE_API_BASE_URL` in frontend `.env` is correct
- [ ] CORS is configured in backend
- [ ] No firewall blocking connection

### Issue: CORS errors
**Fix**: Update backend `.env`:
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
```

### Issue: Authentication fails
**Check**:
- [ ] JWT_SECRET is set in backend `.env`
- [ ] Token is being sent in Authorization header
- [ ] Token hasn't expired
- [ ] User exists in database

### Issue: Database connection fails
**Check**:
- [ ] Database server is running
- [ ] Database credentials in `.env` are correct
- [ ] Database exists
- [ ] User has proper permissions

---

## 📋 Environment Variables Checklist

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## 🔗 Key Endpoints to Test

### Health
- `GET /api/v1/health` → ✅ 200 OK
- `GET /api/v1/inventory/health` → ✅ 200 OK

### Authentication
- `POST /api/v1/auth/login` → ✅ Returns token
- `GET /api/v1/auth/profile` → ✅ Returns user (with token)

### Inventory
- `GET /api/v1/inventory/materials` → ✅ Returns materials (with token)
- `GET /api/v1/inventory/stock-areas` → ✅ Returns stock areas (with token)
- `GET /api/v1/inventory/material-request` → ✅ Returns MRs (with token)
- `GET /api/v1/inventory/stock-transfer` → ✅ Returns transfers (with token)

---

## 📊 Verification Script

Run the automated verification script:
```bash
./verify_connections.sh
```

This will check:
- ✅ Prerequisites (Node.js, npm)
- ✅ Backend setup
- ✅ Frontend setup
- ✅ Server status
- ✅ API endpoints
- ✅ CORS configuration
- ✅ Database connection

---

## 🎯 Success Criteria

Project is **fully connected** when:

- [ ] ✅ Backend starts without errors
- [ ] ✅ Frontend starts without errors
- [ ] ✅ Frontend connects to backend (console message)
- [ ] ✅ Can login successfully
- [ ] ✅ Can navigate to all main pages
- [ ] ✅ Can create Material Request
- [ ] ✅ Can create Stock Transfer
- [ ] ✅ Can view Stock Levels
- [ ] ✅ Data persists in database
- [ ] ✅ No console errors
- [ ] ✅ No CORS errors
- [ ] ✅ API calls return expected data

---

## 📝 Detailed Verification

For comprehensive verification, see:
- **COMPREHENSIVE_CONNECTION_VERIFICATION_PLAN.md** - Full detailed plan
- **CONNECTION_VERIFICATION.md** - Previous verification results
- **BACKEND_FRONTEND_INTEGRATION_STATUS.md** - Integration status

---

## 🆘 Need Help?

1. Check browser console for errors
2. Check backend logs for errors
3. Verify environment variables
4. Test API endpoints with curl/Postman
5. Review detailed verification plan

---

**Last Updated**: [Date]
**Status**: Ready for Quick Verification

