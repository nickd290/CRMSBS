# Starterbox CRM - Railway Deployment Guide

## 🚀 Quick Deploy Steps

### Step 1: Create Railway Project (Web Dashboard)

1. Go to: https://railway.app/new
2. Click "Empty Project"
3. Name: `starterbox-crm`
4. Click "Create"

### Step 2: Add PostgreSQL Database

1. In your new project, click "+ New"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway will provision the database automatically

### Step 3: Create Backend Service

1. Click "+ New" → "Empty Service"
2. Name the service: `backend`
3. Click on the service card
4. Go to "Settings" tab
5. Under "Source":
   - Click "Connect Repo" (if using GitHub) OR
   - Deploy from this directory (see CLI commands below)
6. Configure build settings:
   - **Root Directory**: `server`
   - **Build Command**: Leave empty (uses package.json)
   - **Start Command**: Leave empty (uses package.json)
7. Go to "Variables" tab
8. Add these environment variables:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=https://backend-production-XXXX.up.railway.app/api/auth/gmail/callback
PORT=${{PORT}}
FRONTEND_URL=https://frontend-production-XXXX.up.railway.app
ENCRYPTION_KEY=YOUR_64_CHAR_ENCRYPTION_KEY_HERE
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
NODE_ENV=production
```

**Note**: Replace `XXXX` with actual Railway-generated URLs after deployment.

9. Click "Deploy" or wait for auto-deploy

### Step 4: Create Frontend Service

1. Click "+ New" → "Empty Service"
2. Name the service: `frontend`
3. Click on the service card
4. Go to "Settings" tab
5. Configure:
   - **Root Directory**: Leave empty (root of repo)
   - Railway will auto-detect Vite
6. Go to "Variables" tab
7. Add this environment variable:

```bash
VITE_API_URL=https://backend-production-XXXX.up.railway.app/api
```

**Note**: Replace `XXXX` with actual backend Railway URL.

8. Click "Deploy"

### Step 5: Get Production URLs

After both services deploy:
1. Click on Backend service → "Settings" → Copy the domain URL
2. Click on Frontend service → "Settings" → Copy the domain URL
3. Update environment variables with actual URLs:
   - Backend: Update `FRONTEND_URL` and `GOOGLE_REDIRECT_URI`
   - Frontend: Update `VITE_API_URL`
4. Services will auto-redeploy

### Step 6: Update Google OAuth

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find OAuth Client ID: `632079760511-...`
3. Click "Edit"
4. **Authorized redirect URIs** - Add:
   ```
   https://backend-production-XXXX.up.railway.app/api/auth/gmail/callback
   ```
5. **Authorized JavaScript origins** - Add:
   ```
   https://frontend-production-XXXX.up.railway.app
   ```
6. Save

### Step 7: Verify Deployment

Test backend health:
```bash
curl https://backend-production-XXXX.up.railway.app/api/health
```

Should return:
```json
{"status":"ok","message":"CRMSBS API is running"}
```

Visit your frontend:
```
https://frontend-production-XXXX.up.railway.app
```

---

## 🔧 Alternative: Deploy via CLI

If you prefer CLI deployment:

```bash
# Navigate to project
cd /Users/nicholasdeblasio/CRMSBS

# Link to Railway project (after creating via web)
railway link

# Deploy backend
cd server
railway up

# Deploy frontend
cd ..
railway up
```

---

## 📋 Environment Variables Reference

### Backend Variables
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=https://[backend-url]/api/auth/gmail/callback
PORT=${{PORT}}
FRONTEND_URL=https://[frontend-url]
ENCRYPTION_KEY=YOUR_64_CHAR_ENCRYPTION_KEY_HERE
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
NODE_ENV=production
```

### Frontend Variables
```
VITE_API_URL=https://[backend-url]/api
```

---

## ✅ Testing Checklist

- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend loads without errors
- [ ] Welcome screen shows Starterbox logo
- [ ] Mobile route choice appears on mobile viewport
- [ ] Dashboard displays CRM data
- [ ] AI text chat works
- [ ] AI voice chat works (mic button)
- [ ] Gmail OAuth connection flow
- [ ] Email checking via chatbot
- [ ] Customer email search

---

## 🆘 Troubleshooting

**Backend won't start:**
- Check DATABASE_URL is set correctly
- Verify all environment variables are present
- Check Railway logs: `railway logs`

**Frontend shows connection error:**
- Verify VITE_API_URL points to correct backend
- Check CORS settings in backend
- Verify FRONTEND_URL is set in backend env vars

**Gmail OAuth fails:**
- Ensure GOOGLE_REDIRECT_URI matches exactly in Railway and Google Console
- Verify callback URL includes `/api/auth/gmail/callback`
- Check Google Console has production URLs whitelisted

**AI chatbot not working:**
- Verify GEMINI_API_KEY is set on backend
- Check backend logs for API errors
- Ensure `/api/ai/chat` endpoint is accessible

---

## 📊 Estimated Costs

- PostgreSQL Database: ~$5/month (Starter plan)
- Backend Service: ~$5-10/month
- Frontend Service: Minimal (static hosting)
- **Total**: ~$10-15/month on Railway Hobby plan

---

## 🔐 Security Notes

✅ Gemini API key is now backend-only (not exposed in frontend)
✅ OAuth tokens encrypted with secure key
✅ CORS properly configured
✅ Environment files in .gitignore

---

## 📞 Support

If you encounter issues:
1. Check Railway logs
2. Verify all environment variables
3. Test backend health endpoint
4. Check browser console for frontend errors
