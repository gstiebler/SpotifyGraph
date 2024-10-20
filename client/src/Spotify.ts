import _ from "lodash";
import { AccessToken, Artist, SavedTrack, SimplifiedArtist, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getFromCacheOrCalculate } from "./util";

const MAX_ARTISTS = 100;
const MAX_RELATED_ARTISTS = 5;

export type StoredArtist = {
    id: string;
    name: string;
}

export interface ProcessedArtist extends StoredArtist {
    savedTrackCount: number;
}

const simplifiedArtistToSGArtist = (artist: SimplifiedArtist): StoredArtist => {
    return {
        id: artist.id,
        name: artist.name
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

    let artistsMapLocal = new Map<string, StoredArtist>();

    for (const track of tracks) {
        for (const artist of track.track.artists) {
            artistsMapLocal.set(artist.id, simplifiedArtistToSGArtist(artist));
        }
    }

    return artistsMapLocal;
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
    const artistsRelationships = new Set<string>();

    for (const artist of artistsMapFromTracks.values()) {
        const previousCount = artistsMap.get(artist.id)?.savedTrackCount || 0;
        artistsMap.set(artist.id, { ...artist, savedTrackCount: previousCount + 1 });
    }

    for (const { artistId, relatedArtists } of relatedArtistsList) {
        for (const relatedArtist of relatedArtists.slice(0, MAX_RELATED_ARTISTS)) {
            if (!artistsMap.has((relatedArtist as Artist).id)) {
                artistsMap.set((relatedArtist as Artist).id, { ...relatedArtist, savedTrackCount: 0 });
            }
            const artistKey = `${artistId}-${(relatedArtist as Artist).id}`;
            artistsRelationships.add(artistKey);
        }
    }
    const artistsRelationshipPairs = Array.from(artistsRelationships).map((key) => key.split("-"));
    return { artistsMap, artistsRelationshipPairs };
};
