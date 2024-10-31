import React, { useState, useEffect } from 'react';
import './App.css';
import { AccessToken, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Route, Routes, Link, useLocation, Navigate } from 'react-router-dom';
import { Drawer, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sliders from './Params';
import { Graph } from './Graph';
import { ArtistRelationship, getArtists, ProcessedArtist, LoadingProgress as LoadingProgressType } from './Spotify';
import TableView from './TableView';
import Home from './Home';
import LoadingProgress from './LoadingProgress';
import { styled } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const clientId = "88ea8220c6e443d9aec4aee0405c51eb";
const redirectUri = `${window.location.origin}/`;

const theme = createTheme({
  palette: {
    primary: {
      main: '#1DB954',
      dark: '#1ed760',
      contrastText: '#FFFFFF'
    },
    background: {
      default: '#191414',
      paper: '#282828',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B3B3B3',
    }
  }
});

const AppHeader = styled('header')(({ theme }) => ({
  flex: '0 1 auto',
  backgroundColor: '#282828',
  padding: '10px 20px',
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}));

const AppContent = styled('div')({
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'black'
});

const TabContainer = styled('div')({
  display: 'flex'
});

const TabLink = styled(Link)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  padding: '10px 20px',
  marginLeft: '5px',
  cursor: 'pointer',
  fontSize: '16px',
  color: theme.palette.primary.contrastText,
  textDecoration: 'none',
  display: 'inline-block',
  textAlign: 'center',
  borderRadius: '4px',
  '&.active': {
    backgroundColor: theme.palette.primary.dark,
  }
}));

const TabContent = styled('div')({
  flex: '1 1 auto',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  width: '100%',
  height: '100%'
});

const App: React.FC = () => {
  const [artistsList, setArtistsList] = useState<ProcessedArtist[]>([]);
  const [artistRelationships, setArtistRelationships] = useState<ArtistRelationship[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const [forceCenterStrength, setForceCenterStrength] = useState(0.03);
  const [forceManyBodyStrength, setForceManyBodyStrength] = useState(-10000);
  const [linkStrengthFactor, setLinkStrengthFactor] = useState(0.05);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgressType | null>(null);
  const [isVisible, setIsVisible] = useState(true);

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
      setIsVisible(false);
    }).then((a) => {
      console.log("Authorization complete", a);
    });
  }, []);

  const isLoggedIn = false;

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <AppHeader>
          <IconButton onClick={toggleDrawer} color="inherit">
            <MenuIcon />
          </IconButton>
          <Typography variant="h6">Artist Data</Typography>
          <TabContainer>
            <TabLinks />
          </TabContainer>
        </AppHeader>
        {loadingProgress && <LoadingProgress loadingProgress={loadingProgress} isVisible={isVisible} />}
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
        <AppContent>
          <Routes>
            <Route path="/" element={isLoggedIn ? <Navigate to="/graph" /> : <Home />} />
            <Route path="/callback" element={isLoggedIn ? <Navigate to="/graph" /> : <Home />} />
            <Route path="/graph" element={
              <TabContent>
                <Graph
                  artistsRelationships={artistRelationships}
                  artistsList={artistsList}
                  forceCenterStrength={forceCenterStrength}
                  forceManyBodyStrength={forceManyBodyStrength}
                  linkStrengthFactor={linkStrengthFactor}
                  className="Graph"
                />
              </TabContent>
            } />
            <Route path="/table" element={<TableView artistsList={artistsList} />} />
          </Routes>
        </AppContent>
      </div>
    </ThemeProvider>
  );
};

const TabLinks: React.FC = () => {
  const location = useLocation();
  return (
    <>
      <TabLink to="/graph" className={location.pathname === '/graph' ? 'active' : ''}>Graph</TabLink>
      <TabLink to="/table" className={location.pathname === '/table' ? 'active' : ''}>Table</TabLink>
    </>
  );
};

export default App;