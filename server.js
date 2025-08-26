const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Gmail API configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set up Gmail API
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get authorization URL
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.modify']
  });
  res.json({ authUrl });
});

// Handle OAuth callback
app.post('/auth/callback', async (req, res) => {
  try {
    const { code } = req.body;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.json({ success: true, message: 'Authentication successful' });
  } catch (error) {
    console.error('Error during authentication:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get emails grouped by sender
app.get('/emails/senders', async (req, res) => {
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 500
    });

    const messages = response.data.messages || [];
    const senderMap = new Map();

    for (const message of messages) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date']
      });

      const headers = fullMessage.data.payload.headers;
      const fromHeader = headers.find(h => h.name === 'From');
      const subjectHeader = headers.find(h => h.name === 'Subject');
      const dateHeader = headers.find(h => h.name === 'Date');

      if (fromHeader) {
        const sender = fromHeader.value;
        const email = extractEmail(sender);
        
        if (!senderMap.has(email)) {
          senderMap.set(email, {
            sender: sender,
            email: email,
            count: 0,
            messageIds: []
          });
        }
        
        const senderData = senderMap.get(email);
        senderData.count++;
        senderData.messageIds.push({
          id: message.id,
          subject: subjectHeader ? subjectHeader.value : 'No Subject',
          date: dateHeader ? dateHeader.value : 'Unknown Date'
        });
      }
    }

    const senders = Array.from(senderMap.values())
      .sort((a, b) => b.count - a.count);

    res.json(senders);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
});

// Delete emails from specific sender
app.post('/emails/delete', async (req, res) => {
  try {
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ error: 'Invalid message IDs' });
    }

    const deletePromises = messageIds.map(id => 
      gmail.users.messages.delete({
        userId: 'me',
        id: id
      })
    );

    await Promise.all(deletePromises);
    
    res.json({ 
      success: true, 
      message: `Successfully deleted ${messageIds.length} emails` 
    });
  } catch (error) {
    console.error('Error deleting emails:', error);
    res.status(500).json({ error: 'Failed to delete emails' });
  }
});

// Utility function to extract email from "Name <email@domain.com>" format
function extractEmail(sender) {
  const emailMatch = sender.match(/<(.+?)>/);
  return emailMatch ? emailMatch[1] : sender;
}

app.listen(PORT, () => {
  console.log(`Email Deleter server running on http://localhost:${PORT}`);
});
