import { useState, useEffect, useRef } from 'react';

interface AudioPlayerState {
  playing: boolean;
  currentTime: number;
  duration: number;
  loading: boolean;
  error: string | null;
}

export function useAudioPlayer(audioUrl: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<AudioPlayerState>({
    playing: false,
    currentTime: 0,
    duration: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Create audio element
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    // Event listeners
    const handleLoadedMetadata = () => {
      setState((prev) => ({
        ...prev,
        duration: audio.duration,
        loading: false,
      }));
    };

    const handleTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        currentTime: audio.currentTime,
      }));
    };

    const handleEnded = () => {
      setState((prev) => ({
        ...prev,
        playing: false,
        currentTime: 0,
      }));
    };

    const handleError = () => {
      setState((prev) => ({
        ...prev,
        error: 'Failed to load audio',
        loading: false,
      }));
    };

    const handleCanPlay = () => {
      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Preload metadata
    audio.preload = 'metadata';

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const play = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setState((prev) => ({ ...prev, playing: true }));
      } catch (error) {
        console.error('Error playing audio:', error);
        setState((prev) => ({ ...prev, error: 'Failed to play audio' }));
      }
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState((prev) => ({ ...prev, playing: false }));
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState((prev) => ({ ...prev, currentTime: time }));
    }
  };

  const togglePlay = () => {
    if (state.playing) {
      pause();
    } else {
      play();
    }
  };

  return {
    ...state,
    play,
    pause,
    seek,
    togglePlay,
  };
}
