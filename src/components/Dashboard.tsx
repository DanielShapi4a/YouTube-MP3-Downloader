import React, { useState } from 'react';
import { translations } from '../i18n';
import { AppSettings, ActiveDownload, LogEntry, Language } from '../types';

interface DashboardProps {
  settings: AppSettings;
  activeDownload: ActiveDownload | null;
  logs: LogEntry[];
  onStartDownload: (url: string, isPlaylist: boolean) => void;
  onCancelDownload: (id: string) => void;
  onClearLogs: () => void;
}

export default function Dashboard({
  settings,
  activeDownload,
  logs,
  onStartDownload,
  onCancelDownload,
  onClearLogs,
}: DashboardProps) {
  const [urlInput, setUrlInput] = useState<string>('');
  const [downloadMode, setDownloadMode] = useState<'single' | 'playlist'>('single');
  const [isLogsOpen, setIsLogsOpen] = useState<boolean>(false);

  const t = translations[settings.language];
  const isRtl = settings.language === Language.HE;
  const isFetchingWithoutProgress =
    activeDownload?.status === 'fetching' && activeDownload.progress <= 5;

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrlInput(text);
        }
      }
    } catch {
      setUrlInput((current) => current);
    }
  };

  const handleStart = () => {
    if (!urlInput.trim()) {
      alert(t.invalidUrl);
      return;
    }
    onStartDownload(urlInput.trim(), downloadMode === 'playlist');
  };

  // Pre-load quick sample links to ease testing
  const quickSamples = [
    {
      title: 'Rick Astley (Pop)',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      mode: 'single',
    },
    {
      title: 'M83 Midnight (Indie)',
      url: 'https://www.youtube.com/watch?v=T8B0E8l8gYo',
      mode: 'single',
    },
    {
      title: 'Kavinsky Nightcall (Synth)',
      url: 'https://www.youtube.com/watch?v=MV_3Dpw-BRY',
      mode: 'single',
    },
    {
      title: 'Lo-Fi Beats (Playlist)',
      url: 'https://www.youtube.com/playlist?list=PL_lofi_study_beats',
      mode: 'playlist',
    },
    {
      title: 'Synthwave Car (Playlist)',
      url: 'https://www.youtube.com/playlist?list=PL_retro_car_synth',
      mode: 'playlist',
    },
  ];

  return (
    <div className={`flex-1 flex flex-col gap-6 p-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      {/* Hero / Input Section */}
      <section className="flex flex-col gap-5 bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 relative overflow-hidden">
        {/* Decorative ambient background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>

        <div className="flex flex-col gap-1">
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">
            {t.newDownload}
          </h2>
          <p className="font-body-md text-sm text-on-surface-variant">{t.enterUrl}</p>
        </div>

        {/* Toggle Switcher option: Single Song or Playlist */}
        <div className="flex flex-col gap-2 mt-1">
          <label className="text-xs font-label-bold text-on-surface-variant uppercase tracking-wider">
            {t.downloadType}
          </label>
          <div className="grid grid-cols-2 gap-1 bg-surface-dim border border-outline-variant/30 p-1 rounded-lg w-full sm:w-fit">
            <button
              id="switch-single-btn"
              type="button"
              aria-pressed={downloadMode === 'single'}
              aria-label={t.singleTrack}
              onClick={() => setDownloadMode('single')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-label-bold text-xs transition-all cursor-pointer border ${
                downloadMode === 'single'
                  ? 'bg-secondary-container text-on-secondary-container font-black shadow-sm border-secondary/50'
                  : 'text-on-surface-variant hover:text-on-surface border-transparent'
              }`}
            >
              <span className="material-icons-span text-sm">
                {downloadMode === 'single' ? 'radio_button_checked' : 'music_note'}
              </span>
              {t.singleTrack}
            </button>
            <button
              id="switch-playlist-btn"
              type="button"
              aria-pressed={downloadMode === 'playlist'}
              aria-label={t.playlistMode}
              onClick={() => setDownloadMode('playlist')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-label-bold text-xs transition-all cursor-pointer border ${
                downloadMode === 'playlist'
                  ? 'bg-secondary-container text-on-secondary-container font-black shadow-sm border-secondary/50'
                  : 'text-on-surface-variant hover:text-on-surface border-transparent'
              }`}
            >
              <span className="material-icons-span text-sm font-bold">
                {downloadMode === 'playlist' ? 'radio_button_checked' : 'playlist_add_check'}
              </span>
              {t.playlistMode}
            </button>
          </div>
        </div>

        {/* URL Input Group */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center bg-surface-dim border border-outline-variant/40 rounded-lg p-2 input-focus-glow transition-all duration-200">
            <div className="px-3 flex items-center justify-center text-on-surface-variant shrink-0">
              <span className="material-icons-span text-xl">link</span>
            </div>
            <input
              id="youtube-url-input"
              className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-on-surface placeholder-on-surface-variant/40 py-2 focus:ring-0"
              placeholder={
                downloadMode === 'playlist'
                  ? 'https://www.youtube.com/playlist?list=...'
                  : 'https://www.youtube.com/watch?v=...'
              }
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
            <button
              id="paste-url-btn"
              onClick={handlePaste}
              className="flex items-center gap-1 px-4 py-2 bg-surface-container-highest hover:bg-surface-variant text-on-surface rounded-md transition-all font-label-bold text-xs border border-outline-variant/30 cursor-pointer select-none"
            >
              <span className="material-icons-span text-[16px]">content_paste</span>
              {t.paste}
            </button>
          </div>

          {/* Quick Sandbox Tester Links */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-on-surface-variant uppercase font-label-bold">
              Samples:
            </span>
            {quickSamples.map((samp, i) => (
              <button
                key={i}
                id={`sample-link-${i}`}
                onClick={() => {
                  setDownloadMode(samp.mode as 'single' | 'playlist');
                  setUrlInput(samp.url);
                }}
                className="px-2 py-1 text-[10px] rounded bg-surface-container border border-outline-variant/20 text-secondary hover:border-secondary transition-all cursor-pointer"
              >
                {samp.title}
              </button>
            ))}
          </div>

          {/* Destination Folder & CTA Action Row */}
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-surface-container-highest/20 p-4 rounded-lg border border-outline-variant/20 mt-1">
            {/* Destination folder selector visual */}
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-xs text-on-surface-variant">{t.saveToFolder}:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded bg-secondary/10 text-secondary shrink-0">
                  <span
                    className="material-icons-span text-lg"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    folder
                  </span>
                </div>
                <span className="font-mono text-xs text-on-surface truncate pr-2 max-w-[240px] block font-semibold">
                  {settings.saveLocation}
                </span>
              </div>
            </div>

            {/* Primary Start download button element */}
            <button
              id="trigger-download-btn"
              disabled={!!activeDownload}
              onClick={handleStart}
              className={`flex items-center justify-center gap-2 bg-gradient-to-b from-primary-container to-error text-on-primary-container px-6 py-3 rounded-lg font-label-bold text-sm border-t border-white/20 primary-glow transition-all duration-200 select-none whitespace-nowrap ${
                activeDownload
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:opacity-90 active:scale-95 cursor-pointer'
              }`}
            >
              <span
                className="material-icons-span text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                download
              </span>
              {downloadMode === 'playlist' ? t.startDownload : t.downloadMp3}
            </button>
          </div>
        </div>
      </section>

      {/* Active Download Progress Card (Standard responsive card element) */}
      <section className="flex flex-col gap-2">
        <h3 className="font-label-bold text-xs text-on-surface-variant uppercase tracking-wider pl-1">
          {t.activeDownload}
        </h3>
        {activeDownload ? (
          <div
            id="active-download-card"
            className="bg-surface-container-highest border border-outline-variant/30 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-4 relative overflow-hidden shadow-lg animate-[fadeIn_0.3s_ease]"
          >
            {/* Download percentage fill visual backdrop */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-secondary/5 z-0 transition-all duration-300"
              style={{ width: `${activeDownload.progress}%`, [isRtl ? 'right' : 'left']: 0 }}
            ></div>

            {/* Simulated art thumbnail */}
            <div className="w-24 h-16 bg-surface-dim rounded border border-outline-variant/30 flex-shrink-0 relative overflow-hidden z-10 block">
              <img
                alt="Active thumbnail"
                className="w-full h-full object-cover opacity-80"
                src={
                  activeDownload.thumbnailUrl ||
                  'https://lh3.googleusercontent.com/aida-public/AB6AXuC7xzgbTIbblwEno73Er_I-A18Ng545U8gL8IQnYJmSN4-AZsvsNxS5J9ByJhrPH9m8kViwUO2Bba8fWIzxwh4zoRLpFAnNBmT9SsT_Slwlq7UPab0LLz8agB_iCCymEguAzyGr68S1N0p03V13QHtXjtb6Ka582qsCyyLr9AF3tlMwow6Q0nr49spU48mfdIk32wgbAfTTJb8OJcoVRbwiT9x8pSY6nA0UNinZrOBegjwbVd2km8A7eMSdxQ8FJvWmkTsJisGuAGQ'
                }
              />
              <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] text-white font-mono font-semibold">
                {Math.floor(activeDownload.duration / 60)}:
                {(activeDownload.duration % 60).toString().padStart(2, '0')}
              </div>
            </div>

            {/* Title metadata progress meter */}
            <div className="flex-1 flex flex-col gap-1 z-10 min-w-0">
              <div className="flex justify-between items-start">
                <div className="min-w-0 pr-4">
                  <h4 className="font-body-lg text-sm text-on-surface font-bold truncate">
                    {activeDownload.title}
                  </h4>
                  {activeDownload.genre && (
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                      <span className="truncate">{activeDownload.artist}</span>
                      <span className="opacity-30">•</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-dim border border-outline-variant/10 text-[10px] text-on-surface-variant/75 uppercase">
                        {activeDownload.genre}
                      </span>
                    </div>
                  )}
                </div>
                <span className="font-mono text-sm text-secondary-fixed-dim whitespace-nowrap font-bold">
                  {isFetchingWithoutProgress ? '...' : `${activeDownload.progress}%`}
                </span>
              </div>

              <div className="w-full h-2.5 bg-surface-dim rounded-full overflow-hidden border border-outline-variant/20 mt-1">
                <div
                  id="active-progress-bar-fill"
                  className={`h-full bg-secondary-fixed-dim rounded-full shadow-[0_0_8px_rgba(0,227,253,0.5)] ${
                    isFetchingWithoutProgress
                      ? 'w-1/3 animate-[active-progress-indeterminate_1.1s_ease-in-out_infinite]'
                      : 'transition-all duration-300'
                  }`}
                  style={
                    isFetchingWithoutProgress ? undefined : { width: `${activeDownload.progress}%` }
                  }
                ></div>
              </div>

              {/* Status codes sub bars */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-secondary-container/10 text-secondary border border-secondary-container/20 text-[10px] uppercase font-label-bold tracking-wider">
                    {activeDownload.status === 'fetching'
                      ? 'Fetching'
                      : activeDownload.status === 'converting'
                        ? settings.language === Language.HE
                          ? 'מקודד'
                          : settings.language === Language.RU
                            ? 'Конвертация'
                            : 'Converting'
                        : settings.language === Language.HE
                          ? 'מוריד'
                          : settings.language === Language.RU
                            ? 'Загрузка'
                            : 'Downloading'}
                  </span>
                  <span className="text-on-surface-variant font-medium">
                    {activeDownload.speed}
                  </span>
                </div>
                <span className="text-on-surface-variant font-medium">
                  {t.eta}: {activeDownload.eta}
                </span>
              </div>
            </div>

            {/* Cancel actions trigger button */}
            <div className="flex items-center z-10 pl-2 shrink-0 border-outline-variant/20 md:border-l border-t md:border-t-0 pt-3 md:pt-0">
              <button
                id="cancel-download-btn"
                onClick={() => onCancelDownload(activeDownload.id)}
                className="p-3 text-on-surface-variant hover:text-error transition-colors rounded-full hover:bg-surface-variant flex flex-col items-center justify-center gap-0.5 cursor-pointer"
                title={t.cancel}
              >
                <span className="material-icons-span text-xl">cancel</span>
                <span className="text-[9px] font-label-bold text-on-surface-variant uppercase tracking-wider">
                  {t.cancel}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-dashed border-outline-variant/20 rounded-xl p-8 text-center flex flex-col items-center justify-center bg-surface-container-low/30 text-on-surface-variant/40 select-none">
            <span className="material-icons-span text-3xl mb-1">downloading</span>
            <span className="text-xs font-label-bold uppercase tracking-widest">
              No Active Downloads
            </span>
          </div>
        )}
      </section>

      {/* Advanced Technical Logs Dropdown Dashboard widget */}
      <section className="mt-auto border-t border-outline-variant/20 pt-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <button
            id="toggle-advanced-logs-btn"
            onClick={() => setIsLogsOpen(!isLogsOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-variant text-on-surface-variant border border-outline-variant/20 transition-all cursor-pointer font-label-bold text-xs uppercase"
          >
            <span className="material-icons-span text-[16px]">terminal</span>
            {t.advancedLogs}
            <span className="material-icons-span text-sm pr-1">
              {isLogsOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isLogsOpen && (
            <button
              id="clear-logs-btn"
              onClick={onClearLogs}
              className="text-[10px] text-tertiary-fixed-dim hover:text-primary transition-colors uppercase font-bold"
            >
              {settings.language === Language.HE
                ? 'נקה לוג'
                : settings.language === Language.RU
                  ? 'Очиститьлог'
                  : 'Clear Log'}
            </button>
          )}
        </div>

        {isLogsOpen && (
          <div
            id="logs-container-panel"
            className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-3 font-mono text-[11px] h-36 overflow-y-auto flex flex-col gap-1 select-text"
          >
            {logs.length > 0 ? (
              [...logs].reverse().map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-on-surface-variant select-none opacity-40 shrink-0">
                    [{log.timestamp}]
                  </span>
                  <span
                    className={`font-bold shrink-0 ${
                      log.type === 'success'
                        ? 'text-secondary-fixed-dim'
                        : log.type === 'error'
                          ? 'text-error'
                          : log.type === 'warning'
                            ? 'text-primary'
                            : 'text-blue-400'
                    }`}
                  >
                    {log.type.toUpperCase()}:
                  </span>
                  <span className="text-on-background opacity-85">{log.message}</span>
                </div>
              ))
            ) : (
              <span className="text-on-surface-variant/30 text-center py-8">
                Logs are empty. Engine running perfectly...
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
