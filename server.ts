import express from 'express';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const client_id = process.env.CLIENT_ID!;
const client_secret = process.env.CLIENT_SECRET!;

const app = express();
const port = 3000;

// Spotify API credentials (replace with your actual values)
const redirectUri = 'http://localhost:3000/callback'; // Must match your Spotify app settings

app.get('/', (req: Request, res: Response) => {
  // Construct the authorization URL
  const authorizeUrl = `https://accounts.spotify.com/authorize?` +
    new URLSearchParams({
      response_type: 'code',
      client_id: client_id,
      scope: 'user-read-private user-read-email', // Add desired scopes
      redirect_uri: redirectUri,
    });

  // Simple HTML page with a link to authorize
  const html = `
    <html>
      <head><title>Spotify Auth</title></head>
      <body>
        <a href="${authorizeUrl}">Authorize with Spotify</a>
      </body>
    </html>
  `;
  res.send(html);
});

app.get('/callback', (req: Request, res: Response) => {
  const code = req.query.code;

  if (typeof code !== 'string') {
    res.status(400).send('Authorization code missing or invalid.');
    return;
  }

  // Make a POST request to the Spotify token endpoint
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const authString = `${client_id}:${client_secret}`;
  const base64Auth = Buffer.from(authString).toString('base64');

  const requestBody = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
  });

  fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${base64Auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: requestBody,
  })
  .then(response => response.json())
  .then((data: any) => { // You might want to define a more specific type for 'data'
    const accessToken = data.access_token;
    // TODO: Use the access token to make API requests
    res.send('Access token received: ' + accessToken);
  })
  .catch(error => {
    console.error('Error exchanging code for token:', error);
    res.status(500).send('Error exchanging code for token');
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});