import { app, BrowserWindow, dialog, ipcMain, net, protocol, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type {
  AppSettings,
  DownloadProgressEvent,
  DownloadRequest,
  LibraryTrack,
  NativeLogEvent,
  Playlist,
} from '../src/types';
import { CarTuneDatabase } from './services/database';
import { YtDlpService } from './services/ytdlp';

const rawFfmpegPath = require('ffmpeg-static') as string | null;

let mainWindow: BrowserWindow | null = null;
let db: CarTuneDatabase;
let ytDlp: YtDlpService;

app.disableHardwareAcceleration();

const startupLogPath = () => path.join(app.getPath('userData'), 'logs', 'startup.log');

const writeStartupLog = (message: string, error?: unknown) => {
  try {
    const logPath = startupLogPath();
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    const errorText =
      error instanceof Error
        ? `\n${error.stack || error.message}`
        : error
          ? `\n${String(error)}`
          : '';
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}${errorText}\n`);
  } catch {
    // Startup logging must never become the reason startup fails.
  }
};

const emitLog = (event: NativeLogEvent) => {
  writeStartupLog(`${event.type.toUpperCase()}: ${event.message}`);
  mainWindow?.webContents.send('native:log', event);
};

const emitProgress = (event: DownloadProgressEvent) => {
  mainWindow?.webContents.send('downloads:progress', event);
};

const defaultSaveLocation = () => path.join(app.getPath('music'), 'CarTune');

const resolveAsarUnpackedPath = (filePath: string | null) => {
  if (!filePath) return null;

  const unpackedPath = filePath.replace(
    `${path.sep}app.asar${path.sep}`,
    `${path.sep}app.asar.unpacked${path.sep}`,
  );
  return unpackedPath !== filePath && fs.existsSync(unpackedPath) ? unpackedPath : filePath;
};

const getFfmpegPath = () => resolveAsarUnpackedPath(rawFfmpegPath);

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;

    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  });
}

const createWindow = async () => {
  writeStartupLog('Creating BrowserWindow.');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 920,
    minHeight: 640,
    backgroundColor: '#101114',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      writeStartupLog(`Renderer failed to load ${validatedURL}: ${errorCode} ${errorDescription}`);
    },
  );
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    writeStartupLog(`Renderer process gone: ${details.reason} exitCode=${details.exitCode}`);
  });
  mainWindow.on('unresponsive', () => {
    writeStartupLog('BrowserWindow became unresponsive.');
  });
  mainWindow.on('closed', () => {
    writeStartupLog('BrowserWindow closed.');
    mainWindow = null;
  });

  if (!app.isPackaged && process.env.NODE_ENV === 'development') {
    writeStartupLog('Loading development URL.');
    await mainWindow.loadURL('http://localhost:3000');
    if (process.env.ELECTRON_OPEN_DEVTOOLS === 'true') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    return;
  }

  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  writeStartupLog(`Loading packaged renderer: ${indexPath}`);
  await mainWindow.loadFile(indexPath);
  writeStartupLog('Packaged renderer loaded.');
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'cartune-media',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

const handleFatalStartupError = (error: unknown) => {
  writeStartupLog('Fatal startup error.', error);
  const message = error instanceof Error ? error.message : String(error);
  dialog.showErrorBox('CarTune MP3 failed to start', `${message}\n\nSee startup.log in AppData.`);
  app.quit();
};

process.on('uncaughtException', (error) => {
  handleFatalStartupError(error);
});

process.on('unhandledRejection', (reason) => {
  handleFatalStartupError(reason);
});

app
  .whenReady()
  .then(async () => {
    if (!gotSingleInstanceLock) {
      return;
    }

    writeStartupLog('App ready.');
    db = new CarTuneDatabase(
      path.join(app.getPath('userData'), 'cartune.sqlite'),
      defaultSaveLocation(),
    );

    const ffmpegPath = getFfmpegPath();

    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
      throw new Error('ffmpeg-static did not resolve an ffmpeg binary.');
    }

    ytDlp = new YtDlpService(ffmpegPath);

    protocol.handle('cartune-media', async (request) => {
      const filePath = getMediaFilePath(request.url);

      if (!isAllowedMediaPath(filePath)) {
        emitLog({
          type: 'warning',
          message: `Blocked media protocol request for unregistered file: ${filePath}`,
        });
        return new Response('Media file is not registered in the library.', { status: 403 });
      }

      if (!fs.existsSync(filePath)) {
        emitLog({
          type: 'error',
          message: `Media file is missing on disk: ${filePath}`,
        });
        return new Response('Media file was not found on disk.', { status: 404 });
      }

      return net.fetch(pathToFileURL(filePath).toString());
    });

    registerIpcHandlers();
    await createWindow();

    emitLog({ type: 'success', message: 'CarTune MP3 desktop bridge initialized.' });
    emitLog({ type: 'success', message: `FFmpeg binary loaded: ${ffmpegPath}` });
    emitLog({
      type: 'info',
      message: `SQLite library opened: ${path.join(app.getPath('userData'), 'cartune.sqlite')}`,
    });
    ytDlp.updateSignatures(emitLog);
  })
  .catch(handleFatalStartupError);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function registerIpcHandlers() {
  ipcMain.handle('metadata:inspect', (_event, input: { url: string; isPlaylist: boolean }) => {
    return ytDlp.inspect(input);
  });

  ipcMain.handle('downloads:start', async (_event, request: DownloadRequest) => {
    return ytDlp.startDownload(
      request,
      emitProgress,
      emitLog,
      (track: LibraryTrack) => db.saveTrack(track),
      request.playlistId
        ? (downloadedTracks, completed) => {
            db.updatePlaylistStatus(
              request.playlistId!,
              completed ? 'completed' : 'processing',
              downloadedTracks,
            );
          }
        : undefined,
      db.listTracks(),
    );
  });

  ipcMain.handle('downloads:cancel', (_event, jobId: string) => {
    ytDlp.cancel(jobId);
    emitLog({ type: 'warning', message: `Download job cancelled: ${jobId}` });
  });

  ipcMain.handle('library:listTracks', () => db.listTracks());
  ipcMain.handle('library:refresh', () => {
    const result = db.refreshLibraryFromDisk();
    emitLog({
      type: result.removedTracks > 0 ? 'warning' : 'success',
      message:
        result.removedTracks > 0
          ? `Library refresh removed ${result.removedTracks} missing local file entries.`
          : 'Library refresh completed. No missing local files found.',
    });
    return result;
  });
  ipcMain.handle('library:deleteTrack', (_event, id: string) => db.deleteTrack(id));
  ipcMain.handle('library:clearTracks', () => db.clearTracks());
  ipcMain.handle('library:listPlaylists', () => db.listPlaylists());
  ipcMain.handle('library:savePlaylist', (_event, playlist: Playlist) => db.savePlaylist(playlist));
  ipcMain.handle(
    'library:updatePlaylistStatus',
    (_event, id: string, status: Playlist['status']) => {
      if (status === 'paused') {
        ytDlp.pausePlaylist(id);
      } else if (status === 'processing') {
        ytDlp.resumePlaylist(id);
      }

      db.updatePlaylistStatus(id, status);
    },
  );
  ipcMain.handle('library:deletePlaylist', (_event, id: string) => db.deletePlaylist(id));

  ipcMain.handle('settings:get', () => db.getSettings());
  ipcMain.handle('settings:save', (_event, settings: AppSettings) => {
    fs.mkdirSync(settings.saveLocation, { recursive: true });
    return db.saveSettings(settings);
  });
  ipcMain.handle('settings:chooseSaveLocation', async (_event, current?: string) => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Choose CarTune output folder',
      defaultPath: current || defaultSaveLocation(),
      properties: ['openDirectory', 'createDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('shell:showItemInFolder', (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });
  ipcMain.handle('shell:openFolder', async (_event, folderPath: string) => {
    fs.mkdirSync(folderPath, { recursive: true });
    await shell.openPath(folderPath);
  });
}

function isAllowedMediaPath(filePath: string) {
  const requestedPath = path.normalize(filePath).toLowerCase();
  return db
    .listTracks()
    .some(
      (track) => track.filePath && path.normalize(track.filePath).toLowerCase() === requestedPath,
    );
}

function getMediaFilePath(mediaUrl: string) {
  const parsedUrl = new URL(mediaUrl);
  const queryPath = parsedUrl.searchParams.get('path');

  if (queryPath) {
    return queryPath;
  }

  return decodeURIComponent(mediaUrl.replace('cartune-media://', ''));
}
