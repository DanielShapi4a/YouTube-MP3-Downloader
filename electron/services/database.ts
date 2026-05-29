import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import type { AppSettings, LibraryTrack, Playlist } from '../../src/types';
import { Language, Quality } from '../../src/types';

export class CarTuneDatabase {
  private db: Database.Database;
  private defaultSettings: AppSettings;

  constructor(dbPath: string, defaultSaveLocation: string) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new Database(dbPath);
    this.defaultSettings = {
      saveLocation: defaultSaveLocation,
      language: Language.EN,
      quality: Quality.KBPS_320,
      advancedLogging: true,
    };
    this.initialize();
  }

  private initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        album TEXT NOT NULL,
        duration INTEGER NOT NULL,
        bitrate TEXT NOT NULL,
        size TEXT NOT NULL,
        thumbnailUrl TEXT,
        genre TEXT NOT NULL,
        downloadedAt TEXT NOT NULL,
        filePath TEXT NOT NULL,
        sourceUrl TEXT
      );

      CREATE TABLE IF NOT EXISTS playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        totalTracks INTEGER NOT NULL,
        downloadedTracks INTEGER NOT NULL,
        status TEXT NOT NULL,
        tracksJson TEXT NOT NULL
      );
    `);
  }

  getSettings(): AppSettings {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get('app') as
      | { value: string }
      | undefined;
    if (!row) return this.defaultSettings;

    try {
      return { ...this.defaultSettings, ...JSON.parse(row.value) };
    } catch {
      return this.defaultSettings;
    }
  }

  saveSettings(settings: AppSettings): AppSettings {
    this.db
      .prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      .run('app', JSON.stringify(settings));
    return settings;
  }

  listTracks(): LibraryTrack[] {
    return this.db
      .prepare('SELECT * FROM tracks ORDER BY downloadedAt DESC, rowid DESC')
      .all() as LibraryTrack[];
  }

  saveTrack(track: LibraryTrack) {
    this.db
      .prepare(
        `
        INSERT OR REPLACE INTO tracks (
          id, title, artist, album, duration, bitrate, size, thumbnailUrl, genre, downloadedAt, filePath, sourceUrl
        ) VALUES (
          @id, @title, @artist, @album, @duration, @bitrate, @size, @thumbnailUrl, @genre, @downloadedAt, @filePath, @sourceUrl
        )
      `,
      )
      .run(track);
  }

  deleteTrack(id: string) {
    this.db.prepare('DELETE FROM tracks WHERE id = ?').run(id);
  }

  clearTracks() {
    this.db.prepare('DELETE FROM tracks').run();
  }

  listPlaylists(): Playlist[] {
    const rows = this.db.prepare('SELECT * FROM playlists ORDER BY rowid DESC').all() as Array<{
      id: string;
      name: string;
      url: string;
      totalTracks: number;
      downloadedTracks: number;
      status: Playlist['status'];
      tracksJson: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      url: row.url,
      totalTracks: row.totalTracks,
      downloadedTracks: row.downloadedTracks,
      status: row.status,
      tracks: JSON.parse(row.tracksJson),
    }));
  }

  savePlaylist(playlist: Playlist) {
    this.db
      .prepare(
        `
        INSERT OR REPLACE INTO playlists (
          id, name, url, totalTracks, downloadedTracks, status, tracksJson
        ) VALUES (
          @id, @name, @url, @totalTracks, @downloadedTracks, @status, @tracksJson
        )
      `,
      )
      .run({
        ...playlist,
        tracksJson: JSON.stringify(playlist.tracks),
      });
  }

  updatePlaylistStatus(id: string, status: Playlist['status'], downloadedTracks?: number) {
    if (typeof downloadedTracks === 'number') {
      this.db
        .prepare('UPDATE playlists SET status = ?, downloadedTracks = ? WHERE id = ?')
        .run(status, downloadedTracks, id);
      return;
    }
    this.db.prepare('UPDATE playlists SET status = ? WHERE id = ?').run(status, id);
  }

  deletePlaylist(id: string) {
    this.db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
  }

  close() {
    this.db.close();
  }
}
