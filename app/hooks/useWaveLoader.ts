import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWaveLoaderProps {
  items: any[];
  waveCount?: number;
  initialWave?: number;
  debug?: boolean;
}

export const useWaveLoader = ({ 
  items, 
  waveCount = 3, 
  initialWave = 1,
  debug = false 
}: UseWaveLoaderProps) => {
  const [currentWave, setCurrentWave] = useState(initialWave);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Calculer la taille de chaque vague
  const waveSize = Math.floor(items.length / waveCount);
  const totalWaves = Math.ceil(items.length / waveSize);

  // Calculer les éléments visibles selon la vague actuelle
  const visibleItems = items.slice(0, currentWave * waveSize);
  const hasMoreWaves = currentWave < totalWaves;

  const loadNextWave = useCallback(() => {
    if (hasMoreWaves && !isLoading) {
      setIsLoading(true);
      
      // Simuler un petit délai pour le chargement
      setTimeout(() => {
        setCurrentWave(prev => prev + 1);
        setIsLoading(false);
      }, 100);
    }
  }, [hasMoreWaves, isLoading, currentWave]);

  // Chargement initial automatique de la première vague
  useEffect(() => {
    if (items.length > 0 && !hasInitialLoad) {
      setHasInitialLoad(true);
      setCurrentWave(initialWave);
    }
  }, [items.length, hasInitialLoad, initialWave]);

  // Reset quand les items changent
  useEffect(() => {
    if (items.length === 0) {
      setCurrentWave(initialWave);
      setHasInitialLoad(false);
    }
  }, [items.length, initialWave]);

  // Intersection Observer pour déclencher le chargement automatique des vagues suivantes
  useEffect(() => {
    if (!hasInitialLoad || !sentinelRef.current || !hasMoreWaves) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !isLoading && hasInitialLoad) {
          loadNextWave();
        }
      },
      {
        rootMargin: '200px',
        threshold: 0.1,
      }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMoreWaves, isLoading, loadNextWave, hasInitialLoad]);

  return {
    visibleItems,
    currentWave,
    totalWaves,
    hasMoreWaves,
    isLoading,
    sentinelRef,
    loadNextWave,
    progress: Math.round((currentWave / totalWaves) * 100),
    hasInitialLoad,
  };
};
