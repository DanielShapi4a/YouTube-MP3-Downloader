import React, { useState } from 'react';
import { translations } from '../i18n';
import { AppSettings, Playlist, Language } from '../types';

interface PlaylistManagerProps {
  settings: AppSettings;
  playlists: Playlist[];
  onAddPlaylist: (url: string) => void;
  onUpdatePlaylistStatus: (id: string, status: 'queued' | 'processing' | 'paused' | 'completed') => void;
  onDeletePlaylist: (id: string) => void;
}

// Helper function to dynamically map high-quality theme art based on starting songs or playlist labels
const getPlaylistBgImage = (playlist: Playlist) => {
  const name = playlist.name.toLowerCase();
  
  if (name.includes('lofi') || name.includes('lo-fi')) {
    // High-quality warm Lofi room background
    return 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&q=80&w=600';
  }
  if (name.includes('synth') || name.includes('retro')) {
    // Beautiful vaporwave/retro futuristic neon highway background
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600';
  }
  if (name.includes('tech') || name.includes('podcast')) {
    // Clean audio equipment / dashboard sound wave wallpaper
    return 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=600';
  }
  // Standard stylish dashboard or road drive artwork
  return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=600';
};

export default function PlaylistManager({
  settings,
  playlists,
  onAddPlaylist,
  onUpdatePlaylistStatus,
  onDeletePlaylist
}: PlaylistManagerProps) {
  const [playlistUrl, setPlaylistUrl] = useState<string>('');
  const [isInputOpen, setIsInputOpen] = useState<boolean>(false);
  const [selectedPlaylistForTracks, setSelectedPlaylistForTracks] = useState<Playlist | null>(null);

  const t = translations[settings.language];
  const isRtl = settings.language === Language.HE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;
    onAddPlaylist(playlistUrl.trim());
    setPlaylistUrl('');
    setIsInputOpen(false);
  };

  const handlePredefinedAdd = () => {
    onAddPlaylist('https://www.youtube.com/playlist?list=PL_retro_synthwave_hits_2026');
  };

  return (
    <div className={`flex-1 flex flex-col gap-6 p-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      
      {/* Section Header */}
      <section className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background font-extrabold">{t.playlistQueue}</h2>
          <p className="font-body-md text-sm text-on-surface-variant font-medium mt-1">{t.playlistDesc}</p>
        </div>
        
        <button 
          id="toggle-add-playlist-btn"
          onClick={() => setIsInputOpen(!isInputOpen)}
          className="flex items-center justify-center gap-2 bg-transparent border border-surface-container-high text-secondary hover:bg-surface-container-high hover:border-secondary font-label-bold text-xs font-semibold px-4 py-2.5 rounded transition-all cursor-pointer shadow-sm self-start md:self-auto"
        >
          <span className="material-icons-span text-sm">add_link</span>
          {t.addPlaylistUrl}
        </button>
      </section>

      {/* Slide down Playlist Input Modal Drawer inline */}
      {isInputOpen && (
        <form onSubmit={handleSubmit} className="bg-surface-container-low border border-secondary/30 rounded-xl p-5 shrink-0 flex flex-col gap-3 animate-[fadeIn_0.2s_ease-out]">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-label-bold text-secondary uppercase tracking-wider">{t.inputPlaylistUrlPlaceholder}</label>
            <div className="flex flex-col sm:flex-row gap-3 mt-1.5">
              <input
                id="playlist-url-input-box"
                type="text"
                className="flex-1 bg-surface-dim border border-outline-variant/40 rounded-lg px-4 py-2.5 font-mono text-xs text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                placeholder="https://www.youtube.com/playlist?list=PL_..."
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-secondary-container text-on-secondary-container font-label-bold text-xs font-black shadow-md rounded-lg hover:opacity-90 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  {settings.language === Language.EN ? "Add Link" : settings.language === Language.RU ? "Добавить" : "הוסף קישור"}
                </button>
                <button
                  type="button"
                  onClick={handlePredefinedAdd}
                  className="px-3 py-2.5 bg-surface-container-highest border border-outline-variant/30 text-on-surface rounded-lg font-label-bold text-[10px] hover:bg-surface-variant cursor-pointer whitespace-nowrap uppercase"
                >
                  {settings.language === Language.HE ? "הוסף פלייליסט דוגמה" : settings.language === Language.RU ? "Плейлист-Пример" : "Add Demo Playlist"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Bento Grid for Playlists */}
      <section className="flex-1 overflow-y-auto pr-1">
        {playlists.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {playlists.map((playlist) => {
              const percentage = Math.round((playlist.downloadedTracks / playlist.totalTracks) * 100);
              
              // Status chip styles mapping
              const isProcessing = playlist.status === 'processing';
              const isPaused = playlist.status === 'paused';
              const isCompleted = playlist.status === 'completed';
              
              return (
                <div 
                  key={playlist.id} 
                  className="bg-surface-container-low rounded-xl border border-surface-container-highest hover:border-outline-variant/40 transition-colors overflow-hidden flex flex-col group relative shadow-md"
                >
                  
                  {/* Playlist Starting Song Background Graphic */}
                  <div 
                    className="h-28 w-full relative p-4 flex items-start justify-between bg-cover bg-center shrink-0 border-b border-surface-container-highest overflow-hidden"
                    style={{ 
                      backgroundImage: `linear-gradient(to bottom, rgba(5, 20, 36, 0.45) 0%, rgba(5, 20, 36, 0.9) 100%), url(${getPlaylistBgImage(playlist)})`,
                    }}
                  >
                    {/* Interactive state chip */}
                    <div className="bg-surface-dim/80 backdrop-blur-sm px-3 py-1 rounded-full border border-outline-variant/20 flex items-center gap-2 select-none z-10">
                      <span className={`w-2 h-2 rounded-full ${
                        isCompleted ? 'bg-secondary' : isPaused ? 'bg-outline' : 'bg-primary-container animate-pulse'
                      }`}></span>
                      <span className="font-label-bold text-[9px] font-black uppercase tracking-widest text-on-surface text-[10px]">
                        {playlist.status === 'processing' ? t.processing : playlist.status === 'queued' ? t.queued : playlist.status === 'paused' ? t.paused : t.completed}
                      </span>
                    </div>

                    <button 
                      onClick={() => onDeletePlaylist(playlist.id)}
                      className="text-on-surface-variant hover:text-error transition-colors p-1.5 hover:bg-surface-dim/40 rounded-full cursor-pointer z-10"
                      title={settings.language === Language.HE ? "מחק פלייליסט" : settings.language === Language.RU ? "Удалить плейлист" : "Delete playlist"}
                    >
                      <span className="material-icons-span text-[18px]">close</span>
                    </button>

                    {/* Left overlay details indicating first track starting point */}
                    <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2 z-10" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                      <div className="w-7 h-7 rounded bg-secondary/20 border border-secondary/30 shrink-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[15px] text-secondary font-black">play_arrow</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-on-surface-variant font-bold block uppercase tracking-wider opacity-80 leading-none">
                          {settings.language === Language.HE ? "שיר ראשון" : settings.language === Language.RU ? "Стартовый трек" : "Starting Song"}
                        </span>
                        <span className="text-[11px] text-white font-extrabold truncate block mt-0.5" title={playlist.tracks && playlist.tracks.length > 0 ? playlist.tracks[0].title : ''}>
                          {playlist.tracks && playlist.tracks.length > 0 ? playlist.tracks[0].title : "..."}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Content parameters */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-headline-md text-sm font-black text-on-surface mb-1 truncate group-hover:text-secondary transition-colors">
                        {playlist.name}
                      </h3>
                      <p className="font-mono text-[10px] text-on-surface-variant truncate mb-4 select-text">
                        {playlist.url}
                      </p>
                    </div>

                    {/* Compilation metrics / Progress meter */}
                    <div className="mt-auto">
                      <div className="flex justify-between items-end mb-2 text-xs">
                        <span className="font-label-bold text-xs text-secondary-fixed font-semibold whitespace-nowrap">
                          {playlist.downloadedTracks} / {playlist.totalTracks} {settings.language === Language.HE ? "שירים" : settings.language === Language.RU ? "Треков" : "Tracks"}
                        </span>
                        <span className="font-label-sm text-xs text-on-surface-variant font-bold">{percentage}%</span>
                      </div>
                      
                      <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/10">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-secondary' : 'bg-primary'}`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Tab Active and Operational actions list */}
                  <div className="px-4 py-2.5 border-t border-surface-container-highest bg-surface-dim/40 flex gap-2 shrink-0">
                    {!isCompleted ? (
                      isProcessing ? (
                        <button 
                          id={`pause-playlist-${playlist.id}`}
                          onClick={() => onUpdatePlaylistStatus(playlist.id, 'paused')}
                          className="flex-1 flex justify-center items-center gap-1 py-2 px-3 rounded bg-transparent border border-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label-bold text-[10px] uppercase font-bold transition-colors cursor-pointer"
                        >
                          <span className="material-icons-span text-sm pr-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>pause</span>
                          {t.pause}
                        </button>
                      ) : (
                        <button 
                          id={`resume-playlist-${playlist.id}`}
                          onClick={() => onUpdatePlaylistStatus(playlist.id, 'processing')}
                          className="flex-1 flex justify-center items-center gap-1 py-1.5 px-3 rounded bg-primary-container text-on-primary-container bg-gradient-to-b from-primary-container to-[#d64a38] border-t border-white/20 font-label-bold text-[10px] uppercase font-bold shadow-[0_4px_10px_rgba(255,85,64,0.2)] hover:opacity-90 transition-all cursor-pointer"
                        >
                          <span className="material-icons-span text-sm pr-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                          {playlist.status === 'paused' ? t.resume : t.downloadAll}
                        </button>
                      )
                    ) : (
                      <button 
                        id={`clear-playlist-${playlist.id}`}
                        onClick={() => onDeletePlaylist(playlist.id)}
                        className="flex-1 flex justify-center items-center gap-1 py-1.5 px-3 rounded bg-transparent border border-transparent text-tertiary-fixed hover:bg-surface-container-high font-label-bold text-[10px] uppercase font-bold transition-all cursor-pointer"
                      >
                        {t.clear}
                      </button>
                    )}

                    {/* View tracks summary modal log */}
                    <button 
                      id={`view-tracks-btn-${playlist.id}`}
                      onClick={() => setSelectedPlaylistForTracks(playlist)}
                      className="flex-1 flex justify-center items-center gap-1 py-1.5 px-3 rounded bg-transparent border border-surface-container-high text-secondary hover:bg-surface-container-high hover:border-secondary font-label-bold text-[10px] uppercase font-bold transition-colors cursor-pointer"
                    >
                      {t.viewTracks}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-outline-variant/30 rounded-xl bg-surface-container-low/30 text-center px-6">
            <span className="material-icons-span text-4xl mb-3 text-on-surface-variant/40 animate-pulse">playlist_play</span>
            <p className="font-body-md text-sm text-on-surface-variant max-w-sm leading-relaxed">{t.noPlaylists}</p>
          </div>
        )}
      </section>

      {/* Searchable/scorable Custom Tracks Modal */}
      {selectedPlaylistForTracks && (
        <div 
          id="playlist-tracks-modal" 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in animate-[fadeIn_0.2s_ease-out]"
        >
          <div 
            className="w-full max-w-xl bg-surface-container-low border border-outline-variant/40 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden max-h-[80vh] text-on-surface"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-surface-container-high bg-surface-dim shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-icons-span text-secondary text-2xl font-black">music_video</span>
                <div>
                  <h2 className="text-sm font-extrabold text-on-surface tracking-tight leading-none">
                    {selectedPlaylistForTracks.name}
                  </h2>
                  <span className="text-[10px] text-on-surface-variant mt-1.5 block opacity-85 leading-none font-mono">
                    {selectedPlaylistForTracks.totalTracks} {settings.language === Language.HE ? "שירים בסך הכל" : settings.language === Language.RU ? "Всего треков" : "Tracks in Total"}
                  </span>
                </div>
              </div>
              <button 
                id="close-tracks-modal-btn"
                onClick={() => setSelectedPlaylistForTracks(null)}
                className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95 cursor-pointer"
              >
                <span className="material-icons-span">close</span>
              </button>
            </div>

            {/* List Body */}
            <div className="p-4 overflow-y-auto space-y-2">
              {selectedPlaylistForTracks.tracks && selectedPlaylistForTracks.tracks.length > 0 ? (
                selectedPlaylistForTracks.tracks.map((track, idx) => {
                  const durationMins = Math.floor(track.duration / 60);
                  const durationSecs = Math.floor(track.duration % 60);
                  const formattedDuration = `${durationMins}:${durationSecs < 10 ? '0' : ''}${durationSecs}`;
                  
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 bg-surface hover:bg-surface-container-high rounded-lg border border-outline-variant/5 transition-all text-sm gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0 text-start">
                        {/* Number Indicator */}
                        <span className="font-mono text-xs text-on-surface-variant text-center shrink-0 w-5">
                          {idx + 1}
                        </span>
                        
                        {/* Track Info */}
                        <div className="min-w-0">
                          <h4 className="font-bold text-on-surface truncate leading-tight select-text text-xs">
                            {track.title}
                          </h4>
                          <span className="text-[11px] text-on-surface-variant truncate block mt-0.5 select-text">
                            {track.artist}
                          </span>
                        </div>
                      </div>

                      {/* Right metadata details */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-mono text-[11px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/10">
                          {formattedDuration}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-on-surface-variant/60">
                  <span className="material-icons-span text-3xl opacity-50 block mb-1">sentiment_dissatisfied</span>
                  <span className="text-xs">{settings.language === Language.HE ? "אין שירים זמינים" : settings.language === Language.RU ? "Нет доступных треков" : "No tracks found."}</span>
                </div>
              )}
            </div>

            {/* Close trigger bottom bar */}
            <div className="p-4 border-t border-surface-container-high bg-surface-dim shrink-0 flex justify-end">
              <button 
                id="close-tracks-modal-bottom-btn"
                onClick={() => setSelectedPlaylistForTracks(null)}
                className="w-full px-5 py-2 rounded-lg bg-surface-container-high text-on-surface font-extrabold text-xs uppercase hover:bg-surface-container-highest transition-colors cursor-pointer text-center"
              >
                {settings.language === Language.HE ? "סגור" : settings.language === Language.RU ? "Закрыть" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
