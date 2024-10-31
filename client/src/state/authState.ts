import { atom } from 'recoil';
import { AccessToken, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { SPOTIFY_CONFIG } from '../constants';

export const tokenState = atom<AccessToken | null>({
  key: 'tokenState',
  default: null,
});

export const login = async (setToken: (token: AccessToken) => void) => {
  return SpotifyApi.performUserAuthorization(
    SPOTIFY_CONFIG.clientId, 
    SPOTIFY_CONFIG.redirectUri, 
    [...SPOTIFY_CONFIG.scopes],
    async (spotifyToken: AccessToken) => setToken(spotifyToken)
  );
};
