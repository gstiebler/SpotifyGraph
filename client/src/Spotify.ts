import _ from "lodash";
import { AccessToken, SavedTrack, SimplifiedArtist, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getFromCacheOrCalculate } from "./util";

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

const getArtistsMapFromTracks = async (token: AccessToken, clientId: string): Promise<Map<string, StoredArtist>> => {
    const api = SpotifyApi.withAccessToken(clientId, token!);
    const tracks = [] as SavedTrack[];

    while (true) {
        const response = await api.currentUser.tracks.savedTracks(50, tracks.length);
        tracks.push(...response.items);
        console.log(`Fetched ${tracks.length} tracks`);
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

const getRelatedArtists = async (artistsIds: string[], api: SpotifyApi) => {
    const throtledGetRelatedArtists = _.throttle(async (id) => {
        const artists = (await api.artists.relatedArtists(id)).artists;
        return artists.map(simplifiedArtistToSGArtist);
    }, 5);

    const getRelatedArtistsPromises = artistsIds.map(async (id) => {
        console.log(`Fetching related artists for ${id}`);
        return { artistId: id, relatedArtists: await throtledGetRelatedArtists(id) };
    });
    return Promise.all(getRelatedArtistsPromises);
}

export const getArtists = async (token: AccessToken, clientId: string) => {
    const api = SpotifyApi.withAccessToken(clientId, token!);

    const artistsMapFromTracksPairs = await getFromCacheOrCalculate('artistsMap', async () => {
        const mapResult = await getArtistsMapFromTracks(token, clientId);
        return [...mapResult.entries()];
    });
    const artistsMapFromTracks = new Map<string, StoredArtist>(artistsMapFromTracksPairs.slice(0, MAX_ARTISTS));

    const artistsIds = [...artistsMapFromTracks.keys()];
    const relatedArtistsListOriginal = await getFromCacheOrCalculate('relatedArtists', () => {
        return getRelatedArtists(artistsIds, api);
    });

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
        console.log(`Processing related artists for ${artistId}`);
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

    return { artistsMap, artistRelationships: [...artistsRelationshipsMap.values()] };
};
