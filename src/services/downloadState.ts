import type {
  ActiveDownload,
  DownloadProgressEvent,
  LibraryTrack,
  Playlist,
  TrackMetadata,
} from '../types';

export function createResolvingDownload(id: string, isPlaylist: boolean): ActiveDownload {
  return {
    id,
    title: isPlaylist ? 'Resolving playlist metadata...' : 'Resolving track metadata...',
    artist: isPlaylist ? 'YouTube Playlist' : 'YouTube',
    duration: 0,
    progress: 2,
    speed: 'fetching metadata',
    eta: '--:--',
    status: 'fetching',
    thumbnailUrl: '',
    genre: 'Music',
  };
}

export function createStartingTrackDownload(id: string, metadata: TrackMetadata): ActiveDownload {
  return {
    id,
    title: metadata.title,
    artist: metadata.artist,
    duration: metadata.duration,
    progress: 5,
    speed: 'starting download',
    eta: '--:--',
    status: 'fetching',
    thumbnailUrl: metadata.thumbnailUrl,
    genre: metadata.genre,
  };
}

export function updatePendingPlaylistDownload(
  activeDownload: ActiveDownload | null,
  pendingDownloadId: string,
  playlistName: string,
  trackCount: number,
): ActiveDownload | null {
  if (activeDownload?.id !== pendingDownloadId) {
    return activeDownload;
  }

  return {
    ...activeDownload,
    title: playlistName,
    artist: `${trackCount} tracks`,
    progress: 5,
    speed: 'starting playlist download',
    genre: 'Playlist',
  };
}

export function createActiveDownloadFromProgress(event: DownloadProgressEvent): ActiveDownload {
  return {
    id: event.jobId,
    title: event.title,
    artist: event.artist,
    duration: event.duration,
    progress: Math.round(event.progress),
    speed: event.speed,
    eta: event.eta,
    status: event.status,
    thumbnailUrl: event.thumbnailUrl,
    genre: event.genre,
    playlistId: event.playlistId,
    error: event.error,
  };
}

export function upsertCompletedTrack(
  tracks: LibraryTrack[],
  completedTrack: LibraryTrack,
): LibraryTrack[] {
  const withoutDuplicate = tracks.filter((track) => track.id !== completedTrack.id);
  return [completedTrack, ...withoutDuplicate];
}

export function applyPlaylistProgress(
  playlists: Playlist[],
  event: DownloadProgressEvent,
): Playlist[] {
  if (!event.playlistId || typeof event.downloadedTracks !== 'number') {
    return playlists;
  }

  return playlists.map((playlist) => {
    if (playlist.id !== event.playlistId) {
      return playlist;
    }

    const totalTracks = event.totalTracks ?? playlist.totalTracks;
    const isCompleted = event.status === 'completed' && event.downloadedTracks === totalTracks;
    const status: Playlist['status'] =
      event.status === 'paused' ? 'paused' : isCompleted ? 'completed' : 'processing';

    return {
      ...playlist,
      downloadedTracks: event.downloadedTracks,
      status,
    };
  });
}
