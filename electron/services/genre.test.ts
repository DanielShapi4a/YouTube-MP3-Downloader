import { describe, expect, it } from 'vitest';
import { inferGenre, isBroadMetadataLabel, resolveMusicGenre } from './genre';

describe('genre resolver', () => {
  it('ignores broad YouTube categories when resolving music genres', () => {
    expect(
      resolveMusicGenre({
        title: 'The Last of Us (Main Theme) | fingerstyle guitar cover',
        categories: ['Music'],
      }),
    ).toBe('Acoustic');
  });

  it('uses explicit genre metadata when yt-dlp provides it', () => {
    expect(resolveMusicGenre({ genre: 'Progressive House', categories: ['Music'] })).toBe(
      'Electronic',
    );
  });

  it('falls back to a controlled music label instead of raw broad metadata', () => {
    expect(resolveMusicGenre({ title: 'Unknown Upload', categories: ['People & Blogs'] })).toBe(
      'Music',
    );
    expect(isBroadMetadataLabel('Music')).toBe(true);
  });

  it('infers common genres from video text and tags', () => {
    expect(inferGenre('Avicii waiting for love official lyric video')).toBe('Electronic');
    expect(inferGenre('lofi beats to relax and study')).toBe('Lofi');
    expect(inferGenre('movie theme original soundtrack')).toBe('Soundtrack');
  });
});
