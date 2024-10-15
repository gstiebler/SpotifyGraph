import express from 'express';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

dotenv.config();

const clientId = process.env.CLIENT_ID!;
const clientSecret = process.env.CLIENT_SECRET!;

const app = express();
const port = 3000;

// Spotify API credentials (replace with your actual values)
const redirectUri = 'http://localhost:3000/callback'; // Must match your Spotify app settings


const api = SpotifyApi.withClientCredentials(clientId, clientSecret);

app.get('/', (req: Request, res: Response) => {
    // Construct the authorization URL
    const authorizeUrl = `https://accounts.spotify.com/authorize?` +
        new URLSearchParams({
            response_type: 'code',
            client_id: clientId,
            scope: 'user-library-read',
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

async function savedTracks(api: SpotifyApi) {
    const tracks = await api.currentUser.tracks.savedTracks();
    console.table(tracks.items.map((item) => ({
      name: item.track.name,
      artists: item.track.artists.map((artist) => artist.name).join(", "),
    })));
  }

app.get('/callback', async (req: Request, res: Response) => {
    const code = req.query.code;
    console.log(req.query);

    const { accessToken, refreshToken } = await api.getAccessToken(code);


    if (typeof accessToken !== 'string') {
        res.status(400).send('Authorization code missing or invalid.');
        return;
    }

    const sdk = SpotifyApi.withAccessToken(client_id, req.body); 
    // const api = SpotifyApi.withUserAuthorization(client_id, redirectUri, ['user-library-read']);

    const tracks = await sdk.currentUser.tracks.savedTracks();
    console.table(tracks.items.map((item) => ({
      name: item.track.name,
      artists: item.track.artists.map((artist) => artist.name).join(", "),
    })));
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});