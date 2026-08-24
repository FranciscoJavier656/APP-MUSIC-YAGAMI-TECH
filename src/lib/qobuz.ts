import axios from 'axios';

export const searchQobuz = async (query: string) => {
  const res = await axios.get(`/api/search`, {
    params: { q: query }
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzAlbum = async (albumId: string) => {
  const res = await axios.get(`/api/album`, {
    params: { album_id: albumId }
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzPlaylist = async (playlistId: string) => {
  const res = await axios.get(`/api/playlist`, {
    params: { playlist_id: playlistId }
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzTrackUrl = async (trackId: string, formatId: string = '5') => {
  const res = await axios.get(`/api/stream`, {
    params: { track_id: trackId, format_id: formatId }
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data.url;
};

export const getFeaturedAlbums = async (type: string = 'new-releases') => {
  const res = await axios.get(`/api/featured`, { params: { type } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getFeaturedPlaylists = async () => {
  const res = await axios.get(`/api/playlists`);
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};
