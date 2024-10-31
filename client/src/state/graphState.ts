import { atom } from 'recoil';
import { ProcessedArtist, ArtistRelationship } from '../Spotify';

export const artistsListState = atom<ProcessedArtist[]>({
  key: 'artistsListState',
  default: [],
});

export const artistRelationshipsState = atom<ArtistRelationship[]>({
  key: 'artistRelationshipsState',
  default: [],
});

export const forceCenterStrengthState = atom<number>({
  key: 'forceCenterStrengthState',
  default: 0.03,
});

export const forceManyBodyStrengthState = atom<number>({
  key: 'forceManyBodyStrengthState',
  default: -10000,
});

export const linkStrengthFactorState = atom<number>({
  key: 'linkStrengthFactorState',
  default: 0.05,
});
