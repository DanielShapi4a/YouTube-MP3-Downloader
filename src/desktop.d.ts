import type {
  AppSettings,
  DownloadProgressEvent,
  DownloadRequest,
  LibraryTrack,
  NativeLogEvent,
  Playlist,
  PlaylistMetadata,
  TrackMetadata,
} from './types';

type PlaylistStatus = Playlist['status'];

declare global {
  interface Window {
    carTune?: {
      metadata: {
        inspect(input: {
          url: string;
          isPlaylist: boolean;
        }): Promise<TrackMetadata | PlaylistMetadata>;
      };
      downloads: {
        start(input: DownloadRequest): Promise<{ jobId: string }>;
        cancel(jobId: string): Promise<void>;
        onProgress(callback: (event: DownloadProgressEvent) => void): () => void;
        onLog(callback: (event: NativeLogEvent) => void): () => void;
      };
      library: {
        listTracks(): Promise<LibraryTrack[]>;
        deleteTrack(id: string): Promise<void>;
        clearTracks(): Promise<void>;
        listPlaylists(): Promise<Playlist[]>;
        savePlaylist(playlist: Playlist): Promise<void>;
        updatePlaylistStatus(id: string, status: PlaylistStatus): Promise<void>;
        deletePlaylist(id: string): Promise<void>;
      };
      settings: {
        get(): Promise<AppSettings>;
        save(settings: AppSettings): Promise<AppSettings>;
        chooseSaveLocation(current?: string): Promise<string | null>;
      };
      shell: {
        showItemInFolder(filePath: string): Promise<void>;
        openFolder(folderPath: string): Promise<void>;
      };
      media: {
        getUrl(filePath: string): string;
      };
    };
  }
}

export {};
