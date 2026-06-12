import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Language, Quality, type LibraryTrack, type Playlist } from '../../src/types';
import { CarTuneDatabase } from './database';

describe('CarTuneDatabase', () => {
  let tempDir: string;
  let database: CarTuneDatabase;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cartune-db-test-'));
    database = new CarTuneDatabase(
      path.join(tempDir, 'cartune.sqlite'),
      path.join(tempDir, 'Music'),
    );
  });

  afterEach(() => {
    database.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns defaults and persists settings', () => {
    expect(database.getSettings()).toMatchObject({
      saveLocation: path.join(tempDir, 'Music'),
      language: Language.EN,
      quality: Quality.KBPS_320,
      advancedLogging: true,
    });

    database.saveSettings({
      saveLocation: 'D:\\CarTune',
      language: Language.RU,
      quality: Quality.KBPS_128,
      advancedLogging: false,
    });

    expect(database.getSettings()).toEqual({
      saveLocation: 'D:\\CarTune',
      language: Language.RU,
      quality: Quality.KBPS_128,
      advancedLogging: false,
    });
  });

  it('persists, lists, deletes, and clears tracks', () => {
    const track: LibraryTrack = {
      id: 'track-1',
      title: 'Nightcall',
      artist: 'Kavinsky',
      album: 'Outrun',
      duration: 258,
      bitrate: '320',
      size: '10.1 MB',
      thumbnailUrl: 'cover.jpg',
      genre: 'Synthwave',
      downloadedAt: '2026-05-29',
      filePath: path.join(tempDir, 'Kavinsky - Nightcall.mp3'),
      sourceUrl: 'https://youtube.example/watch?v=1',
    };

    database.saveTrack(track);
    expect(database.listTracks()).toEqual([track]);

    database.deleteTrack(track.id);
    expect(database.listTracks()).toEqual([]);

    database.saveTrack(track);
    database.clearTracks();
    expect(database.listTracks()).toEqual([]);
  });

  it('persists playlists and status updates', () => {
    const playlist: Playlist = {
      id: 'playlist-1',
      name: 'Road Mix',
      url: 'youtube.com/playlist?list=1',
      totalTracks: 2,
      downloadedTracks: 0,
      status: 'processing',
      tracks: [
        {
          title: 'Track One',
          artist: 'Artist One',
          duration: 180,
          url: 'https://youtube.example/1',
        },
        {
          title: 'Track Two',
          artist: 'Artist Two',
          duration: 200,
          url: 'https://youtube.example/2',
        },
      ],
    };

    database.savePlaylist(playlist);
    expect(database.listPlaylists()).toEqual([playlist]);

    database.updatePlaylistStatus(playlist.id, 'completed', 2);
    expect(database.listPlaylists()[0]).toMatchObject({ status: 'completed', downloadedTracks: 2 });

    database.deletePlaylist(playlist.id);
    expect(database.listPlaylists()).toEqual([]);
  });

  it('refreshes the library by removing missing files and updating playlist counters', () => {
    const saveLocation = path.join(tempDir, 'Music');
    fs.mkdirSync(saveLocation, { recursive: true });

    const presentFile = path.join(saveLocation, 'Artist One - Track One.mp3');
    const missingFile = path.join(saveLocation, 'Artist Two - Track Two.mp3');
    fs.writeFileSync(presentFile, 'mp3');

    const presentTrack: LibraryTrack = {
      id: 'track-1',
      title: 'Track One',
      artist: 'Artist One',
      album: 'Road Mix',
      duration: 180,
      bitrate: '320',
      size: '7.1 MB',
      thumbnailUrl: 'cover-one.jpg',
      genre: 'Rock',
      downloadedAt: '2026-06-12',
      filePath: presentFile,
      sourceUrl: 'https://youtube.example/1',
    };
    const missingTrack: LibraryTrack = {
      id: 'track-2',
      title: 'Track Two',
      artist: 'Artist Two',
      album: 'Road Mix',
      duration: 200,
      bitrate: '320',
      size: '8.3 MB',
      thumbnailUrl: 'cover-two.jpg',
      genre: 'Rock',
      downloadedAt: '2026-06-12',
      filePath: missingFile,
      sourceUrl: 'https://youtube.example/2',
    };
    const playlist: Playlist = {
      id: 'playlist-1',
      name: 'Road Mix',
      url: 'youtube.com/playlist?list=1',
      totalTracks: 2,
      downloadedTracks: 2,
      status: 'completed',
      tracks: [
        {
          title: 'Track One',
          artist: 'Artist One',
          duration: 180,
          url: 'https://youtube.example/1',
        },
        {
          title: 'Track Two',
          artist: 'Artist Two',
          duration: 200,
          url: 'https://youtube.example/2',
        },
      ],
    };

    database.saveTrack(presentTrack);
    database.saveTrack(missingTrack);
    database.savePlaylist(playlist);

    const result = database.refreshLibraryFromDisk();

    expect(result.removedTracks).toBe(1);
    expect(result.tracks).toEqual([presentTrack]);
    expect(result.playlists[0]).toMatchObject({
      id: playlist.id,
      downloadedTracks: 1,
      status: 'paused',
    });
    expect(database.listTracks()).toEqual([presentTrack]);
  });
});
