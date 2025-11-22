#!/bin/bash

# Starterbox CRM - Railway Deployment Script
# This script automates the Railway deployment process as much as possible

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_NAME="starterbox-crm"
BACKEND_SERVICE="backend"
FRONTEND_SERVICE="frontend"
# NOTE: Replace these with your actual values
ENCRYPTION_KEY="YOUR_64_CHAR_ENCRYPTION_KEY_HERE"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET_HERE"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Starterbox CRM - Railway Deployment Script            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Railway CLI is installed
echo -e "${YELLOW}[1/8] Checking Railway CLI...${NC}"
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Please install it first:${NC}"
    echo "   curl -fsSL https://railway.app/install.sh | sh"
    exit 1
fi
echo -e "${GREEN}✓ Railway CLI found${NC}"

# Check if authenticated
echo -e "\n${YELLOW}[2/8] Verifying Railway authentication...${NC}"
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Railway. Please run:${NC}"
    echo "   railway login"
    exit 1
fi
RAILWAY_USER=$(railway whoami)
echo -e "${GREEN}✓ Logged in as: $RAILWAY_USER${NC}"

# Create project (requires manual interaction)
echo -e "\n${YELLOW}[3/8] Creating Railway project...${NC}"
echo -e "${BLUE}ℹ️  You'll need to answer a few prompts:${NC}"
echo "   - Select your workspace"
echo "   - Confirm project name: $PROJECT_NAME"
echo "   - Select: Empty Project"
echo ""
read -p "Press ENTER when ready to create project..."

cd /Users/nicholasdeblasio/CRMSBS

# Try to create project
if railway init; then
    echo -e "${GREEN}✓ Project created successfully${NC}"
else
    echo -e "${RED}❌ Failed to create project${NC}"
    echo -e "${YELLOW}Please create the project manually at https://railway.app/new${NC}"
    echo "Then run this script again with --skip-init flag"
    exit 1
fi

# Add PostgreSQL database
echo -e "\n${YELLOW}[4/8] Adding PostgreSQL database...${NC}"
echo -e "${BLUE}ℹ️  Select 'PostgreSQL' when prompted${NC}"
echo ""
read -p "Press ENTER when ready to add database..."

if railway add; then
    echo -e "${GREEN}✓ PostgreSQL database added${NC}"
else
    echo -e "${RED}❌ Failed to add database${NC}"
    exit 1
fi

# Wait for database to provision
echo -e "${YELLOW}⏳ Waiting for database to provision (10 seconds)...${NC}"
sleep 10

# Get project info
echo -e "\n${YELLOW}[5/8] Getting project information...${NC}"
railway status

echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}IMPORTANT: Manual Steps Required${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo "The Railway CLI doesn't support creating multiple services from CLI."
echo "Please follow these steps in the Railway web dashboard:"
echo ""
echo "1. Open your project: https://railway.app/dashboard"
echo "2. Click on your '$PROJECT_NAME' project"
echo ""
echo -e "${GREEN}CREATE BACKEND SERVICE:${NC}"
echo "   a. Click '+ New' → 'Empty Service'"
echo "   b. Name it: '$BACKEND_SERVICE'"
echo "   c. Go to Settings → Root Directory: 'server'"
echo "   d. Go to Variables → Click 'Raw Editor'"
echo "   e. Paste these variables:"
echo ""
echo "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
echo "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID"
echo "GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET"
echo "GOOGLE_REDIRECT_URI=https://REPLACE-WITH-BACKEND-URL/api/auth/gmail/callback"
echo "PORT=\${{PORT}}"
echo "FRONTEND_URL=https://REPLACE-WITH-FRONTEND-URL"
echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "GEMINI_API_KEY=$GEMINI_API_KEY"
echo "NODE_ENV=production"
echo ""
echo -e "${GREEN}CREATE FRONTEND SERVICE:${NC}"
echo "   a. Click '+ New' → 'Empty Service'"
echo "   b. Name it: '$FRONTEND_SERVICE'"
echo "   c. Go to Variables → Add:"
echo ""
echo "VITE_API_URL=https://REPLACE-WITH-BACKEND-URL/api"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
read -p "Press ENTER once you've created BOTH services in the dashboard..."

echo -e "\n${YELLOW}[6/8] Deploying backend service...${NC}"
echo "We'll now deploy the backend code to Railway"
read -p "Press ENTER to continue..."

# Deploy backend
cd /Users/nicholasdeblasio/CRMSBS/server
if railway up; then
    echo -e "${GREEN}✓ Backend deployed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Backend deployment initiated, check Railway dashboard for status${NC}"
fi

# Deploy frontend
echo -e "\n${YELLOW}[7/8] Deploying frontend service...${NC}"
cd /Users/nicholasdeblasio/CRMSBS
if railway up; then
    echo -e "${GREEN}✓ Frontend deployed successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend deployment initiated, check Railway dashboard for status${NC}"
fi

echo -e "\n${YELLOW}[8/8] Getting deployment URLs...${NC}"
sleep 5

# Try to get URLs from Railway
echo -e "\n${GREEN}✓ Deployment process complete!${NC}"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}NEXT STEPS:${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo "1. Get your deployment URLs from Railway dashboard"
echo "2. Update environment variables with actual URLs:"
echo "   - Backend: Update FRONTEND_URL and GOOGLE_REDIRECT_URI"
echo "   - Frontend: Update VITE_API_URL"
echo ""
echo "3. Update Google Cloud Console OAuth settings:"
echo "   https://console.cloud.google.com/apis/credentials"
echo "   Add these URLs:"
echo "   - Authorized redirect URI: https://[backend-url]/api/auth/gmail/callback"
echo "   - Authorized JavaScript origin: https://[frontend-url]"
echo ""
echo "4. Test your deployment:"
echo "   curl https://[backend-url]/api/health"
echo "   (Should return: {\"status\":\"ok\",\"message\":\"CRMSBS API is running\"})"
echo ""
echo "5. Visit your frontend:"
echo "   https://[frontend-url]"
echo ""
echo -e "${GREEN}🎉 Deployment setup complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo "For troubleshooting, check:"
echo "  - Railway logs: railway logs"
echo "  - Deployment guide: ./RAILWAY_DEPLOYMENT.md"
echo "  - Full summary: ./DEPLOYMENT_SUMMARY.md"
echo ""
