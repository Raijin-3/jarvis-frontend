"use client";

import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  onTimeUpdate?: (time: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
  onDurationChange?: (duration: number) => void;
  onVideoRef?: (ref: HTMLVideoElement | null) => void;
  currentTime?: number;
  shouldPlay?: boolean;
}

export function VideoPlayer({ 
  src, 
  poster, 
  className = "",
  onTimeUpdate,
  onPlayStateChange,
  onDurationChange,
  onVideoRef,
  currentTime,
  shouldPlay
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isIframe = /mediadelivery\.net|youtube\.com|youtu\.be|vimeo\.com/i.test(src);
  const cls = `w-full h-full ${className}`.trim();

  // Set up video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isIframe) return;

    const handleTimeUpdate = () => {
      onTimeUpdate?.(video.currentTime);
    };

    const handlePlay = () => {
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      onPlayStateChange?.(false);
    };

    const handleLoadedMetadata = () => {
      onDurationChange?.(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onTimeUpdate, onPlayStateChange, onDurationChange, isIframe]);

  // Provide video ref to parent
  useEffect(() => {
    onVideoRef?.(videoRef.current);
  }, [onVideoRef]);

  // Sync external state changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isIframe) return;

    if (typeof currentTime === 'number' && Math.abs(video.currentTime - currentTime) > 1) {
      video.currentTime = currentTime;
    }
  }, [currentTime, isIframe]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isIframe || typeof shouldPlay !== 'boolean') return;

    if (shouldPlay && video.paused) {
      video.play().catch(console.error);
    } else if (!shouldPlay && !video.paused) {
      video.pause();
    }
  }, [shouldPlay, isIframe]);

  if (isIframe) {
    return (
      <iframe
        src={src}
        className={cls}
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video 
      ref={videoRef}
      src={src} 
      controls 
      playsInline 
      poster={poster} 
      className={cls} 
    />
  );
}

