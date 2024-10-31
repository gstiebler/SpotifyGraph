export const SPOTIFY_CONFIG = {
  clientId: "88ea8220c6e443d9aec4aee0405c51eb",
  redirectUri: `${window.location.origin}/`,
  scopes: ["user-library-read"]
} as const;

export const THEME = {
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
} as const;
