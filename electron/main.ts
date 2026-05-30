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

const ffmpegPath = require('ffmpeg-static') as string | null;

let mainWindow: BrowserWindow | null = null;
let db: CarTuneDatabase;
let ytDlp: YtDlpService;

const emitLog = (event: NativeLogEvent) => {
  mainWindow?.webContents.send('native:log', event);
};

const emitProgress = (event: DownloadProgressEvent) => {
  mainWindow?.webContents.send('downloads:progress', event);
};

const defaultSaveLocation = () => path.join(app.getPath('music'), 'CarTune');

const createWindow = async () => {
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

  if (!app.isPackaged && process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:3000');
    if (process.env.ELECTRON_OPEN_DEVTOOLS === 'true') {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
    return;
  }

  await mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
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

app.whenReady().then(async () => {
  db = new CarTuneDatabase(
    path.join(app.getPath('userData'), 'cartune.sqlite'),
    defaultSaveLocation(),
  );

  if (!ffmpegPath) {
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
});

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
