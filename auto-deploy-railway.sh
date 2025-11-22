#!/bin/bash

# Starterbox CRM - Fully Automated Railway Deployment
# This script automates the entire Railway deployment process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="starterbox-crm"
GITHUB_REPO="nickd290/CRMSBS"
GITHUB_BRANCH="main"

# IMPORTANT: Replace these with your actual values
ENCRYPTION_KEY="YOUR_64_CHAR_ENCRYPTION_KEY_HERE"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID_HERE"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET_HERE"

# Variables to be filled during deployment
BACKEND_URL=""
FRONTEND_URL=""

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Starterbox CRM - Automated Railway Deployment       ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print step headers
print_step() {
    echo ""
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to check Railway authentication
check_railway_auth() {
    print_step "[1/9] Verifying Railway Authentication"

    if ! railway whoami &> /dev/null; then
        echo -e "${RED}❌ Not logged in to Railway${NC}"
        echo "Please run: railway login"
        exit 1
    fi

    RAILWAY_USER=$(railway whoami)
    echo -e "${GREEN}✓ Logged in as: $RAILWAY_USER${NC}"
}

# Function to configure backend service
configure_backend() {
    print_step "[2/9] Configuring Backend Service"

    cd /Users/nicholasdeblasio/CRMSBS/server

    echo "Setting backend environment variables..."

    # Set environment variables for backend
    # Note: DATABASE_URL and PORT are automatically provided by Railway
    railway variables --set "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID" --service backend
    railway variables --set "GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET" --service backend
    railway variables --set "GOOGLE_REDIRECT_URI=https://temp-backend.railway.app/api/auth/gmail/callback" --service backend
    railway variables --set "FRONTEND_URL=https://temp-frontend.railway.app" --service backend
    railway variables --set "ENCRYPTION_KEY=$ENCRYPTION_KEY" --service backend
    railway variables --set "GEMINI_API_KEY=$GEMINI_API_KEY" --service backend
    railway variables --set "NODE_ENV=production" --service backend

    echo -e "${GREEN}✓ Backend environment variables configured${NC}"
}

# Function to configure frontend service
configure_frontend() {
    print_step "[3/9] Configuring Frontend Service"

    cd /Users/nicholasdeblasio/CRMSBS

    echo "Setting frontend environment variables..."

    railway variables --set "VITE_API_URL=https://temp-backend.railway.app/api" --service frontend

    echo -e "${GREEN}✓ Frontend environment variables configured${NC}"
}

# Function to deploy backend
deploy_backend() {
    print_step "[4/9] Deploying Backend Service"

    cd /Users/nicholasdeblasio/CRMSBS/server

    echo "Deploying backend to Railway..."
    echo -e "${CYAN}This may take 2-5 minutes...${NC}"

    railway up --service backend --detach

    echo -e "${GREEN}✓ Backend deployment initiated${NC}"
}

# Function to deploy frontend
deploy_frontend() {
    print_step "[5/9] Deploying Frontend Service"

    cd /Users/nicholasdeblasio/CRMSBS

    echo "Deploying frontend to Railway..."
    echo -e "${CYAN}This may take 2-5 minutes...${NC}"

    railway up --service frontend --detach

    echo -e "${GREEN}✓ Frontend deployment initiated${NC}"
}

# Function to wait for deployments
wait_for_deployments() {
    print_step "[6/9] Waiting for Deployments to Complete"

    echo "Waiting for services to deploy..."
    echo -e "${CYAN}(This usually takes 3-5 minutes)${NC}"
    echo ""

    # Wait 3 minutes for builds to complete
    for i in {180..1}; do
        printf "\r${YELLOW}Time remaining: %02d:%02d${NC}" $((i/60)) $((i%60))
        sleep 1
    done
    echo ""

    echo -e "${GREEN}✓ Deployment wait complete${NC}"
}

# Function to get deployment URLs
get_deployment_urls() {
    print_step "[7/9] Getting Deployment URLs"

    echo "Retrieving service URLs..."

    # Try to get URLs from Railway
    cd /Users/nicholasdeblasio/CRMSBS/server
    railway status --service backend > /tmp/backend-status.txt 2>&1 || true

    cd /Users/nicholasdeblasio/CRMSBS
    railway status --service frontend > /tmp/frontend-status.txt 2>&1 || true

    # Check Railway dashboard for URLs
    echo ""
    echo -e "${YELLOW}Please go to your Railway dashboard and get the URLs:${NC}"
    echo -e "${CYAN}https://railway.com/project/39e9c23f-f9bf-4928-8d80-7321eeed720b${NC}"
    echo ""
    read -p "Enter your BACKEND URL (e.g., https://backend-production-xxxx.up.railway.app): " BACKEND_URL
    read -p "Enter your FRONTEND URL (e.g., https://frontend-production-xxxx.up.railway.app): " FRONTEND_URL

    # Remove trailing slash if present
    BACKEND_URL=${BACKEND_URL%/}
    FRONTEND_URL=${FRONTEND_URL%/}

    echo ""
    echo -e "${GREEN}✓ URLs captured:${NC}"
    echo -e "   Backend:  ${CYAN}$BACKEND_URL${NC}"
    echo -e "   Frontend: ${CYAN}$FRONTEND_URL${NC}"
}

# Function to update environment variables with real URLs
update_env_vars() {
    print_step "[8/9] Updating Environment Variables with Production URLs"

    echo "Updating backend environment variables..."
    cd /Users/nicholasdeblasio/CRMSBS/server
    railway variables --set "FRONTEND_URL=$FRONTEND_URL" --service backend
    railway variables --set "GOOGLE_REDIRECT_URI=$BACKEND_URL/api/auth/gmail/callback" --service backend

    echo "Updating frontend environment variables..."
    cd /Users/nicholasdeblasio/CRMSBS
    railway variables --set "VITE_API_URL=$BACKEND_URL/api" --service frontend

    echo -e "${GREEN}✓ Environment variables updated${NC}"
    echo -e "${CYAN}Services will automatically redeploy with new variables${NC}"

    # Wait for redeployment
    echo ""
    echo "Waiting for redeployment (2 minutes)..."
    sleep 120

    echo -e "${GREEN}✓ Redeployment complete${NC}"
}

# Function to display Google OAuth instructions
show_oauth_instructions() {
    print_step "[9/9] Google OAuth Configuration"

    echo -e "${GREEN}✓ Railway deployment complete!${NC}"
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}FINAL STEP: Update Google OAuth Settings${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "1. Go to: ${CYAN}https://console.cloud.google.com/apis/credentials${NC}"
    echo ""
    echo -e "2. Click on your OAuth Client ID: ${CYAN}$GOOGLE_CLIENT_ID${NC}"
    echo ""
    echo -e "3. Under ${YELLOW}Authorized redirect URIs${NC}, add:"
    echo -e "   ${GREEN}$BACKEND_URL/api/auth/gmail/callback${NC}"
    echo ""
    echo -e "4. Under ${YELLOW}Authorized JavaScript origins${NC}, add:"
    echo -e "   ${GREEN}$FRONTEND_URL${NC}"
    echo ""
    echo -e "5. Click ${YELLOW}SAVE${NC}"
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}Your application URLs:${NC}"
    echo -e "  Backend:  ${CYAN}$BACKEND_URL${NC}"
    echo -e "  Frontend: ${CYAN}$FRONTEND_URL${NC}"
    echo ""
    echo -e "${GREEN}Test your backend:${NC}"
    echo -e "  ${CYAN}curl $BACKEND_URL/api/health${NC}"
    echo ""
    echo -e "${GREEN}Visit your app:${NC}"
    echo -e "  ${CYAN}$FRONTEND_URL${NC}"
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
}

# Main execution
main() {
    check_railway_auth
    configure_backend
    configure_frontend
    deploy_backend
    deploy_frontend
    wait_for_deployments
    get_deployment_urls
    update_env_vars
    show_oauth_instructions
}

# Run main function
main
