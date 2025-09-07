"use client";

export function VideoPlayer({ src, poster, className = "" }: { src: string; poster?: string; className?: string }) {
  const isIframe = /mediadelivery\.net|youtube\.com|youtu\.be|vimeo\.com/i.test(src);
  const cls = `w-full h-full ${className}`.trim();
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
    <video src={src} controls playsInline poster={poster} className={cls} />
  );
}

