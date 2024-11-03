import { AccessToken, SavedTrack, SimplifiedArtist, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getFromCacheOrCalculate } from "./util";
import Dexie, { EntityTable } from 'dexie';
import { SPOTIFY_CONFIG } from "./constants";

const MAX_ARTISTS = 20000;
const NUM_FILTERED_ARTISTS = 3000;
const MAX_RELATED_ARTISTS = 20;

export type StoredArtist = {
    id: string;
    name: string;
    savedTrackCount: number;
}

export interface ProcessedArtist extends StoredArtist {
    score: number;
    relatedArtists: string[];
}

export type ArtistRelationship = {
    artistId1: string;
    artistId2: string;
    strength: number;
};

export type LoadingProgress = {
    phase: 'tracks' | 'artists';
    current: number;
    total: number;
}

const simplifiedArtistToSGArtist = (artist: SimplifiedArtist): StoredArtist => {
    return {
        id: artist.id,
        name: artist.name,
        savedTrackCount: 0,
    };
}

interface RelatedArtists {
    id: string;
    relatedArtists: SimplifiedArtist[];
}

type SpotifyGraphDB = Dexie & {
    spotifyGraph: EntityTable<
        RelatedArtists,
        'id' // primary key "id" (for the typings only)
    >;
};

const getArtistsMapFromTracks = async (
    token: AccessToken,
    onProgress?: (progress: LoadingProgress) => void
): Promise<Map<string, StoredArtist>> => {
    const api = SpotifyApi.withAccessToken(SPOTIFY_CONFIG.clientId, token!);
    const tracks = [] as SavedTrack[];

    // Get total tracks first
    const initial = await api.currentUser.tracks.savedTracks(1, 0);
    const totalTracks = initial.total;

    while (true) {
        const response = await api.currentUser.tracks.savedTracks(50, tracks.length);
        tracks.push(...response.items);
        onProgress?.({
            phase: 'tracks',
            current: tracks.length,
            total: totalTracks
        });
        if (!response.next) {
            break;
        }
    }

    let artistsMap = new Map<string, StoredArtist>();

    for (const track of tracks) {
        for (const artist of track.track.artists) {
            const simplifiedArtist = simplifiedArtistToSGArtist(artist);
            const previousCount = artistsMap.get(artist.id)?.savedTrackCount || 0;
            artistsMap.set(artist.id, {
                ...simplifiedArtist,
                savedTrackCount: previousCount + 1
            });
        }
    }

    return artistsMap;
}

const getRelatedArtists = async (
    artistsIds: string[],
    api: SpotifyApi,
    db: SpotifyGraphDB,
    onProgress?: (progress: LoadingProgress) => void
) => {
    const result = [] as { artistId: string, relatedArtists: SimplifiedArtist[] }[];
    const total = artistsIds.length;

    const artistsNotInCache = [];
    // Caution when parallelizing this loop, the Spotify API has a rate limit
    for (const [index, id] of artistsIds.entries()) {
        // Check if we have the data in the cache
        const cachedData = await db.spotifyGraph.get(id);
        if (cachedData) {
            result.push({
                artistId: id,
                relatedArtists: cachedData.relatedArtists
            });
        } else {
            artistsNotInCache.push(id);
        }
    }

    for (const [index, artistId] of artistsNotInCache.entries()) {
        const artists = (await api.artists.relatedArtists(artistId)).artists;
        result.push({ artistId, relatedArtists: artists });

        try {
            await db.spotifyGraph.put({
                id: artistId,
                relatedArtists: artists
            });
        } catch (e) {
            console.error('Failed to save related artists to cache', e);
        }

        onProgress?.({
            phase: 'artists',
            current: index + 1,
            total: artistsNotInCache.length
        });
    }
    return result;
}

export const getArtists = async (
    token: AccessToken,
    onProgress?: (progress: LoadingProgress) => void
) => {
    const api = SpotifyApi.withAccessToken(SPOTIFY_CONFIG.clientId, token!);

    const db = new Dexie('spotifyGraph') as SpotifyGraphDB;
    if (!db) {
        throw new Error('Failed to open the database');
    }
    db.version(1).stores({
        spotifyGraph: '++id'
    });

    const artistsMapFromTracksPairs = await getFromCacheOrCalculate('artistsMap', async () => {
        const mapResult = await getArtistsMapFromTracks(token, onProgress);
        return [...mapResult.entries()];
    });
    const artistsMapFromTracks = new Map<string, StoredArtist>(artistsMapFromTracksPairs.slice(0, MAX_ARTISTS));

    const artistsIds = [...artistsMapFromTracks.keys()];
    const relatedArtistsListOriginal = await getRelatedArtists(artistsIds, api, db, onProgress);

    const relatedArtistsList = relatedArtistsListOriginal.filter(({ artistId }) => artistsMapFromTracks.has(artistId));

    const artistsMap = new Map<string, ProcessedArtist>();

    for (const artist of artistsMapFromTracks.values()) {
        artistsMap.set(artist.id, {
            ...artist,
            score: artist.savedTrackCount,
            relatedArtists: [],
        });
    }

    // The value of the set is a string in the form of "artistId1-artistId2"
    const artistsRelationshipsMap = new Map<string, ArtistRelationship>();
    // artistId1 => artistId2, and artistId2 => artistId1
    const artistsGraph = new Map<string, Set<string>>();

    const calculateScore = (artist: ProcessedArtist) => {
        return 1 + Math.log(artist.savedTrackCount);
    }

    const formatRelatedArtistToList = (relatedArtist: ProcessedArtist) => {
        const score = calculateScore(relatedArtist);
        return `${relatedArtist.name} (${score.toFixed(2)})`;
    }

    for (const { artistId, relatedArtists } of relatedArtistsList) {
        const artist = artistsMap.get(artistId)!;
        for (const relatedArtist of relatedArtists.slice(0, MAX_RELATED_ARTISTS)) {
            if (!artistsMap.has(relatedArtist.id)) {
                artistsMap.set(relatedArtist.id, {
                    ...relatedArtist,
                    savedTrackCount: 0,
                    score: calculateScore(artist),
                    relatedArtists: [formatRelatedArtistToList(artist)],
                });
            } else {
                const relatedArtistOnMap = artistsMap.get(relatedArtist.id)!;
                relatedArtistOnMap.score += calculateScore(artist);
                relatedArtistOnMap.relatedArtists.push(formatRelatedArtistToList(artist));
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
    }


    const compareArtist = (a: ProcessedArtist, b: ProcessedArtist) => {
        const savedTracksDiff = b.savedTrackCount - a.savedTrackCount;
        if (savedTracksDiff !== 0) {
            return savedTracksDiff;
        }
        return b.score - a.score;
    };

    const artistsList = [...artistsMap.values()].sort(compareArtist);
    return filterArtistsAndRelationships(artistsList, [...artistsRelationshipsMap.values()]);
};

function filterArtistsAndRelationships(artistsList: ProcessedArtist[], artistRelationships: ArtistRelationship[]) {
    const sortedArtistsList = artistsList.sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) {
            return scoreDiff;
        }
        return b.savedTrackCount - a.savedTrackCount;
    });
    const filteredArtistsList = sortedArtistsList.slice(0, NUM_FILTERED_ARTISTS);
    const artistsMap = new Map(filteredArtistsList.map((artist) => [artist.id, artist]));
    const filteredArtistsRelationships = artistRelationships.filter(
        (relationship) => artistsMap.has(relationship.artistId1) && artistsMap.has(relationship.artistId2));
    return { artistsList: filteredArtistsList, artistRelationships: filteredArtistsRelationships };
}
