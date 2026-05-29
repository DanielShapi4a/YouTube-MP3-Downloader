import { useState, useEffect, useRef } from 'react';
import {
  AppSettings,
  LibraryTrack,
  ActiveDownload,
  Playlist,
  LogEntry,
  Language,
  TrackMetadata,
  PlaylistMetadata,
  DownloadProgressEvent,
} from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CompletedLibrary from './components/CompletedLibrary';
import PlaylistManager from './components/PlaylistManager';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import { DEFAULT_SETTINGS, INITIAL_PLAYLISTS, createInitialTracks } from './data/initialData';
import { readStoredJson, writeStoredJson } from './services/localStorageStore';
import {
  createCompletedTrack,
  createMockActiveDownload,
  createPlaylistCompletedTrack,
  getMockProgressTick,
  resolveMockThumbnail,
} from './services/webDownloadSimulator';
import { getErrorMessage } from './utils/errors';

export default function App() {
  const desktopApi = window.carTune;
  const [activeTab, setActiveTab] = useState<'downloads' | 'completed' | 'playlists'>('downloads');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isDesktopReady, setIsDesktopReady] = useState<boolean>(!desktopApi);

  // App Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    if (desktopApi) return DEFAULT_SETTINGS;
    return readStoredJson('cartune_settings', DEFAULT_SETTINGS);
  });

  // Track Library State
  const [tracks, setTracks] = useState<LibraryTrack[]>(() => {
    if (desktopApi) return [];
    return readStoredJson('cartune_tracks', createInitialTracks());
  });

  // Playlists State
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    if (desktopApi) return [];
    return readStoredJson('cartune_playlists', INITIAL_PLAYLISTS);
  });

  // Active Downloads
  const [activeDownload, setActiveDownload] = useState<ActiveDownload | null>(null);

  // Advanced Technical Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Track intervals for download simulation
  const downloadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playlistTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nativeJobIdRef = useRef<string | null>(null);
  const pendingNativeCancelRef = useRef<boolean>(false);

  // Sync to local storage
  useEffect(() => {
    if (desktopApi) {
      if (isDesktopReady) {
        desktopApi.settings.save(settings).catch((error) => {
          addLog('error', `Failed to persist settings: ${getErrorMessage(error)}`);
        });
      }
    } else {
      writeStoredJson('cartune_settings', settings);
    }
    // Set Document Direction based on Locale
    document.documentElement.dir = settings.language === Language.HE ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings, desktopApi, isDesktopReady]);

  useEffect(() => {
    if (!desktopApi) {
      writeStoredJson('cartune_tracks', tracks);
    }
  }, [tracks, desktopApi]);

  useEffect(() => {
    if (!desktopApi) {
      writeStoredJson('cartune_playlists', playlists);
    }
  }, [playlists, desktopApi]);

  // Initial Boot-up logging and desktop state hydration
  useEffect(() => {
    if (!desktopApi) {
      addLog('success', 'CarTune MP3 Core initialized and running.');
      addLog('info', 'FFMPEG native libraries loaded successfully.');
      addLog('info', 'Save location scanned: C:\\Users\\Admin\\Music\\CarTune');
      addLog('success', 'Ready to compile tracks.');
      return;
    }

    let isMounted = true;
    const unsubLog = desktopApi.downloads.onLog((event) => addLog(event.type, event.message));
    const unsubProgress = desktopApi.downloads.onProgress((event) =>
      handleNativeDownloadProgress(event),
    );

    Promise.all([
      desktopApi.settings.get(),
      desktopApi.library.listTracks(),
      desktopApi.library.listPlaylists(),
    ])
      .then(([savedSettings, savedTracks, savedPlaylists]) => {
        if (!isMounted) return;
        setSettings(savedSettings);
        setTracks(savedTracks);
        setPlaylists(savedPlaylists);
        setIsDesktopReady(true);
        addLog('success', 'Desktop library restored from SQLite.');
      })
      .catch((error) => {
        addLog('error', `Desktop state hydration failed: ${getErrorMessage(error)}`);
        setIsDesktopReady(true);
      });

    return () => {
      isMounted = false;
      unsubLog();
      unsubProgress();
    };
  }, [desktopApi]);

  const addLog = (type: 'info' | 'warning' | 'error' | 'success', message: string) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    setLogs((prev) => [...prev.slice(-99), newLog]); // Keep last 100 logs
  };

  function handleNativeDownloadProgress(event: DownloadProgressEvent) {
    if (event.status === 'completed' && event.track) {
      setTracks((prev) => {
        const withoutDuplicate = prev.filter((track) => track.id !== event.track!.id);
        return [event.track!, ...withoutDuplicate];
      });
      if (!event.playlistId || event.downloadedTracks === event.totalTracks) {
        nativeJobIdRef.current = null;
      }
      setActiveDownload(null);
      addLog('success', `CarTune MP3 successfully outputted to: ${event.track.filePath}`);
    } else if (event.status === 'failed') {
      nativeJobIdRef.current = null;
      setActiveDownload(null);
      addLog('error', event.error || `Download failed for ${event.title}`);
    } else {
      setActiveDownload({
        id: event.jobId,
        title: event.title,
        artist: event.artist,
        duration: event.duration,
        progress: Math.round(event.progress),
        speed: event.speed,
        eta: event.eta,
        status: event.status,
        thumbnailUrl: event.thumbnailUrl,
        playlistId: event.playlistId,
        error: event.error,
      });
    }

    if (event.playlistId && typeof event.downloadedTracks === 'number') {
      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id === event.playlistId
            ? {
                ...playlist,
                downloadedTracks: event.downloadedTracks!,
                status:
                  event.status === 'completed' && event.downloadedTracks === playlist.totalTracks
                    ? 'completed'
                    : 'processing',
              }
            : playlist,
        ),
      );
    }
  }

  const handleUpdateLanguage = (lang: Language) => {
    setSettings((prev) => ({ ...prev, language: lang }));
    addLog('info', `Language orientation changed to: ${lang}`);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    addLog('success', 'Configuration preferences saved successfully.');
  };

  const handleOpenFolder = async () => {
    if (desktopApi) {
      try {
        await desktopApi.shell.openFolder(settings.saveLocation);
        addLog('info', `Opened output folder: ${settings.saveLocation}`);
      } catch (error: unknown) {
        addLog('error', `Unable to open output folder: ${getErrorMessage(error)}`);
      }
      return;
    }

    addLog('info', `Simulating system folder call: ${settings.saveLocation}`);
    alert(
      settings.language === Language.HE
        ? `תיקיית השירים נפתחה במיקום:\n${settings.saveLocation}`
        : settings.language === Language.RU
          ? `Проводник запущен по адресу:\n${settings.saveLocation}`
          : `System explorer triggered successfully at directory:\n${settings.saveLocation}`,
    );
  };

  const handleCancelDownload = (id: string) => {
    if (desktopApi) {
      const nativeJobId = nativeJobIdRef.current;
      if (nativeJobId) {
        desktopApi.downloads.cancel(nativeJobId).catch((error) => {
          addLog('error', `Unable to cancel native download: ${getErrorMessage(error)}`);
        });
        nativeJobIdRef.current = null;
      } else {
        pendingNativeCancelRef.current = true;
      }
    }

    if (downloadTimerRef.current) {
      clearInterval(downloadTimerRef.current);
      downloadTimerRef.current = null;
    }
    setActiveDownload(null);
    addLog('warning', `Download queue item cancelled by user.`);
  };

  const handleClearAllTracks = () => {
    if (
      confirm(
        settings.language === Language.HE
          ? 'האם למחוק את כל השירים מספריית המוזיקה?'
          : settings.language === Language.RU
            ? 'Вы уверены, что хотите удалить ВСЕ песни?'
            : 'Are you sure you want to delete ALL downloaded songs?',
      )
    ) {
      setTracks([]);
      desktopApi?.library.clearTracks().catch((error) => {
        addLog('error', `Unable to clear SQLite library: ${getErrorMessage(error)}`);
      });
      addLog('warning', 'Completed library history wiped.');
    }
  };

  const handleDeleteTrack = (id: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== id));
    desktopApi?.library.deleteTrack(id).catch((error) => {
      addLog('error', `Unable to delete track from SQLite: ${getErrorMessage(error)}`);
    });
    addLog('info', `Completed track removed from local indexes: ${id}`);
  };

  // Launch simulated downloading process from metadata
  const startSingleTrackDownload = (trackMeta: TrackMetadata) => {
    if (activeDownload) return;

    const calculatedThumbnail = resolveMockThumbnail(trackMeta.title || '');
    const downloadItem = createMockActiveDownload(trackMeta, calculatedThumbnail);

    setActiveDownload(downloadItem);
    addLog('info', `Queued thread initialized for: ${downloadItem.title}`);

    let currentProgress = 0;
    addLog('info', `Connecting to YouTube manifest servers...`);

    downloadTimerRef.current = setInterval(() => {
      const progressTick = getMockProgressTick(currentProgress);
      currentProgress = progressTick.progress;

      if (currentProgress < 100) {
        // Downloading phase
        setActiveDownload((prev) =>
          prev
            ? {
                ...prev,
                progress: currentProgress,
                status: 'downloading',
                speed: progressTick.speed,
                eta: progressTick.eta,
              }
            : null,
        );

        addLog('info', `Downloading stream payloads... ${currentProgress}% completed.`);
      } else {
        // Conversion phase (FFMPEG compiling CJS/MP3 tags)
        clearInterval(downloadTimerRef.current);
        downloadTimerRef.current = null;

        setActiveDownload((prev) =>
          prev
            ? {
                ...prev,
                progress: 100,
                status: 'converting',
                speed: 'FFmpeg encoding',
                eta: '00:01',
              }
            : null,
        );

        addLog(
          'warning',
          `Payload retrieved. Calling FFmpeg compiler to encode ${settings.quality}kbps MP3 track.`,
        );

        setTimeout(() => {
          const completedTrack = createCompletedTrack(trackMeta, settings, calculatedThumbnail);

          setTracks((prev) => [completedTrack, ...prev]);
          setActiveDownload(null);
          addLog(
            'success',
            `CarTune MP3 successfully outputted to: ${settings.saveLocation}\\${completedTrack.artist} - ${completedTrack.title}.mp3`,
          );

          if (settings.language === Language.HE) {
            alert(
              `השיר "${completedTrack.title}" הורד והומר בהצלחה לקצב של ${settings.quality}kbps!`,
            );
          } else if (settings.language === Language.RU) {
            alert(
              `Песня "${completedTrack.title}" успешно загружена и переведена в формат MP3 со скоростью ${settings.quality} кбит/с!`,
            );
          } else {
            alert(
              `Successfully downloaded and compiled "${completedTrack.title}" at ${settings.quality}kbps MP3!`,
            );
          }
        }, 1500);
      }
    }, 1000);
  };

  // Triggering the downloading mechanism
  const handleStartDownload = async (url: string, isPlaylist: boolean) => {
    addLog('info', `API fetch initiated mapping URL context: ${url}`);

    if (desktopApi) {
      try {
        const data = await desktopApi.metadata.inspect({ url, isPlaylist });

        if (isPlaylist) {
          const playlistData = data as PlaylistMetadata;
          const newPlaylist: Playlist = {
            id: `playlist-${Date.now()}`,
            name: playlistData.name,
            url: url.replace('https://', ''),
            totalTracks: playlistData.tracks.length,
            downloadedTracks: 0,
            status: 'processing',
            tracks: playlistData.tracks,
          };

          setPlaylists((prev) => [newPlaylist, ...prev]);
          await desktopApi.library.savePlaylist(newPlaylist);
          setActiveTab('playlists');
          addLog(
            'success',
            `Parsed Playlist name: "${playlistData.name}" containing ${playlistData.tracks.length} tracks.`,
          );
          const { jobId } = await desktopApi.downloads.start({
            url,
            isPlaylist: true,
            quality: settings.quality,
            saveLocation: settings.saveLocation,
            playlistId: newPlaylist.id,
          });
          if (pendingNativeCancelRef.current) {
            pendingNativeCancelRef.current = false;
            await desktopApi.downloads.cancel(jobId);
            return;
          }

          nativeJobIdRef.current = jobId;
          return;
        }

        const metadata = data as TrackMetadata;
        setActiveDownload({
          id: `pending-${Date.now()}`,
          title: metadata.title,
          artist: metadata.artist,
          duration: metadata.duration,
          progress: 0,
          speed: 'queued',
          eta: '--:--',
          status: 'queued',
          thumbnailUrl: metadata.thumbnailUrl,
        });
        addLog('success', `Resolved metadata for "${metadata.title}" by ${metadata.artist}.`);
        const { jobId } = await desktopApi.downloads.start({
          url: metadata.url || url,
          isPlaylist: false,
          quality: settings.quality,
          saveLocation: settings.saveLocation,
          metadata,
        });
        if (pendingNativeCancelRef.current) {
          pendingNativeCancelRef.current = false;
          await desktopApi.downloads.cancel(jobId);
          return;
        }

        nativeJobIdRef.current = jobId;
        setActiveDownload((prev) =>
          prev && prev.id.startsWith('pending-') ? { ...prev, id: jobId } : prev,
        );
      } catch (error: unknown) {
        const message = getErrorMessage(error, 'Native download gateway failed.');
        addLog('error', `Native download gateway failed: ${message}`);
        alert(message);
      }
      return;
    }

    try {
      const response = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, isPlaylist }),
      });
      const data = (await response.json()) as TrackMetadata | PlaylistMetadata | { error?: string };

      if ('error' in data && data.error) {
        addLog('error', `Server rejected parser request: ${data.error}`);
        alert(data.error);
        return;
      }

      if (isPlaylist) {
        const playlistData = data as PlaylistMetadata;
        // Multi-song Playlist batch queue compilation
        addLog(
          'success',
          `Parsed Playlist name: "${playlistData.name}" containing ${playlistData.tracks.length} tracks.`,
        );

        const newPlaylist: Playlist = {
          id: `playlist-${Date.now()}`,
          name: playlistData.name,
          url: url.replace('https://', ''),
          totalTracks: playlistData.tracks.length,
          downloadedTracks: 0,
          status: 'processing',
          tracks: playlistData.tracks,
        };

        setPlaylists((prev) => [newPlaylist, ...prev]);
        setActiveTab('playlists');

        // Setup incremental playlist downloader simulator thread
        runPlaylistQueueWorker(newPlaylist.id, playlistData.tracks);
      } else {
        const metadata = data as TrackMetadata;
        // Individual audio track queue compiling
        startSingleTrackDownload(metadata);
      }
    } catch (error: unknown) {
      addLog('error', `Network error during manifest compiling: ${getErrorMessage(error)}`);
      alert('Downloading gateway experienced a connection blip. Using fast fallbacks...');
    }
  };

  // Add playlist manually via panel
  const handleAddPlaylistLink = (url: string) => {
    handleStartDownload(url, true);
  };

  // Playlist queue worker simulator thread
  const runPlaylistQueueWorker = (playlistId: string, trackList: Playlist['tracks']) => {
    let currentIdx = 0;
    addLog('info', `Starting playlist batch workers on playlist id: ${playlistId}`);

    if (playlistTimerRef.current) {
      clearInterval(playlistTimerRef.current);
    }

    playlistTimerRef.current = setInterval(() => {
      // Find latest state details
      setPlaylists((prev) => {
        const item = prev.find((p) => p.id === playlistId);
        if (!item || item.status === 'paused') {
          clearInterval(playlistTimerRef.current);
          playlistTimerRef.current = null;
          return prev;
        }

        if (currentIdx < trackList.length) {
          const currentTrack = trackList[currentIdx];
          const completedTrack = createPlaylistCompletedTrack(
            currentTrack,
            item.name,
            settings,
            currentIdx,
          );

          // Update library
          setTracks((prevTracks) => [completedTrack, ...prevTracks]);
          addLog(
            'success',
            `Batch compiled successfully [${item.name}]: ${completedTrack.artist} - ${completedTrack.title}`,
          );

          currentIdx++;

          const isDone = currentIdx === trackList.length;

          return prev.map((p) =>
            p.id === playlistId
              ? {
                  ...p,
                  downloadedTracks: currentIdx,
                  status: isDone ? 'completed' : 'processing',
                }
              : p,
          );
        } else {
          clearInterval(playlistTimerRef.current);
          playlistTimerRef.current = null;
        }

        return prev;
      });
    }, 3500); // Process each song every 3.5 seconds
  };

  const handleUpdatePlaylistStatus = (
    id: string,
    status: 'queued' | 'processing' | 'paused' | 'completed',
  ) => {
    setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    desktopApi?.library.updatePlaylistStatus(id, status).catch((error) => {
      addLog('error', `Unable to persist playlist status: ${getErrorMessage(error)}`);
    });
    addLog('info', `Playlist state modified to: ${status}`);

    if (!desktopApi && status === 'processing') {
      const playlist = playlists.find((p) => p.id === id);
      if (playlist) {
        runPlaylistQueueWorker(id, playlist.tracks);
      }
    }
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    desktopApi?.library.deletePlaylist(id).catch((error) => {
      addLog('error', `Unable to delete playlist from SQLite: ${getErrorMessage(error)}`);
    });
    addLog('warning', `Playlist queue item index removed: ${id}`);
  };

  const handleBrowseLocation = async () => {
    if (!desktopApi) return null;
    try {
      return await desktopApi.settings.chooseSaveLocation(settings.saveLocation);
    } catch (error: unknown) {
      addLog('error', `Folder picker failed: ${getErrorMessage(error)}`);
      return null;
    }
  };

  const handleOpenHelp = () => {
    setIsHelpOpen(true);
    addLog('info', 'Triggered user instruction dashboard help center.');
  };

  return (
    <div className="bg-background text-on-surface font-sans h-screen flex overflow-hidden select-none">
      {/* Side Navigation Bar */}
      <Sidebar
        activeTab={activeTab}
        settings={settings}
        onChangeTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Layout Container */}
      <div className="flex-1 flex flex-col h-full bg-surface relative min-w-0">
        {/* Top Header */}
        <Header
          settings={settings}
          onUpdateLanguage={handleUpdateLanguage}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onHelp={handleOpenHelp}
          onOpenFolder={handleOpenFolder}
        />

        {/* Dynamic Switchable Screens */}
        <main className="flex-1 overflow-y-auto bg-surface relative flex flex-col min-h-0">
          {activeTab === 'downloads' && (
            <Dashboard
              settings={settings}
              activeDownload={activeDownload}
              logs={logs}
              onStartDownload={handleStartDownload}
              onCancelDownload={handleCancelDownload}
              onClearLogs={() => setLogs([])}
            />
          )}

          {activeTab === 'completed' && (
            <CompletedLibrary
              settings={settings}
              tracks={tracks}
              onDeleteTrack={handleDeleteTrack}
              onClearAllTracks={handleClearAllTracks}
              onAddLog={addLog}
            />
          )}

          {activeTab === 'playlists' && (
            <PlaylistManager
              settings={settings}
              playlists={playlists}
              onAddPlaylist={handleAddPlaylistLink}
              onUpdatePlaylistStatus={handleUpdatePlaylistStatus}
              onDeletePlaylist={handleDeletePlaylist}
            />
          )}
        </main>
      </div>

      {/* Configuration Settings Modal component */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        onBrowseLocation={desktopApi ? handleBrowseLocation : undefined}
      />

      {/* Styled Help Modal component */}
      <HelpModal
        isOpen={isHelpOpen}
        language={settings.language}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
