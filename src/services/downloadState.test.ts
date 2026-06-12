import { describe, expect, it } from 'vitest';
import { Quality, type DownloadProgressEvent, type LibraryTrack, type Playlist } from '../types';
import {
  applyPlaylistProgress,
  createActiveDownloadFromProgress,
  createResolvingDownload,
  createStartingTrackDownload,
  updatePendingPlaylistDownload,
  upsertCompletedTrack,
} from './downloadState';

const track: LibraryTrack = {
  id: 'track-1',
  title: 'Wake Me Up',
  artist: 'Avicii',
  album: 'CarTune Downloads',
  duration: 251,
  bitrate: Quality.KBPS_320,
  size: '9.6 MB',
  thumbnailUrl: 'cover.jpg',
  genre: 'Electronic',
  downloadedAt: '2026-05-30',
  filePath: 'C:\\Music\\Avicii - Wake Me Up.mp3',
};

const progressEvent: DownloadProgressEvent = {
  jobId: 'job-1',
  title: 'Wake Me Up',
  artist: 'Avicii',
  duration: 251,
  thumbnailUrl: 'cover.jpg',
  genre: 'Electronic',
  progress: 42.6,
  speed: '1.2 MB/s',
  eta: '00:10',
  status: 'downloading',
};

describe('download state service', () => {
  it('creates user-visible resolving state before native metadata returns', () => {
    expect(createResolvingDownload('pending-1', false)).toMatchObject({
      id: 'pending-1',
      title: 'Resolving track metadata...',
      progress: 2,
      status: 'fetching',
    });
  });

  it('maps track metadata into starting download state', () => {
    expect(
      createStartingTrackDownload('pending-1', {
        title: 'Wake Me Up',
        artist: 'Avicii',
        album: 'CarTune Downloads',
        duration: 251,
        genre: 'Electronic',
        thumbnailUrl: 'cover.jpg',
        url: 'https://youtube.test/watch',
      }),
    ).toMatchObject({
      artist: 'Avicii',
      genre: 'Electronic',
      progress: 5,
      speed: 'starting download',
    });
  });

  it('updates only the matching pending playlist indicator', () => {
    expect(
      updatePendingPlaylistDownload(
        createResolvingDownload('pending-1', true),
        'pending-1',
        'Road Mix',
        12,
      ),
    ).toMatchObject({
      title: 'Road Mix',
      artist: '12 tracks',
      genre: 'Playlist',
    });
  });

  it('maps native progress events into active download view models', () => {
    expect(createActiveDownloadFromProgress(progressEvent)).toMatchObject({
      id: 'job-1',
      progress: 43,
      status: 'downloading',
      genre: 'Electronic',
    });
  });

  it('deduplicates completed tracks by id when inserting them at the top', () => {
    expect(upsertCompletedTrack([{ ...track, title: 'Old title' }], track)).toEqual([track]);
  });

  it('updates playlist counters and marks final native playlist progress complete', () => {
    const playlist: Playlist = {
      id: 'playlist-1',
      name: 'Road Mix',
      url: 'youtube.test/list',
      totalTracks: 2,
      downloadedTracks: 1,
      status: 'processing',
      tracks: [],
    };

    expect(
      applyPlaylistProgress([playlist], {
        ...progressEvent,
        playlistId: 'playlist-1',
        downloadedTracks: 2,
        totalTracks: 2,
        status: 'completed',
      }),
    ).toEqual([{ ...playlist, downloadedTracks: 2, status: 'completed' }]);
  });

  it('keeps playlist and dashboard state paused when native playlist progress pauses', () => {
    const playlist: Playlist = {
      id: 'playlist-1',
      name: 'Road Mix',
      url: 'youtube.test/list',
      totalTracks: 4,
      downloadedTracks: 1,
      status: 'processing',
      tracks: [],
    };

    expect(
      applyPlaylistProgress([playlist], {
        ...progressEvent,
        playlistId: 'playlist-1',
        downloadedTracks: 1,
        totalTracks: 4,
        status: 'paused',
      }),
    ).toEqual([{ ...playlist, downloadedTracks: 1, status: 'paused' }]);
  });
});
