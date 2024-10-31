import React, { useState, useEffect } from 'react';
import './App.css';
import { AccessToken } from '@spotify/web-api-ts-sdk';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import { Drawer, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sliders from './Params';
import { Graph } from './Graph';
import { getArtists, LoadingProgress as LoadingProgressType } from './Spotify';
import TableView from './TableView';
import Home from './Home';
import LoadingProgress from './LoadingProgress';
import { styled } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useSetRecoilState } from 'recoil';
import { ProtectedRoute } from './components/ProtectedRoute';
import { THEME } from './constants';
import { login, tokenState } from './state/authState';
import {
  artistsListState,
  artistRelationshipsState,
} from './state/graphState';

const theme = createTheme(THEME);

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
  const setArtistsList = useSetRecoilState(artistsListState);
  const setArtistRelationships = useSetRecoilState(artistRelationshipsState);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<LoadingProgressType | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const setToken = useSetRecoilState(tokenState);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  useEffect(() => {
    login(async (spotifyToken: AccessToken) => {
      if (!spotifyToken) {
        return;
      }
      setToken(spotifyToken);
      console.log(spotifyToken);
      const { artistsList: artistsListLocal, artistRelationships: artistRelationshipsLocal } = await getArtists(spotifyToken, setLoadingProgress);

      setArtistsList(artistsListLocal);
      setArtistRelationships(artistRelationshipsLocal);
      setLoadingProgress(null);
      setIsVisible(false);
    }).then((a) => {
      console.log("Authorization complete", a);
    });
  }, [setToken]);

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
            <Sliders />
          </Box>
        </Drawer>
        <AppContent>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Routes>
                    <Route path="/graph" element={
                      <TabContent>
                        <Graph />
                      </TabContent>
                    } />
                    <Route path="/table" element={<TableView />} />
                  </Routes>
                </ProtectedRoute>
              }
            />
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