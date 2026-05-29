import React from 'react';
import { Language } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
}

const helpTranslations = {
  [Language.EN]: {
    title: 'How to Use CarTune MP3',
    tagline: 'Your ultimate offline companion for high-quality music on the road.',
    step1Title: '1. Find & Copy Your Music',
    step1Desc:
      'Go to YouTube and copy the link of any music video, song, or full-album playlist you want to listen to in your vehicle.',
    step2Title: '2. Paste the Link',
    step2Desc:
      "Use the 'Paste' button inside CarTune or press Ctrl+V to paste the link into the URL input field. Choose Single Song or Playlist mode.",
    step3Title: '3. Download & Compile MP3s',
    step3Desc:
      "Click 'Download MP3'. CarTune connects, extracts audio feeds, and synthesizes high-fidelity tagging. Adjust bitrate (128/256/320kbps) in Settings.",
    step4Title: '4. Load to Car USB',
    step4Desc:
      "Once completed, go to the 'Completed' library. Click 'Show in Folder' to view your MP3 files. Copy them directly onto your car USB drive!",
    usbTipTitle: '🚗 USB Car Stereo Pro-Tips',
    usbTip1:
      'Format your USB flash drive to FAT32 or exFAT file systems (standard format for car stereos).',
    usbTip2:
      'Place files inside root directory or custom folders. Most dashboard head units sort alphabetically.',
    usbTip3:
      'CarTune converts to high-compatibility standard tags, ensuring artist names & cover arts show cleanly on your vehicle screen.',
    closeBtn: "Got it, let's ride!",
  },
  [Language.RU]: {
    title: 'Руководство CarTune MP3',
    tagline: 'Ваш идеальный офлайн-компаньон для качественной музыки в дороге.',
    step1Title: '1. Скопируйте ссылку',
    step1Desc:
      'Перейдите на YouTube и скопируйте URL-адрес любого музыкального видео, песни или плейлиста, которые хотите слушать в машине.',
    step2Title: '2. Вставьте ссылку',
    step2Desc:
      'Нажмите кнопку «Вставить» или воспользуйтесь сочетанием клавиш Ctrl+V. Выберите режим: Одна песня или Плейлист.',
    step3Title: '3. Скачайте и Конвертируйте',
    step3Desc:
      'Нажмите «Скачать MP3». CarTune извлечет аудиопоток и преобразует его в нужный битрейт (128/256/320 кбит/с), настраиваемый во вкладке Настройки.',
    step4Title: '4. Скопируйте на флешку',
    step4Desc:
      'В разделе «Завершено» нажмите «Показать в папке». Скопируйте готовые аудиофайлы прямо на флеш-накопитель USB вашего авто!',
    usbTipTitle: '🚗 Советы по USB для автомагнитол',
    usbTip1:
      'Форматируйте вашу USB-флешку в файловую систему FAT32 или exFAT (наиболее поддерживаемые типы).',
    usbTip2:
      'Размещайте файлы в корне флешки или по каталогам. Автомобильные аудиосистемы обычно сортируют треки по алфавиту.',
    usbTip3:
      'CarTune записывает стандартные теги ID3, поэтому обложки и имена артистов будут корректно отображаться на экране приборной панели.',
    closeBtn: 'Поехали!',
  },
  [Language.HE]: {
    title: 'מדריך לשימוש ב-CarTune MP3',
    tagline: 'השותף המושלם שלך למוזיקה איכותית ונטולת אינטרנט בנסיעות שלך.',
    step1Title: '1. העתק קישור מיוטיוב',
    step1Desc:
      'כנס ליוטיוב והעתק את הכתובת (URL) של שיר, קליפ או פלייליסט שלם שתרצה לשמוע במערכת השמע של הרכב שלך.',
    step2Title: '2. הדבק את הקישור ברשת',
    step2Desc:
      "הקש על כפתור 'הדבק' או השתמש בקיצור המקשים Ctrl+V כדי למלא את שדה הכתובת. בחר בין מצב שיר בודד לפלייליסט.",
    step3Title: '3. הורד והמר ל-MP3',
    step3Desc:
      "לחץ על 'הורד קובץ MP3'. המערכת תתחבר, תחלץ את השמע ותבצע המרה מתקדמת. ניתן לשנות את איכות השמע (128/256/320kbps) בהגדרות.",
    step4Title: '4. העבר לדיסק און קי לרכב',
    step4Desc:
      "בסיום ההורדה, כנס ללשונית 'הושלמו' ולחץ על 'הצג בתיקייה'. העתק את קבצי ה-MP3 שנוצרו ישירות אל הדיסק און קי שלך!",
    usbTipTitle: '🚗 טיפים חשובים למערכת השמע ברכב',
    usbTip1:
      'פרמט את כונן ה-USB (דיסק און קי) במערכת הקבצים FAT32 או exFAT (תבניות סטנדרטיות הנתמכות בכל הרכבים).',
    usbTip2:
      "מקם את קבצי המוזיקה בתיקייה ראשית או בתיקיות מסודרות. רוב מערכות הרכב מציגות וממיינות לפי סדר א'-ב'.",
    usbTip3:
      'המערכת מייצרת תגיות שמע תואמות ומתקדמות, המבטיחות ששם האמן ותמונת האלבום יוצגו בבירור על גבי מסך הרכב שלכם.',
    closeBtn: 'הבנתי, בוא נצא לדרך!',
  },
};

export default function HelpModal({ isOpen, language, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  const h = helpTranslations[language] || helpTranslations[Language.EN];
  const isRtl = language === Language.HE;

  return (
    <div
      id="help-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
    >
      <div
        className="w-full max-w-2xl bg-surface-container-low border border-outline-variant/40 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden max-h-[85vh] text-on-surface"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-container-high bg-surface-dim shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="material-icons-span text-primary text-2.5xl animate-pulse"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              help_center
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-on-surface tracking-tight leading-none">
                {h.title}
              </h2>
              <span className="text-[11px] text-on-surface-variant mt-1.5 block opacity-85 leading-normal">
                {h.tagline}
              </span>
            </div>
          </div>
          <button
            id="close-help-top-btn"
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors active:scale-95 cursor-pointer"
          >
            <span className="material-icons-span">close</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto font-sans leading-relaxed">
          {/* Grid Layout of steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Step 1 */}
            <div className="p-4 bg-surface rounded-xl border border-outline-variant/10 space-y-2">
              <h4 className="font-bold text-accent text-sm text-secondary tracking-wide uppercase">
                {h.step1Title}
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">{h.step1Desc}</p>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-surface rounded-xl border border-outline-variant/10 space-y-2">
              <h4 className="font-bold text-accent text-sm text-secondary tracking-wide uppercase">
                {h.step2Title}
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">{h.step2Desc}</p>
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-surface rounded-xl border border-outline-variant/10 space-y-2">
              <h4 className="font-bold text-accent text-sm text-secondary tracking-wide uppercase">
                {h.step3Title}
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">{h.step3Desc}</p>
            </div>

            {/* Step 4 */}
            <div className="p-4 bg-surface rounded-xl border border-outline-variant/10 space-y-2">
              <h4 className="font-bold text-accent text-sm text-secondary tracking-wide uppercase">
                {h.step4Title}
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">{h.step4Desc}</p>
            </div>
          </div>

          {/* USB Dashboard Integration Pro Tips Segment */}
          <div className="p-5 bg-surface-container-highest/60 border border-secondary/20 rounded-xl space-y-3">
            <h3 className="font-bold text-md text-secondary flex items-center gap-2">
              <span className="material-icons-span text-lg text-secondary">alt_route</span>
              {h.usbTipTitle}
            </h3>

            <ul className="space-y-2 text-xs text-on-surface-variant list-none pl-0">
              <li className="flex items-start gap-2.5">
                <span className="material-icons-span text-secondary text-sm shrink-0 select-none mt-0.5">
                  check
                </span>
                <span>{h.usbTip1}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-icons-span text-secondary text-sm shrink-0 select-none mt-0.5">
                  check
                </span>
                <span>{h.usbTip2}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="material-icons-span text-secondary text-sm shrink-0 select-none mt-0.5">
                  check
                </span>
                <span>{h.usbTip3}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-surface-container-high bg-surface-dim flex justify-end shrink-0">
          <button
            id="close-help-bottom-btn"
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3 rounded-lg bg-primary-container text-on-primary-container font-bold text-xs uppercase bg-gradient-to-b from-primary-container to-[#d43d2b] shadow-[0_4px_14px_rgba(255,85,64,0.3)] border-t border-[#ff8b7a] hover:brightness-110 transition-all active:scale-95 cursor-pointer text-center"
          >
            {h.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
