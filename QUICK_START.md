# 🚀 QUICK START - Deploy to Railway

## One-Command Deployment

I've created an automated deployment script for you! Just run:

```bash
cd /Users/nicholasdeblasio/CRMSBS
./deploy-to-railway.sh
```

The script will:
- ✅ Verify Railway CLI is installed and authenticated
- ✅ Create a new Railway project named "starterbox-crm"
- ✅ Add PostgreSQL database
- ✅ Guide you through creating backend and frontend services
- ✅ Deploy both services automatically
- ✅ Provide next steps for OAuth configuration

## What You'll Need to Do

The script automates most of the process, but you'll need to:

1. **Answer a few prompts** when the script runs (workspace selection, confirm project name)
2. **Create two services in Railway dashboard** (the script will guide you with exact instructions)
3. **Update Google OAuth settings** after deployment

## Estimated Time

- **Total**: 10-15 minutes
- **Script automation**: 5 minutes
- **Manual dashboard steps**: 5 minutes
- **OAuth update**: 2 minutes
- **Testing**: 3 minutes

## Alternative: Manual Web Dashboard

If you prefer the web dashboard instead:

1. Go to: https://railway.app/new
2. Follow the detailed guide in `RAILWAY_DEPLOYMENT.md`

## After Deployment

Once deployed, test your app:

```bash
# Test backend health
curl https://[your-backend-url]/api/health

# Visit frontend
open https://[your-frontend-url]
```

## Need Help?

- 📖 Detailed guide: `RAILWAY_DEPLOYMENT.md`
- 📋 Full summary: `DEPLOYMENT_SUMMARY.md`
- 💬 Stuck? Check Railway logs: `railway logs`

---

**Ready? Run the script:**
```bash
./deploy-to-railway.sh
```
