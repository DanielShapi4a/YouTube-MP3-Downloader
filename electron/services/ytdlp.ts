import { app } from 'electron';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type {
  DownloadProgressEvent,
  DownloadRequest,
  LibraryTrack,
  NativeLogEvent,
  PlaylistMetadata,
  TrackMetadata,
} from '../../src/types';
import {
  addTrackIdentityKeys,
  buildPlaylistTrackIdentityMap,
  cleanPathSegment,
  getPlaylistDownloadDirectory,
  hasTrackIdentity,
  normalizeSingleMediaUrl,
} from './downloadPlanning';
import { isBroadMetadataLabel, resolveMusicGenre } from './genre';

type LogSink = (event: NativeLogEvent) => void;
type ProgressSink = (event: DownloadProgressEvent) => void;

interface PlaylistControl {
  paused: boolean;
  cancelled: boolean;
  currentJobId: string;
  emitProgress: ProgressSink;
  lastProgress?: DownloadProgressEvent;
  resume?: () => void;
}

class PausedDownloadError extends Error {
  constructor() {
    super('Playlist download paused.');
  }
}

class CancelledDownloadError extends Error {
  constructor() {
    super('Download cancelled.');
  }
}

const parseYtDlpProgress = (line: string) => {
  const percentMatch = line.match(/\[download]\s+([0-9.]+)%/);
  if (!percentMatch) return null;

  const speedMatch = line.match(/at\s+([^\s]+\/s)/);
  const etaMatch = line.match(/ETA\s+([0-9:]+)/);
  return {
    percent: Math.min(99, Math.max(0, Number(percentMatch[1]))),
    speed: speedMatch?.[1] || 'downloading',
    eta: etaMatch?.[1] || '--:--',
  };
};

const parseFfmpegTime = (line: string, duration: number) => {
  const match = line.match(/time=(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
  if (!match || !duration) return null;

  const seconds = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  return Math.min(99, Math.round((seconds / duration) * 100));
};

const chooseMoreSpecificGenre = (primary: string, fallback: string) =>
  isBroadMetadataLabel(primary) && !isBroadMetadataLabel(fallback) ? fallback : primary || fallback;

export class YtDlpService {
  private jobs = new Map<string, ChildProcessWithoutNullStreams>();
  private playlistControls = new Map<string, PlaylistControl>();
  private cancelledJobIds = new Set<string>();
  private ffmpegPath: string;
  private userBinPath: string;
  private packagedBinPath: string;
  private userDenoPath: string;
  private packagedDenoPath: string;

  constructor(ffmpegPath: string) {
    this.ffmpegPath = ffmpegPath;
    const binaryDirectory = path.join(app.getPath('userData'), 'bin');
    const resourceBinaryDirectory = app.isPackaged
      ? path.join(process.resourcesPath, 'bin')
      : path.join(process.cwd(), 'resources', 'bin');

    this.userBinPath = path.join(
      binaryDirectory,
      process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
    );
    this.packagedBinPath = path.join(
      resourceBinaryDirectory,
      process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
    );
    this.userDenoPath = path.join(
      binaryDirectory,
      process.platform === 'win32' ? 'deno.exe' : 'deno',
    );
    this.packagedDenoPath = path.join(
      resourceBinaryDirectory,
      process.platform === 'win32' ? 'deno.exe' : 'deno',
    );
  }

  ensureBinary(log: LogSink) {
    fs.mkdirSync(path.dirname(this.userBinPath), { recursive: true });

    if (!fs.existsSync(this.userBinPath) && fs.existsSync(this.packagedBinPath)) {
      fs.copyFileSync(this.packagedBinPath, this.userBinPath);
      if (process.platform !== 'win32') {
        fs.chmodSync(this.userBinPath, 0o755);
      }
      log({ type: 'success', message: `yt-dlp binary staged at ${this.userBinPath}` });
    }

    if (!fs.existsSync(this.userDenoPath) && fs.existsSync(this.packagedDenoPath)) {
      fs.copyFileSync(this.packagedDenoPath, this.userDenoPath);
      if (process.platform !== 'win32') {
        fs.chmodSync(this.userDenoPath, 0o755);
      }
      log({ type: 'success', message: `Deno JavaScript runtime staged at ${this.userDenoPath}` });
    }

    if (!fs.existsSync(this.userBinPath)) {
      log({
        type: 'warning',
        message:
          'yt-dlp.exe is missing. Run npm run fetch:binaries before launching the Electron app.',
      });
    }

    if (!fs.existsSync(this.userDenoPath)) {
      log({
        type: 'warning',
        message:
          'Deno JavaScript runtime is missing. Some YouTube downloads may fail with HTTP 403 until resources/bin/deno.exe is bundled.',
      });
    }
  }

  updateSignatures(log: LogSink) {
    this.ensureBinary(log);
    if (!fs.existsSync(this.userBinPath)) return;

    log({ type: 'info', message: 'Running background yt-dlp extractor signature update.' });
    const child = spawn(this.userBinPath, ['-U'], { windowsHide: true });

    child.stdout.on('data', (chunk) => {
      const message = chunk.toString().trim();
      if (message) log({ type: 'info', message });
    });

    child.stderr.on('data', (chunk) => {
      const message = chunk.toString().trim();
      if (message) log({ type: 'warning', message });
    });

    child.on('close', (code) => {
      log({
        type: code === 0 ? 'success' : 'warning',
        message:
          code === 0
            ? 'yt-dlp extractor signatures are current.'
            : `yt-dlp updater exited with code ${code}; continuing with staged binary.`,
      });
    });
  }

  async inspect(input: {
    url: string;
    isPlaylist: boolean;
  }): Promise<TrackMetadata | PlaylistMetadata> {
    const inspectedUrl = input.isPlaylist ? input.url : normalizeSingleMediaUrl(input.url);
    const args = input.isPlaylist
      ? ['--dump-single-json', '--flat-playlist', inspectedUrl]
      : ['--dump-single-json', '--no-playlist', inspectedUrl];
    const json = await this.runJson(args);

    if (input.isPlaylist) {
      const entries = Array.isArray(json.entries) ? json.entries : [];
      return {
        name: json.title || json.playlist_title || 'YouTube Playlist',
        tracks: entries.map((entry: any) => ({
          title: entry.title || 'Untitled Track',
          artist: entry.artist || entry.uploader || entry.channel || 'YouTube',
          duration: Math.round(Number(entry.duration || 0)),
          url: entry.url?.startsWith('http')
            ? entry.url
            : `https://www.youtube.com/watch?v=${entry.id || entry.url}`,
          thumbnailUrl: entry.thumbnail || entry.thumbnails?.at?.(-1)?.url || '',
          genre: resolveMusicGenre(entry, json),
        })),
      };
    }

    return this.toTrackMetadata(json, inspectedUrl);
  }

  async startDownload(
    request: DownloadRequest,
    emitProgress: ProgressSink,
    log: LogSink,
    saveTrack: (track: LibraryTrack) => void,
    updatePlaylist?: (downloadedTracks: number, completed: boolean) => void,
    existingTracks: LibraryTrack[] = [],
  ) {
    const jobId = `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const playlistControl = request.isPlaylist
      ? this.createPlaylistControl(request.playlistId, jobId, emitProgress)
      : undefined;
    const emitJobProgress: ProgressSink = (event) => {
      if (playlistControl) {
        playlistControl.lastProgress = event;
      }
      emitProgress(event);
    };

    queueMicrotask(async () => {
      try {
        fs.mkdirSync(request.saveLocation, { recursive: true });

        if (request.isPlaylist) {
          const playlist = (await this.inspect({
            url: request.url,
            isPlaylist: true,
          })) as PlaylistMetadata;
          const playlistSaveLocation = getPlaylistDownloadDirectory(
            request.saveLocation,
            playlist.name,
          );
          fs.mkdirSync(playlistSaveLocation, { recursive: true });

          const downloadedTrackKeys = buildPlaylistTrackIdentityMap(
            existingTracks.filter((track) => !track.filePath || fs.existsSync(track.filePath)),
            playlistSaveLocation,
          );
          let completed = 0;

          for (let index = 0; index < playlist.tracks.length; index += 1) {
            await this.waitIfPaused(playlistControl);
            if (playlistControl?.cancelled) throw new CancelledDownloadError();

            const item = playlist.tracks[index];
            const metadata = await this.resolvePlaylistTrackMetadata(item, playlist.name);

            if (hasTrackIdentity(downloadedTrackKeys, metadata)) {
              completed += 1;
              updatePlaylist?.(completed, completed === playlist.tracks.length);
              log({
                type: 'info',
                message: `Skipped duplicate playlist track: ${metadata.artist} - ${metadata.title}`,
              });
              emitJobProgress({
                jobId,
                playlistId: request.playlistId,
                title: metadata.title,
                artist: metadata.artist,
                duration: metadata.duration,
                thumbnailUrl: metadata.thumbnailUrl,
                genre: metadata.genre,
                progress: 100,
                speed: 'skipped duplicate',
                eta: '00:00',
                status: 'completed',
                downloadedTracks: completed,
                totalTracks: playlist.tracks.length,
              });
              continue;
            }

            let track: LibraryTrack;
            try {
              track = await this.downloadOne(
                jobId,
                {
                  ...request,
                  url: item.url,
                  saveLocation: playlistSaveLocation,
                  metadata,
                },
                metadata,
                emitJobProgress,
                log,
              );
            } catch (error) {
              if (error instanceof PausedDownloadError) {
                index -= 1;
                await this.waitIfPaused(playlistControl);
                continue;
              }
              throw error;
            }

            saveTrack(track);
            addTrackIdentityKeys(downloadedTrackKeys, {
              title: track.title,
              artist: track.artist,
              duration: track.duration,
              url: track.sourceUrl || metadata.url,
            });
            completed += 1;
            updatePlaylist?.(completed, completed === playlist.tracks.length);
            emitJobProgress({
              jobId,
              playlistId: request.playlistId,
              track,
              title: metadata.title,
              artist: metadata.artist,
              duration: metadata.duration,
              thumbnailUrl: metadata.thumbnailUrl,
              genre: metadata.genre,
              progress: 100,
              speed: 'complete',
              eta: '00:00',
              status: 'completed',
              downloadedTracks: completed,
              totalTracks: playlist.tracks.length,
            });
          }
          return;
        }

        const metadata =
          request.metadata ||
          ((await this.inspect({ url: request.url, isPlaylist: false })) as TrackMetadata);
        const track = await this.downloadOne(jobId, request, metadata, emitProgress, log);
        saveTrack(track);
        emitProgress({
          jobId,
          track,
          title: metadata.title,
          artist: metadata.artist,
          duration: metadata.duration,
          thumbnailUrl: metadata.thumbnailUrl,
          progress: 100,
          speed: 'complete',
          eta: '00:00',
          genre: metadata.genre,
          status: 'completed',
        });
      } catch (error: any) {
        if (error instanceof CancelledDownloadError) {
          log({ type: 'warning', message: error.message });
          return;
        }

        log({ type: 'error', message: error?.message || 'Download failed.' });
        emitProgress({
          jobId,
          playlistId: request.playlistId,
          title: request.metadata?.title || 'Download failed',
          artist: request.metadata?.artist || '',
          duration: request.metadata?.duration || 0,
          thumbnailUrl: request.metadata?.thumbnailUrl || '',
          progress: 0,
          speed: 'failed',
          eta: '--:--',
          status: 'failed',
          error: error?.message || 'Download failed.',
        });
      } finally {
        this.jobs.delete(jobId);
        if (request.playlistId) {
          this.playlistControls.delete(request.playlistId);
        }
      }
    });

    return { jobId };
  }

  cancel(jobId: string) {
    this.cancelledJobIds.add(jobId);
    const playlistControl = Array.from(this.playlistControls.values()).find(
      (control) => control.currentJobId === jobId,
    );
    if (playlistControl) {
      playlistControl.cancelled = true;
      playlistControl.paused = false;
      playlistControl.resume?.();
    }

    const child = this.jobs.get(jobId);
    if (child) {
      child.kill();
      this.jobs.delete(jobId);
    }
  }

  pausePlaylist(playlistId: string) {
    const control = this.playlistControls.get(playlistId);
    if (!control || control.cancelled) return false;

    control.paused = true;
    if (control.lastProgress) {
      control.emitProgress({
        ...control.lastProgress,
        status: 'paused',
        speed: 'paused',
        eta: '--:--',
      });
    }
    const child = this.jobs.get(control.currentJobId);
    child?.kill();
    return true;
  }

  resumePlaylist(playlistId: string) {
    const control = this.playlistControls.get(playlistId);
    if (!control || control.cancelled) return false;

    control.paused = false;
    if (control.lastProgress) {
      control.emitProgress({
        ...control.lastProgress,
        status:
          control.lastProgress.status === 'fetching' || control.lastProgress.progress <= 0
            ? 'fetching'
            : 'downloading',
        speed: 'resuming',
        eta: '--:--',
      });
    }
    control.resume?.();
    control.resume = undefined;
    return true;
  }

  private async downloadOne(
    jobId: string,
    request: DownloadRequest,
    metadata: TrackMetadata,
    emitProgress: ProgressSink,
    log: LogSink,
  ): Promise<LibraryTrack> {
    const tempDir = path.join(
      app.getPath('temp'),
      'CarTune',
      jobId,
      Math.random().toString(16).slice(2),
    );
    fs.mkdirSync(tempDir, { recursive: true });

    emitProgress({
      jobId,
      playlistId: request.playlistId,
      title: metadata.title,
      artist: metadata.artist,
      duration: metadata.duration,
      thumbnailUrl: metadata.thumbnailUrl,
      genre: metadata.genre,
      progress: 0,
      speed: 'fetching',
      eta: '--:--',
      status: 'fetching',
    });

    const sourceTemplate = path.join(tempDir, 'source.%(ext)s');
    const downloadUrl = normalizeSingleMediaUrl(request.url);
    await this.runProcess(
      this.userBinPath,
      [
        '--no-playlist',
        '--ffmpeg-location',
        path.dirname(this.ffmpegPath),
        '-f',
        'bestaudio/best',
        '--write-thumbnail',
        '-o',
        sourceTemplate,
        downloadUrl,
      ],
      (line) => {
        const progress = parseYtDlpProgress(line);
        if (!progress) return;
        emitProgress({
          jobId,
          playlistId: request.playlistId,
          title: metadata.title,
          artist: metadata.artist,
          duration: metadata.duration,
          thumbnailUrl: metadata.thumbnailUrl,
          genre: metadata.genre,
          progress: Math.round(progress.percent * 0.72),
          speed: progress.speed,
          eta: progress.eta,
          status: 'downloading',
        });
      },
      jobId,
    );

    const files = fs.readdirSync(tempDir).map((file) => path.join(tempDir, file));
    const sourceAudio = files.find(
      (file) => /^source\./.test(path.basename(file)) && !/\.(jpg|jpeg|png|webp)$/i.test(file),
    );
    const coverArt = files.find((file) => /\.(jpg|jpeg|png)$/i.test(file));

    if (!sourceAudio) {
      throw new Error('yt-dlp did not produce an audio stream.');
    }

    const outputName = `${cleanPathSegment(metadata.artist, 'Unknown Artist')} - ${cleanPathSegment(metadata.title, 'Untitled Track')}.mp3`;
    const outputPath = path.join(request.saveLocation, outputName);
    const ffmpegArgs = [
      '-y',
      '-i',
      sourceAudio,
      ...(coverArt ? ['-i', coverArt, '-map', '0:a', '-map', '1:v'] : ['-vn']),
      '-c:a',
      'libmp3lame',
      '-b:a',
      `${request.quality}k`,
      ...(coverArt ? ['-c:v', 'mjpeg', '-disposition:v', 'attached_pic'] : []),
      '-id3v2_version',
      '3',
      '-metadata',
      `title=${metadata.title}`,
      '-metadata',
      `artist=${metadata.artist}`,
      '-metadata',
      `album=${metadata.album}`,
      '-metadata',
      `genre=${metadata.genre}`,
      outputPath,
    ];

    log({ type: 'info', message: `Encoding ${metadata.title} at ${request.quality}kbps MP3.` });
    await this.runProcess(
      this.ffmpegPath,
      ffmpegArgs,
      (line) => {
        const ffmpegPercent = parseFfmpegTime(line, metadata.duration);
        if (ffmpegPercent === null) return;
        emitProgress({
          jobId,
          playlistId: request.playlistId,
          title: metadata.title,
          artist: metadata.artist,
          duration: metadata.duration,
          thumbnailUrl: metadata.thumbnailUrl,
          genre: metadata.genre,
          progress: 72 + Math.round(ffmpegPercent * 0.27),
          speed: 'FFmpeg encoding',
          eta: '--:--',
          status: 'converting',
        });
      },
      jobId,
    );

    const stat = fs.statSync(outputPath);
    return {
      id: `track-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: metadata.title,
      artist: metadata.artist,
      album: metadata.album,
      duration: metadata.duration,
      bitrate: request.quality,
      size: `${(stat.size / (1024 * 1024)).toFixed(1)} MB`,
      thumbnailUrl: metadata.thumbnailUrl,
      genre: metadata.genre,
      downloadedAt: new Date().toLocaleDateString(),
      filePath: outputPath,
      sourceUrl: downloadUrl,
    };
  }

  private async resolvePlaylistTrackMetadata(
    item: PlaylistMetadata['tracks'][number],
    playlistName: string,
  ): Promise<TrackMetadata> {
    const fallback: TrackMetadata = {
      title: item.title,
      artist: item.artist,
      album: playlistName,
      duration: item.duration,
      genre: item.genre || 'Music',
      thumbnailUrl: item.thumbnailUrl || '',
      url: item.url,
    };

    try {
      const inspected = (await this.inspect({
        url: item.url,
        isPlaylist: false,
      })) as TrackMetadata;

      return {
        title: inspected.title || fallback.title,
        artist: inspected.artist || fallback.artist,
        album: playlistName,
        duration: inspected.duration || fallback.duration,
        genre: chooseMoreSpecificGenre(inspected.genre, fallback.genre),
        thumbnailUrl: inspected.thumbnailUrl || fallback.thumbnailUrl,
        url: normalizeSingleMediaUrl(inspected.url || fallback.url),
      };
    } catch {
      return fallback;
    }
  }

  private async toTrackMetadata(json: any, fallbackUrl: string): Promise<TrackMetadata> {
    return {
      title: json.track || json.title || 'Untitled Track',
      artist: json.artist || json.creator || json.uploader || json.channel || 'YouTube',
      album: json.album || json.playlist_title || 'CarTune Downloads',
      duration: Math.round(Number(json.duration || 0)),
      genre: resolveMusicGenre(json),
      thumbnailUrl: json.thumbnail || json.thumbnails?.at?.(-1)?.url || '',
      url: normalizeSingleMediaUrl(json.webpage_url || fallbackUrl),
    };
  }

  private runJson(args: string[]) {
    return new Promise<any>((resolve, reject) => {
      if (!fs.existsSync(this.userBinPath)) {
        reject(new Error('yt-dlp binary is missing. Run npm run fetch:binaries.'));
        return;
      }

      const child = spawn(this.userBinPath, [...this.getJsRuntimeArgs(), ...args], {
        windowsHide: true,
      });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.on('error', reject);
      child.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private runProcess(
    command: string,
    args: string[],
    onLine: (line: string) => void,
    jobId: string,
  ) {
    return new Promise<void>((resolve, reject) => {
      if (this.cancelledJobIds.has(jobId)) {
        this.cancelledJobIds.delete(jobId);
        reject(new CancelledDownloadError());
        return;
      }

      const child = spawn(command, [...this.getProcessRuntimeArgs(command), ...args], {
        windowsHide: true,
      });
      this.jobs.set(jobId, child);
      const recentOutput: string[] = [];

      const consume = (chunk: Buffer) => {
        chunk
          .toString()
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach((line) => {
            recentOutput.push(line);
            if (recentOutput.length > 20) {
              recentOutput.shift();
            }
            onLine(line);
          });
      };

      child.stdout.on('data', consume);
      child.stderr.on('data', consume);
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        const control = Array.from(this.playlistControls.values()).find(
          (item) => item.currentJobId === jobId,
        );
        if (this.cancelledJobIds.has(jobId)) {
          this.cancelledJobIds.delete(jobId);
          reject(new CancelledDownloadError());
          return;
        }
        if (control?.cancelled) {
          reject(new CancelledDownloadError());
          return;
        }
        if (control?.paused) {
          reject(new PausedDownloadError());
          return;
        }

        const details = recentOutput
          .filter((line) => /error|warning|unable|failed|unsupported|not available/i.test(line))
          .slice(-5)
          .join(' ');
        reject(
          new Error(
            details
              ? `${path.basename(command)} exited with code ${code}: ${details}`
              : `${path.basename(command)} exited with code ${code}`,
          ),
        );
      });
    });
  }

  private createPlaylistControl(
    playlistId: string | undefined,
    jobId: string,
    emitProgress: ProgressSink,
  ) {
    if (!playlistId) return undefined;

    const control: PlaylistControl = {
      paused: false,
      cancelled: false,
      currentJobId: jobId,
      emitProgress,
    };
    this.playlistControls.set(playlistId, control);
    return control;
  }

  private waitIfPaused(control: PlaylistControl | undefined) {
    if (!control?.paused) return Promise.resolve();

    return new Promise<void>((resolve) => {
      control.resume = resolve;
    });
  }

  private getProcessRuntimeArgs(command: string) {
    return path.normalize(command) === path.normalize(this.userBinPath)
      ? this.getJsRuntimeArgs()
      : [];
  }

  private getJsRuntimeArgs() {
    return fs.existsSync(this.userDenoPath) ? ['--js-runtimes', `deno:${this.userDenoPath}`] : [];
  }
}
