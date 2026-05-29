import { useState, useEffect } from 'react';
import { translations } from '../i18n';
import { AppSettings, LibraryTrack, Language } from '../types';
import { SynthPlayer } from '../utils/audio';

interface CompletedLibraryProps {
  settings: AppSettings;
  tracks: LibraryTrack[];
  onDeleteTrack: (id: string) => void;
  onClearAllTracks: () => void;
  onAddLog: (type: 'info' | 'warning' | 'error' | 'success', msg: string) => void;
}

export default function CompletedLibrary({
  settings,
  tracks,
  onDeleteTrack,
  onClearAllTracks,
  onAddLog
}: CompletedLibraryProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);

  const t = translations[settings.language];
  const isRtl = settings.language === Language.HE;

  // Cleanup synthesizer on component unmount
  useEffect(() => {
    return () => {
      SynthPlayer.stop();
    };
  }, []);

  const handlePlayToggle = (track: LibraryTrack) => {
    if (playingTrackId === track.id) {
      SynthPlayer.stop();
      setPlayingTrackId(null);
      onAddLog('info', `Stopped playback of ${track.title}`);
    } else {
      SynthPlayer.play(track.title, track.artist);
      setPlayingTrackId(track.id);
      onAddLog('success', `Synthesizing retro audio for "${track.title}" by ${track.artist}`);
    }
  };

  const handleShowInFolder = (track: LibraryTrack) => {
    const isWindows = settings.saveLocation.includes('\\') || settings.saveLocation.startsWith('C:');
    const pathDelimiter = isWindows ? '\\' : '/';
    const filePath = `${settings.saveLocation}${pathDelimiter}${track.artist} - ${track.title}.mp3`;
    
    // Log to technical panel
    onAddLog('info', `FileSystem wrapper triggered. Opening directory containing file: ${filePath}`);
    
    // Visual alert feedback
    alert(settings.language === Language.EN ? `Browsing and highlighting track in explorer:\n\nFolder: ${settings.saveLocation}\nFile: ${track.artist} - ${track.title}.mp3` : settings.language === Language.RU ? `Перенаправление в Проводник:\n\nПапка: ${settings.saveLocation}\nФайл: ${track.artist} - ${track.title}.mp3` : `מנווט בתיקיית הקבצים ומסמן את השיר:\n\nתיקייה: ${settings.saveLocation}\nקובץ: ${track.artist} - ${track.title}.mp3`);
  };

  // Extract unique genres for filtration
  const uniqueGenres = ['All', ...Array.from(new Set(tracks.map(t => t.genre)))];

  // Filters logic
  const filteredTracks = tracks.filter(track => {
    const matchesSearch = 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.genre.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenre = selectedGenre === 'All' || track.genre === selectedGenre;
    
    return matchesSearch && matchesGenre;
  });

  return (
    <div className={`flex-1 flex flex-col gap-6 p-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      
      {/* Page Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">{t.library}</h2>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">{t.libraryDesc}</p>
        </div>

        <div className="flex items-center gap-4 self-start md:self-auto shrink-0">
          <span className="font-label-sm text-xs text-tertiary font-bold px-3 py-1 bg-surface-container-high rounded-full border border-outline-variant/10">
            {tracks.length} {t.itemsCount}
          </span>
          {tracks.length > 0 && (
            <button 
              id="clear-all-library-btn"
              onClick={onClearAllTracks}
              className="text-primary hover:text-primary-fixed font-label-bold text-xs font-bold px-3 py-1 border border-primary/20 hover:border-primary/50 hover:bg-primary/5 rounded transition-colors cursor-pointer"
            >
              {t.clearAll}
            </button>
          )}
        </div>
      </section>

      {/* Filter Options & Search bar row */}
      <section className="flex flex-col sm:flex-row gap-3 bg-surface-container-low border border-outline-variant/25 rounded-xl p-4 shrink-0">
        {/* Text search */}
        <div className="flex-1 flex items-center bg-surface-dim border border-outline-variant/30 rounded-lg px-3 py-2 focus-within:border-secondary transition-all">
          <span className="material-icons-span text-on-surface-variant text-lg">search</span>
          <input 
            id="track-search-box"
            className="w-full bg-transparent border-none outline-none font-body-md text-sm text-on-surface placeholder-on-surface-variant/40 ml-2 focus:ring-0" 
            placeholder={t.searchPlaceholder}
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-icons-span text-sm">cancel</span>
            </button>
          )}
        </div>

        {/* Genre capsule filter list */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none shrink-0 max-w-full sm:max-w-[280px]">
          {uniqueGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all border ${
                selectedGenre === genre
                  ? 'bg-secondary-container border-secondary text-on-secondary-container font-black shadow-sm'
                  : 'bg-surface-dim border-outline-variant/20 hover:border-outline-variant/60 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {genre === 'All' ? t.filterAll : genre}
            </button>
          ))}
        </div>
      </section>

      {/* Completed Stacked Bento List */}
      <section className="flex-1 overflow-y-auto pr-1">
        {filteredTracks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredTracks.map((track) => (
              <div 
                key={track.id} 
                className={`group flex flex-col md:flex-row items-stretch md:items-center gap-4 p-3 bg-surface-container-low border hover:bg-surface-container border-surface-container-highest hover:border-surface-variant rounded-xl transition-all duration-200 ${
                  playingTrackId === track.id ? 'border-secondary shadow-[0_0_15px_rgba(0,227,253,0.1)] bg-surface-container/60' : ''
                }`}
              >
                {/* Album / Art Visual block */}
                <div 
                  id={`play-track-box-${track.id}`}
                  onClick={() => handlePlayToggle(track)}
                  className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container-highest cursor-pointer flex-shrink-0 border border-outline-variant/10 shadow-md"
                >
                  <img 
                    alt="Album frame" 
                    className={`w-full h-full object-cover transition-all duration-300 ${
                      playingTrackId === track.id ? 'scale-110 opacity-60 filter blur-[1px]' : 'opacity-80 group-hover:opacity-100'
                    }`} 
                    src={track.thumbnailUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCTcAcXcHPqipsxaWMoWF3TIP6JBMj31jsnkvUzvoaRLtvri9zgrrgSW85M6fPCV9twwGzWUR3NKujjkcrMLY3-OxCf-p-hwH635yaSW-OtWTgHgq6UuSSGUJpDuwuDlllpIVx_KNULt7t2jO3mn0FLX_isajgebu-3uKBD0O3Qwik_G4G4dSvEgBA-nEOpqEn3hU8HTpGBAO3r4TyvVYWQTE3eEfMZbgImdqg0O4wu-tsn82MhnizQwTstidviok_NPqVF7gRgJWA"} 
                  />
                  
                  {/* Playing visual Waveform sound anim or Play arrow */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all ${
                    playingTrackId === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    {playingTrackId === track.id ? (
                      <div className="flex items-end gap-1.5 h-6">
                        <span className="w-1.5 bg-secondary rounded-full animate-[pulse_0.4s_infinite_alternate_ease-in-out]"></span>
                        <span className="w-1.5 bg-secondary rounded-full animate-[pulse_0.6s_infinite_alternate_ease-in-out_0.2s] h-1.5"></span>
                        <span className="w-1.5 bg-secondary rounded-full animate-[pulse_0.5s_infinite_alternate_ease-in-out_0.1s] h-3"></span>
                        <span className="w-1.5 bg-secondary rounded-full animate-[pulse_0.7s_infinite_alternate_ease-in-out_0.3s] h-2"></span>
                      </div>
                    ) : (
                      <span className="material-icons-span text-white text-3xl font-black">play_arrow</span>
                    )}
                  </div>
                </div>

                {/* Song Meta Information Info */}
                <div className="flex-1 min-w-0" onClick={() => handlePlayToggle(track)}>
                  <h3 className="font-body-lg text-sm font-bold text-on-surface truncate cursor-pointer group-hover:text-secondary-fixed transition-colors">
                    {track.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 font-body-md text-xs text-on-surface-variant truncate">
                    <span className="font-semibold">{track.artist}</span>
                    <span className="opacity-30">•</span>
                    <span>{track.album}</span>
                    <span className="opacity-30">•</span>
                    <span className="px-1.5 py-0.5 rounded bg-surface-dim border border-outline-variant/10 text-[10px] text-on-surface-variant/70 uppercase">
                      {track.genre}
                    </span>
                  </div>
                </div>

                {/* Complete Stats and Actions triggers Column */}
                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-3 md:pt-0 border-t border-outline-variant/15 md:border-t-0">
                  {/* File specifications labels */}
                  <div className="flex flex-col items-start md:items-end">
                    <span className="font-label-bold text-[10px] text-secondary-fixed-dim bg-secondary-container/10 border border-secondary-container/20 px-2.5 py-0.5 rounded-md font-extrabold uppercase shrink-0">
                      {track.bitrate === '320' ? '320kbps MP3' : track.bitrate === '256' ? '256kbps MP3' : '128kbps MP3'}
                    </span>
                    <span className="font-label-sm text-[10px] text-tertiary mt-1 font-semibold shrink-0">
                      {track.size} • {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Operational triggers */}
                  <div className="flex items-center gap-2">
                    <button 
                      id={`show-folder-btn-${track.id}`}
                      onClick={() => handleShowInFolder(track)}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg border border-surface-container-highest text-secondary hover:bg-surface-container-high transition-all text-xs font-label-bold active:scale-95 cursor-pointer"
                    >
                      <span className="material-icons-span text-sm pr-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
                      {t.showInFolder}
                    </button>

                    <button 
                      id={`delete-track-btn-${track.id}`}
                      onClick={() => onDeleteTrack(track.id)}
                      className="text-tertiary-fixed-dim hover:text-error transition-all p-2 rounded-full hover:bg-surface-container-high active:scale-90 cursor-pointer" 
                      title={t.deleteFile}
                    >
                      <span className="material-icons-span text-lg">delete</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-outline-variant/30 rounded-xl bg-surface-container-low/35 text-center px-6">
            <span className="material-icons-span text-4xl mb-3 text-on-surface-variant/40 animate-pulse">check_circle</span>
            <p className="font-body-md text-sm text-on-surface-variant max-w-sm leading-relaxed">{t.noTracks}</p>
          </div>
        )}
      </section>

    </div>
  );
}
