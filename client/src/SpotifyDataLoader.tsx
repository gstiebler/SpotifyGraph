import React, { useEffect } from 'react';
import { Typography, Box, CircularProgress, Paper } from '@mui/material';
import { LoadingProgress as LoadingProgressType, getArtists } from './Spotify';
import { AccessToken } from '@spotify/web-api-ts-sdk';
import { useSetRecoilState } from 'recoil';
import { artistsListState, artistRelationshipsState } from './state/graphState';

interface SpotifyDataLoaderProps {
    token: AccessToken;
    onLoadingComplete: () => void;
}

const SpotifyDataLoader: React.FC<SpotifyDataLoaderProps> = ({ token, onLoadingComplete }) => {
    const [loadingProgress, setLoadingProgress] = React.useState<LoadingProgressType>({ phase: 'tracks', current: 0, total: 1 });
    const setArtistsList = useSetRecoilState(artistsListState);
    const setArtistRelationships = useSetRecoilState(artistRelationshipsState);

    useEffect(() => {
        const loadData = async () => {
            const { artistsList, artistRelationships } = await getArtists(token, setLoadingProgress);
            setArtistsList(artistsList);
            setArtistRelationships(artistRelationships);
            onLoadingComplete();
        };

        loadData();
    }, [token, onLoadingComplete, setArtistsList, setArtistRelationships]);

    const { phase, current, total } = loadingProgress;
    const percentage = Math.round((current / total) * 100);

    return (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <Paper sx={{
                backgroundColor: 'rgba(40, 40, 40, 0.95)',
                padding: '32px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
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
        </Box>
    );
};

export default SpotifyDataLoader;
