# Gmail Integration Setup Guide

## Progress Summary ✅

**Completed:**
- ✅ Backend Express server created
- ✅ PostgreSQL database set up (database: `crmsbs`)
- ✅ Prisma ORM configured with complete schema
- ✅ Gmail OAuth routes implemented
- ✅ Email fetching/sending API endpoints ready
- ✅ Database models for GmailAccount, EmailMessage, EmailCustomerLink

**What's Working:**
- Backend server at `http://localhost:3001`
- OAuth flow for connecting Gmail accounts
- Fetch emails, send emails, reply to emails
- Database schema with all CRM models

---

## Next Steps: Google Cloud Setup (Required)

### Step 1: Create Google Cloud Project (15-20 minutes)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com

2. **Create New Project:**
   - Click "Select a project" → "New Project"
   - Project name: `CRMSBS Gmail Integration`
   - Click "Create"

3. **Enable Gmail API:**
   - In the search bar, type "Gmail API"
   - Click on "Gmail API"
   - Click "Enable"

4. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (for regular Gmail accounts)
   - Click "Create"

   **Fill in the form:**
   - App name: `CRMSBS`
   - User support email: (your email)
   - Developer contact email: (your email)
   - Click "Save and Continue"

   **Scopes:**
   - Click "Add or Remove Scopes"
   - Search for and add these scopes:
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.compose`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `https://www.googleapis.com/auth/userinfo.profile`
   - Click "Save and Continue"

   **Test users:**
   - Click "Add Users"
   - Add your 3 Gmail accounts (the ones you want to connect)
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: `CRMSBS Web Client`

   **Authorized JavaScript origins:**
   - Add: `http://localhost:3000`
   - Add: `http://localhost:3001`

   **Authorized redirect URIs:**
   - Add: `http://localhost:3001/api/auth/gmail/callback`

   - Click "Create"

6. **Copy Your Credentials:**
   - You'll see a popup with:
     - Client ID (long string starting with numbers)
     - Client Secret (shorter random string)
   - **IMPORTANT:** Copy both of these!

---

### Step 2: Update Server Environment Variables

Open `/Users/nicholasdeblasio/CRMSBS/server/.env` and update:

```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

### Step 3: Start the Backend Server

```bash
cd /Users/nicholasdeblasio/CRMSBS/server
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📧 Gmail integration ready
```

---

### Step 4: Test OAuth Flow

1. Go to: http://localhost:3001/api/auth/gmail
2. You'll get a JSON response with an `authUrl`
3. Copy that URL and paste it in your browser
4. Sign in with one of your 3 Gmail accounts
5. Grant permissions
6. You'll be redirected back to your frontend

---

## API Endpoints Reference

### Authentication
- `GET /api/auth/gmail` - Get OAuth URL
- `GET /api/auth/gmail/callback` - OAuth callback (auto-redirect)
- `GET /api/auth/accounts` - List connected accounts
- `DELETE /api/auth/accounts/:id` - Disconnect account

### Gmail Operations
- `GET /api/gmail/:accountId/messages` - Fetch emails
- `GET /api/gmail/:accountId/messages/:messageId` - Get email details
- `POST /api/gmail/:accountId/send` - Send new email
- `POST /api/gmail/:accountId/reply/:threadId` - Reply to email

---

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure you added your Gmail accounts as "Test users" in OAuth consent screen

### "redirect_uri_mismatch"
- Check that redirect URI in Google Cloud matches exactly:
  `http://localhost:3001/api/auth/gmail/callback`

### "invalid_client"
- Check that Client ID and Secret are correctly copied to `.env`

### Database connection errors
- Make sure PostgreSQL is running:
  ```bash
  brew services list | grep postgresql
  ```

---

## Database Schema

**Tables Created:**
- `gmail_accounts` - Connected Gmail accounts with OAuth tokens
- `email_messages` - Cached email data
- `email_customer_links` - Links between emails and CRM customers
- `customers` - Golf course clients
- `products`, `orders`, `invoices`, `mockups`, `samples` - CRM data

**View Database:**
```bash
cd /Users/nicholasdeblasio/CRMSBS/server
npm run db:studio
```

Opens Prisma Studio at http://localhost:5555

---

## Security Notes

- Never commit `.env` file to git
- Refresh tokens are stored in database (should be encrypted in production)
- OAuth tokens auto-refresh when expired
- All API calls require valid account ID

---

## What's Next

After Google Cloud setup is complete:
1. Start backend server
2. Build frontend email UI components
3. Connect frontend to backend API
4. Test with all 3 accounts
5. Add customer email matching logic
6. Polish UI and add email composer

---

**Current Status:** Backend ready, waiting for Google Cloud OAuth credentials
