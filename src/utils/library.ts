import type { LibraryTrack } from '../types';

export const ALL_GENRES = 'All';

export function getTrackFilePath(track: LibraryTrack, saveLocation: string) {
  if (track.filePath) return track.filePath;

  const isWindowsPath = saveLocation.includes('\\') || /^[a-z]:/i.test(saveLocation);
  const delimiter = isWindowsPath ? '\\' : '/';
  return `${saveLocation}${delimiter}${track.artist} - ${track.title}.mp3`;
}

export function getUniqueGenres(tracks: LibraryTrack[]) {
  return [ALL_GENRES, ...Array.from(new Set(tracks.map((track) => track.genre)))];
}

export function filterLibraryTracks(tracks: LibraryTrack[], searchQuery: string, selectedGenre: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return tracks.filter((track) => {
    const matchesSearch =
      !normalizedQuery ||
      track.title.toLowerCase().includes(normalizedQuery) ||
      track.artist.toLowerCase().includes(normalizedQuery) ||
      track.genre.toLowerCase().includes(normalizedQuery);

    const matchesGenre = selectedGenre === ALL_GENRES || track.genre === selectedGenre;

    return matchesSearch && matchesGenre;
  });
}
