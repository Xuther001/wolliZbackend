require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch'); // Alternatively we can use axios
const app = express();
const PORT = 3001;

app.use(express.json());

let accessToken = null;
let instanceUrl = null;

async function authenticateWithSalesforce() {
  const res = await fetch(`${process.env.SF_LOGIN_URL}/services/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET,
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD,
    })
  });

  const data = await res.json();

  if (data.access_token) {
    accessToken = data.access_token;
    instanceUrl = data.instance_url;
    console.log('Salesforce Authenticated!');
  } else {
    console.error('Salesforce Authentication Failed:', data);
  }
}

app.get('/', (req, res) => {
  res.send('Hello from Node.js backend!');
});

app.get('/api/properties/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const sfRes = await fetch(`${instanceUrl}/services/apexrest/Property__c/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await sfRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch property', detail: err.message });
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const sfRes = await fetch(`${instanceUrl}/services/apexrest/Property__c/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });

    const text = await sfRes.text();
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete property', detail: err.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  await authenticateWithSalesforce();
});