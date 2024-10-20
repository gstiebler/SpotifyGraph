import React, { useEffect, useState } from 'react';
import './App.css';
import { AccessToken, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Graph } from './Graph';
import { getArtists, ProcessedArtist } from './Spotify';

const clientId = "88ea8220c6e443d9aec4aee0405c51eb";
const redirectUri = "http://localhost:3000/callback";

function Home() {
  return <h2>Home</h2>;
}

function Login() {
  // print the access token
  console.log(window.location.href);
  return <h2>Login</h2>;
}

const App: React.FC = () => {

  const [artistsMap, setArtistsMap] = useState<Map<string, ProcessedArtist>>(new Map());
  const [artistsRelationshipPairs, setArtistsRelationshipPairs] = useState<string[][]>([]);

  useEffect(() => {

    SpotifyApi.performUserAuthorization(clientId, redirectUri, ["user-library-read"], async (spotifyToken: AccessToken) => {
      if (!spotifyToken) {
        return;
      }
      console.log(spotifyToken);
      const { artistsMap: artistsMapLocal, artistsRelationshipPairs: artistsRelationshipPairsLocal } = await getArtists(spotifyToken, clientId);

      setArtistsMap(artistsMapLocal);
      setArtistsRelationshipPairs(artistsRelationshipPairsLocal);
    });
  }, []);

  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/callback" element={<Login />} />
          </Routes>
        </header>
        <div className="App-content">
          <Graph className="Graph" artistsMap={artistsMap} artistsRelationshipPairs={artistsRelationshipPairs} />
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;