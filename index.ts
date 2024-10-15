import axios from 'axios';
import dotenv from 'dotenv';
import { SpotifyWebApi } from '@spotify/web-api-ts-sdk';

dotenv.config();

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

const authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  method: 'post',
  headers: {
    'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  data: new URLSearchParams({
    grant_type: 'client_credentials'
  })
};

async function getAccessToken(): Promise<string> {
  try {
    const response = await axios(authOptions);
    if (response.status === 200) {
      const token = response.data.access_token;
      return token;
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  return '';
}

async function main() {
  const token = await getAccessToken();
  console.log('Token:', token);
}

main();
