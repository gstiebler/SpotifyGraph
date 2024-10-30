// App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import { AccessToken, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { BrowserRouter } from 'react-router-dom';
import { Drawer, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sliders from './Params';
import { Graph } from './Graph';
import { ArtistRelationship, getArtists, ProcessedArtist } from './Spotify';

const clientId = "88ea8220c6e443d9aec4aee0405c51eb";
const redirectUri = "http://localhost:3000/callback";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('graph');
  const [artistsList, setArtistsList] = useState<ProcessedArtist[]>([]);
  const [artistRelationships, setArtistRelationships] = useState<ArtistRelationship[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [forceCenterStrength, setForceCenterStrength] = useState(0.03);
  const [forceManyBodyStrength, setForceManyBodyStrength] = useState(-5000);
  const [linkStrengthFactor, setLinkStrengthFactor] = useState(0.5);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

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
          <IconButton onClick={toggleDrawer} color="inherit">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">Artist Data</Typography>
          <div className="tabs">
            <button className={activeTab === 'graph' ? 'active' : ''} onClick={() => setActiveTab('graph')}>Graph</button>
            <button className={activeTab === 'table' ? 'active' : ''} onClick={() => setActiveTab('table')}>Table</button>
          </div>
        </header>
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer}
        >
          <Box sx={{ width: 250, padding: 2 }}>
            <Sliders
              forceCenterStrength={forceCenterStrength}
              setForceCenterStrength={setForceCenterStrength}
              forceManyBodyStrength={forceManyBodyStrength}
              setForceManyBodyStrength={setForceManyBodyStrength}
              linkStrengthFactor={linkStrengthFactor}
              setLinkStrengthFactor={setLinkStrengthFactor}
            />
          </Box>
        </Drawer>
        <div className="App-content">
          {activeTab === 'graph' && (
            <div className="tab-content">
              <Graph
                artistsRelationships={artistRelationships}
                artistsList={artistsList}
                forceCenterStrength={forceCenterStrength}
                forceManyBodyStrength={forceManyBodyStrength}
                linkStrengthFactor={linkStrengthFactor}
                className="Graph"
              />
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
};

export default App;