import React, { useEffect, useRef } from 'react';
import _ from 'lodash';
import './App.css';
import { AccessToken, Artist, Artists, SimplifiedArtist, SpotifyApi } from '@spotify/web-api-ts-sdk';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import * as d3 from 'd3';

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



const nodes = [
  { name: 'A' },
  { name: 'B' },
  { name: 'C' },
  { name: 'D' },
  { name: 'E' },
  { name: 'F' },
  { name: 'G' },
  { name: 'H' },
] as any;

const links = [
  { source: nodes[0], target: nodes[1] },
  { source: nodes[0], target: nodes[2] },
  { source: nodes[0], target: nodes[3] },
  { source: nodes[1], target: nodes[6] },
  { source: nodes[3], target: nodes[4] },
  { source: nodes[3], target: nodes[7] },
  { source: nodes[4], target: nodes[5] },
  { source: nodes[4], target: nodes[7] }
];

function executeD3(svg: any) {
  const width = 400, height = 300;
  const simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-100))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('link', d3.forceLink(links).id((d: any) => d.index))
    .on('tick', () => ticked(svg));
}

function updateLinks(svg: any) {
  const u = svg
    .selectAll('line')
    .data(links)
    .join('line')
    .style('stroke', 'black')
    .attr('x1', function (d: any) {
      return d.source.x;
    })
    .attr('y1', function (d: any) {
      return d.source.y;
    })
    .attr('x2', function (d: any) {
      return d.target.x;
    })
    .attr('y2', function (d: any) {
      return d.target.y;
    });
}

function updateNodes(svg: any) {
  const u = svg
    .selectAll('text')
    .data(nodes)
    .join('text')
    .text(function (d: any) {
      return d.name;
    })
    .attr('x', function (d: any) {
      return d.x;
    })
    .attr('y', function (d: any) {
      return d.y;
    })
    .attr('dy', function (d: any) {
      return 5;
    });
}

function ticked(svg: any) {
  updateNodes(svg);
  updateLinks(svg);
}

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
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      executeD3(svg);
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
          <button onClick={handleButtonClick}>Get User Profile</button>
          <button onClick={showSomethingClick}>Show something</button>
        </header>
      </div>
    </BrowserRouter>
  );
}

export default App;
