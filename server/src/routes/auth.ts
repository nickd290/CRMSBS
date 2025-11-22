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

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'No authorization code provided' });
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Store account in database
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

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/emails?success=true&account=${account.id}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/emails?error=auth_failed`);
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
