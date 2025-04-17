'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ReelViewer.module.css';

interface ReelCardProps {
  reel: {
    id: string;
    celebrity: string;
    script: string;
    url: string;
  };
  isActive: boolean;
}

export default function ReelCard({ reel, isActive }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current
        .play()
        .catch((e) => {
          console.error('Autoplay prevented:', e);
        });
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  const handleVideoClick = () => {
    if (videoRef.current) {
      const currentlyMuted = videoRef.current.muted;
      videoRef.current.muted = !currentlyMuted;
      setIsMuted(!currentlyMuted);
    }
  };

  return (
    <div className={styles.reelCard}>
      <video
        ref={videoRef}
        src="https://www.w3schools.com/html/mov_bbb.mp4"
        controls={false}
        playsInline
        loop
        muted={isMuted}
        onClick={handleVideoClick}
        className={styles.video}
      />
      <div className={styles.overlay}>
        <h2 className={styles.celebrityName}>{reel.celebrity}</h2>
        <p className={styles.script}>{reel.script}</p>
        {isMuted && isActive && (
          <div className={styles.tapForSound}>🔇 Tap for sound</div>
        )}
      </div>
    </div>
  );
}