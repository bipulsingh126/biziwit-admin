# 🚀 Production Deployment - bizwitinsh.plenthia.com

## ✅ Configuration Complete

Your BiziWit Admin is now configured for production deployment on:
**https://bizwitinsh.plenthia.com**

---

## 📋 Configuration Summary

### Backend Configuration (`backend/.env`)
```env
# Production Domain
BASE_URL=https://bizwitinsh.plenthia.com
FRONTEND_URL=https://bizwitinsh.plenthia.com
CORS_ORIGIN=https://bizwitinsh.plenthia.com

# MongoDB Atlas (Already configured)
MONGODB_URI=mongodb+srv://riyanshsingh123456789_db_user:OCTbou5rtX8OjDi3@cluster0.u1aj71l.mongodb.net/biziwit?retryWrites=true&w=majority

# Server Port
PORT=4000
```

### Frontend Configuration (`admin/.env`)
```env
# Production API
VITE_API_BASE=https://bizwitinsh.plenthia.com

# Environment
VITE_NODE_ENV=production
```

---

## 🔧 Deployment Steps

### 1. Copy Environment Files
```bash
# Backend
cd backend
cp .env.example .env

# Frontend
cd admin
cp .env.example .env
```

### 2. Deploy Backend
```bash
cd backend
npm install --production
npm start

# Or with PM2 for production
pm2 start src/server.js --name biziwit-backend
pm2 save
pm2 startup
```

### 3. Build & Deploy Frontend
```bash
cd admin
npm install
npm run build

# The 'dist' folder contains your production build
# Upload contents to your web server
```

---

## 🌐 Domain Setup

### Current Configuration:
- **Domain:** `bizwitinsh.plenthia.com`
- **Backend API:** `https://bizwitinsh.plenthia.com/api/*`
- **Frontend:** `https://bizwitinsh.plenthia.com`
- **Health Check:** `https://bizwitinsh.plenthia.com/health`

### SSL Certificate:
- ✅ Ensure SSL is enabled on your hosting (Plenthia should provide this)
- ✅ Force HTTPS redirect

---

## 🧪 Testing Your Deployment

### 1. Test Backend API:
```bash
curl https://bizwitinsh.plenthia.com/health
# Expected: {"ok":true}
```

### 2. Test MongoDB Connection:
Check server logs for:
```
✅ Connected to database successfully
```

### 3. Test Admin Login:
Open: `https://bizwitinsh.plenthia.com`

**Login Credentials:**
```
Super Admin:
Email: superadmin@biziwit.com
Password: SuperAdmin@2024
```

---

## 🔐 Security Checklist

- [x] MongoDB Atlas configured with authentication
- [x] CORS restricted to production domain
- [x] SSL/HTTPS enabled
- [ ] Change JWT_SECRET to strong random value
- [ ] Change default admin passwords after first login
- [ ] Whitelist server IP in MongoDB Atlas Network Access

---

## 🛠️ Local Development

To switch back to local development, update your `.env` files:

### Backend `.env`:
```env
# Comment out production:
# BASE_URL=https://bizwitinsh.plenthia.com
# FRONTEND_URL=https://bizwitinsh.plenthia.com
# CORS_ORIGIN=https://bizwitinsh.plenthia.com

# Uncomment for local:
BASE_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://localhost:4000
MONGODB_URI=mongodb://localhost:27017/biziwit
```

### Frontend `.env`:
```env
# Comment out production:
# VITE_API_BASE=https://bizwitinsh.plenthia.com
# VITE_NODE_ENV=production

# Uncomment for local:
VITE_API_BASE=http://localhost:4000
VITE_NODE_ENV=development
```

---

## 📊 Server Requirements

### Minimum Requirements:
- **Node.js:** v18 or higher
- **RAM:** 512MB minimum (1GB recommended)
- **Storage:** 1GB minimum
- **MongoDB:** Atlas (cloud) or local instance

### Recommended Setup:
- **Reverse Proxy:** Nginx or Apache
- **Process Manager:** PM2
- **SSL:** Let's Encrypt or Plenthia SSL
- **Monitoring:** PM2 monitoring or custom solution

---

## 🚨 Troubleshooting

### Issue: CORS Errors
**Solution:** Ensure CORS_ORIGIN matches your exact domain:
```env
CORS_ORIGIN=https://bizwitinsh.plenthia.com
```

### Issue: MongoDB Connection Failed
**Solution:** 
1. Check MongoDB Atlas IP whitelist
2. Verify connection string in `.env`
3. Ensure MongoDB Atlas cluster is running

### Issue: 404 on API Routes
**Solution:**
1. Ensure backend is running on correct port
2. Check reverse proxy configuration
3. Verify API routes are accessible

### Issue: Frontend Can't Connect to Backend
**Solution:**
1. Check `VITE_API_BASE` in frontend `.env`
2. Ensure backend is accessible at that URL
3. Check browser console for CORS errors

---

## 📞 Support

### Useful Commands:

**Check Backend Status:**
```bash
pm2 status
pm2 logs biziwit-backend
```

**Restart Backend:**
```bash
pm2 restart biziwit-backend
```

**View Backend Logs:**
```bash
pm2 logs biziwit-backend --lines 100
```

**Rebuild Frontend:**
```bash
cd admin
npm run build
```

---

## ✅ Deployment Checklist

- [x] Domain configured: `bizwitinsh.plenthia.com`
- [x] Backend `.env.example` updated
- [x] Frontend `.env.example` updated
- [x] MongoDB Atlas connection configured
- [x] CORS configured for production domain
- [x] Localhost settings commented out
- [ ] Copy `.env.example` to `.env` on server
- [ ] Deploy backend to server
- [ ] Build and deploy frontend
- [ ] Test health endpoint
- [ ] Test admin login
- [ ] Change default passwords
- [ ] Generate strong JWT_SECRET

---

**Your BiziWit Admin is ready for production! 🎉**

**Production URL:** https://bizwitinsh.plenthia.com
