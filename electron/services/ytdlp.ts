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

type LogSink = (event: NativeLogEvent) => void;
type ProgressSink = (event: DownloadProgressEvent) => void;

interface PlaylistControl {
  paused: boolean;
  cancelled: boolean;
  currentJobId: string;
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

const INVALID_FILE_CHARS = /[<>:"/\\|?*\u0000-\u001F]/g;

const cleanSegment = (value: string, fallback: string) => {
  const cleaned = value.replace(INVALID_FILE_CHARS, '').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 120) || fallback;
};

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

export class YtDlpService {
  private jobs = new Map<string, ChildProcessWithoutNullStreams>();
  private playlistControls = new Map<string, PlaylistControl>();
  private ffmpegPath: string;
  private userBinPath: string;
  private packagedBinPath: string;

  constructor(ffmpegPath: string) {
    this.ffmpegPath = ffmpegPath;
    this.userBinPath = path.join(app.getPath('userData'), 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    this.packagedBinPath = app.isPackaged
      ? path.join(process.resourcesPath, 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp')
      : path.join(process.cwd(), 'resources', 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
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

    if (!fs.existsSync(this.userBinPath)) {
      log({
        type: 'warning',
        message: 'yt-dlp.exe is missing. Run npm run fetch:binaries before launching the Electron app.',
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
        message: code === 0 ? 'yt-dlp extractor signatures are current.' : `yt-dlp updater exited with code ${code}; continuing with staged binary.`,
      });
    });
  }

  async inspect(input: { url: string; isPlaylist: boolean }): Promise<TrackMetadata | PlaylistMetadata> {
    const args = input.isPlaylist
      ? ['--dump-single-json', '--flat-playlist', input.url]
      : ['--dump-single-json', '--no-playlist', input.url];
    const json = await this.runJson(args);

    if (input.isPlaylist) {
      const entries = Array.isArray(json.entries) ? json.entries : [];
      return {
        name: json.title || json.playlist_title || 'YouTube Playlist',
        tracks: entries.map((entry: any) => ({
          title: entry.title || 'Untitled Track',
          artist: entry.artist || entry.uploader || entry.channel || 'YouTube',
          duration: Math.round(Number(entry.duration || 0)),
          url: entry.url?.startsWith('http') ? entry.url : `https://www.youtube.com/watch?v=${entry.id || entry.url}`,
          thumbnailUrl: entry.thumbnail || entry.thumbnails?.at?.(-1)?.url || '',
        })),
      };
    }

    return this.toTrackMetadata(json, input.url);
  }

  async startDownload(
    request: DownloadRequest,
    emitProgress: ProgressSink,
    log: LogSink,
    saveTrack: (track: LibraryTrack) => void,
    updatePlaylist?: (downloadedTracks: number, completed: boolean) => void,
  ) {
    const jobId = `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const playlistControl = request.isPlaylist ? this.createPlaylistControl(request.playlistId, jobId) : undefined;

    queueMicrotask(async () => {
      try {
        fs.mkdirSync(request.saveLocation, { recursive: true });

        if (request.isPlaylist) {
          const playlist = (await this.inspect({ url: request.url, isPlaylist: true })) as PlaylistMetadata;
          let completed = 0;

          for (let index = 0; index < playlist.tracks.length; index += 1) {
            await this.waitIfPaused(playlistControl);
            if (playlistControl?.cancelled) throw new CancelledDownloadError();

            const item = playlist.tracks[index];
            const metadata: TrackMetadata = {
              title: item.title,
              artist: item.artist,
              album: playlist.name,
              duration: item.duration,
              genre: 'YouTube Playlist',
              thumbnailUrl: item.thumbnailUrl || '',
              url: item.url,
            };

            let track: LibraryTrack;
            try {
              track = await this.downloadOne(jobId, { ...request, url: item.url, metadata }, metadata, emitProgress, log);
            } catch (error) {
              if (error instanceof PausedDownloadError) {
                index -= 1;
                await this.waitIfPaused(playlistControl);
                continue;
              }
              throw error;
            }

            saveTrack(track);
            completed += 1;
            updatePlaylist?.(completed, completed === playlist.tracks.length);
            emitProgress({
              jobId,
              playlistId: request.playlistId,
              track,
              title: metadata.title,
              artist: metadata.artist,
              duration: metadata.duration,
              thumbnailUrl: metadata.thumbnailUrl,
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

        const metadata = request.metadata || ((await this.inspect({ url: request.url, isPlaylist: false })) as TrackMetadata);
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
    const playlistControl = Array.from(this.playlistControls.values()).find((control) => control.currentJobId === jobId);
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
    const child = this.jobs.get(control.currentJobId);
    child?.kill();
    return true;
  }

  resumePlaylist(playlistId: string) {
    const control = this.playlistControls.get(playlistId);
    if (!control || control.cancelled) return false;

    control.paused = false;
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
    const tempDir = path.join(app.getPath('temp'), 'CarTune', jobId, Math.random().toString(16).slice(2));
    fs.mkdirSync(tempDir, { recursive: true });

    emitProgress({
      jobId,
      playlistId: request.playlistId,
      title: metadata.title,
      artist: metadata.artist,
      duration: metadata.duration,
      thumbnailUrl: metadata.thumbnailUrl,
      progress: 0,
      speed: 'fetching',
      eta: '--:--',
      status: 'fetching',
    });

    const sourceTemplate = path.join(tempDir, 'source.%(ext)s');
    await this.runProcess(
      this.userBinPath,
      [
        '--no-playlist',
        '--ffmpeg-location',
        path.dirname(this.ffmpegPath),
        '-f',
        'bestaudio/best',
        '--write-thumbnail',
        '--convert-thumbnails',
        'jpg',
        '-o',
        sourceTemplate,
        request.url,
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
          progress: Math.round(progress.percent * 0.72),
          speed: progress.speed,
          eta: progress.eta,
          status: 'downloading',
        });
      },
      jobId,
    );

    const files = fs.readdirSync(tempDir).map((file) => path.join(tempDir, file));
    const sourceAudio = files.find((file) => /^source\./.test(path.basename(file)) && !/\.(jpg|jpeg|png|webp)$/i.test(file));
    const coverArt = files.find((file) => /\.(jpg|jpeg|png)$/i.test(file));

    if (!sourceAudio) {
      throw new Error('yt-dlp did not produce an audio stream.');
    }

    const outputName = `${cleanSegment(metadata.artist, 'Unknown Artist')} - ${cleanSegment(metadata.title, 'Untitled Track')}.mp3`;
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
      sourceUrl: request.url,
    };
  }

  private toTrackMetadata(json: any, fallbackUrl: string): TrackMetadata {
    return {
      title: json.track || json.title || 'Untitled Track',
      artist: json.artist || json.creator || json.uploader || json.channel || 'YouTube',
      album: json.album || json.playlist_title || 'CarTune Downloads',
      duration: Math.round(Number(json.duration || 0)),
      genre: json.genre || json.categories?.[0] || 'YouTube Audio',
      thumbnailUrl: json.thumbnail || json.thumbnails?.at?.(-1)?.url || '',
      url: json.webpage_url || fallbackUrl,
    };
  }

  private runJson(args: string[]) {
    return new Promise<any>((resolve, reject) => {
      if (!fs.existsSync(this.userBinPath)) {
        reject(new Error('yt-dlp binary is missing. Run npm run fetch:binaries.'));
        return;
      }

      const child = spawn(this.userBinPath, args, { windowsHide: true });
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

  private runProcess(command: string, args: string[], onLine: (line: string) => void, jobId: string) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, { windowsHide: true });
      this.jobs.set(jobId, child);

      const consume = (chunk: Buffer) => {
        chunk
          .toString()
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean)
          .forEach(onLine);
      };

      child.stdout.on('data', consume);
      child.stderr.on('data', consume);
      child.on('error', reject);
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        const control = Array.from(this.playlistControls.values()).find((item) => item.currentJobId === jobId);
        if (control?.cancelled) {
          reject(new CancelledDownloadError());
          return;
        }
        if (control?.paused) {
          reject(new PausedDownloadError());
          return;
        }

        reject(new Error(`${path.basename(command)} exited with code ${code}`));
      });
    });
  }

  private createPlaylistControl(playlistId: string | undefined, jobId: string) {
    if (!playlistId) return undefined;

    const control: PlaylistControl = {
      paused: false,
      cancelled: false,
      currentJobId: jobId,
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
}
