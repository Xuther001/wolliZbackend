import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import userRoutes from './routes/userRoutes.js';
import { sequelize } from './models/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const privateKey = fs.readFileSync('./private.key', 'utf8');

let accessToken = null;
let instanceUrl = null;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Hello from Node.js with JWT!');
});

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
      console.log('Salesforce Authenticated via JWT!');
    } else {
      console.error('Authentication failed:', data);
    }
  } catch (err) {
    console.error('JWT Auth Error:', err);
  }
}

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

app.post('/api/properties', async (req, res) => {
  if (!accessToken || !instanceUrl) {
    return res.status(503).json({ error: 'Salesforce not authenticated' });
  }

  try {
    const sfRes = await fetch(`${instanceUrl}/services/apexrest/Property__c/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!sfRes.ok) {
      const errorText = await sfRes.text();
      return res.status(sfRes.status).json({ error: errorText });
    }

    const data = await sfRes.json();
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create property', detail: err.message });
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

    if (!sfRes.ok) {
      const errorText = await sfRes.text();
      return res.status(sfRes.status).json({ error: errorText });
    }

    const text = await sfRes.text();
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete property', detail: err.message });
  }
});

app.listen(PORT, async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL database.');

    await sequelize.sync({ alter: true });

    await authenticateWithJWT();
    console.log(`Server running at http://localhost:${PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
  }
});