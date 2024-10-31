import React, { useState, useEffect } from 'react';
import './App.css';
import { AccessToken } from '@spotify/web-api-ts-sdk';
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import { Drawer, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Sliders from './Params';
import { Graph } from './Graph';
import TableView from './TableView';
import Home from './Home';
import { styled } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { useSetRecoilState } from 'recoil';
import { ProtectedRoute } from './components/ProtectedRoute';
import { THEME } from './constants';
import { login, tokenState } from './state/authState';
import SpotifyDataLoader from './SpotifyDataLoader';

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

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <>
      <AppHeader>
        <IconButton onClick={toggleDrawer} color="inherit">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6">Artist Data</Typography>
        <TabContainer>
          <TabLinks />
        </TabContainer>
      </AppHeader>
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
        {children}
      </AppContent>
    </>
  );
};

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const setToken = useSetRecoilState(tokenState);
  const [spotifyToken, setSpotifyToken] = useState<AccessToken | null>(null);

  useEffect(() => {
    login(async (token: AccessToken) => {
      if (!token) return;
      setToken(token);
      setSpotifyToken(token);
    }).then((a) => {
      console.log("Authorization complete", a);
    });
  }, [setToken]);

  if (isLoading && spotifyToken) {
    return <SpotifyDataLoader token={spotifyToken} onLoadingComplete={() => setIsLoading(false)} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/graph" element={
                      <TabContent>
                        <Graph />
                      </TabContent>
                    } />
                    <Route path="/table" element={<TableView />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
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