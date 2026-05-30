import { useEffect, useRef, useState } from 'react';
import { LibraryTrack, LogEntry } from '../types';
import { getErrorMessage } from '../utils/errors';

type AddLog = (type: LogEntry['type'], message: string) => void;

export function useTrackPlayback(onAddLog: AddLog) {
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPlayback = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingTrackId(null);
  };

  useEffect(() => {
    return stopPlayback;
  }, []);

  const toggleTrackPlayback = (track: LibraryTrack) => {
    if (playingTrackId === track.id) {
      stopPlayback();
      onAddLog('info', `Stopped playback of ${track.title}`);
      return;
    }

    stopPlayback();

    if (!track.filePath || !window.carTune) {
      onAddLog('warning', `Playback requires a downloaded local MP3 file for "${track.title}".`);
      return;
    }

    const audio = new Audio(window.carTune.media.getUrl(track.filePath));
    audioRef.current = audio;
    audio.currentTime = 0;
    audio.volume = 0.85;
    audio.onended = () => setPlayingTrackId(null);
    audio.onerror = () => {
      setPlayingTrackId(null);
      onAddLog('error', `Unable to play local file: ${track.filePath}`);
    };
    audio.play().catch((error: unknown) => {
      setPlayingTrackId(null);
      onAddLog('error', `Playback failed: ${getErrorMessage(error)}`);
    });

    setPlayingTrackId(track.id);
    onAddLog('info', `Starting playback sample for "${track.title}".`);
    onAddLog('success', `Playing local MP3 file for "${track.title}" by ${track.artist}`);
  };

  return {
    playingTrackId,
    stopPlayback,
    toggleTrackPlayback,
  };
}
