import _ from "lodash";
import { AccessToken, SavedTrack, SimplifiedArtist, SpotifyApi } from "@spotify/web-api-ts-sdk";
const fs = require('fs');
const path = require('path');
import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '/../.env' });

const clientId = process.env.CLIENT_ID!;
const clientSecret = process.env.CLIENT_SECRET!;

const MAX_ARTISTS = 10000;
const MAX_RELATED_ARTISTS = 20;

export type StoredArtist = {
    id: string;
    name: string;
    savedTrackCount: number;
}

export interface ProcessedArtist extends StoredArtist {
    score: number;
}

export type ArtistRelationship = {
    artistId1: string;
    artistId2: string;
    strength: number;
};

const simplifiedArtistToSGArtist = (artist: SimplifiedArtist): StoredArtist => {
    return {
        id: artist.id,
        name: artist.name,
        savedTrackCount: 0,
    };
}

const getRelatedArtists = async (artistsIds: string[], api: SpotifyApi) => {
    let result = [];

    for (const id of artistsIds) {
        console.log(`Fetching related artists for ${id}`);
        const artists = (await api.artists.relatedArtists(id)).artists;
        result.push({ artistId: id, relatedArtists: artists.map(simplifiedArtistToSGArtist) });
    }
    return result;
}

export const getArtists = async () => {
    const api = SpotifyApi.withClientCredentials(clientId, clientSecret);

    const savedTracksPath = path.join(__dirname, '../data/savedTracks.json');
    const savedTracksData = fs.readFileSync(savedTracksPath, 'utf-8');
    const artistsMapFromTracksPairs = JSON.parse(savedTracksData);
    const artistsMapFromTracks = new Map<string, StoredArtist>(artistsMapFromTracksPairs.slice(0, MAX_ARTISTS));

    const artistsIds = [...artistsMapFromTracks.keys()];


    const relatedArtistsPath = path.join(__dirname, '../data/artists.json');
    const relatedArtistsData = fs.readFileSync(relatedArtistsPath, 'utf-8');
    const relatedArtistsListOriginal = JSON.parse(relatedArtistsData) as { artistId: string, relatedArtists: StoredArtist[] }[];

    // const relatedArtistsListOriginal = await getRelatedArtists(artistsIds, api);
    // console.log(JSON.stringify(relatedArtistsListOriginal, null, 2));

    const relatedArtistsList = relatedArtistsListOriginal.filter(({ artistId }) => artistsMapFromTracks.has(artistId));

    const artistsMap = new Map<string, ProcessedArtist>();
    // The value of the set is a string in the form of "artistId1-artistId2"
    const artistsRelationshipsMap = new Map<string, ArtistRelationship>();
    // artistId1 => artistId2, and artistId2 => artistId1
    const artistsGraph = new Map<string, Set<string>>();

    for (const artist of artistsMapFromTracks.values()) {
        artistsMap.set(artist.id, {
            ...artist,
            score: artist.savedTrackCount,
        });
    }

    for (const { artistId, relatedArtists } of relatedArtistsList) {
        const artist = artistsMap.get(artistId)!;
        for (const relatedArtist of relatedArtists.slice(0, MAX_RELATED_ARTISTS)) {
            if (!artistsMap.has(relatedArtist.id)) {
                artistsMap.set(relatedArtist.id, {
                    ...relatedArtist,
                    savedTrackCount: 0,
                    score: artist.savedTrackCount,
                });
            } else {
                const relatedArtistOnMap = artistsMap.get(relatedArtist.id)!;
                relatedArtistOnMap.score += artist.savedTrackCount;
            }
            const artistId1 = artistId;
            const artistId2 = relatedArtist.id;
            const artistKey = `${artistId1}-${artistId2}`;
            artistsRelationshipsMap.set(artistKey, {
                artistId1,
                artistId2,
                strength: 1
            });
            if (!artistsGraph.has(artistId1)) {
                artistsGraph.set(artistId1, new Set());
            }
            if (!artistsGraph.has(artistId2)) {
                artistsGraph.set(artistId2, new Set());
            }
            artistsGraph.get(artistId1)!.add(artistId2);
            artistsGraph.get(artistId2)!.add(artistId1);
        }
    }
    /*
        // increase the strength of the relationship between two artists for every artist they have in common
        for (const [artist, relatedArtists] of artistsGraph) {
            for (const relatedArtist of relatedArtists) {
                const relatedArtistsNested = artistsGraph.get(relatedArtist)!;
                for (const relatedArtistNested of relatedArtistsNested) {
                    if (relatedArtistNested === artist) {
                        const key = `${artist}-${relatedArtist}`;
                        const keyReversed = `${relatedArtist}-${artist}`;
                        const strength = (artistsRelationshipsMap.get(key)?.strength || 0) + 1;
                        artistsRelationshipsMap.set(key, { artistId1: artist, artistId2: relatedArtist, strength });
    
                        const strength2 = (artistsRelationshipsMap.get(keyReversed)?.strength || 0) + 1;
                        artistsRelationshipsMap.set(keyReversed, { artistId1: artist, artistId2: relatedArtist, strength: strength2 });
                    }
                }
            }
        }*/

    const sortedArtistsBySavedTracks = Array.from(artistsMap.values()).sort((a, b) => {
        const savedTracksDiff = b.savedTrackCount - a.savedTrackCount;
        if (savedTracksDiff !== 0) {
            return savedTracksDiff;
        }
        return b.score - a.score;
    });

    console.table(sortedArtistsBySavedTracks.map(artist => ({
        id: artist.id,
        name: artist.name,
        savedTrackCount: artist.savedTrackCount,
        score: artist.score
    })));

    return { artistsMap, artistRelationships: [...artistsRelationshipsMap.values()] };
};

getArtists();
