# 🚀 Automated Railway Deployment

## Quick Setup (Do This ONCE Before Running Script)

### Step 1: Connect Backend to GitHub

1. Go to: https://railway.com/project/39e9c23f-f9bf-4928-8d80-7321eeed720b
2. Click on **backend** service
3. Click **Settings** tab
4. Under **Source**, click **Connect Repo**
5. Select: `nickd290/CRMSBS`
6. Branch: `main`
7. **Root Directory**: `server` (IMPORTANT!)
8. Save

### Step 2: Connect Frontend to GitHub

1. Click on **frontend** service
2. Click **Settings** tab
3. Under **Source**, click **Connect Repo**
4. Select: `nickd290/CRMSBS`
5. Branch: `main`
6. **Root Directory**: (leave empty)
7. Save

---

## Run the Automated Script

Once both services are connected to GitHub, run:

```bash
./auto-deploy-railway.sh
```

## What the Script Does Automatically

✅ Configures all backend environment variables
✅ Configures all frontend environment variables
✅ Deploys both services
✅ Waits for deployments to complete
✅ Gets your production URLs
✅ Updates environment variables with real URLs
✅ Triggers redeployments
✅ Provides Google OAuth configuration instructions

## What You Need to Do

1. Connect services to GitHub (Steps above) - **ONE TIME ONLY**
2. Run `./auto-deploy-railway.sh`
3. When prompted, enter your backend and frontend URLs from Railway
4. At the end, update Google OAuth settings with the URLs provided

## Total Time

- **Manual Setup**: 2 minutes (one time)
- **Script Execution**: 8-10 minutes (automated)
- **Google OAuth Update**: 1 minute

**Total**: ~12 minutes from start to finish

---

## Troubleshooting

**Script fails with "service not found":**
- Make sure you completed Step 1 and Step 2 above
- Verify both services show "Connected to GitHub" in Railway dashboard

**Deployments fail:**
- Check Railway logs: `railway logs --service backend`
- Check Railway logs: `railway logs --service frontend`

**Environment variables not updating:**
- Manually update via Railway dashboard → Service → Variables

---

## After Deployment

Test your backend:
```bash
curl https://[your-backend-url]/api/health
```

Expected response:
```json
{"status":"ok","message":"CRMSBS API is running"}
```

Visit your app:
```
https://[your-frontend-url]
```

You should see the Starterbox welcome screen!
