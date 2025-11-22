import express from 'express';
import { google } from 'googleapis';
import { prisma } from '../lib/prisma';

const router = express.Router();

// Helper function to get authenticated Gmail client
async function getGmailClient(accountId: string) {
  const account = await prisma.gmailAccount.findUnique({
    where: { id: accountId }
  });

  if (!account) {
    throw new Error('Account not found');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: account.refreshToken,
    access_token: account.accessToken || undefined,
    expiry_date: account.tokenExpiry?.getTime() || undefined
  });

  // Check if token needs refresh
  if (!account.tokenExpiry || account.tokenExpiry < new Date()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await prisma.gmailAccount.update({
      where: { id: accountId },
      data: {
        accessToken: credentials.access_token!,
        tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
      }
    });
    oauth2Client.setCredentials(credentials);
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Get messages for an account
router.get('/:accountId/messages', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { maxResults = '25', pageToken } = req.query;

    const gmail = await getGmailClient(accountId);

    // List messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: parseInt(maxResults as string),
      pageToken: pageToken as string
    });

    const messages = response.data.messages || [];

    // Fetch full details for each message
    const fullMessages = await Promise.all(
      messages.map(async (msg) => {
        const details = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full'
        });

        const headers = details.data.payload?.headers || [];
        const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

        return {
          id: details.data.id,
          threadId: details.data.threadId,
          snippet: details.data.snippet,
          from: getHeader('from'),
          to: getHeader('to'),
          subject: getHeader('subject'),
          date: getHeader('date'),
          isRead: !details.data.labelIds?.includes('UNREAD')
        };
      })
    );

    res.json({
      messages: fullMessages,
      nextPageToken: response.data.nextPageToken
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get single message details
router.get('/:accountId/messages/:messageId', async (req, res) => {
  try {
    const { accountId, messageId } = req.params;
    const gmail = await getGmailClient(accountId);

    const message = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const headers = message.data.payload?.headers || [];
    const getHeader = (name: string) => headers.find(h => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    // Extract body
    let body = '';
    const parts = message.data.payload?.parts || [];

    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        break;
      }
    }

    // If no parts, check main payload body
    if (!body && message.data.payload?.body?.data) {
      body = Buffer.from(message.data.payload.body.data, 'base64').toString('utf-8');
    }

    res.json({
      id: message.data.id,
      threadId: message.data.threadId,
      snippet: message.data.snippet,
      from: getHeader('from'),
      to: getHeader('to'),
      cc: getHeader('cc'),
      subject: getHeader('subject'),
      date: getHeader('date'),
      body,
      isRead: !message.data.labelIds?.includes('UNREAD')
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Send email
router.post('/:accountId/send', async (req, res) => {
  try {
    const { accountId } = req.params;
    const { to, subject, body } = req.body;

    const gmail = await getGmailClient(accountId);

    // Create email in RFC 2822 format
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');

    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail
      }
    });

    res.json({ success: true, messageId: response.data.id });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Reply to email
router.post('/:accountId/reply/:threadId', async (req, res) => {
  try {
    const { accountId, threadId } = req.params;
    const { to, subject, body } = req.body;

    const gmail = await getGmailClient(accountId);

    // Create reply email
    const email = [
      `To: ${to}`,
      `Subject: Re: ${subject}`,
      `In-Reply-To: ${threadId}`,
      `References: ${threadId}`,
      '',
      body
    ].join('\n');

    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
        threadId
      }
    });

    res.json({ success: true, messageId: response.data.id });
  } catch (error) {
    console.error('Error replying to email:', error);
    res.status(500).json({ error: 'Failed to reply to email' });
  }
});

export default router;
