import { LibraryTrack } from '../../types';

interface LibraryTrackRowProps {
  key?: string;
  track: LibraryTrack;
  isPlaying: boolean;
  showInFolderLabel: string;
  deleteLabel: string;
  onPlayToggle: (track: LibraryTrack) => void;
  onShowInFolder: (track: LibraryTrack) => void;
  onDeleteTrack: (id: string) => void;
}

export default function LibraryTrackRow({
  track,
  isPlaying,
  showInFolderLabel,
  deleteLabel,
  onPlayToggle,
  onShowInFolder,
  onDeleteTrack,
}: LibraryTrackRowProps) {
  return (
    <div
      className={`group flex flex-col md:flex-row items-stretch md:items-center gap-4 p-3 bg-surface-container-low border hover:bg-surface-container border-surface-container-highest hover:border-surface-variant rounded-xl transition-all duration-200 ${
        isPlaying ? 'border-secondary shadow-[0_0_15px_rgba(0,227,253,0.1)] bg-surface-container/60' : ''
      }`}
    >
      <div
        id={`play-track-box-${track.id}`}
        onClick={() => onPlayToggle(track)}
        className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container-highest cursor-pointer flex-shrink-0 border border-outline-variant/10 shadow-md"
      >
        <img
          alt="Album frame"
          className={`w-full h-full object-cover transition-all duration-300 ${
            isPlaying ? 'scale-110 opacity-60 filter blur-[1px]' : 'opacity-80 group-hover:opacity-100'
          }`}
          src={track.thumbnailUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCTcAcXcHPqipsxaWMoWF3TIP6JBMj31jsnkvUzvoaRLtvri9zgrrgSW85M6fPCV9twwGzWUR3NKujjkcrMLY3-OxCf-p-hwH635yaSW-OtWTgHgq6UuSSGUJpDuwuDlllpIVx_KNULt7t2jO3mn0FLX_isajgebu-3uKBD0O3Qwik_G4G4dSvEgBA-nEOpqEn3hU8HTpGBAO3r4TyvVYWQTE3eEfMZbgImdqg0O4wu-tsn82MhnizQwTstidviok_NPqVF7gRgJWA'}
        />

        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-all ${
          isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          {isPlaying ? (
            <div className="flex items-end gap-1.5 h-6">
              <span className="w-1.5 bg-secondary rounded-full animate-[pulse_0.4s_infinite_alternate_ease-in-out]" />
              <span className="w-1.5 bg-secondary rounded-full animate-[pulse_0.6s_infinite_alternate_ease-in-out_0.2s] h-1.5" />
              <span className="w-1.5 bg-secondary rounded-full animate-[pulse_0.5s_infinite_alternate_ease-in-out_0.1s] h-3" />
              <span className="w-1.5 bg-secondary rounded-full animate-[pulse_0.7s_infinite_alternate_ease-in-out_0.3s] h-2" />
            </div>
          ) : (
            <span className="material-icons-span text-white text-3xl font-black">play_arrow</span>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0" onClick={() => onPlayToggle(track)}>
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

      <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-3 md:pt-0 border-t border-outline-variant/15 md:border-t-0">
        <div className="flex flex-col items-start md:items-end">
          <span className="font-label-bold text-[10px] text-secondary-fixed-dim bg-secondary-container/10 border border-secondary-container/20 px-2.5 py-0.5 rounded-md font-extrabold uppercase shrink-0">
            {track.bitrate === '320' ? '320kbps MP3' : track.bitrate === '256' ? '256kbps MP3' : '128kbps MP3'}
          </span>
          <span className="font-label-sm text-[10px] text-tertiary mt-1 font-semibold shrink-0">
            {track.size} • {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={`show-folder-btn-${track.id}`}
            onClick={() => onShowInFolder(track)}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-surface-container-highest text-secondary hover:bg-surface-container-high transition-all text-xs font-label-bold active:scale-95 cursor-pointer"
          >
            <span className="material-icons-span text-sm pr-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
            {showInFolderLabel}
          </button>

          <button
            id={`delete-track-btn-${track.id}`}
            onClick={() => onDeleteTrack(track.id)}
            className="text-tertiary-fixed-dim hover:text-error transition-all p-2 rounded-full hover:bg-surface-container-high active:scale-90 cursor-pointer"
            title={deleteLabel}
          >
            <span className="material-icons-span text-lg">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
