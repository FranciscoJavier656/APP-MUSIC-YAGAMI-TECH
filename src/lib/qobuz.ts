import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const API_BASE = Capacitor.isNativePlatform() ? 'https://ais-pre-pssjmmwet2liei6r6ofh3r-237034068613.us-west1.run.app' : '';


export const searchQobuz = async (query: string) => {
  const res = await axios.get(`${API_BASE}/api/search`, {
    params: { q: query }
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzAlbum = async (albumId: string) => {
  const res = await axios.get(`${API_BASE}/api/album`, {
    params: { album_id: albumId }
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzPlaylist = async (playlistId: string) => {
  const res = await axios.get(`${API_BASE}/api/playlist`, {
    params: { playlist_id: playlistId }
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getQobuzTrackUrl = async (trackId: string, formatId: string = '5') => {
  const res = await axios.get(`${API_BASE}/api/stream`, {
    params: { track_id: trackId, format_id: formatId }
  });
  if (res.data.error) throw new Error(res.data.error);
  return res.data.url;
};

export const getFeaturedAlbums = async (type: string = 'new-releases') => {
  const res = await axios.get(`${API_BASE}/api/featured`, { params: { type } });
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};

export const getFeaturedPlaylists = async () => {
  const res = await axios.get(`${API_BASE}/api/playlists`);
  if (res.data.error) throw new Error(res.data.error);
  return res.data;
};
