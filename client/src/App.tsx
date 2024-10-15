import React, { useEffect, useRef } from 'react';
import _ from 'lodash';
import logo from './logo.svg';
import './App.css';
import { AccessToken, Artist, Artists, SimplifiedArtist, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import * as d3 from 'd3';
import {
  forceSimulation,
  SimulationNodeDatum,
} from "d3-force";

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

let spotifyToken: AccessToken;

function App() {

  const handleButtonClick = async () => {
    SpotifyApi.performUserAuthorization(clientId, redirectUri, ["user-library-read"], async (token: AccessToken) => {
      spotifyToken = token;
      console.log(token);
    });
  };

  const showSomethingClick = async () => {
    const api = SpotifyApi.withAccessToken(clientId, spotifyToken);
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
    const relatedArtistsListMap = await Promise.all(getRelatedArtistsPromise);
  };


  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    var width = 300, height = 300
    var nodes = [{}, {}, {}, {}, {}]

    var simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2))
      .on('tick', ticked);

      function ticked() {
        svg
          .selectAll('circle')
          .data(nodes)
          .join('circle')
          .attr('r', 5)
          .attr('cx', function(d: any) {
            return d.x
          })
          .attr('cy', function(d: any) {
            return d.y
          });
      }
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
          <svg ref={svgRef} width={500} height={300} />
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.tsx</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
          <button onClick={handleButtonClick}>Get User Profile</button>
          <button onClick={showSomethingClick}>Show something</button>
        </header>
      </div>
    </BrowserRouter>
  );
}

export default App;
