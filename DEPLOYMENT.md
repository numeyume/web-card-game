# 🚀 Production Deployment Guide

Complete guide for deploying the Web Card Game MVP to production using **free tier** services.

## 📋 Prerequisites

- GitHub account
- MongoDB Atlas account (free)
- Vercel account (free)
- Render account (free)

---

## 🍃 Step 1: MongoDB Atlas Setup (Free Tier)

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign up for a free account
3. Create a new organization/project

### 1.2 Create Free Cluster
1. Click "Create Cluster"
2. Select **M0 Free Tier** (512MB storage, shared)
3. Choose region (closest to your users)
4. Cluster name: `web-card-game-cluster`

### 1.3 Database Security
1. **Database Access**: Create a user
   - Username: `webCardGameUser`
   - Password: Generate secure password
   - Role: `Atlas admin` or `readWriteAnyDatabase`

2. **Network Access**: Add IP addresses
   - For development: Add your current IP
   - For production: Add `0.0.0.0/0` (all IPs)
   - ⚠️ **Security Note**: In real production, restrict to specific IPs

### 1.4 Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" driver
4. Copy the connection string:
```
mongodb+srv://<username>:<password>@web-card-game-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## 🎯 Step 2: Render Deployment (Server)

### 2.1 Prepare Repository
1. Push your code to GitHub repository
2. Ensure `render.yaml` is in root directory

### 2.2 Create Render Service
1. Go to [Render](https://render.com/)
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect GitHub repository
5. Configuration:
   - **Name**: `web-card-game-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.cjs`
   - **Plan**: Free

### 2.3 Environment Variables
Add these in Render dashboard:

```bash
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secure-random-jwt-secret-here
MONGODB_URI=mongodb+srv://webCardGameUser:YOUR_PASSWORD@web-card-game-cluster.xxxxx.mongodb.net/webCardGame?retryWrites=true&w=majority
CLIENT_URL=https://your-app.vercel.app
PRODUCTION_CLIENT_URL=https://your-app.vercel.app
MAX_ROOMS=100
MAX_PLAYERS_PER_ROOM=4
GAME_SESSION_TIMEOUT=3600000
VOTING_SESSION_DURATION=300000
ENABLE_DEBUG_LOGS=true
ENABLE_MONGODB_FALLBACK=true
```

### 2.4 Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Your server URL: `https://your-app-name.onrender.com`

---

## ⚡ Step 3: Vercel Deployment (Client)

### 3.1 Prepare Client
1. Update client environment variables
2. Create `.env.production` in `/client`:
```bash
VITE_SERVER_URL=https://your-app-name.onrender.com
VITE_MAX_RECONNECT_ATTEMPTS=5
VITE_RECONNECT_INTERVAL=3000
```

### 3.2 Deploy to Vercel
1. Go to [Vercel](https://vercel.com/)
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Configuration:
   - **Framework**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Environment Variables
Add in Vercel dashboard:
```bash
VITE_SERVER_URL=https://your-app-name.onrender.com
```

### 3.4 Deploy
1. Click "Deploy"
2. Wait for deployment (2-5 minutes)
3. Your client URL: `https://your-app.vercel.app`

---

## 🔧 Step 4: Update CORS Configuration

### 4.1 Update Server CORS
1. In Render dashboard, update environment variables:
```bash
CLIENT_URL=https://your-app.vercel.app
PRODUCTION_CLIENT_URL=https://your-app.vercel.app
```

### 4.2 Redeploy
1. Render will auto-redeploy on environment variable changes
2. Verify health check: `https://your-app-name.onrender.com/api/health`

---

## ✅ Step 5: Verification

### 5.1 Health Checks
1. **Server Health**: Visit `https://your-app-name.onrender.com/api/health`
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "environment": "production",
     "mongodb": "connected",
     "activeConnections": 0
   }
   ```

2. **Client Access**: Visit `https://your-app.vercel.app`
   - Should load the game lobby
   - Create a room and test basic functionality

### 5.2 Test Full Functionality
1. **Multi-tab Testing**: Open multiple browser tabs
2. **Create Room**: Test room creation and joining
3. **Real-time Sync**: Test card play/buy synchronization
4. **Game End**: Test end conditions and voting system
5. **Mobile**: Test on mobile devices

---

## 🔍 Troubleshooting

### Common Issues

#### 1. CORS Errors
```bash
# Symptoms: Client can't connect to server
# Solution: Check CORS configuration in server
CLIENT_URL=https://your-exact-vercel-url.vercel.app
```

#### 2. MongoDB Connection Issues
```bash
# Symptoms: Server runs but DB operations fail
# Check: MongoDB Atlas IP whitelist (0.0.0.0/0)
# Check: Username/password in connection string
# Check: Database name in MONGODB_URI
```

#### 3. Socket.IO Connection Issues
```bash
# Symptoms: Real-time features not working
# Solution: Render supports WebSockets, check environment
# Verify: VITE_SERVER_URL points to Render URL
```

#### 4. Build Failures
```bash
# Client build fails: Check Node.js version compatibility
# Server deploy fails: Ensure package.json has correct scripts
```

### Debug Commands
```bash
# Check server logs in Render dashboard
# Check browser console for client errors
# Test API endpoints directly:
curl https://your-app-name.onrender.com/api/health
curl https://your-app-name.onrender.com/api/rooms
```

---

## 💰 Free Tier Limitations

### MongoDB Atlas (Free M0)
- 512MB storage
- Shared clusters
- No backups (paid feature)

### Render (Free Plan)
- Apps sleep after 15 minutes of inactivity
- 500 hours/month (enough for testing)
- Public repositories only

### Vercel (Hobby Plan)
- 100GB bandwidth/month
- Unlimited static deployments
- Custom domains available

---

## 🚀 Going Live Checklist

- [ ] MongoDB Atlas cluster created and user configured
- [ ] Environment variables set correctly in both Render and Vercel
- [ ] CORS configuration allows your client domain
- [ ] Health check endpoint returns 200 status
- [ ] Real-time features work across multiple browser tabs
- [ ] Mobile responsiveness tested
- [ ] Game flow tested end-to-end
- [ ] Voting system tested with multiple players

---

## 🔐 Security Best Practices

1. **JWT Secret**: Use cryptographically strong random string
2. **MongoDB**: Create dedicated database user (not admin)
3. **CORS**: Restrict to specific domains in production
4. **Rate Limiting**: Implement if high traffic expected
5. **HTTPS**: Enforced by default on Vercel/Render

---

## 📞 Support

If you encounter issues:
1. Check Render logs in dashboard
2. Check Vercel function logs
3. Verify environment variables
4. Test with `test-all.bat` locally first

**Your game is now live and ready for players! 🎮**