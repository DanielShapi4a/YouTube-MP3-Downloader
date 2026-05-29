import {
  ActiveDownload,
  AppSettings,
  LibraryTrack,
  Playlist,
  Quality,
  TrackMetadata,
} from '../types';
import { ALBUM_ART } from '../data/initialData';

type MockTrackMetadata = Pick<TrackMetadata, 'title'> & Partial<Omit<TrackMetadata, 'title'>>;
type MockPlaylistTrack = Playlist['tracks'][number];

const DEFAULT_MOCK_DURATION = 200;

export function resolveMockThumbnail(title: string) {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('midnight')) return ALBUM_ART.midnightCity;
  if (normalizedTitle.includes('strobe')) return ALBUM_ART.strobe;
  if (normalizedTitle.includes('nightcall')) return ALBUM_ART.nightcall;
  return ALBUM_ART.default;
}

export function createMockActiveDownload(
  trackMeta: MockTrackMetadata,
  thumbnailUrl = resolveMockThumbnail(trackMeta.title),
): ActiveDownload {
  return {
    id: `download-${Date.now()}`,
    title: trackMeta.title,
    artist: trackMeta.artist || 'Web Artist',
    duration: trackMeta.duration || DEFAULT_MOCK_DURATION,
    progress: 0,
    speed: '3.2 MB/s',
    eta: '00:15',
    status: 'queued',
    thumbnailUrl,
  };
}

export function calculateMp3Size(duration: number, quality: Quality | string) {
  const bitrate = parseInt(quality, 10);
  if (!Number.isFinite(duration) || !Number.isFinite(bitrate)) {
    return '0.0 MB';
  }

  return `${((duration * (bitrate / 8)) / 1024).toFixed(1)} MB`;
}

export function createCompletedTrack(
  trackMeta: MockTrackMetadata,
  settings: AppSettings,
  thumbnailUrl = resolveMockThumbnail(trackMeta.title),
): LibraryTrack {
  const duration = trackMeta.duration || DEFAULT_MOCK_DURATION;

  return {
    id: `track-${Date.now()}`,
    title: trackMeta.title,
    artist: trackMeta.artist || 'Synthesized Hits',
    album: trackMeta.album || 'CarTune Compiled Drive',
    duration,
    bitrate: settings.quality,
    size: calculateMp3Size(duration, settings.quality),
    thumbnailUrl,
    genre: trackMeta.genre || 'Drive Pop',
    downloadedAt: new Date().toLocaleDateString(),
  };
}

export function createPlaylistCompletedTrack(
  currentTrack: MockPlaylistTrack,
  playlistName: string,
  settings: AppSettings,
  index: number,
): LibraryTrack {
  const thumbChoices = [ALBUM_ART.midnightCity, ALBUM_ART.strobe, ALBUM_ART.nightcall];

  return {
    id: `track-${Date.now()}-${index}`,
    title: currentTrack.title,
    artist: currentTrack.artist,
    album: playlistName,
    duration: currentTrack.duration,
    bitrate: settings.quality,
    size: calculateMp3Size(currentTrack.duration, settings.quality),
    thumbnailUrl: thumbChoices[index % thumbChoices.length],
    genre:
      playlistName.includes('Lofi') || playlistName.includes('Lo-Fi') ? 'Lofi Beats' : 'Synthwave',
    downloadedAt: new Date().toLocaleDateString(),
  };
}

export function getMockProgressTick(currentProgress: number) {
  const nextProgress = Math.min(100, currentProgress + Math.floor(Math.random() * 12) + 8);
  const speedVal = (Math.random() * 1.5 + 2.5).toFixed(1);
  const secondsLeft = Math.ceil((100 - nextProgress) / 8);

  return {
    progress: nextProgress,
    speed: `${speedVal} MB/s`,
    eta: `00:${Math.max(0, secondsLeft).toString().padStart(2, '0')}`,
  };
}
