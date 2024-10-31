import React from 'react';
import { styled } from '@mui/material/styles';
import { useRecoilValue } from 'recoil';
import { artistsListState } from './state/graphState';

const StyledTable = styled('table')({
  backgroundColor: '#191414',
  color: '#FFFFFF',
  width: '100%',
  borderCollapse: 'collapse',
  '& th, & td': {
    padding: '12px',
    borderBottom: '1px solid #282828',
  },
  '& th': {
    backgroundColor: '#282828',
    color: '#1DB954',
  },
  '& a': {
    color: '#1DB954',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    }
  }
});

const TableView: React.FC = () => {
  const artistsList = useRecoilValue(artistsListState);

  return (
    <div className="tab-content" style={{ backgroundColor: '#191414', padding: '20px' }}>
      <StyledTable>
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
      </StyledTable>
    </div>
  );
};

export default TableView;
