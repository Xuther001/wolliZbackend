require('dotenv').config();
const express = require('express');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3001;

const privateKey = fs.readFileSync('./private.key', 'utf8');

let accessToken = null;
let instanceUrl = null;

async function authenticateWithJWT() {
  const token = jwt.sign(
    {
      iss: process.env.SF_CLIENT_ID,
      sub: process.env.SF_USERNAME,
      aud: 'https://login.salesforce.com',
      exp: Math.floor(Date.now() / 1000) + 300,
    },
    privateKey,
    { algorithm: 'RS256' }
  );

  try {
    const response = await fetch(`${process.env.SF_LOGIN_URL}/services/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token,
      }),
    });

    const data = await response.json();

    if (data.access_token) {
      accessToken = data.access_token;
      instanceUrl = data.instance_url;
      console.log('✅ Salesforce Authenticated via JWT!');
    } else {
      console.error('❌ Authentication failed:', data);
    }
  } catch (err) {
    console.error('🔥 JWT Auth Error:', err);
  }
}

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from Node.js with JWT!');
});

app.get('/api/properties/:id', async (req, res) => {
  if (!accessToken || !instanceUrl) {
    return res.status(503).json({ error: 'Salesforce not authenticated' });
  }

  const id = req.params.id;

  try {
    const sfRes = await fetch(`${instanceUrl}/services/apexrest/Property__c/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!sfRes.ok) {
      const errorText = await sfRes.text();
      return res.status(sfRes.status).json({ error: errorText });
    }

    const data = await sfRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch property', detail: err.message });
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  if (!accessToken || !instanceUrl) {
    return res.status(503).json({ error: 'Salesforce not authenticated' });
  }

  const id = req.params.id;

  try {
    const sfRes = await fetch(`${instanceUrl}/services/apexrest/Property__c/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const text = await sfRes.text();
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete property', detail: err.message });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  await authenticateWithJWT();
});