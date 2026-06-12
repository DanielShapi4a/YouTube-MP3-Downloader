import { contextBridge, ipcRenderer } from 'electron';
import type { DownloadProgressEvent, NativeLogEvent } from '../src/types';

const on = <T>(channel: string, callback: (event: T) => void) => {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('carTune', {
  metadata: {
    inspect: (input: { url: string; isPlaylist: boolean }) =>
      ipcRenderer.invoke('metadata:inspect', input),
  },
  downloads: {
    start: (input: unknown) => ipcRenderer.invoke('downloads:start', input),
    cancel: (jobId: string) => ipcRenderer.invoke('downloads:cancel', jobId),
    onProgress: (callback: (event: DownloadProgressEvent) => void) =>
      on('downloads:progress', callback),
    onLog: (callback: (event: NativeLogEvent) => void) => on('native:log', callback),
  },
  library: {
    listTracks: () => ipcRenderer.invoke('library:listTracks'),
    refresh: () => ipcRenderer.invoke('library:refresh'),
    deleteTrack: (id: string) => ipcRenderer.invoke('library:deleteTrack', id),
    clearTracks: () => ipcRenderer.invoke('library:clearTracks'),
    listPlaylists: () => ipcRenderer.invoke('library:listPlaylists'),
    savePlaylist: (playlist: unknown) => ipcRenderer.invoke('library:savePlaylist', playlist),
    updatePlaylistStatus: (id: string, status: string) =>
      ipcRenderer.invoke('library:updatePlaylistStatus', id, status),
    deletePlaylist: (id: string) => ipcRenderer.invoke('library:deletePlaylist', id),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (settings: unknown) => ipcRenderer.invoke('settings:save', settings),
    chooseSaveLocation: (current?: string) =>
      ipcRenderer.invoke('settings:chooseSaveLocation', current),
  },
  shell: {
    showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
    openFolder: (folderPath: string) => ipcRenderer.invoke('shell:openFolder', folderPath),
  },
  media: {
    getUrl: (filePath: string) => `cartune-media://file?path=${encodeURIComponent(filePath)}`,
  },
});
