import React, { useEffect, useState } from 'react';
import './App.css';
import { AccessToken, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Graph } from './Graph';
import { ArtistRelationship, getArtists, ProcessedArtist } from './Spotify';

const clientId = "88ea8220c6e443d9aec4aee0405c51eb";
const redirectUri = "http://localhost:3000/callback";

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
          <h1>Artist Data</h1>
          <div className="tabs">
            <button className={activeTab === 'graph' ? 'active' : ''} onClick={() => setActiveTab('graph')}>Graph</button>
            <button className={activeTab === 'table' ? 'active' : ''} onClick={() => setActiveTab('table')}>Table</button>
          </div>
        </header>
        <div className="App-content">
          {activeTab === 'graph' && (
            <div className="tab-content">
              <Graph artistsRelationships={artistRelationships} artistsList={artistsList} className="Graph" />
            </div>
          )}
          {activeTab === 'table' && (
            <div className="tab-content">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Saved Tracks</th>
                    <th>Score</th>
                    <th>Related Artists</th>
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
      </div>
    </BrowserRouter>
  );
}

export default App;