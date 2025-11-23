import express from 'express';
import { google } from 'googleapis';
import { prisma } from '../lib/prisma';

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes for Gmail API
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// Start OAuth flow
router.get('/gmail', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent screen to get refresh token
  });

  res.json({ authUrl });
});

// OAuth callback
router.get('/gmail/callback', async (req, res) => {
  const { code } = req.query;

  console.log('📧 Gmail OAuth callback received');
  console.log('  Code present:', !!code);
  console.log('  Code type:', typeof code);
  console.log('  Code prefix:', code ? String(code).substring(0, 10) + '...' : 'N/A');

  if (!code || typeof code !== 'string') {
    console.error('❌ OAuth callback failed: No authorization code provided');
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    // Exchange code for tokens
    console.log('🔄 Exchanging authorization code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    console.log('✅ Token exchange successful');
    console.log('  Access token present:', !!tokens.access_token);
    console.log('  Refresh token present:', !!tokens.refresh_token);
    console.log('  Token expiry:', tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'N/A');

    if (!tokens.refresh_token) {
      console.warn('⚠️  Warning: No refresh token received. User may need to reauthorize.');
    }

    oauth2Client.setCredentials(tokens);

    // Get user info
    console.log('👤 Fetching user info from Google...');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    console.log('✅ User info retrieved');
    console.log('  Email:', userInfo.data.email);
    console.log('  Name:', userInfo.data.name);
    console.log('  User ID:', userInfo.data.id);

    // Store account in database
    console.log('💾 Storing account in database...');
    const account = await prisma.gmailAccount.upsert({
      where: { email: userInfo.data.email! },
      update: {
        refreshToken: tokens.refresh_token!,
        accessToken: tokens.access_token!,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        displayName: userInfo.data.name || undefined
      },
      create: {
        email: userInfo.data.email!,
        displayName: userInfo.data.name || undefined,
        refreshToken: tokens.refresh_token!,
        accessToken: tokens.access_token!,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    });
    console.log('✅ Account saved to database');
    console.log('  Account ID:', account.id);
    console.log('  Email:', account.email);

    // Redirect to frontend with success
    const redirectUrl = `${process.env.FRONTEND_URL}/emails?success=true&account=${account.id}`;
    console.log('🔄 Redirecting to frontend:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ OAuth callback error - Full details:');
    console.error('  Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('  Error message:', error instanceof Error ? error.message : String(error));
    console.error('  Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    if (error instanceof Error && 'code' in error) {
      console.error('  Error code:', (error as any).code);
    }

    if (error instanceof Error && 'response' in error) {
      console.error('  API Response:', (error as any).response?.data || 'No response data');
    }

    const errorRedirectUrl = `${process.env.FRONTEND_URL}/emails?error=auth_failed`;
    console.log('🔄 Redirecting to frontend with error:', errorRedirectUrl);
    res.redirect(errorRedirectUrl);
  }
});

// Get all connected accounts
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await prisma.gmailAccount.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true
      }
    });
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Disconnect account
router.delete('/accounts/:id', async (req, res) => {
  try {
    await prisma.gmailAccount.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
