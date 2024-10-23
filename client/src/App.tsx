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

  const [artistsList, setArtistsList] = useState<ProcessedArtist[]>([]);
  const [artistRelationships, setArtistRelationships] = useState<ArtistRelationship[]>([]);
  const [activeTab, setActiveTab] = useState<string>('graph');

  useEffect(() => {

    SpotifyApi.performUserAuthorization(clientId, redirectUri, ["user-library-read"], async (spotifyToken: AccessToken) => {
      if (!spotifyToken) {
        return;
      }
      console.log(spotifyToken);
      const { artistsList: artistsListLocal, artistRelationships: artistRelationshipsLocal } = await getArtists(spotifyToken, clientId);

      setArtistsList(artistsListLocal);
      setArtistRelationships(artistRelationshipsLocal);
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
          <h1>Artist Data</h1>
          <div className="tabs"></div>
          <button onClick={() => setActiveTab('graph')}>Graph</button>
          <button onClick={() => setActiveTab('table')}>Table</button>
        </div>
        {activeTab === 'graph' && (artistsList.length > 0) && (
          <div className="tab-content">
            <Graph artistsRelationships={artistRelationships} artistsList={artistsList} />
          </div>
        )}
        {activeTab === 'table' && (
          <div className="tab-content">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>saved tracks</th>
                  <th>score</th>
                </tr>
              </thead>
              <tbody>
                {artistsList.map((artist) => (
                  <tr key={artist.id}>
                    <td><a href={`https://open.spotify.com/artist/${artist.id}`} target="_blank" rel="noopener noreferrer">{artist.name}</a></td>
                    <td>{artist.savedTrackCount}</td>
                    <td>{artist.score.toFixed(2)}</td>
                    <td>{artist.relatedArtists.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </BrowserRouter >
  );
}

export default App;