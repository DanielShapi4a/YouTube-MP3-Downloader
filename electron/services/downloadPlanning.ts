import path from 'node:path';
import type { LibraryTrack, TrackMetadata } from '../../src/types';

const INVALID_FILE_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;

type TrackIdentityInput = Pick<TrackMetadata, 'title' | 'artist' | 'duration' | 'url'> & {
  sourceUrl?: string;
};

export function cleanPathSegment(value: string, fallback: string) {
  const cleaned = value.replace(INVALID_FILE_CHARS, '').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 120) || fallback;
}

export function getPlaylistDownloadDirectory(saveLocation: string, playlistName: string) {
  return path.join(saveLocation, cleanPathSegment(playlistName, 'YouTube Playlist'));
}

export function getTrackIdentityKeys(track: TrackIdentityInput) {
  const keys = new Set<string>();
  const sourceUrl = normalizeSourceUrl(track.sourceUrl || track.url);
  const title = normalizeText(track.title);
  const artist = normalizeText(track.artist);
  const duration = Math.max(0, Math.round(Number(track.duration || 0)));

  if (sourceUrl) {
    keys.add(`url:${sourceUrl}`);
  }

  if (title && artist) {
    keys.add(`meta:${artist}|${title}|${duration}`);
  }

  return keys;
}

export function addTrackIdentityKeys(target: Set<string>, track: TrackIdentityInput) {
  getTrackIdentityKeys(track).forEach((key) => target.add(key));
}

export function hasTrackIdentity(target: Set<string>, track: TrackIdentityInput) {
  return [...getTrackIdentityKeys(track)].some((key) => target.has(key));
}

export function buildExistingTrackIdentityMap(tracks: LibraryTrack[]) {
  const keys = new Set<string>();

  tracks.forEach((track) => {
    if (!track.filePath) return;
    addTrackIdentityKeys(keys, {
      title: track.title,
      artist: track.artist,
      duration: track.duration,
      url: track.sourceUrl || '',
    });
  });

  return keys;
}

export function buildPlaylistTrackIdentityMap(tracks: LibraryTrack[], playlistDirectory: string) {
  return buildExistingTrackIdentityMap(
    tracks.filter((track) => isTrackInPlaylistDirectory(track, playlistDirectory)),
  );
}

export function isTrackInPlaylistDirectory(track: LibraryTrack, playlistDirectory: string) {
  if (!track.filePath) return false;

  const normalizedDirectory = normalizeDirectoryPath(playlistDirectory);
  const normalizedFilePath = normalizeFilePath(track.filePath);

  return path.dirname(normalizedFilePath) === normalizedDirectory;
}

function normalizeSourceUrl(value: string | undefined) {
  if (!value) return '';

  try {
    const parsed = new URL(value);
    const videoId = parsed.searchParams.get('v');

    if (videoId) {
      return `youtube:${videoId}`;
    }

    return `${parsed.hostname.replace(/^www\./, '')}${parsed.pathname}${parsed.search}`;
  } catch {
    return normalizeText(value);
  }
}

function normalizeDirectoryPath(value: string) {
  return normalizeFilePath(value).replace(/[\\/]+$/, '');
}

function normalizeFilePath(value: string) {
  return path.normalize(value).toLowerCase();
}

function normalizeText(value: string | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
