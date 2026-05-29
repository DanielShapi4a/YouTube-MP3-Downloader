import { AppSettings, LibraryTrack, Playlist, Language, Quality } from '../types';

const MIDNIGHT_CITY_ART =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCTcAcXcHPqipsxaWMoWF3TIP6JBMj31jsnkvUzvoaRLtvri9zgrrgSW85M6fPCV9twwGzWUR3NKujjkcrMLY3-OxCf-p-hwH635yaSW-OtWTgHgq6UuSSGUJpDuwuDlllpIVx_KNULt7t2jO3mn0FLX_isajgebu-3uKBD0O3Qwik_G4G4dSvEgBA-nEOpqEn3hU8HTpGBAO3r4TyvVYWQTE3eEfMZbgImdqg0O4wu-tsn82MhnizQwTstidviok_NPqVF7gRgJWA';
const STROBE_ART =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBOg4r5tS9ilh4L8mvzP1tWx_Ve70etKmpZhUowHMXA7d-OFB92CRQWl-Ne-esW5bv8DM1pZhEvoydN4brvi92DAL8mNqHWtGBvxaRIPk16sSE0Huh-TXupf96dh3pVn73VuWa05bgotlPCtIAhQZL9bGaPQ0tI2lx3Il_5Hsv-2QbZTEy1PvFhkBJUQ2uoYCbLUveJK5N0m1J5UjVzzcStHkxAGtNe14DqKKo30ue5aDvILFgt6Sh02pBABjycRBR60RGyk2ybvLI';
const NIGHTCALL_ART =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAvFnRo-mWDJSbjYc6pX5pZ07aC8wT7bh0d8oOOn-xpOT-WEJlQ5pYStsJXdrglatwfDAZWHPeTe12Bip3jSOxh3NpB8EuzNRMImCe6XD6sJASKxK1bN03WBapmjCshiVLS1IV8Ce1TZM0_SllkYMLR9VbZLAyc4DvY0Ntv8ivNko8LdOnZBiv9jdYCjDh7Rv_9zxzLmpFcy3K3zCMoT6vZgMU-skEVe94ax9soVxkH_SZg0VGPo_AG4jw7bEvuUZrYw5bQI8-QdlM';
const DEFAULT_ART =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC7xzgbTIbblwEno73Er_I-A18Ng545U8gL8IQnYJmSN4-AZsvsNxS5J9ByJhrPH9m8kViwUO2Bba8fWIzxwh4zoRLpFAnNBmT9SsT_Slwlq7UPab0LLz8agB_iCCymEguAzyGr68S1N0p03V13QHtXjtb6Ka582qsCyyLr9AF3tlMwow6Q0nr49spU48mfdIk32wgbAfTTJb8OJcoVRbwiT9x8pSY6nA0UNinZrOBegjwbVd2km8A7eMSdxQ8FJvWmkTsJisGuAGQ';

export const ALBUM_ART = {
  default: DEFAULT_ART,
  midnightCity: MIDNIGHT_CITY_ART,
  strobe: STROBE_ART,
  nightcall: NIGHTCALL_ART,
};

export const DEFAULT_SETTINGS: AppSettings = {
  saveLocation: 'C:\\Users\\Admin\\Music\\CarTune',
  language: Language.EN,
  quality: Quality.KBPS_320,
  advancedLogging: true,
};

export function createInitialTracks(): LibraryTrack[] {
  const downloadedAt = new Date().toLocaleDateString();

  return [
    {
      id: 'track-1',
      title: 'Midnight City (Extended Mix)',
      artist: 'M83',
      album: "Hurry Up, We're Dreaming",
      duration: 243,
      bitrate: '320',
      size: '12.4 MB',
      thumbnailUrl: MIDNIGHT_CITY_ART,
      genre: 'Synthwave',
      downloadedAt,
    },
    {
      id: 'track-2',
      title: 'Strobe (Radio Edit)',
      artist: 'deadmau5',
      album: 'For Lack of a Better Name',
      duration: 384,
      bitrate: '320',
      size: '45.2 MB',
      thumbnailUrl: STROBE_ART,
      genre: 'Electronic',
      downloadedAt,
    },
    {
      id: 'track-3',
      title: 'Nightcall',
      artist: 'Kavinsky',
      album: 'Outrun',
      duration: 258,
      bitrate: '320',
      size: '10.1 MB',
      thumbnailUrl: NIGHTCALL_ART,
      genre: 'Retrowave',
      downloadedAt,
    },
  ];
}

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'playlist-1',
    name: 'Lo-Fi Study Beats 2026',
    url: 'youtube.com/playlist?list=PL_lofi_study_2026',
    totalTracks: 120,
    downloadedTracks: 45,
    status: 'processing',
    tracks: [
      { title: 'Dreaming Awake', artist: 'Lofi Girl', duration: 144 },
      { title: 'Midnight Coffee', artist: 'ChilledCow', duration: 152 },
      { title: 'Afternoon Breeze', artist: 'Focus Mind', duration: 180 },
    ],
  },
  {
    id: 'playlist-2',
    name: 'Synthwave Retrowave Mix',
    url: 'youtube.com/playlist?list=PL_retro_synth_mix',
    totalTracks: 42,
    downloadedTracks: 0,
    status: 'queued',
    tracks: [
      { title: 'Laser Highway', artist: 'Miami Nights 1984', duration: 252 },
      { title: 'Sunset Cruise', artist: 'The Midnight', duration: 212 },
    ],
  },
  {
    id: 'playlist-3',
    name: 'Tech Podcast Backlog',
    url: 'youtube.com/playlist?list=PL_tech_backlog',
    totalTracks: 15,
    downloadedTracks: 15,
    status: 'completed',
    tracks: [
      { title: 'Future of AI', artist: 'Tech Talk', duration: 1200 },
      { title: 'Web Dev in 2026', artist: 'Code Cast', duration: 1500 },
    ],
  },
];
