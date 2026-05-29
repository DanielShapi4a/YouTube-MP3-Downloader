import { describe, expect, it } from 'vitest';
import type { LibraryTrack } from '../types';
import { filterLibraryTracks, getTrackFilePath, getUniqueGenres } from './library';

const baseTrack: LibraryTrack = {
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
};

describe('library utilities', () => {
  it('prefers persisted filePath over computed paths', () => {
    expect(
      getTrackFilePath({ ...baseTrack, filePath: 'D:\\Music\\Nightcall.mp3' }, 'C:\\Music'),
    ).toBe('D:\\Music\\Nightcall.mp3');
  });

  it('computes fallback Windows and POSIX paths', () => {
    expect(getTrackFilePath(baseTrack, 'C:\\Users\\Admin\\Music')).toBe(
      'C:\\Users\\Admin\\Music\\Kavinsky - Nightcall.mp3',
    );
    expect(getTrackFilePath(baseTrack, '/Users/admin/Music')).toBe(
      '/Users/admin/Music/Kavinsky - Nightcall.mp3',
    );
  });

  it('filters by search text and genre', () => {
    const tracks = [
      baseTrack,
      { ...baseTrack, id: 'track-2', title: 'Midnight City', artist: 'M83', genre: 'Indie' },
    ];

    expect(filterLibraryTracks(tracks, 'midnight', 'All')).toHaveLength(1);
    expect(filterLibraryTracks(tracks, '', 'Synthwave')).toEqual([baseTrack]);
  });

  it('returns stable unique genre labels', () => {
    expect(getUniqueGenres([baseTrack, { ...baseTrack, id: 'track-2' }])).toEqual([
      'All',
      'Synthwave',
    ]);
  });
});
