'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ReelViewer.module.css';
import ReelCard from './ReelCard';
import LoadingSpinner from '../LoadingSpinner';

interface Reel {
  id: string;
  celebrity: string;
  script: string;
  url: string;
  createdAt: string;
}

export default function ReelViewer({ initialReels }: { initialReels: Reel[] }) {
  const [reels, setReels] = useState<Reel[]>(initialReels);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMoreReels = async () => {
    if (loading || reels.length === 0) return;
    
    setLoading(true);
    try {
      const lastId = reels[reels.length - 1].id;
      const response = await fetch(`/api/reels?cursor=${lastId}`);
      const { data } = await response.json();
      
      if (data.length > 0) {
        setReels([...reels, ...data]);
      }
    } catch (error) {
      console.error('Error fetching more reels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
    const threshold = 100;
    
    if (scrollHeight - (scrollTop + clientHeight) < threshold) {
      fetchMoreReels();
    }

    // Calculate current visible reel
    const itemHeight = clientHeight;
    const newIndex = Math.round(scrollTop / itemHeight);
    
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={styles.container}
      onScroll={handleScroll}
    >
      {reels.map((reel, index) => (
        <ReelCard 
          key={reel.id}
          reel={reel}
          isActive={index === currentIndex}
        />
      ))}
      {loading && <LoadingSpinner />}
    </div>
  );
}