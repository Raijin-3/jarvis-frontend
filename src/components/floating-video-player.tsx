"use client";

import { useEffect, useRef, useState } from "react";
import { X, Maximize2, Play, Pause } from "lucide-react";

interface FloatingVideoPlayerProps {
  src: string;
  title?: string;
  currentTime?: number;
  isPlaying?: boolean;
  onClose: () => void;
  onExpand: () => void;
  onTimeUpdate?: (time: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
}

export function FloatingVideoPlayer({
  src,
  title,
  currentTime = 0,
  isPlaying = false,
  onClose,
  onExpand,
  onTimeUpdate,
  onPlayStateChange,
}: FloatingVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [localIsPlaying, setLocalIsPlaying] = useState(isPlaying);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  const isIframe = /mediadelivery\.net|youtube\.com|youtu\.be|vimeo\.com/i.test(src);

  // Sync playback state
  useEffect(() => {
    if (videoRef.current && !isIframe) {
      const video = videoRef.current;
      
      // Set current time
      if (Math.abs(video.currentTime - currentTime) > 1) {
        video.currentTime = currentTime;
      }
      
      // Set play state
      if (isPlaying && video.paused) {
        video.play().catch(console.error);
      } else if (!isPlaying && !video.paused) {
        video.pause();
      }
    }
  }, [currentTime, isPlaying, isIframe]);

  // Handle video events
  useEffect(() => {
    if (!videoRef.current || isIframe) return;

    const video = videoRef.current;

    const handleTimeUpdate = () => {
      onTimeUpdate?.(video.currentTime);
    };

    const handlePlay = () => {
      setLocalIsPlaying(true);
      onPlayStateChange?.(true);
    };

    const handlePause = () => {
      setLocalIsPlaying(false);
      onPlayStateChange?.(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [onTimeUpdate, onPlayStateChange, isIframe]);

  const handlePlayPause = () => {
    if (!videoRef.current || isIframe) return;
    
    if (localIsPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosX: position.x,
        startPosY: position.y,
      };
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    const newX = Math.max(0, Math.min(window.innerWidth - 320, dragRef.current.startPosX + deltaX));
    const newY = Math.max(0, Math.min(window.innerHeight - 200, dragRef.current.startPosY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // Position floating player in bottom-right corner initially
  useEffect(() => {
    const updatePosition = () => {
      setPosition({
        x: Math.max(20, window.innerWidth - 340),
        y: Math.max(20, window.innerHeight - 220),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  return (
    <div
      className="fixed z-50 bg-black rounded-lg shadow-2xl border border-gray-700 overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '320px',
        height: '180px',
      }}
    >
      {/* Header */}
      <div
        className="bg-gray-900 px-3 py-2 flex items-center justify-between cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-medium truncate">
            {title || "Video Player"}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onExpand}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Expand to main view"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Close floating player"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Video Content */}
      <div className="relative h-full bg-black">
        {isIframe ? (
          <iframe
            ref={iframeRef}
            src={src}
            className="w-full h-full"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-cover"
            playsInline
            onDoubleClick={onExpand}
          />
        )}

        {/* Controls overlay for regular video */}
        {!isIframe && (
          <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={handlePlayPause}
              className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              {localIsPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}