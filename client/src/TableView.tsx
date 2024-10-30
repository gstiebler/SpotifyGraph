import React from 'react';
import { ProcessedArtist } from './Spotify';

interface TableViewProps {
  artistsList: ProcessedArtist[];
}

const TableView: React.FC<TableViewProps> = ({ artistsList }) => {
  return (
    <div className="tab-content">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Saved Tracks</th>
            <th>Score</th>
            <th>Related Artists</th>
          </tr>
        </thead>
        <tbody>
          {artistsList.map((artist) => (
            <tr key={artist.id}>
              <td><a href={`https://open.spotify.com/artist/${artist.id}`} target="_blank" rel="noopener noreferrer">{artist.name}</a></td>
              <td>{artist.savedTrackCount}</td>
              <td>{artist.score.toFixed(2)}</td>
              <td>{artist.relatedArtists.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;
