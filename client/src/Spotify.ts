import { AccessToken, Artist, SimplifiedArtist, SpotifyApi } from "@spotify/web-api-ts-sdk";


export const getArtists = async (token: AccessToken, clientId: string) => {
    const api = SpotifyApi.withAccessToken(clientId, token!);
    const tracks = await api.currentUser.tracks.savedTracks(50);
    let artistsMapLocal = new Map<string, SimplifiedArtist>();
    console.table(tracks.items.map((item) => ({
        name: item.track.name,
        artists: item.track.artists.map((artist) => artist.name).join(", "),
    })));

    for (const track of tracks.items) {
        for (const artist of track.track.artists) {
            artistsMapLocal.set(artist.id, artist);
        }
    }

    const artistsRelationships = new Set<string>();

    const artistsIds = Array.from(artistsMapLocal.keys());
    const getRelatedArtistsPromise = await artistsIds.map(async (id) => [id, (await api.artists.relatedArtists(id)).artists]);
    const relatedArtistsListMap = (await Promise.all(getRelatedArtistsPromise));
    for (const [id, relatedArtists] of relatedArtistsListMap) {
        for (const relatedArtist of relatedArtists) {
            artistsMapLocal.set((relatedArtist as Artist).id, relatedArtist as Artist);
            const artistKey = `${id}-${(relatedArtist as Artist).id}`;
            artistsRelationships.add(artistKey);
        }
    }
    const artistsRelationshipPairsLocal = Array.from(artistsRelationships).map((key) => key.split("-"));
    return { artistsMapLocal, artistsRelationshipPairsLocal };


};
