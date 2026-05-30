import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Quality, type LibraryTrack } from '../../src/types';
import {
  buildPlaylistTrackIdentityMap,
  cleanPathSegment,
  getPlaylistDownloadDirectory,
  hasTrackIdentity,
  isTrackInPlaylistDirectory,
  normalizeSingleMediaUrl,
} from './downloadPlanning';

const existingTrack: LibraryTrack = {
  id: 'track-1',
  title: 'Wake Me Up',
  artist: 'Avicii',
  album: 'Road Mix',
  duration: 251,
  bitrate: Quality.KBPS_320,
  size: '9.6 MB',
  thumbnailUrl: '',
  genre: 'Electronic',
  downloadedAt: '2026-05-30',
  filePath: 'C:\\Music\\CarTune\\Road Mix\\Avicii - Wake Me Up.mp3',
  sourceUrl: 'https://www.youtube.com/watch?v=5y_KJAg8bHI',
};

describe('download planning helpers', () => {
  it('creates safe playlist folders below the selected save location', () => {
    expect(getPlaylistDownloadDirectory('C:\\Music\\CarTune', 'Road: Mix / 2026')).toBe(
      path.join('C:\\Music\\CarTune', 'Road Mix 2026'),
    );
  });

  it('sanitizes invalid file and folder segments', () => {
    expect(cleanPathSegment('  A <bad> / playlist?  ', 'Playlist')).toBe('A bad playlist');
  });

  it('normalizes YouTube radio and short links into single-video URLs', () => {
    expect(
      normalizeSingleMediaUrl(
        'https://www.youtube.com/watch?v=YG_ebwsneJ0&list=RDYG_ebwsneJ0&start_radio=1',
      ),
    ).toBe('https://www.youtube.com/watch?v=YG_ebwsneJ0');
    expect(normalizeSingleMediaUrl('https://youtu.be/abc123?t=30')).toBe(
      'https://www.youtube.com/watch?v=abc123',
    );
    expect(normalizeSingleMediaUrl('https://www.youtube.com/shorts/short123')).toBe(
      'https://www.youtube.com/watch?v=short123',
    );
  });

  it('matches duplicate playlist tracks by stable YouTube id inside the playlist folder', () => {
    const keys = buildPlaylistTrackIdentityMap([existingTrack], 'C:\\Music\\CarTune\\Road Mix');

    expect(
      hasTrackIdentity(keys, {
        title: 'Different title from API',
        artist: 'Different Artist',
        duration: 100,
        url: 'https://youtube.com/watch?v=5y_KJAg8bHI',
      }),
    ).toBe(true);
  });

  it('matches duplicate playlist tracks by normalized metadata inside the playlist folder', () => {
    const keys = buildPlaylistTrackIdentityMap(
      [{ ...existingTrack, sourceUrl: undefined }],
      'C:\\Music\\CarTune\\Road Mix',
    );

    expect(
      hasTrackIdentity(keys, {
        title: ' wake   me up ',
        artist: 'AVICII',
        duration: 251,
        url: '',
      }),
    ).toBe(true);
  });

  it('does not match tracks downloaded outside the current playlist folder', () => {
    const keys = buildPlaylistTrackIdentityMap(
      [{ ...existingTrack, filePath: 'C:\\Music\\CarTune\\Avicii - Wake Me Up.mp3' }],
      'C:\\Music\\CarTune\\Road Mix',
    );

    expect(
      hasTrackIdentity(keys, {
        title: 'Wake Me Up',
        artist: 'Avicii',
        duration: 251,
        url: 'https://youtube.com/watch?v=5y_KJAg8bHI',
      }),
    ).toBe(false);
  });

  it('recognizes playlist folder membership by file path only', () => {
    expect(isTrackInPlaylistDirectory(existingTrack, 'C:\\Music\\CarTune\\Road Mix')).toBe(true);
    expect(isTrackInPlaylistDirectory(existingTrack, 'C:\\Music\\CarTune')).toBe(false);
  });
});
