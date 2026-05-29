import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, ALBUM_ART } from '../data/initialData';
import {
  calculateMp3Size,
  createCompletedTrack,
  createMockActiveDownload,
  createPlaylistCompletedTrack,
  getMockProgressTick,
  resolveMockThumbnail,
} from './webDownloadSimulator';

describe('web download simulator service', () => {
  it('maps known mock titles to deterministic artwork', () => {
    expect(resolveMockThumbnail('Midnight City')).toBe(ALBUM_ART.midnightCity);
    expect(resolveMockThumbnail('Strobe Radio Edit')).toBe(ALBUM_ART.strobe);
    expect(resolveMockThumbnail('Nightcall')).toBe(ALBUM_ART.nightcall);
    expect(resolveMockThumbnail('Unknown song')).toBe(ALBUM_ART.default);
  });

  it('calculates MP3 size from duration and bitrate', () => {
    expect(calculateMp3Size(256, '320')).toBe('10.0 MB');
    expect(calculateMp3Size(Number.NaN, '320')).toBe('0.0 MB');
    expect(calculateMp3Size(256, 'invalid')).toBe('0.0 MB');
  });

  it('builds active and completed single-track models with safe metadata fallbacks', () => {
    const activeDownload = createMockActiveDownload({ title: 'Untitled' });
    const completedTrack = createCompletedTrack({ title: 'Untitled' }, DEFAULT_SETTINGS);

    expect(activeDownload).toMatchObject({
      title: 'Untitled',
      artist: 'Web Artist',
      duration: 200,
      progress: 0,
      status: 'queued',
    });

    expect(completedTrack).toMatchObject({
      title: 'Untitled',
      artist: 'Synthesized Hits',
      album: 'CarTune Compiled Drive',
      duration: 200,
      size: '7.8 MB',
      genre: 'Drive Pop',
    });
  });

  it('creates playlist tracks using playlist context', () => {
    const track = createPlaylistCompletedTrack(
      { title: 'Dreaming Awake', artist: 'Lofi Girl', duration: 144 },
      'Lo-Fi Study Beats',
      DEFAULT_SETTINGS,
      0,
    );

    expect(track).toMatchObject({
      title: 'Dreaming Awake',
      artist: 'Lofi Girl',
      album: 'Lo-Fi Study Beats',
      bitrate: DEFAULT_SETTINGS.quality,
      genre: 'Lofi Beats',
    });
  });

  it('caps simulated progress at 100 percent', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    expect(getMockProgressTick(95)).toMatchObject({
      progress: 100,
      eta: '00:00',
    });
  });
});
