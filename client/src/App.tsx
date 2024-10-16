import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import './App.css';
import { AccessToken, Artist, Artists, SimplifiedArtist, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Graph } from './Graph';

const clientId = "88ea8220c6e443d9aec4aee0405c51eb";
const redirectUri = "http://localhost:3000/callback";

function Home() {
  return <h2>Home</h2>;
}

function About() {
  return <h2>About</h2>;
}

function Login() {
  // print the access token
  console.log(window.location.href);
  return <h2>Login</h2>;
}

const App: React.FC = () => {

  useEffect(() => {

    const getArtists = async (token: AccessToken) => {
      const api = SpotifyApi.withAccessToken(clientId, token!);
      const tracks = await api.currentUser.tracks.savedTracks(50);
      let artistsMap = new Map<string, SimplifiedArtist>();
      console.table(tracks.items.map((item) => ({
        name: item.track.name,
        artists: item.track.artists.map((artist) => artist.name).join(", "),
      })));
  
      tracks.items.forEach((item) => {
        item.track.artists.forEach((artist) => {
          artistsMap.set(artist.id, artist);
        });
      });
  
      const artistsIds = Array.from(artistsMap.keys());
      const getRelatedArtistsPromise = await artistsIds.map(async (id) => [id, (await api.artists.relatedArtists(id)).artists]);
      const relatedArtistsListMap = (await Promise.all(getRelatedArtistsPromise));
      console.log(relatedArtistsListMap);
    };

    SpotifyApi.performUserAuthorization(clientId, redirectUri, ["user-library-read"], async (spotifyToken: AccessToken) => {
      if (!spotifyToken) {
        return;
      }
      console.log(spotifyToken);
      // getArtists(spotifyToken);
    });
  }, []);



  return (
    <BrowserRouter>
      <div className="App">
        <header className="App-header">
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/about">About</Link>
              </li>
            </ul>
          </nav>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/callback" element={<Login />} />
          </Routes>
        </header>
        <Graph />
      </div>
    </BrowserRouter>
  );
}

export default App;
