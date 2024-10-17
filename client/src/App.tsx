import React, { useEffect, useState } from 'react';
import './App.css';
import { AccessToken, Artist, SimplifiedArtist, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Graph } from './Graph';

const clientId = "88ea8220c6e443d9aec4aee0405c51eb";
const redirectUri = "http://localhost:3000/callback";

function Home() {
  return <h2>Home</h2>;
}

function Login() {
  // print the access token
  console.log(window.location.href);
  return <h2>Login</h2>;
}

const App: React.FC = () => {

  const [artistsMap, setArtistsMap] = useState<Map<string, SimplifiedArtist>>(new Map());
  const [artistsRelationshipPairs, setArtistsRelationshipPairs] = useState<string[][]>([]);

  useEffect(() => {

    const getArtists = async (token: AccessToken) => {
      const api = SpotifyApi.withAccessToken(clientId, token!);
      const tracks = await api.currentUser.tracks.savedTracks(50);
      let artistsMapLocal = new Map<string, SimplifiedArtist>();
      console.table(tracks.items.map((item) => ({
        name: item.track.name,
        artists: item.track.artists.map((artist) => artist.name).join(", "),
      })));
  
      for (const track of tracks.items) {
        for (const artist of track.track.artists) {
          artistsMapLocal.set(artist.id, artist);
        }
      }

      const artistsRelationships = new Set<string>();
  
      const artistsIds = Array.from(artistsMapLocal.keys());
      const getRelatedArtistsPromise = await artistsIds.map(async (id) => [id, (await api.artists.relatedArtists(id)).artists]);
      const relatedArtistsListMap = (await Promise.all(getRelatedArtistsPromise));
      for (const [id, relatedArtists] of relatedArtistsListMap) {
        for (const relatedArtist of relatedArtists) {
          artistsMapLocal.set((relatedArtist as Artist).id, relatedArtist as Artist);
          const artistKey = `${id}-${(relatedArtist as Artist).id}`;
          artistsRelationships.add(artistKey);
        }
      }
      const artistsRelationshipPairsLocal = Array.from(artistsRelationships).map((key) => key.split("-"));
      localStorage.setItem('artistsRelationshipPairs', JSON.stringify(artistsRelationshipPairsLocal));
      localStorage.setItem('artistsMap', JSON.stringify(Array.from(artistsMapLocal.entries())));
      setArtistsMap(artistsMapLocal);
      setArtistsRelationshipPairs(artistsRelationshipPairsLocal);
    };

    SpotifyApi.performUserAuthorization(clientId, redirectUri, ["user-library-read"], async (spotifyToken: AccessToken) => {
      if (!spotifyToken) {
        return;
      }
      console.log(spotifyToken);
      if (localStorage.getItem('artistsMap')) {
        const artistsMapLocal = new Map<string, SimplifiedArtist>(JSON.parse(localStorage.getItem('artistsMap')!));
        const artistsRelationshipPairsLocal = JSON.parse(localStorage.getItem('artistsRelationshipPairs')!);
        setArtistsMap(artistsMapLocal);
        setArtistsRelationshipPairs(artistsRelationshipPairsLocal);
      } else {
        getArtists(spotifyToken);
      }
    });
  }, []);

  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/callback" element={<Login />} />
          </Routes>
        </header>
        <div className="App-content">
          <Graph className="Graph" artistsMap={artistsMap} artistsRelationshipPairs={artistsRelationshipPairs}/>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;