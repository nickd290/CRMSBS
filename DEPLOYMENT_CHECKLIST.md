# ✅ Starterbox CRM - Railway Deployment Checklist

## Pre-Deployment (COMPLETE ✓)

- [x] Backend AI proxy created
- [x] Frontend updated to use environment variables
- [x] Security enhancements implemented
- [x] Encryption key generated
- [x] Dependencies installed
- [x] Configuration files created
- [x] Documentation written

## Deployment Steps

### Step 1: Run Deployment Script
```bash
cd /Users/nicholasdeblasio/CRMSBS
./deploy-to-railway.sh
```

- [ ] Script starts successfully
- [ ] Railway CLI authentication verified
- [ ] Project created (answer prompts)
- [ ] PostgreSQL database added
- [ ] Backend service created in dashboard
- [ ] Frontend service created in dashboard
- [ ] Backend deployed
- [ ] Frontend deployed

### Step 2: Get Deployment URLs

From Railway dashboard:
- [ ] Backend URL copied: `_______________________________`
- [ ] Frontend URL copied: `_______________________________`

### Step 3: Update Environment Variables

In Railway Dashboard → Backend Service → Variables:
- [ ] `FRONTEND_URL` updated with actual frontend URL
- [ ] `GOOGLE_REDIRECT_URI` updated with actual backend URL

In Railway Dashboard → Frontend Service → Variables:
- [ ] `VITE_API_URL` updated with actual backend URL + `/api`

### Step 4: Redeploy Services

After updating env vars:
- [ ] Backend redeployed
- [ ] Frontend redeployed

### Step 5: Update Google OAuth

At https://console.cloud.google.com/apis/credentials:
- [ ] Opened OAuth Client ID: `632079760511-...`
- [ ] Added Authorized redirect URI:
  - `https://[backend-url]/api/auth/gmail/callback`
- [ ] Added Authorized JavaScript origin:
  - `https://[frontend-url]`
- [ ] Saved changes

### Step 6: Test Backend

```bash
curl https://[backend-url]/api/health
```

Expected response:
```json
{"status":"ok","message":"CRMSBS API is running"}
```

- [ ] Backend health check passes

### Step 7: Test Frontend

Visit: `https://[frontend-url]`

- [ ] Welcome screen loads
- [ ] Starterbox logo visible
- [ ] No console errors

### Step 8: Test Mobile Features

Resize browser to <768px:
- [ ] Mobile route choice screen appears
- [ ] "Chat with AI Assistant" button works
- [ ] "View Full Dashboard" button works

### Step 9: Test Dashboard

On desktop view:
- [ ] Dashboard loads
- [ ] CRM data displays
- [ ] Navigation works

### Step 10: Test AI Features

- [ ] Text chat: "Tell me about the CRM" works
- [ ] Voice chat: Mic button activates
- [ ] Voice responses play

### Step 11: Test Gmail Integration

- [ ] Click Gmail connect
- [ ] OAuth flow redirects to Google
- [ ] Redirects back to app
- [ ] Gmail account connected

### Step 12: Test Email Features

In AI chat:
- [ ] "Check my email" returns emails
- [ ] "Show unread emails" works
- [ ] "Find emails from [customer name]" works

## Post-Deployment

### Optional Enhancements
- [ ] Set up custom domain in Railway
- [ ] Enable error monitoring (Sentry)
- [ ] Set up automated backups
- [ ] Configure CI/CD pipeline

### Documentation
- [ ] Save production URLs securely
- [ ] Document any customizations
- [ ] Share access with team (if applicable)

## Troubleshooting

If something doesn't work:

**Backend Issues:**
```bash
railway logs -s backend
```

**Frontend Issues:**
```bash
railway logs -s frontend
```

**Database Issues:**
```bash
railway connect
```

## Rollback Plan

If deployment fails:
1. Local app still works at localhost:3000
2. All changes committed to git
3. Can redeploy any time
4. No data loss (local PostgreSQL unchanged)

## Success Criteria

Deployment is successful when:
- ✅ Backend health check returns 200 OK
- ✅ Frontend loads without errors
- ✅ AI chat works (text and voice)
- ✅ Gmail OAuth flow completes
- ✅ Email features work in chatbot

---

**Estimated Completion Time:** 15-20 minutes

**Current Status:** Ready to deploy! Run `./deploy-to-railway.sh`
