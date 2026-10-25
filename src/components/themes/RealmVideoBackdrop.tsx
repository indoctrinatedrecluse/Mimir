import React, { useEffect, useRef, useState } from 'react';
import { RealmId } from '@/types';
import { REALM_THEMES } from '@/components/themes/realmThemes';
import { RealmAtmosphereCanvas } from '@/components/themes/RealmAtmosphereCanvas';

interface RealmVideoBackdropProps {
  realmId: RealmId;
  videoUrl?: string;
  staticBgUrl: string;
  isActive?: boolean;
  className?: string;
}

export const RealmVideoBackdrop: React.FC<RealmVideoBackdropProps> = ({
  realmId,
  videoUrl,
  staticBgUrl,
  isActive = true,
  className = '',
}) => {
  const theme = REALM_THEMES[realmId] || REALM_THEMES.midgard;
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Dual-buffer references for smooth crossfade between realm switches
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reset error state on realm change
  useEffect(() => {
    setVideoError(false);
    setIsVideoLoaded(false);
  }, [realmId, videoUrl]);

  // Performance sentinel: Pause video when tab/window is hidden or inactive
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVisibility = () => {
      if (document.hidden || !isActive) {
        video.pause();
      } else if (isVideoLoaded && !videoError) {
        video.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    handleVisibility();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isActive, isVideoLoaded, videoError]);

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className}`}>
      {/* Underlying Static Ruler Artwork (Always pre-rendered for instant seamless backdrop & fallback) */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${
          videoError || !isVideoLoaded ? 'animate-realm-drift' : 'scale-100'
        }`}
        style={{
          backgroundImage: `url('${staticBgUrl}')`,
        }}
      />

      {/* Hardware-Accelerated Looping Cinematic Video (Option B) */}
      {videoUrl && !videoError && (
        <video
          ref={videoRef}
          key={videoUrl}
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          onLoadedData={() => {
            setIsVideoLoaded(true);
            videoRef.current?.play().catch(() => {});
          }}
          onError={() => {
            // Graceful fallback to Option A (Particles + Ken Burns) if video file is missing
            setVideoError(true);
            setIsVideoLoaded(false);
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 pointer-events-none ${
            isVideoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Atmospheric Particle Simulation: Enabled if video is absent, loading, or errored */}
      {(videoError || !isVideoLoaded) && (
        <RealmAtmosphereCanvas realmId={realmId} enabled={true} />
      )}

      {/* Soft radial vignette keeping the center sovereign ruler sharp & prominent while dimming edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(4,7,17,0.35)_60%,rgba(3,5,10,0.85)_100%)] pointer-events-none" />

      {/* Subtle vertical gradient for header & bottom HUD contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030611]/50 via-transparent to-[#020408]/75 pointer-events-none" />

      {/* Subtle realm color tint */}
      <div
        className="absolute inset-0 opacity-15 mix-blend-color-dodge transition-opacity duration-700 pointer-events-none"
        style={{ backgroundColor: theme.accentColor }}
      />
    </div>
  );
};
