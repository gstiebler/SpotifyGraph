import React from 'react';
import { Button, Typography } from '@mui/material';
import { AccessToken, SpotifyApi } from '@spotify/web-api-ts-sdk';


const clientId = "88ea8220c6e443d9aec4aee0405c51eb";
const redirectUri = `${window.location.origin}/callback`;

const Home: React.FC = () => {
  const handleLogin = () => {
    SpotifyApi.performUserAuthorization(clientId, redirectUri, ["user-library-read"], async (spotifyToken: AccessToken) => {
      if (!spotifyToken) {
        return;
      }
      console.log(spotifyToken);
    }).then((a) => {
      console.log("Authorization complete", a);
    });
  };

  return (
    <div className="Home">
      <Typography variant="h3">Welcome to Spotify Graph</Typography>
      <Typography variant="body1">Log in to view your Spotify data visualized.</Typography>
      <Button variant="contained" color="primary" onClick={handleLogin}>
        Log in with Spotify
      </Button>
    </div>
  );
};

export default Home;
