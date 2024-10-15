import axios from 'axios';
import dotenv from 'dotenv';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

dotenv.config();

const client_id = process.env.CLIENT_ID!;
const client_secret = process.env.CLIENT_SECRET!;

const api = SpotifyApi.withClientCredentials(client_id, client_secret);

async function beatles() {
  const items = await api.search("The Beatles", ["artist"]);

  console.table(items.artists.items.map((item) => ({
    name: item.name,
    followers: item.followers.total,
    popularity: item.popularity,
  })));
}

async function profile() {
  const profile = await api.users.profile("12149816950");
  console.log(profile);
}

async function savedTracks() {
  const tracks = await api.currentUser.tracks.savedTracks();
  console.table(tracks.items.map((item) => ({
    name: item.track.name,
    artists: item.track.artists.map((artist) => artist.name).join(", "),
  })));
}

savedTracks();


