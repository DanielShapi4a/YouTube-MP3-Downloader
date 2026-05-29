import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CompletedLibrary from './CompletedLibrary';
import { Language, Quality, type AppSettings, type LibraryTrack } from '../types';

const settings: AppSettings = {
  saveLocation: 'C:\\Users\\Admin\\Music\\CarTune',
  language: Language.EN,
  quality: Quality.KBPS_320,
  advancedLogging: true,
};

const track: LibraryTrack = {
  id: 'track-1',
  title: 'Nightcall',
  artist: 'Kavinsky',
  album: 'Outrun',
  duration: 258,
  bitrate: '320',
  size: '10.1 MB',
  thumbnailUrl: '',
  genre: 'Synthwave',
  downloadedAt: '2026-05-29',
  filePath: 'C:\\Users\\Admin\\Music\\CarTune\\Kavinsky - Nightcall.mp3',
};

const renderLibrary = (tracks: LibraryTrack[] = [track]) => {
  const props = {
    settings,
    tracks,
    onDeleteTrack: vi.fn(),
    onClearAllTracks: vi.fn(),
    onAddLog: vi.fn(),
  };

  render(<CompletedLibrary {...props} />);
  return props;
};

describe('CompletedLibrary', () => {
  beforeEach(() => {
    vi.stubGlobal('Audio', vi.fn().mockImplementation((src: string) => ({
      src,
      pause: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      onended: null,
      onerror: null,
    })));
  });

  it('filters visible tracks by search query', () => {
    renderLibrary([
      track,
      { ...track, id: 'track-2', title: 'Midnight City', artist: 'M83', genre: 'Indie' },
    ]);

    fireEvent.change(screen.getByPlaceholderText('Search tracks by title, artist, or genre...'), { target: { value: 'midnight' } });

    expect(screen.getByText('Midnight City')).toBeInTheDocument();
    expect(screen.queryByText('Nightcall')).not.toBeInTheDocument();
  });

  it('opens native Show in Folder for persisted desktop tracks', async () => {
    const showItemInFolder = vi.fn().mockResolvedValue(undefined);
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
        showItemInFolder,
        openFolder: vi.fn(),
      },
      media: {
        getUrl: vi.fn((filePath: string) => `cartune-media://${encodeURIComponent(filePath)}`),
      },
    };

    renderLibrary();
    fireEvent.click(screen.getByRole('button', { name: /show in folder/i }));

    await waitFor(() => expect(showItemInFolder).toHaveBeenCalledWith(track.filePath));
  });

  it('plays a local file through the desktop media protocol', async () => {
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
        getUrl: vi.fn((filePath: string) => `cartune-media://${encodeURIComponent(filePath)}`),
      },
    };
    const props = renderLibrary();

    fireEvent.click(document.getElementById(`play-track-box-${track.id}`)!);

    expect(window.carTune.media.getUrl).toHaveBeenCalledWith(track.filePath);
    expect(Audio).toHaveBeenCalledWith(`cartune-media://${encodeURIComponent(track.filePath!)}`);
    await waitFor(() => expect(props.onAddLog).toHaveBeenCalledWith('success', expect.stringContaining('Playing local MP3 file')));
  });
});
