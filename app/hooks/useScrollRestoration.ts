import { useEffect, useRef } from 'react';

interface ScrollRestorationOptions {
  key: string;
  enabled?: boolean;
  debug?: boolean;
  restoreDelay?: number;
  saveThrottle?: number;
}

export const useScrollRestoration = ({
  key,
  enabled = true,
  debug = false,
  restoreDelay = 100,
  saveThrottle = 300
}: ScrollRestorationOptions) => {
  const hasRestored = useRef(false);
  const lastSaveTime = useRef(0);

  // Fonction pour sauvegarder la position
  const save = () => {
    if (!enabled) return;
    
    const now = Date.now();
    if (now - lastSaveTime.current < saveThrottle) return;
    
    const scrollData = {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: now
    };
    
    sessionStorage.setItem(`scroll-restoration:${key}`, JSON.stringify(scrollData));
    lastSaveTime.current = now;
  };

  // Fonction pour restaurer la position
  const restore = () => {
    if (!enabled || hasRestored.current) return;
    
    try {
      const stored = sessionStorage.getItem(`scroll-restoration:${key}`);
      if (!stored) return;
      
      const { y, x } = JSON.parse(stored);
      if (y > 0) {
        setTimeout(() => {
          window.scrollTo({ top: y, left: x || 0, behavior: "auto" });
          sessionStorage.removeItem(`scroll-restoration:${key}`);
          hasRestored.current = true;
        }, restoreDelay);
      }
    } catch (error) {
      // Gestion silencieuse des erreurs en production
    }
  };

  useEffect(() => {
    if (!enabled) return;
    
    // Restaurer au montage
    restore();
    
    // Écouter les scrolls pour sauvegarder
    const handleScroll = () => save();
    const handleBeforeUnload = () => save();
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      save(); // Sauvegarde finale
    };
  }, [enabled, key, restoreDelay, saveThrottle]);

  return { save };
};