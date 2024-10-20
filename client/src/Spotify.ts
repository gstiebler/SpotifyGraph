import _ from "lodash";
import { AccessToken, Artist, SavedTrack, SimplifiedArtist, SpotifyApi } from "@spotify/web-api-ts-sdk";
import { getFromCacheOrCalculate } from "./util";



const getArtistsMapFromTracks = async (token: AccessToken, clientId: string): Promise<Map<string, SimplifiedArtist>> => {
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

    let artistsMapLocal = new Map<string, SimplifiedArtist>();
    console.table(tracks.map((item) => ({
        name: item.track.name,
        artists: item.track.artists.map((artist) => artist.name).join(", "),
    })));

    for (const track of tracks) {
        for (const artist of track.track.artists) {
            artistsMapLocal.set(artist.id, artist);
        }
    }

    return artistsMapLocal;
}

const getRelatedArtists = async (artistsIds: string[], api: SpotifyApi) => {
    const throtledGetRelatedArtists = _.throttle(async (id) => (await api.artists.relatedArtists(id)).artists, 5);

    const getRelatedArtistsPromises = artistsIds.map(async (id) => {
        console.log(`Fetching related artists for ${id}`);
        return { artistId: id, relatedArtists: await throtledGetRelatedArtists(id) };
    });
    return Promise.all(getRelatedArtistsPromises);
}

export const getArtists = async (token: AccessToken, clientId: string) => {
    const api = SpotifyApi.withAccessToken(clientId, token!);
    
    const artistsMapFromTracks = await getFromCacheOrCalculate('artistsMap', async () => {
        return await getArtistsMapFromTracks(token, clientId);
    });

    const artistsIds = Array.from(artistsMapFromTracks.keys());

    const artistsMap = new Map<string, SimplifiedArtist>();
    // The value of the set is a string in the form of "artistId1-artistId2"
    const artistsRelationships = new Set<string>();
    
    const relatedArtistsList = await getFromCacheOrCalculate('relatedArtists', () => getRelatedArtists(artistsIds, api));
    for (const { artistId, relatedArtists } of relatedArtistsList) {
        for (const relatedArtist of relatedArtists) {
            artistsMap.set((relatedArtist as Artist).id, relatedArtist as Artist);
            const artistKey = `${artistId}-${(relatedArtist as Artist).id}`;
            artistsRelationships.add(artistKey);
        }
    }
    const artistsRelationshipPairs = Array.from(artistsRelationships).map((key) => key.split("-"));
    return { artistsMap, artistsRelationshipPairs };
};
