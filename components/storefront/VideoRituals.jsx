"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/Icon";

function VideoCard({ video, isCenter, isMobile, onClick }) {
  const videoRef = useRef(null);
  const [hovering, setHovering] = useState(false);

  function handleMouseEnter() {
    setHovering(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }

  function handleMouseLeave() {
    setHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  const sizeClass = isMobile
    ? "w-[240px] h-[400px]"
    : isCenter
      ? "w-[280px] sm:w-[300px] h-[440px] sm:h-[480px] z-20 shadow-2xl ring-2 ring-antique-gold/40"
      : "w-[240px] sm:w-[260px] h-[380px] sm:h-[420px] z-10 opacity-70 scale-95";

  return (
    <button
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex-shrink-0 rounded-2xl overflow-hidden transition-all duration-500 ease-out cursor-pointer group ${sizeClass}`}
    >
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovering ? "opacity-0" : "opacity-100"}`}
          loading="lazy"
        />
      ) : !hovering ? (
        <div className="absolute inset-0 bg-gradient-to-b from-forest-base to-forest-deep flex items-center justify-center">
          <Icon name="videocam" size={48} className="text-white/40" />
        </div>
      ) : null}

      <video
        ref={videoRef}
        src={video.videoUrl}
        muted
        loop
        playsInline
        preload="none"
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${hovering ? "opacity-100" : "opacity-0"}`}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${hovering ? "opacity-0" : "opacity-100"}`}>
        <div className={`rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-transform group-hover:scale-110 ${
          isCenter || isMobile ? "w-14 h-14" : "w-11 h-11"
        }`}>
          <Icon
            name="play_arrow"
            size={isCenter || isMobile ? 32 : 26}
            className="text-white ml-0.5"
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className={`text-white font-semibold leading-snug line-clamp-2 ${
          isCenter || isMobile ? "text-sm" : "text-xs"
        }`}>
          {video.title}
        </h3>
        {video.description && (isCenter || isMobile) && (
          <p className="text-white/70 text-xs mt-1 line-clamp-2">{video.description}</p>
        )}
      </div>

      {video.category && (isCenter || isMobile) && (
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] font-semibold uppercase tracking-wider">
          {video.category}
        </div>
      )}
    </button>
  );
}

function VideoModal({ video, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-sm sm:max-w-md mx-auto" style={{ aspectRatio: "9/16", maxHeight: "85vh" }}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white z-10"
        >
          <Icon name="close" size={28} />
        </button>
        <video
          src={video.videoUrl}
          poster={video.thumbnailUrl || undefined}
          controls
          autoPlay
          className="w-full h-full rounded-2xl bg-black object-contain"
        />
      </div>
    </div>
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 640);
    }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function VideoRituals({ videos = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [touchStart, setTouchStart] = useState(null);
  const isMobile = useIsMobile();

  const total = videos.length;

  const goTo = useCallback(
    (idx) => {
      if (total === 0) return;
      setCurrentIndex(((idx % total) + total) % total);
    },
    [total]
  );

  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  function handleTouchStart(e) {
    setTouchStart(e.touches[0].clientX);
  }

  function handleTouchEnd(e) {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev();
    }
    setTouchStart(null);
  }

  if (total === 0) return null;

  const getVisibleIndices = () => {
    if (isMobile || total === 1) return [currentIndex];
    if (total === 2) return [currentIndex, (currentIndex + 1) % total];
    const prevIdx = ((currentIndex - 1) + total) % total;
    const nextIdx = (currentIndex + 1) % total;
    return [prevIdx, currentIndex, nextIdx];
  };

  const visible = getVisibleIndices();

  return (
    <section className="py-12 sm:py-16 md:py-20 overflow-hidden bg-gradient-to-b from-ivory-canvas via-white to-ivory-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <div className="mb-8 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-antique-gold/10 text-antique-gold text-[10px] sm:text-xs font-semibold uppercase tracking-widest mb-3 sm:mb-4">
            <Icon name="auto_awesome" size={14} />
            Shoppable Rituals
          </div>
          <h2 className="font-headline text-2xl sm:text-4xl lg:text-5xl text-forest-deep leading-tight">
            HAKKIVEDA{" "}
            <span className="text-antique-gold italic">VIDEO RITUALS</span>
          </h2>
          <p className="mt-2 sm:mt-3 text-xs sm:text-sm md:text-base text-on-surface-variant max-w-xl">
            Watch authentic tribal rituals, herbal preparations, and real customer hair regrowth journeys.
          </p>
        </div>

        {/* Carousel */}
        <div
          className="relative flex items-center justify-center min-h-[420px] sm:min-h-[460px] md:min-h-[500px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Previous arrow */}
          {total > 1 && (
            <button
              onClick={prev}
              className="absolute left-0 sm:left-4 md:left-6 z-30 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-forest-deep/90 text-white flex items-center justify-center hover:bg-forest-base shadow-lg transition-colors"
              aria-label="Previous video"
            >
              <Icon name="chevron_left" size={22} />
            </button>
          )}

          {/* Cards */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5">
            {visible.map((idx) => (
              <VideoCard
                key={videos[idx].id}
                video={videos[idx]}
                isCenter={idx === currentIndex}
                isMobile={isMobile}
                onClick={() => setPlayingVideo(videos[idx])}
              />
            ))}
          </div>

          {/* Next arrow */}
          {total > 1 && (
            <button
              onClick={next}
              className="absolute right-0 sm:right-4 md:right-6 z-30 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-forest-deep/90 text-white flex items-center justify-center hover:bg-forest-base shadow-lg transition-colors"
              aria-label="Next video"
            >
              <Icon name="chevron_right" size={22} />
            </button>
          )}
        </div>

        {/* Dots */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8">
            {videos.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? "w-5 sm:w-6 h-2 sm:h-2.5 bg-forest-deep"
                    : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-forest-deep/25 hover:bg-forest-deep/40"
                }`}
                aria-label={`Go to video ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-6 sm:mt-8">
          <button className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-forest-deep text-ivory-canvas text-xs sm:text-sm font-semibold rounded-full hover:bg-forest-base transition-colors shadow-md">
            EXPLORE ALL VIDEO RITUALS
            <Icon name="arrow_forward" size={16} />
          </button>
        </div>
      </div>

      {playingVideo && (
        <VideoModal video={playingVideo} onClose={() => setPlayingVideo(null)} />
      )}
    </section>
  );
}
