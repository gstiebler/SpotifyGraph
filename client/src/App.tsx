// App.tsx
import React, { useState, useEffect } from 'react';
import './App.css';
import { AccessToken, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import { Drawer, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sliders from './Params';
import { Graph } from './Graph';
import { ArtistRelationship, getArtists, ProcessedArtist, LoadingProgress } from './Spotify';
import TableView from './TableView';
import Home from './Home';

const clientId = "88ea8220c6e443d9aec4aee0405c51eb";
const redirectUri = `${window.location.origin}/callback`;

const App: React.FC = () => {
  const [artistsList, setArtistsList] = useState<ProcessedArtist[]>([]);
  const [artistRelationships, setArtistRelationships] = useState<ArtistRelationship[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [forceCenterStrength, setForceCenterStrength] = useState(0.03);
  const [forceManyBodyStrength, setForceManyBodyStrength] = useState(-10000);
  const [linkStrengthFactor, setLinkStrengthFactor] = useState(0.05);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgress | null>(null);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  useEffect(() => {
    SpotifyApi.performUserAuthorization(clientId, redirectUri, ["user-library-read"], async (spotifyToken: AccessToken) => {
      if (!spotifyToken) {
        return;
      }
      console.log(spotifyToken);
      const { artistsList: artistsListLocal, artistRelationships: artistRelationshipsLocal } = await getArtists(spotifyToken, clientId, setLoadingProgress);

      setArtistsList(artistsListLocal);
      setArtistRelationships(artistRelationshipsLocal);
      setLoadingProgress(null);
    }).then((a) => {
      console.log("Authorization complete", a);
    });
  }, []);

  const renderProgress = () => {
    if (!loadingProgress) return null;
    const { phase, current, total } = loadingProgress;
    const percentage = Math.round((current / total) * 100);
    return (
      <Box sx={{ 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '20px',
        borderRadius: '8px',
        color: 'white'
      }}>
        <Typography variant="h6">
          Loading {phase === 'tracks' ? 'Saved Tracks' : 'Related Artists'}
        </Typography>
        <Typography>
          {current} / {total} ({percentage}%)
        </Typography>
      </Box>
    );
  };

  const isLoggedIn = false;

  return (
    <div className="App">
      <header className="App-header">
        <IconButton onClick={toggleDrawer} color="inherit">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6">Artist Data</Typography>
        <div className="tabs">
          <TabLinks />
        </div>
      </header>
      {loadingProgress && renderProgress()}
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
      <div className="App-content" style={{ backgroundColor: 'black' }}>
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/graph" /> : <Home />} />
          <Route path="/graph" element={
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
          } />
          <Route path="/table" element={<TableView artistsList={artistsList} />} />
        </Routes>
      </div>
    </div>
  );
};

const TabLinks: React.FC = () => {
  const location = useLocation();
  return (
    <>
      <Link to="/graph" className={location.pathname === '/graph' ? 'active' : ''}>Graph</Link>
      <Link to="/table" className={location.pathname === '/table' ? 'active' : ''}>Table</Link>
    </>
  );
};

export default App;