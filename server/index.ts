import dotenv from 'dotenv';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

dotenv.config({ path: __dirname + '/../.env' });

const client_id = process.env.CLIENT_ID!;
const client_secret = process.env.CLIENT_SECRET!;

const api = SpotifyApi.withClientCredentials(client_id, client_secret);

const pearlJamId = '1w5Kfo2jwwIPruYS2UWh56';

async function showArtist() {
  const artist = await api.artists.relatedArtists(pearlJamId);
  console.log(JSON.stringify(artist, null, 2));
}

showArtist();
