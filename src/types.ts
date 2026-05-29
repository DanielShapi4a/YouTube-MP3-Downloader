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
}

export type DownloadStatus = 'queued' | 'fetching' | 'downloading' | 'converting' | 'completed' | 'failed';

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
  }>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
}
