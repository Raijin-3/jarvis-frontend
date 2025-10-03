"use client";

import { useCallback, useRef, useState } from "react";

interface VideoState {
  currentTime: number;
  isPlaying: boolean;
  duration: number;
}

export function useVideoState() {
  const [videoState, setVideoState] = useState<VideoState>({
    currentTime: 0,
    isPlaying: false,
    duration: 0,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const updateCurrentTime = useCallback((time: number) => {
    setVideoState(prev => ({ ...prev, currentTime: time }));
  }, []);

  const updatePlayState = useCallback((playing: boolean) => {
    setVideoState(prev => ({ ...prev, isPlaying: playing }));
  }, []);

  const updateDuration = useCallback((duration: number) => {
    setVideoState(prev => ({ ...prev, duration }));
  }, []);

  const setVideoRef = useCallback((ref: HTMLVideoElement | null) => {
    videoRef.current = ref;
  }, []);

  const syncVideoTime = useCallback((targetTime: number) => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - targetTime) > 1) {
      videoRef.current.currentTime = targetTime;
    }
  }, []);

  const syncPlayState = useCallback((shouldPlay: boolean) => {
    if (!videoRef.current) return;

    if (shouldPlay && videoRef.current.paused) {
      videoRef.current.play().catch(console.error);
    } else if (!shouldPlay && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, []);

  return {
    videoState,
    updateCurrentTime,
    updatePlayState,
    updateDuration,
    setVideoRef,
    syncVideoTime,
    syncPlayState,
  };
}