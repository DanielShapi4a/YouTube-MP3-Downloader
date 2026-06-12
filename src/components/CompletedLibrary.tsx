import { useState } from 'react';
import { translations } from '../i18n';
import { AppSettings, Language, LibraryTrack } from '../types';
import LibraryTrackRow from './library/LibraryTrackRow';
import { filterLibraryTracks, getTrackFilePath, getUniqueGenres } from '../utils/library';
import { useTrackPlayback } from '../hooks/useTrackPlayback';

interface CompletedLibraryProps {
  settings: AppSettings;
  tracks: LibraryTrack[];
  onDeleteTrack: (id: string) => void;
  onClearAllTracks: () => void;
  onRefreshLibrary: () => void;
  onAddLog: (type: 'info' | 'warning' | 'error' | 'success', msg: string) => void;
}

export default function CompletedLibrary({
  settings,
  tracks,
  onDeleteTrack,
  onClearAllTracks,
  onRefreshLibrary,
  onAddLog,
}: CompletedLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const { playingTrackId, toggleTrackPlayback } = useTrackPlayback(onAddLog);

  const t = translations[settings.language];
  const isRtl = settings.language === Language.HE;
  const uniqueGenres = getUniqueGenres(tracks);
  const filteredTracks = filterLibraryTracks(tracks, searchQuery, selectedGenre);

  const handleShowInFolder = async (track: LibraryTrack) => {
    const filePath = getTrackFilePath(track, settings.saveLocation);
    onAddLog(
      'info',
      `FileSystem wrapper triggered. Opening directory containing file: ${filePath}`,
    );

    if (window.carTune && track.filePath) {
      try {
        await window.carTune.shell.showItemInFolder(track.filePath);
      } catch (error: any) {
        onAddLog('error', `Show in Folder failed: ${error?.message || error}`);
      }
      return;
    }

    alert(
      settings.language === Language.EN
        ? `Browsing and highlighting track in explorer:\n\nFolder: ${settings.saveLocation}\nFile: ${track.artist} - ${track.title}.mp3`
        : settings.language === Language.RU
          ? `Перенаправление в Проводник:\n\nПапка: ${settings.saveLocation}\nФайл: ${track.artist} - ${track.title}.mp3`
          : `מנווט בתיקיית הקבצים ומסמן את השיר:\n\nתיקייה: ${settings.saveLocation}\nקובץ: ${track.artist} - ${track.title}.mp3`,
    );
  };

  return (
    <div className={`flex-1 flex flex-col gap-6 p-6 ${isRtl ? 'text-right' : 'text-left'}`}>
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-extrabold">
            {t.library}
          </h2>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">{t.libraryDesc}</p>
        </div>

        <div className="flex items-center gap-4 self-start md:self-auto shrink-0">
          <button
            id="refresh-library-btn"
            onClick={onRefreshLibrary}
            className="flex items-center gap-1.5 text-secondary hover:text-secondary-fixed font-label-bold text-xs font-bold px-3 py-1 border border-secondary/20 hover:border-secondary/50 hover:bg-secondary/5 rounded transition-colors cursor-pointer"
          >
            <span className="material-icons-span text-sm">refresh</span>
            {t.refreshLibrary}
          </button>
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

      <section className="flex flex-col sm:flex-row gap-3 bg-surface-container-low border border-outline-variant/25 rounded-xl p-4 shrink-0">
        <div className="flex-1 flex items-center bg-surface-dim border border-outline-variant/30 rounded-lg px-3 py-2 focus-within:border-secondary transition-all">
          <span className="material-icons-span text-on-surface-variant text-lg">search</span>
          <input
            id="track-search-box"
            className="w-full bg-transparent border-none outline-none font-body-md text-sm text-on-surface placeholder-on-surface-variant/40 ml-2 focus:ring-0"
            placeholder={t.searchPlaceholder}
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-icons-span text-sm">cancel</span>
            </button>
          )}
        </div>

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

      <section className="flex-1 overflow-y-auto pr-1">
        {filteredTracks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {filteredTracks.map((track) => (
              <LibraryTrackRow
                key={track.id}
                track={track}
                isPlaying={playingTrackId === track.id}
                showInFolderLabel={t.showInFolder}
                deleteLabel={t.deleteFile}
                onPlayToggle={toggleTrackPlayback}
                onShowInFolder={handleShowInFolder}
                onDeleteTrack={onDeleteTrack}
              />
            ))}
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-outline-variant/30 rounded-xl bg-surface-container-low/35 text-center px-6">
            <span className="material-icons-span text-4xl mb-3 text-on-surface-variant/40 animate-pulse">
              check_circle
            </span>
            <p className="font-body-md text-sm text-on-surface-variant max-w-sm leading-relaxed">
              {t.noTracks}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
