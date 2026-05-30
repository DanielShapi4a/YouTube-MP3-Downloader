import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PlaylistManager from './PlaylistManager';
import { Language, Quality, type AppSettings, type LibraryTrack, type Playlist } from '../types';

const settings: AppSettings = {
  saveLocation: 'C:\\Users\\Admin\\Music\\CarTune',
  language: Language.EN,
  quality: Quality.KBPS_320,
  advancedLogging: true,
};

const playlist: Playlist = {
  id: 'playlist-1',
  name: 'Road Mix',
  url: 'youtube.com/playlist?list=road',
  totalTracks: 1,
  downloadedTracks: 1,
  status: 'completed',
  tracks: [
    {
      title: 'Wake Me Up',
      artist: 'Avicii',
      duration: 251,
      url: 'https://youtube.com/watch?v=wake',
      genre: 'Music',
    },
  ],
};

const downloadedTrack: LibraryTrack = {
  id: 'track-1',
  title: 'Wake Me Up',
  artist: 'Avicii',
  album: 'Road Mix',
  duration: 251,
  bitrate: '320',
  size: '9.6 MB',
  thumbnailUrl: '',
  genre: 'Music',
  downloadedAt: '2026-05-30',
  filePath: 'C:\\Users\\Admin\\Music\\CarTune\\Avicii - Wake Me Up.mp3',
  sourceUrl: 'https://youtube.com/watch?v=wake',
};

describe('PlaylistManager', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'Audio',
      vi.fn().mockImplementation(function MockAudio(src: string) {
        return {
          src,
          pause: vi.fn(),
          play: vi.fn().mockResolvedValue(undefined),
          onended: null,
          onerror: null,
        };
      }),
    );

    window.carTune = {
      metadata: { inspect: vi.fn() },
      downloads: {
        start: vi.fn(),
        cancel: vi.fn(),
        onProgress: vi.fn(),
        onLog: vi.fn(),
      },
      library: {
        listTracks: vi.fn(),
        deleteTrack: vi.fn(),
        clearTracks: vi.fn(),
        listPlaylists: vi.fn(),
        savePlaylist: vi.fn(),
        updatePlaylistStatus: vi.fn(),
        deletePlaylist: vi.fn(),
      },
      settings: {
        get: vi.fn(),
        save: vi.fn(),
        chooseSaveLocation: vi.fn(),
      },
      shell: {
        showItemInFolder: vi.fn(),
        openFolder: vi.fn(),
      },
      media: {
        getUrl: vi.fn(
          (filePath: string) => `cartune-media://file?path=${encodeURIComponent(filePath)}`,
        ),
      },
    };
  });

  it('shows genre and plays downloaded playlist tracks from the track modal', async () => {
    const onAddLog = vi.fn();

    render(
      <PlaylistManager
        settings={settings}
        playlists={[playlist]}
        libraryTracks={[downloadedTrack]}
        onAddPlaylist={vi.fn()}
        onUpdatePlaylistStatus={vi.fn()}
        onDeletePlaylist={vi.fn()}
        onAddLog={onAddLog}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /view tracks/i }));
    expect(screen.getByText('Music')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /wake me up/i }));

    expect(window.carTune.media.getUrl).toHaveBeenCalledWith(downloadedTrack.filePath);
    expect(Audio).toHaveBeenCalledWith(
      `cartune-media://file?path=${encodeURIComponent(downloadedTrack.filePath!)}`,
    );
    await waitFor(() =>
      expect(onAddLog).toHaveBeenCalledWith(
        'success',
        expect.stringContaining('Playing local MP3 file'),
      ),
    );
  });
});
