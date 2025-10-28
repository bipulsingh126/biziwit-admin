# BiziWit Admin - Deployment Configuration

## 🚀 Production Setup Instructions

### 1. Domain Structure
Your production domain:

```
Production URL:  https://bizwitinsh.plenthia.com
Admin Panel:     https://bizwitinsh.plenthia.com
API Backend:     https://bizwitinsh.plenthia.com
```

**Note:** Using single domain for both frontend and backend.

### 2. Backend Configuration

#### Create `.env` file from `.env.example`:
```bash
cd backend
cp .env.example .env
```

#### Update `.env` with your production values:
```env
# Server Configuration
PORT=4000

# Base URLs - Production Domain
BASE_URL=https://bizwitinsh.plenthia.com
FRONTEND_URL=https://bizwitinsh.plenthia.com

# CORS Configuration - Production Domain
CORS_ORIGIN=https://bizwitinsh.plenthia.com

# MongoDB Atlas - Get from MongoDB Atlas dashboard
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/biziwit

# Auth - Generate a strong secret (32+ characters)
JWT_SECRET=your_super_strong_jwt_secret_here_minimum_32_chars
JWT_EXPIRES_IN=7d

# Admin Accounts
ADMIN_EMAIL=superadmin@biziwit.com
ADMIN_PASSWORD=SuperAdmin@2024

# File Uploads
UPLOAD_DIR=uploads

# Stripe Configuration (if using payments)
STRIPE_SECRET_KEY=sk_live_your_production_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 3. Frontend Configuration

#### Create `.env` file from `.env.example`:
```bash
cd admin
cp .env.example .env
```

#### Update `.env` with your production values:
```env
# API Base URL - Production Domain
VITE_API_BASE=https://bizwitinsh.plenthia.com

# App Configuration
VITE_APP_NAME=BiziWit Admin
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=production
```

### 4. Build and Deploy

#### Backend Deployment:
```bash
cd backend
npm install --production
# Deploy to your hosting service (Hostinger, AWS, etc.)
```

#### Frontend Deployment:
```bash
cd admin
npm install
npm run build
# Upload 'dist' folder contents to your web hosting
```

### 5. Database Setup

#### MongoDB Atlas (Recommended):
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create database user with read/write permissions
4. Whitelist your server IP address (or 0.0.0.0/0 for cloud hosting)
5. Get connection string and update `MONGODB_URI` in `.env`

### 6. Domain Configuration

#### DNS Settings:
Add these DNS records in your domain provider:
```
Type: A Record
Name: admin
Value: [Your hosting IP address]

Type: A Record  
Name: api
Value: [Your hosting IP address]
```

### 7. SSL Configuration
- Enable SSL certificates for all subdomains
- Most hosting providers offer free SSL (Let's Encrypt)

### 8. Testing Your Deployment

#### API Health Check:
```bash
curl https://bizwitinsh.plenthia.com/health
# Should return: {"ok":true}
```

#### Admin Panel Access:
Open: `https://bizwitinsh.plenthia.com`

#### Login Credentials:
```
Super Admin:
Email: superadmin@biziwit.com
Password: SuperAdmin@2024

Regular Admin:
Email: admin@biziwit.com
Password: Admin@123
```

### 9. Local Development Setup

To run locally, uncomment the localhost configurations in `.env` files:

#### Backend `.env`:
```env
# Comment out production and uncomment for local development
# BASE_URL=http://localhost:4000
# FRONTEND_URL=http://localhost:5173
# CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://localhost:4000
# MONGODB_URI=mongodb://localhost:27017/biziwit
```

#### Frontend `.env`:
```env
# Comment out production and uncomment for local development
# VITE_API_BASE=http://localhost:4000
# VITE_NODE_ENV=development
```

### 10. Security Checklist

- [ ] Strong JWT_SECRET (32+ random characters)
- [ ] MongoDB Atlas with authentication
- [ ] CORS configured with exact domains (no wildcards)
- [ ] SSL certificates enabled
- [ ] Environment variables secured
- [ ] Default admin passwords changed

### 11. File Structure

```
biziwit-admin/
├── backend/
│   ├── src/
│   ├── .env                 # Production config
│   ├── .env.example         # Template
│   └── package.json
├── admin/
│   ├── src/
│   ├── .env                 # Production config
│   ├── .env.example         # Template
│   └── package.json
└── DEPLOYMENT_CONFIG.md     # This file
```

## 🎯 Quick Deployment Checklist

1. [x] Domain configured: `bizwitinsh.plenthia.com`
2. [ ] Create MongoDB Atlas cluster and get connection string
3. [ ] Generate strong JWT secret
4. [ ] Configure DNS records for subdomains
5. [ ] Deploy backend to hosting service
6. [ ] Build and deploy frontend
7. [ ] Enable SSL certificates
8. [ ] Test API health check
9. [ ] Test admin panel login
10. [ ] Update admin passwords

Your BiziWit Admin system will be ready for production! 🚀
