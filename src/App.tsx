import { useState, useEffect, useRef } from 'react';
import { AppSettings, LibraryTrack, ActiveDownload, Playlist, LogEntry, Language, Quality } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CompletedLibrary from './components/CompletedLibrary';
import PlaylistManager from './components/PlaylistManager';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';

// Setup standard, professional mockup tracks matching reference designs
const INITIAL_TRACKS: LibraryTrack[] = [
  {
    id: "track-1",
    title: "Midnight City (Extended Mix)",
    artist: "M83",
    album: "Hurry Up, We're Dreaming",
    duration: 243,
    bitrate: "320",
    size: "12.4 MB",
    thumbnailUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTcAcXcHPqipsxaWMoWF3TIP6JBMj31jsnkvUzvoaRLtvri9zgrrgSW85M6fPCV9twwGzWUR3NKujjkcrMLY3-OxCf-p-hwH635yaSW-OtWTgHgq6UuSSGUJpDuwuDlllpIVx_KNULt7t2jO3mn0FLX_isajgebu-3uKBD0O3Qwik_G4G4dSvEgBA-nEOpqEn3hU8HTpGBAO3r4TyvVYWQTE3eEfMZbgImdqg0O4wu-tsn82MhnizQwTstidviok_NPqVF7gRgJWA",
    genre: "Synthwave",
    downloadedAt: new Date().toLocaleDateString()
  },
  {
    id: "track-2",
    title: "Strobe (Radio Edit)",
    artist: "deadmau5",
    album: "For Lack of a Better Name",
    duration: 384,
    bitrate: "320",
    size: "45.2 MB",
    thumbnailUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOg4r5tS9ilh4L8mvzP1tWx_Ve70etKmpZhUowHMXA7d-OFB92CRQWl-Ne-esW5bv8DM1pZhEvoydN4brvi92DAL8mNqHWtGBvxaRIPk16sSE0Huh-TXupf96dh3pVn73VuWa05bgotlPCtIAhQZL9bGaPQ0tI2lx3Il_5Hsv-2QbZTEy1PvFhkBJUQ2uoYCbLUveJK5N0m1J5UjVzzcStHkxAGtNe14DqKKo30ue5aDvILFgt6Sh02pBABjycRBR60RGyk2ybvLI",
    genre: "Electronic",
    downloadedAt: new Date().toLocaleDateString()
  },
  {
    id: "track-3",
    title: "Nightcall",
    artist: "Kavinsky",
    album: "Outrun",
    duration: 258,
    bitrate: "320",
    size: "10.1 MB",
    thumbnailUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvFnRo-mWDJSbjYc6pX5pZ07aC8wT7bh0d8oOOn-xpOT-WEJlQ5pYStsJXdrglatwfDAZWHPeTe12Bip3jSOxh3NpB8EuzNRMImCe6XD6sJASKxK1bN03WBapmjCshiVLS1IV8Ce1TZM0_SllkYMLR9VbZLAyc4DvY0Ntv8ivNko8LdOnZBiv9jdYCjDh7Rv_9zxzLmpFcy3K3zCMoT6vZgMU-skEVe94ax9soVxkH_SZg0VGPo_AG4jw7bEvuUZrYw5bQI8-QdlM",
    genre: "Retrowave",
    downloadedAt: new Date().toLocaleDateString()
  }
];

const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: "playlist-1",
    name: "Lo-Fi Study Beats 2026",
    url: "youtube.com/playlist?list=PL_lofi_study_2026",
    totalTracks: 120,
    downloadedTracks: 45,
    status: "processing",
    tracks: [
      { title: "Dreaming Awake", artist: "Lofi Girl", duration: 144 },
      { title: "Midnight Coffee", artist: "ChilledCow", duration: 152 },
      { title: "Afternoon Breeze", artist: "Focus Mind", duration: 180 }
    ]
  },
  {
    id: "playlist-2",
    name: "Synthwave Retrowave Mix",
    url: "youtube.com/playlist?list=PL_retro_synth_mix",
    totalTracks: 42,
    downloadedTracks: 0,
    status: "queued",
    tracks: [
      { title: "Laser Highway", artist: "Miami Nights 1984", duration: 252 },
      { title: "Sunset Cruise", artist: "The Midnight", duration: 212 }
    ]
  },
  {
    id: "playlist-3",
    name: "Tech Podcast Backlog",
    url: "youtube.com/playlist?list=PL_tech_backlog",
    totalTracks: 15,
    downloadedTracks: 15,
    status: "completed",
    tracks: [
      { title: "Future of AI", artist: "Tech Talk", duration: 1200 },
      { title: "Web Dev in 2026", artist: "Code Cast", duration: 1500 }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'downloads' | 'completed' | 'playlists'>('downloads');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  
  // App Settings State
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('cartune_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      saveLocation: "C:\\Users\\Admin\\Music\\CarTune",
      language: Language.EN,
      quality: Quality.KBPS_320,
      advancedLogging: true
    };
  });

  // Track Library State
  const [tracks, setTracks] = useState<LibraryTrack[]>(() => {
    const saved = localStorage.getItem('cartune_tracks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_TRACKS;
  });

  // Playlists State
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem('cartune_playlists');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_PLAYLISTS;
  });

  // Active Downloads
  const [activeDownload, setActiveDownload] = useState<ActiveDownload | null>(null);

  // Advanced Technical Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Track intervals for download simulation
  const downloadTimerRef = useRef<any>(null);
  const playlistTimerRef = useRef<any>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('cartune_settings', JSON.stringify(settings));
    // Set Document Direction based on Locale
    document.documentElement.dir = settings.language === Language.HE ? 'rtl' : 'ltr';
    document.documentElement.lang = settings.language;
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('cartune_tracks', JSON.stringify(tracks));
  }, [tracks]);

  useEffect(() => {
    localStorage.setItem('cartune_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Initial Boot-up logging
  useEffect(() => {
    addLog('success', 'CarTune MP3 Core initialized and running.');
    addLog('info', 'FFMPEG native libraries loaded successfully.');
    addLog('info', 'Save location scanned: C:\\Users\\Admin\\Music\\CarTune');
    addLog('success', 'Ready to compile tracks.');
  }, []);

  const addLog = (type: 'info' | 'warning' | 'error' | 'success', message: string) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    };
    setLogs(prev => [...prev.slice(-99), newLog]); // Keep last 100 logs
  };

  const handleUpdateLanguage = (lang: Language) => {
    setSettings(prev => ({ ...prev, language: lang }));
    addLog('info', `Language orientation changed to: ${lang}`);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    addLog('success', 'Configuration preferences saved successfully.');
  };

  const handleOpenFolder = () => {
    addLog('info', `Simulating system folder call: ${settings.saveLocation}`);
    alert(
      settings.language === Language.HE 
        ? `תיקיית השירים נפתחה במיקום:\n${settings.saveLocation}` 
        : settings.language === Language.RU 
          ? `Проводник запущен по адресу:\n${settings.saveLocation}` 
          : `System explorer triggered successfully at directory:\n${settings.saveLocation}`
    );
  };

  const handleCancelDownload = (id: string) => {
    if (downloadTimerRef.current) {
      clearInterval(downloadTimerRef.current);
      downloadTimerRef.current = null;
    }
    setActiveDownload(null);
    addLog('warning', `Download queue item cancelled by user.`);
  };

  const handleClearAllTracks = () => {
    if (confirm(settings.language === Language.HE ? "האם למחוק את כל השירים מספריית המוזיקה?" : settings.language === Language.RU ? "Вы уверены, что хотите удалить ВСЕ песни?" : "Are you sure you want to delete ALL downloaded songs?")) {
      setTracks([]);
      addLog('warning', 'Completed library history wiped.');
    }
  };

  const handleDeleteTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
    addLog('info', `Completed track removed from local indexes: ${id}`);
  };

  // Launch simulated downloading process from metadata
  const startSingleTrackDownload = (trackMeta: any) => {
    if (activeDownload) return;

    // Default cover art based on Title keywords
    let calculatedThumbnail = "https://lh3.googleusercontent.com/aida-public/AB6AXuC7xzgbTIbblwEno73Er_I-A18Ng545U8gL8IQnYJmSN4-AZsvsNxS5J9ByJhrPH9m8kViwUO2Bba8fWIzxwh4zoRLpFAnNBmT9SsT_Slwlq7UPab0LLz8agB_iCCymEguAzyGr68S1N0p03V13QHtXjtb6Ka582qsCyyLr9AF3tlMwow6Q0nr49spU48mfdIk32wgbAfTTJb8OJcoVRbwiT9x8pSY6nA0UNinZrOBegjwbVd2km8A7eMSdxQ8FJvWmkTsJisGuAGQ";
    if (trackMeta.title.toLowerCase().includes("midnight")) {
      calculatedThumbnail = "https://lh3.googleusercontent.com/aida-public/AB6AXuCTcAcXcHPqipsxaWMoWF3TIP6JBMj31jsnkvUzvoaRLtvri9zgrrgSW85M6fPCV9twwGzWUR3NKujjkcrMLY3-OxCf-p-hwH635yaSW-OtWTgHgq6UuSSGUJpDuwuDlllpIVx_KNULt7t2jO3mn0FLX_isajgebu-3uKBD0O3Qwik_G4G4dSvEgBA-nEOpqEn3hU8HTpGBAO3r4TyvVYWQTE3eEfMZbgImdqg0O4wu-tsn82MhnizQwTstidviok_NPqVF7gRgJWA";
    } else if (trackMeta.title.toLowerCase().includes("strobe")) {
      calculatedThumbnail = "https://lh3.googleusercontent.com/aida-public/AB6AXuBOg4r5tS9ilh4L8mvzP1tWx_Ve70etKmpZhUowHMXA7d-OFB92CRQWl-Ne-esW5bv8DM1pZhEvoydN4brvi92DAL8mNqHWtGBvxaRIPk16sSE0Huh-TXupf96dh3pVn73VuWa05bgotlPCtIAhQZL9bGaPQ0tI2lx3Il_5Hsv-2QbZTEy1PvFhkBJUQ2uoYCbLUveJK5N0m1J5UjVzzcStHkxAGtNe14DqKKo30ue5aDvILFgt6Sh02pBABjycRBR60RGyk2ybvLI";
    } else if (trackMeta.title.toLowerCase().includes("nightcall")) {
      calculatedThumbnail = "https://lh3.googleusercontent.com/aida-public/AB6AXuAvFnRo-mWDJSbjYc6pX5pZ07aC8wT7bh0d8oOOn-xpOT-WEJlQ5pYStsJXdrglatwfDAZWHPeTe12Bip3jSOxh3NpB8EuzNRMImCe6XD6sJASKxK1bN03WBapmjCshiVLS1IV8Ce1TZM0_SllkYMLR9VbZLAyc4DvY0Ntv8ivNko8LdOnZBiv9jdYCjDh7Rv_9zxzLmpFcy3K3zCMoT6vZgMU-skEVe94ax9soVxkH_SZg0VGPo_AG4jw7bEvuUZrYw5bQI8-QdlM";
    }

    const downloadItem: ActiveDownload = {
      id: `download-${Date.now()}`,
      title: trackMeta.title,
      artist: trackMeta.artist || "Web Artist",
      duration: trackMeta.duration || 200,
      progress: 0,
      speed: "3.2 MB/s",
      eta: "00:15",
      status: "queued",
      thumbnailUrl: calculatedThumbnail
    };

    setActiveDownload(downloadItem);
    addLog('info', `Queued thread initialized for: ${downloadItem.title}`);

    let currentProgress = 0;
    addLog('info', `Connecting to YouTube manifest servers...`);

    downloadTimerRef.current = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 12) + 8; // Tick progress upwards
      
      if (currentProgress < 100) {
        // Downloading phase
        const speedVal = (Math.random() * 1.5 + 2.5).toFixed(1);
        const secondsLeft = Math.ceil((100 - currentProgress) / 8);
        const formattedEta = `00:${secondsLeft.toString().padStart(2, '0')}`;
        
        setActiveDownload(prev => prev ? {
          ...prev,
          progress: currentProgress,
          status: 'downloading',
          speed: `${speedVal} MB/s`,
          eta: formattedEta
        } : null);

        addLog('info', `Downloading stream payloads... ${currentProgress}% completed.`);
      } else {
        // Conversion phase (FFMPEG compiling CJS/MP3 tags)
        clearInterval(downloadTimerRef.current);
        downloadTimerRef.current = null;
        
        setActiveDownload(prev => prev ? {
          ...prev,
          progress: 100,
          status: 'converting',
          speed: 'FFmpeg encoding',
          eta: '00:01'
        } : null);

        addLog('warning', `Payload retrieved. Calling FFmpeg compiler to encode ${settings.quality}kbps MP3 track.`);

        setTimeout(() => {
          // Finalize addition to Library tracks database
          const calculatedSize = `${((trackMeta.duration * (parseInt(settings.quality) / 8)) / 1024).toFixed(1)} MB`;
          const completedTrack: LibraryTrack = {
            id: `track-${Date.now()}`,
            title: trackMeta.title,
            artist: trackMeta.artist || "Synthesized Hits",
            album: trackMeta.album || "CarTune Compiled Drive",
            duration: trackMeta.duration,
            bitrate: settings.quality,
            size: calculatedSize,
            thumbnailUrl: calculatedThumbnail,
            genre: trackMeta.genre || "Drive Pop",
            downloadedAt: new Date().toLocaleDateString()
          };

          setTracks(prev => [completedTrack, ...prev]);
          setActiveDownload(null);
          addLog('success', `CarTune MP3 successfully outputted to: ${settings.saveLocation}\\${completedTrack.artist} - ${completedTrack.title}.mp3`);
          
          if (settings.language === Language.HE) {
            alert(`השיר "${completedTrack.title}" הורד והומר בהצלחה לקצב של ${settings.quality}kbps!`);
          } else if (settings.language === Language.RU) {
            alert(`Песня "${completedTrack.title}" успешно загружена и переведена в формат MP3 со скоростью ${settings.quality} кбит/с!`);
          } else {
            alert(`Successfully downloaded and compiled "${completedTrack.title}" at ${settings.quality}kbps MP3!`);
          }
        }, 1500);
      }
    }, 1000);
  };

  // Triggering the downloading mechanism
  const handleStartDownload = async (url: string, isPlaylist: boolean) => {
    addLog('info', `API fetch initiated mapping URL context: ${url}`);
    
    try {
      const response = await fetch('/api/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, isPlaylist })
      });
      const data = await response.json();
      
      if (data.error) {
        addLog('error', `Server rejected parser request: ${data.error}`);
        alert(data.error);
        return;
      }

      if (isPlaylist) {
        // Multi-song Playlist batch queue compilation
        addLog('success', `Parsed Playlist name: "${data.name}" containing ${data.tracks.length} tracks.`);
        
        const newPlaylist: Playlist = {
          id: `playlist-${Date.now()}`,
          name: data.name,
          url: url.replace('https://', ''),
          totalTracks: data.tracks.length,
          downloadedTracks: 0,
          status: 'processing',
          tracks: data.tracks
        };

        setPlaylists(prev => [newPlaylist, ...prev]);
        setActiveTab('playlists');
        
        // Setup incremental playlist downloader simulator thread
        runPlaylistQueueWorker(newPlaylist.id, data.tracks);
      } else {
        // Individual audio track queue compiling
        startSingleTrackDownload(data);
      }

    } catch (e: any) {
      addLog('error', `Network error during manifest compiling: ${e?.message}`);
      alert("Downloading gateway experienced a connection blip. Using fast fallbacks...");
    }
  };

  // Add playlist manually via panel
  const handleAddPlaylistLink = (url: string) => {
    handleStartDownload(url, true);
  };

  // Playlist queue worker simulator thread
  const runPlaylistQueueWorker = (playlistId: string, trackList: any[]) => {
    let currentIdx = 0;
    addLog('info', `Starting playlist batch workers on playlist id: ${playlistId}`);

    if (playlistTimerRef.current) {
      clearInterval(playlistTimerRef.current);
    }

    playlistTimerRef.current = setInterval(() => {
      // Find latest state details
      setPlaylists(prev => {
        const item = prev.find(p => p.id === playlistId);
        if (!item || item.status === 'paused') {
          clearInterval(playlistTimerRef.current);
          playlistTimerRef.current = null;
          return prev;
        }

        if (currentIdx < trackList.length) {
          const currentTrack = trackList[currentIdx];
          
          // Add this playlist track directly as downloaded to library state!
          const calculatedSize = `${((currentTrack.duration * (parseInt(settings.quality) / 8)) / 1024).toFixed(1)} MB`;
          
          // Random album thumbnail
          const thumbChoices = [
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCTcAcXcHPqipsxaWMoWF3TIP6JBMj31jsnkvUzvoaRLtvri9zgrrgSW85M6fPCV9twwGzWUR3NKujjkcrMLY3-OxCf-p-hwH635yaSW-OtWTgHgq6UuSSGUJpDuwuDlllpIVx_KNULt7t2jO3mn0FLX_isajgebu-3uKBD0O3Qwik_G4G4dSvEgBA-nEOpqEn3hU8HTpGBAO3r4TyvVYWQTE3eEfMZbgImdqg0O4wu-tsn82MhnizQwTstidviok_NPqVF7gRgJWA",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuBOg4r5tS9ilh4L8mvzP1tWx_Ve70etKmpZhUowHMXA7d-OFB92CRQWl-Ne-esW5bv8DM1pZhEvoydN4brvi92DAL8mNqHWtGBvxaRIPk16sSE0Huh-TXupf96dh3pVn73VuWa05bgotlPCtIAhQZL9bGaPQ0tI2lx3Il_5Hsv-2QbZTEy1PvFhkBJUQ2uoYCbLUveJK5N0m1J5UjVzzcStHkxAGtNe14DqKKo30ue5aDvILFgt6Sh02pBABjycRBR60RGyk2ybvLI",
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAvFnRo-mWDJSbjYc6pX5pZ07aC8wT7bh0d8oOOn-xpOT-WEJlQ5pYStsJXdrglatwfDAZWHPeTe12Bip3jSOxh3NpB8EuzNRMImCe6XD6sJASKxK1bN03WBapmjCshiVLS1IV8Ce1TZM0_SllkYMLR9VbZLAyc4DvY0Ntv8ivNko8LdOnZBiv9jdYCjDh7Rv_9zxzLmpFcy3K3zCMoT6vZgMU-skEVe94ax9soVxkH_SZg0VGPo_AG4jw7bEvuUZrYw5bQI8-QdlM"
          ];

          const completedTrack: LibraryTrack = {
            id: `track-${Date.now()}-${currentIdx}`,
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: item.name,
            duration: currentTrack.duration,
            bitrate: settings.quality,
            size: calculatedSize,
            thumbnailUrl: thumbChoices[currentIdx % thumbChoices.length],
            genre: item.name.includes("Lofi") || item.name.includes("Lo-Fi") ? "Lofi Beats" : "Synthwave",
            downloadedAt: new Date().toLocaleDateString()
          };

          // Update library
          setTracks(prevTracks => [completedTrack, ...prevTracks]);
          addLog('success', `Batch compiled successfully [${item.name}]: ${completedTrack.artist} - ${completedTrack.title}`);

          currentIdx++;
          
          const isDone = currentIdx === trackList.length;
          
          return prev.map(p => p.id === playlistId ? {
            ...p,
            downloadedTracks: currentIdx,
            status: isDone ? 'completed' : 'processing'
          } : p);
        } else {
          clearInterval(playlistTimerRef.current);
          playlistTimerRef.current = null;
        }

        return prev;
      });

    }, 3500); // Process each song every 3.5 seconds
  };

  const handleUpdatePlaylistStatus = (id: string, status: 'queued' | 'processing' | 'paused' | 'completed') => {
    setPlaylists(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    addLog('info', `Playlist state modified to: ${status}`);

    if (status === 'processing') {
      const playlist = playlists.find(p => p.id === id);
      if (playlist) {
        runPlaylistQueueWorker(id, playlist.tracks);
      }
    }
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== id));
    addLog('warning', `Playlist queue item index removed: ${id}`);
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
