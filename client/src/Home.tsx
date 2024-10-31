import React, { useEffect } from 'react';
import { Button, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import { tokenState, login } from './state/authState';
import { AccessToken } from '@spotify/web-api-ts-sdk';

const Home: React.FC = () => {
  const [tokenRecoil, setToken] = useRecoilState(tokenState);
  const navigate = useNavigate();

  useEffect(() => {
    if (!!tokenRecoil) {
      navigate('/graph');
    }
  }, [tokenRecoil, navigate]);

  const handleLogin = async () => {
    const response = await login((token: AccessToken) => {
      setToken(token);
    });
    console.log('Authorization complete', response);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        textAlign: 'center',
        '& .MuiTypography-h3': {
          mb: 2
        },
        '& .MuiButton-containedPrimary': {
          mt: 2
        }
      }}
    >
      <Typography variant="h3">Welcome to Spotify Graph</Typography>
      <Typography variant="body1">Log in to view your Spotify data visualized.</Typography>
      <Button variant="contained" color="primary" onClick={handleLogin}>
        Log in with Spotify
      </Button>
    </Box>
  );
};

export default Home;
