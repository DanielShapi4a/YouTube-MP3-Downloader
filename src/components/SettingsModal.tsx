import React from 'react';
import { translations } from '../i18n';
import { AppSettings, Language, Quality } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  onClose: () => void;
  onSave: (newSettings: AppSettings) => void;
}

export default function SettingsModal({ isOpen, settings, onClose, onSave }: SettingsModalProps) {
  if (!isOpen) return null;

  const t = translations[settings.language];

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSave({ ...settings, language: e.target.value as Language });
  };

  const handleQualityChange = (val: Quality) => {
    onSave({ ...settings, quality: val });
  };

  const handleLoggingToggle = () => {
    onSave({ ...settings, advancedLogging: !settings.advancedLogging });
  };

  const handleBrowseLocation = () => {
    // Simulated folder selection
    const mockDirectories = [
      "C:\\Users\\Admin\\Music\\CarTune",
      "D:\\MyCarUSB\\Music\\SummerMix",
      "F:\\USB_TRANSIT\\MP3_Library",
      "/Volumes/USB_DRIVE/CarTunes"
    ];
    const randomIndex = Math.floor(Math.random() * mockDirectories.length);
    onSave({ ...settings, saveLocation: mockDirectories[randomIndex] });
  };

  return (
    <div id="settings-modal" className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-surface-dim border border-outline-variant/40 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-container-high bg-surface">
          <div className="flex items-center gap-3">
            <span className="material-icons-span text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
            <h2 className="font-headline-md text-headline-md font-bold text-on-surface">{t.settings}</h2>
          </div>
          <button 
            id="close-settings-btn"
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95 cursor-pointer"
          >
            <span className="material-icons-span">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          
          {/* General Section */}
          <section className="space-y-4">
            <h3 className="font-label-bold text-label-bold text-secondary uppercase tracking-wider mb-1">
              {settings.language === Language.EN ? "General Settings" : settings.language === Language.RU ? "Общие настройки" : "הגדרות כלליות"}
            </h3>

            {/* Save Location */}
            <div className="flex flex-col gap-2">
              <label className="font-body-md text-body-md text-on-surface-variant">{t.saveLocationLabel}</label>
              <div className="flex gap-3">
                <input 
                  id="save-location-input"
                  className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none font-mono cursor-default overflow-hidden truncate"
                  readOnly 
                  type="text" 
                  value={settings.saveLocation} 
                />
                <button 
                  id="browse-folder-btn"
                  onClick={handleBrowseLocation}
                  className="px-4 py-3 bg-surface-container-highest border border-surface-container-high rounded-lg text-secondary font-label-bold text-label-bold hover:border-secondary hover:bg-surface-bright transition-all active:scale-95 flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span className="material-icons-span text-[18px]">folder_open</span>
                  {t.browse}
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="flex flex-col gap-2 pt-2">
              <label className="font-body-md text-body-md text-on-surface-variant">{t.langSelection}</label>
              <div className="relative">
                <select 
                  id="language-select"
                  className="w-full appearance-none bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 pr-10 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors cursor-pointer"
                  value={settings.language}
                  onChange={handleLanguageChange}
                >
                  <option value={Language.EN}>English (US)</option>
                  <option value={Language.RU}>Русский (Russian)</option>
                  <option value={Language.HE}>עברית (Hebrew)</option>
                </select>
                <span className="material-icons-span absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
            </div>
          </section>

          {/* Encoding Quality Section */}
          <section className="space-y-4 pt-3 border-t border-surface-container-high">
            <h3 className="font-label-bold text-label-bold text-secondary uppercase tracking-wider mb-1">{t.encodingQuality}</h3>
            <p className="text-sm text-on-surface-variant">{t.qualityDesc}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* 128 kbps */}
              <label 
                id="quality-128-card"
                className={`relative cursor-pointer flex flex-col p-4 rounded-lg border transition-all ${
                  settings.quality === Quality.KBPS_128 
                    ? 'border-primary bg-surface-container' 
                    : 'border-outline-variant bg-surface-container-low hover:border-surface-container-highest'
                }`}
                onClick={() => handleQualityChange(Quality.KBPS_128)}
              >
                <span className="font-body-lg text-body-lg text-on-surface font-semibold">{t.q128Label}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">{t.q128Desc}</span>
                {settings.quality === Quality.KBPS_128 && (
                  <div className="absolute top-3 right-3 text-primary">
                    <span className="material-icons-span text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                )}
              </label>

              {/* 256 kbps */}
              <label 
                id="quality-256-card"
                className={`relative cursor-pointer flex flex-col p-4 rounded-lg border transition-all ${
                  settings.quality === Quality.KBPS_256 
                    ? 'border-primary bg-surface-container' 
                    : 'border-outline-variant bg-surface-container-low hover:border-surface-container-highest'
                }`}
                onClick={() => handleQualityChange(Quality.KBPS_256)}
              >
                <span className="font-body-lg text-body-lg text-on-surface font-semibold">{t.q256Label}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">{t.q256Desc}</span>
                {settings.quality === Quality.KBPS_256 && (
                  <div className="absolute top-3 right-3 text-primary">
                    <span className="material-icons-span text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                )}
              </label>

              {/* 320 kbps */}
              <label 
                id="quality-320-card"
                className={`relative cursor-pointer flex flex-col p-4 rounded-lg border transition-all ${
                  settings.quality === Quality.KBPS_320 
                    ? 'border-primary bg-surface-container' 
                    : 'border-outline-variant bg-surface-container-low hover:border-surface-container-highest'
                }`}
                onClick={() => handleQualityChange(Quality.KBPS_320)}
              >
                <span className="font-body-lg text-body-lg text-on-surface font-semibold">{t.q320Label}</span>
                <span className="font-label-sm text-label-sm text-primary mt-1">{t.q320Desc}</span>
                {settings.quality === Quality.KBPS_320 && (
                  <div className="absolute top-3 right-3 text-primary">
                    <span className="material-icons-span text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  </div>
                )}
              </label>
            </div>
          </section>

          {/* Advanced Logging Section */}
          <section className="space-y-4 pt-4 border-t border-surface-container-high">
            <div 
              id="advanced-logging-toggle"
              onClick={handleLoggingToggle}
              className="flex items-center justify-between cursor-pointer group p-3 -mx-3 rounded-lg hover:bg-surface-container-low transition-colors"
            >
              <div className="flex flex-col pr-4">
                <span className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors">{t.enableLogging}</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">{t.loggingDesc}</span>
              </div>
              <div className="relative inline-flex items-center shrink-0">
                <div className={`w-11 h-6 rounded-full transition-colors relative ${settings.advancedLogging ? 'bg-primary-container' : 'bg-surface-container-highest'}`}>
                  <div className={`absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-tertiary transition-transform ${settings.advancedLogging ? 'translate-x-5 !bg-on-primary-container' : ''}`} />
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-surface-container-high bg-surface-container-low flex justify-end gap-3 shrink-0">
          <button 
            id="cancel-settings-btn"
            onClick={onClose}
            className="px-6 py-2 rounded-lg text-on-surface-variant font-label-bold text-label-bold hover:text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95 cursor-pointer whitespace-nowrap"
          >
            {settings.language === Language.HE ? "ביטול" : settings.language === Language.RU ? "Отмена" : "Cancel"}
          </button>
          
          <button 
            id="save-settings-btn"
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-primary-container text-on-primary-container font-label-bold text-label-bold bg-gradient-to-b from-primary-container to-[#d43d2b] shadow-[0_4px_14px_rgba(255,85,64,0.3)] border-t border-[#ff8b7a] hover:brightness-110 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            {t.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
}
