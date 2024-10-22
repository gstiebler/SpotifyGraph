import React, { useEffect, useState } from 'react';
import './App.css';
import { AccessToken, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Graph } from './Graph';
import { ArtistRelationship, getArtists, ProcessedArtist } from './Spotify';

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
  const [artistRelationships, setArtistRelationships] = useState<ArtistRelationship[]>([]);

  useEffect(() => {

    SpotifyApi.performUserAuthorization(clientId, redirectUri, ["user-library-read"], async (spotifyToken: AccessToken) => {
      if (!spotifyToken) {
        return;
      }
      console.log(spotifyToken);
      const { artistsMap: artistsMapLocal, artistRelationships: artistRelationshipsLocal } = await getArtists(spotifyToken, clientId);

      setArtistsMap(artistsMapLocal);
      setArtistRelationships(artistRelationshipsLocal);
    });
  }, []);

  const sortedArtistsBySavedTracks = Array.from(artistsMap.values()).sort((a, b) => {
    const savedTracksDiff = b.savedTrackCount - a.savedTrackCount;
    if (savedTracksDiff !== 0) {
      return savedTracksDiff;
    }
    return b.score - a.score;
  });

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
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>saved tracks</th>
                <th>score</th>
              </tr>
            </thead>
            <tbody>
              {sortedArtistsBySavedTracks.map((artist) => (
                <tr key={artist.id}>
                  <td>{artist.name}</td>
                  <td>{artist.savedTrackCount}</td>
                  <td>{artist.score}</td>
                  <td>{artist.relatedArtists.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;