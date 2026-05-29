import { Language, AppSettings } from '../types';
import { translations } from '../i18n';

interface SidebarProps {
  activeTab: 'downloads' | 'completed' | 'playlists';
  settings: AppSettings;
  onChangeTab: (tab: 'downloads' | 'completed' | 'playlists') => void;
  onOpenSettings: () => void;
}

export default function Sidebar({
  activeTab,
  settings,
  onChangeTab,
  onOpenSettings,
}: SidebarProps) {
  const t = translations[settings.language];
  const isRtl = settings.language === Language.HE;

  return (
    <nav
      className={`bg-surface-container-low border-surface-container-highest flex-shrink-0 flex flex-col p-4 w-64 h-full border-r ${isRtl ? 'order-last border-l border-r-0' : 'border-r'}`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-10 mt-2 px-2 shrink-0">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-container to-error flex items-center justify-center shadow-lg">
          <span
            className="material-icons-span text-on-primary-container text-xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            graphic_eq
          </span>
        </div>
        <div>
          <h1 className="font-headline-md text-[20px] font-black text-primary leading-none">
            {t.appTitle}
          </h1>
          <span className="text-[11px] text-on-surface-variant leading-none">{t.version}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <ul className="flex flex-col gap-2 flex-1">
        {/* Tab 1: Downloads */}
        <li>
          <button
            id="nav-downloads-tab"
            onClick={() => onChangeTab('downloads')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'downloads'
                ? 'bg-secondary-container text-on-secondary-container font-black shadow-md'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span
              className={`material-icons-span text-[22px] ${activeTab === 'downloads' ? 'icon-fill' : ''}`}
              style={{ fontVariationSettings: activeTab === 'downloads' ? "'FILL' 1" : undefined }}
            >
              download
            </span>
            <span className="font-label-bold text-label-bold text-sm tracking-wider">
              {t.navDownloads}
            </span>
          </button>
        </li>

        {/* Tab 2: Completed */}
        <li>
          <button
            id="nav-completed-tab"
            onClick={() => onChangeTab('completed')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-secondary-container text-on-secondary-container font-black shadow-md'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span
              className={`material-icons-span text-[22px] ${activeTab === 'completed' ? 'icon-fill' : ''}`}
              style={{ fontVariationSettings: activeTab === 'completed' ? "'FILL' 1" : undefined }}
            >
              check_circle
            </span>
            <span className="font-label-bold text-label-bold text-sm tracking-wider">
              {t.navCompleted}
            </span>
          </button>
        </li>

        {/* Tab 3: Playlists */}
        <li>
          <button
            id="nav-playlists-tab"
            onClick={() => onChangeTab('playlists')}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'playlists'
                ? 'bg-secondary-container text-on-secondary-container font-black shadow-md'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span
              className={`material-icons-span text-[22px] ${activeTab === 'playlists' ? 'icon-fill' : ''}`}
              style={{ fontVariationSettings: activeTab === 'playlists' ? "'FILL' 1" : undefined }}
            >
              playlist_play
            </span>
            <span className="font-label-bold text-label-bold text-sm tracking-wider">
              {t.navPlaylists}
            </span>
          </button>
        </li>

        {/* Action: Open Settings */}
        <li>
          <button
            id="nav-settings-btn"
            onClick={onOpenSettings}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 text-on-surface-variant hover:bg-surface-container-high cursor-pointer"
          >
            <span className="material-icons-span text-[22px]">settings</span>
            <span className="font-label-bold text-label-bold text-sm tracking-wider">
              {t.navSettings}
            </span>
          </button>
        </li>
      </ul>

      {/* Footer segment */}
      <div className="mt-auto pt-4 border-t border-surface-container-highest shrink-0 select-none text-center">
        <span className="text-[10px] text-on-surface-variant/40">Version 2.4.0</span>
      </div>
    </nav>
  );
}
