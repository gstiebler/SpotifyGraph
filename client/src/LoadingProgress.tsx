import React from 'react';
import { Typography, Box, CircularProgress, Paper } from '@mui/material';
import { LoadingProgress as LoadingProgressType } from './Spotify';

interface LoadingProgressProps {
  loadingProgress: LoadingProgressType;
  isVisible: boolean;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({ loadingProgress, isVisible }) => {
  const { phase, current, total } = loadingProgress;
  const percentage = Math.round((current / total) * 100);

  return (
    <Paper sx={{ 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(40, 40, 40, 0.95)',
      padding: '32px',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.5s ease-out',
      pointerEvents: isVisible ? 'auto' : 'none',
      color: '#FFFFFF'
    }}>
      <Typography variant="h6" sx={{ color: '#1DB954' }}>
        {phase === 'tracks' ? 'Loading Saved Tracks' : 'Loading Related Artists'}
      </Typography>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress 
          variant="determinate" 
          value={percentage} 
          size={80} 
          thickness={4}
          sx={{ color: '#1DB954' }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography variant="caption" component="div" color="primary">
            {`${percentage}%`}
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ color: '#FFFFFF' }}>
        {current} of {total}
      </Typography>
    </Paper>
  );
};

export default LoadingProgress;
