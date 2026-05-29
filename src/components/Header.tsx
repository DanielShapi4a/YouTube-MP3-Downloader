import React from 'react';
import { AppSettings, Language } from '../types';
import { translations } from '../i18n';

interface HeaderProps {
  settings: AppSettings;
  onUpdateLanguage: (lang: Language) => void;
  onOpenSettings: () => void;
  onHelp: () => void;
  onOpenFolder: () => void;
}

export default function Header({ settings, onUpdateLanguage, onOpenSettings, onHelp, onOpenFolder }: HeaderProps) {
  const t = translations[settings.language];
  const isRtl = settings.language === Language.HE;

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateLanguage(e.target.value as Language);
  };

  return (
    <header className="bg-surface/95 border-b border-outline-variant/30 sticky top-0 md:h-16 h-14 w-full flex justify-between items-center px-4 shrink-0 z-40 backdrop-blur-md">
      
      {/* Search Grounding or Simple Locale indicator */}
      <div className={`flex items-center gap-2 ${isRtl ? 'order-last' : ''}`}>
        <span className="material-icons-span text-on-surface-variant text-[20px]">language</span>
        <div className="relative flex items-center">
          <select 
            id="header-lang-select"
            className="bg-transparent border-none text-on-surface font-body-md text-xs focus:ring-0 cursor-pointer appearance-none pr-6 focus:outline-none"
            value={settings.language}
            onChange={handleLangChange}
          >
            <option value={Language.EN} className="bg-surface text-on-surface">English</option>
            <option value={Language.RU} className="bg-surface text-on-surface">Русский</option>
            <option value={Language.HE} className="bg-surface text-on-surface">עברית</option>
          </select>
          <span className="material-icons-span text-on-surface-variant text-[14px] pointer-events-none absolute right-0 top-1/2 -translate-y-1/2">expand_more</span>
        </div>
      </div>

      <div className="flex-1 md:block hidden"></div>

      {/* Trailing Icon Shortcuts */}
      <div className="flex items-center gap-2 text-on-surface-variant">
        {/* Help button shortcut */}
        <button 
          id="header-help-btn"
          onClick={onHelp}
          className="p-2.5 rounded-full hover:bg-surface-container-high hover:text-secondary text-on-surface transition-all active:scale-90 flex items-center justify-center cursor-pointer gap-2 border border-outline-variant/30 px-4" 
          title={t.help}
        >
          <span className="material-icons-span text-[20px]">help_outline</span>
          <span className="font-label-bold text-xs font-semibold select-none hidden sm:inline">{t.help || 'Help'}</span>
        </button>
      </div>

    </header>
  );
}
