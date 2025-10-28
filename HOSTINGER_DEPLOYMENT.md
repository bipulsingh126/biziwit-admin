# 🚀 Hostinger Deployment Guide - BiziWit Admin

## Overview
Hostinger deployment for BiziWit Admin with Node.js backend and React frontend.

---

## 📋 Prerequisites

1. **Hostinger Plan**: Business or Cloud hosting (required for Node.js support)
2. **Domain**: bizwitinsh.plenthia.com
3. **MongoDB Atlas**: Database connection string
4. **SSH Access**: Enabled in Hostinger control panel

---

## 🎯 Deployment Architecture

```
bizwitinsh.plenthia.com
├── Frontend (React) → /public_html
└── Backend (Node.js) → /domains/bizwitinsh.plenthia.com/api
```

**API Access**: `https://bizwitinsh.plenthia.com/api/*`

---

## 📦 Step 1: Prepare Backend for Deployment

### 1.1 Update Backend `.env`

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
# Server Configuration
PORT=4000

# Production URLs
BASE_URL=https://bizwitinsh.plenthia.com
FRONTEND_URL=https://bizwitinsh.plenthia.com
CORS_ORIGIN=https://bizwitinsh.plenthia.com

# MongoDB Atlas (REQUIRED)
MONGODB_URI=mongodb+srv://riyanshsingh123456789_db_user:OCTbou5rtX8OjDi3@cluster0.u1aj71l.mongodb.net/biziwit?retryWrites=true&w=majority

# Auth - CHANGE THIS!
JWT_SECRET=your_super_strong_random_secret_minimum_32_characters_here
JWT_EXPIRES_IN=7d

# Admin Account
ADMIN_EMAIL=superadmin@biziwit.com
ADMIN_PASSWORD=SuperAdmin@2024

# Uploads
UPLOAD_DIR=uploads
```

### 1.2 Create Backend Startup Script

Create `backend/start.sh`:
```bash
#!/bin/bash
cd /home/u123456789/domains/bizwitinsh.plenthia.com/api
export NODE_ENV=production
node src/server.js
```

---

## 🌐 Step 2: Prepare Frontend for Deployment

### 2.1 Update Frontend `.env`

```bash
cd admin
cp .env.example .env
```

Edit `.env`:
```env
# API Base URL - Same domain with /api prefix
VITE_API_BASE=https://bizwitinsh.plenthia.com

# App Configuration
VITE_APP_NAME=BiziWit Admin
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
```

### 2.2 Build Frontend

```bash
cd admin
npm install
npm run build
```

This creates the `dist` folder with production files.

---

## 🔧 Step 3: Deploy to Hostinger

### 3.1 Access Hostinger

1. Login to [Hostinger Control Panel](https://hpanel.hostinger.com)
2. Go to your hosting account
3. Enable **SSH Access** (Advanced → SSH Access)

### 3.2 Connect via SSH

```bash
ssh u123456789@bizwitinsh.plenthia.com
# Enter your SSH password
```

### 3.3 Setup Directory Structure

```bash
# Navigate to your domain directory
cd ~/domains/bizwitinsh.plenthia.com

# Create API directory for backend
mkdir -p api
mkdir -p api/uploads

# public_html is already created by Hostinger for frontend
```

### 3.4 Upload Backend Files

**Option A: Using FileZilla/FTP:**
1. Connect to Hostinger FTP
2. Upload entire `backend` folder contents to `/domains/bizwitinsh.plenthia.com/api/`
3. Upload `.env` file (ensure it's uploaded!)

**Option B: Using Git (Recommended):**
```bash
# On Hostinger server
cd ~/domains/bizwitinsh.plenthia.com/api

# Clone your repository
git clone https://github.com/yourusername/biziwit-admin.git temp
mv temp/backend/* .
rm -rf temp

# Or upload via SCP from local machine:
# scp -r backend/* u123456789@bizwitinsh.plenthia.com:~/domains/bizwitinsh.plenthia.com/api/
```

### 3.5 Upload Frontend Files

Upload contents of `admin/dist` folder to `/public_html`:

```bash
# From your local machine
scp -r admin/dist/* u123456789@bizwitinsh.plenthia.com:~/public_html/
```

Or use FileZilla to upload `dist` folder contents to `public_html`.

---

## ⚙️ Step 4: Configure Node.js Application

### 4.1 Setup Node.js in Hostinger Panel

1. Go to **Advanced → Node.js**
2. Click **Create Application**
3. Configure:
   - **Node.js version**: 18.x or 20.x
   - **Application mode**: Production
   - **Application root**: `/domains/bizwitinsh.plenthia.com/api`
   - **Application URL**: Leave empty (we'll use reverse proxy)
   - **Application startup file**: `src/server.js`
   - **Port**: 4000

4. Click **Create**

### 4.2 Install Backend Dependencies

In Hostinger SSH:
```bash
cd ~/domains/bizwitinsh.plenthia.com/api
npm install --production
```

### 4.3 Start the Application

In Hostinger Node.js panel:
- Click **Start Application**
- Check logs for any errors

Or via SSH:
```bash
cd ~/domains/bizwitinsh.plenthia.com/api
npm start
```

---

## 🔀 Step 5: Configure Reverse Proxy

### 5.1 Create `.htaccess` in public_html

Create `/public_html/.htaccess`:

```apache
# Enable Rewrite Engine
RewriteEngine On

# API Proxy - Route /api/* to Node.js backend on port 4000
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:4000/api/$1 [P,L]

# Frontend - Single Page Application
# Redirect all non-file requests to index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule ^ index.html [L]

# Security Headers
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>

# CORS Headers for API
<IfModule mod_headers.c>
    SetEnvIf Origin "^https://bizwitinsh\.plenthia\.com$" AccessControlAllowOrigin=$0
    Header set Access-Control-Allow-Origin %{AccessControlAllowOrigin}e env=AccessControlAllowOrigin
    Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

### 5.2 Alternative: Using Hostinger's Built-in Proxy

If `.htaccess` proxy doesn't work, use Hostinger's Node.js proxy:

1. In Hostinger Panel → **Advanced → Node.js**
2. Edit your application
3. Set **Application URL**: `/api`
4. This automatically proxies `/api/*` to your Node.js app

---

## 🔒 Step 6: SSL Configuration

1. Go to Hostinger Panel → **SSL**
2. Enable **Free SSL Certificate** (Let's Encrypt)
3. Wait 5-10 minutes for activation
4. Verify HTTPS works: `https://bizwitinsh.plenthia.com`

---

## ✅ Step 7: Verify Deployment

### 7.1 Test Backend API

```bash
# Test health endpoint
curl https://bizwitinsh.plenthia.com/api/health

# Should return: {"ok":true}
```

### 7.2 Test Frontend

1. Open: `https://bizwitinsh.plenthia.com`
2. Should see login page
3. Try logging in:
   - Email: `superadmin@biziwit.com`
   - Password: `SuperAdmin@2024`

### 7.3 Check Backend Logs

In Hostinger SSH:
```bash
cd ~/domains/bizwitinsh.plenthia.com/api
pm2 logs
# or
tail -f logs/error.log
```

---

## 🐛 Troubleshooting

### Issue: 404 on API Calls

**Solution 1: Check .htaccess**
```bash
# Verify .htaccess exists
cat ~/public_html/.htaccess

# Check if mod_rewrite is enabled (contact Hostinger support if not)
```

**Solution 2: Check Node.js App Status**
```bash
# In Hostinger Panel → Node.js
# Ensure application is "Running"
# Check logs for errors
```

### Issue: Backend Not Starting

**Check logs:**
```bash
cd ~/domains/bizwitinsh.plenthia.com/api
cat logs/error.log
```

**Common fixes:**
- Verify `.env` file exists and has correct values
- Check MongoDB connection string
- Ensure port 4000 is not in use
- Verify Node.js version compatibility

### Issue: CORS Errors

**Update backend `.env`:**
```env
CORS_ORIGIN=https://bizwitinsh.plenthia.com
```

**Restart Node.js app:**
```bash
# In Hostinger Panel → Node.js → Restart Application
```

### Issue: MongoDB Connection Failed

**Verify:**
1. MongoDB Atlas IP whitelist includes `0.0.0.0/0` (or Hostinger IP)
2. Database user has correct permissions
3. Connection string is correct in `.env`

---

## 🔄 Updating Your Application

### Update Backend:
```bash
# SSH into Hostinger
cd ~/domains/bizwitinsh.plenthia.com/api

# Pull latest changes (if using Git)
git pull

# Or upload new files via FTP

# Install dependencies
npm install --production

# Restart application (in Hostinger Panel → Node.js)
```

### Update Frontend:
```bash
# On your local machine
cd admin
npm run build

# Upload dist/* to public_html via FTP/SCP
scp -r dist/* u123456789@bizwitinsh.plenthia.com:~/public_html/
```

---

## 📊 Process Management

### Using PM2 (Recommended)

Install PM2 globally:
```bash
npm install -g pm2
```

Start backend with PM2:
```bash
cd ~/domains/bizwitinsh.plenthia.com/api
pm2 start src/server.js --name "biziwit-backend"
pm2 save
pm2 startup
```

PM2 Commands:
```bash
pm2 list              # List all processes
pm2 logs biziwit-backend  # View logs
pm2 restart biziwit-backend  # Restart app
pm2 stop biziwit-backend     # Stop app
pm2 delete biziwit-backend   # Remove from PM2
```

---

## 🎯 Final Checklist

- [ ] Backend uploaded to `/domains/bizwitinsh.plenthia.com/api/`
- [ ] Frontend built and uploaded to `/public_html/`
- [ ] `.env` files configured correctly
- [ ] Node.js application created in Hostinger panel
- [ ] Dependencies installed (`npm install`)
- [ ] `.htaccess` configured for reverse proxy
- [ ] SSL certificate enabled
- [ ] MongoDB Atlas connection working
- [ ] Backend API responding (test `/api/health`)
- [ ] Frontend login working
- [ ] Admin account accessible

---

## 📞 Support

**Hostinger Support:**
- Live Chat: Available 24/7 in Hostinger panel
- Knowledge Base: https://support.hostinger.com

**Common Hostinger Issues:**
- Node.js not available → Upgrade to Business/Cloud plan
- Port conflicts → Use Hostinger's assigned port
- .htaccess not working → Enable mod_rewrite via support

---

## 🚀 Your Application is Live!

**Admin Panel**: https://bizwitinsh.plenthia.com
**API Endpoint**: https://bizwitinsh.plenthia.com/api

**Login Credentials:**
- Super Admin: superadmin@biziwit.com / SuperAdmin@2024
- Regular Admin: admin@biziwit.com / Admin@123

**Remember to change default passwords after first login!**
