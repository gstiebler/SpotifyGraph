import _ from "lodash";
import { AccessToken, Artist, SavedTrack, SimplifiedArtist, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getFromCacheOrCalculate } from "./util";

export type SGArtist = {
    id: string;
    name: string;
}

const simplifiedArtistToSGArtist = (artist: SimplifiedArtist): SGArtist => {
    return {
        id: artist.id,
        name: artist.name
    };
}

const getArtistsMapFromTracks = async (token: AccessToken, clientId: string): Promise<Map<string, SGArtist>> => {
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

    let artistsMapLocal = new Map<string, SGArtist>();

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
    const artistsMapFromTracks = new Map<string, SGArtist>(artistsMapFromTracksPairs);

    const artistsIds = [...artistsMapFromTracks.keys()];    
    const relatedArtistsList = await getFromCacheOrCalculate('relatedArtists', () => {
        return getRelatedArtists(artistsIds, api);
    });
    
    const artistsMap = new Map<string, SGArtist>();
    // The value of the set is a string in the form of "artistId1-artistId2"
    const artistsRelationships = new Set<string>();

    for (const artist of artistsMapFromTracks.values()) {
        artistsMap.set(artist.id, artist);
    }

    for (const { artistId, relatedArtists } of relatedArtistsList) {
        for (const relatedArtist of relatedArtists) {
            artistsMap.set((relatedArtist as Artist).id, relatedArtist);
            const artistKey = `${artistId}-${(relatedArtist as Artist).id}`;
            artistsRelationships.add(artistKey);
        }
    }
    const artistsRelationshipPairs = Array.from(artistsRelationships).map((key) => key.split("-"));
    return { artistsMap, artistsRelationshipPairs };
};
