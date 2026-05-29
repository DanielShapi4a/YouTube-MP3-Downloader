export enum Language {
  EN = 'en',
  RU = 'ru',
  HE = 'he',
}

export enum Quality {
  KBPS_128 = '128',
  KBPS_256 = '256',
  KBPS_320 = '320',
}

export interface AppSettings {
  saveLocation: string;
  language: Language;
  quality: Quality;
  advancedLogging: boolean;
}

export interface LibraryTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  bitrate: string;
  size: string;
  thumbnailUrl: string;
  audioSeed?: number; // For synth music generation
  genre: string;
  downloadedAt: string;
  filePath?: string;
  sourceUrl?: string;
}

export type DownloadStatus =
  | 'queued'
  | 'fetching'
  | 'downloading'
  | 'converting'
  | 'completed'
  | 'failed';

export interface ActiveDownload {
  id: string;
  title: string;
  artist: string;
  duration: number;
  progress: number; // 0 to 100
  speed: string; // e.g., '3.2 MB/s'
  eta: string; // e.g., '00:12'
  status: DownloadStatus;
  thumbnailUrl: string;
  playlistId?: string;
  error?: string;
}

export interface Playlist {
  id: string;
  name: string;
  url: string;
  totalTracks: number;
  downloadedTracks: number;
  status: 'queued' | 'processing' | 'paused' | 'completed';
  tracks: Array<{
    title: string;
    artist: string;
    duration: number;
    url?: string;
    thumbnailUrl?: string;
  }>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}

export interface TrackMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  genre: string;
  thumbnailUrl: string;
  url: string;
}

export interface PlaylistMetadata {
  name: string;
  tracks: Array<{
    title: string;
    artist: string;
    duration: number;
    url: string;
    thumbnailUrl?: string;
  }>;
}

export interface DownloadRequest {
  url: string;
  isPlaylist: boolean;
  quality: Quality;
  saveLocation: string;
  playlistId?: string;
  metadata?: TrackMetadata;
}

export interface DownloadProgressEvent {
  jobId: string;
  playlistId?: string;
  track?: LibraryTrack;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl: string;
  progress: number;
  speed: string;
  eta: string;
  status: DownloadStatus;
  downloadedTracks?: number;
  totalTracks?: number;
  error?: string;
}

export interface NativeLogEvent {
  type: LogEntry['type'];
  message: string;
}
