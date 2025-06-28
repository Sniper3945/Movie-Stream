import { useEffect, useRef, useCallback } from 'react';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

interface UseScrollRestorationOptions {
  key: string;
  enabled?: boolean;
  restoreDelay?: number;
  saveThrottle?: number;
  container?: () => Element | Window | null;
  debug?: boolean;
}

interface UseScrollRestorationReturn {
  save: () => void;
  restore: () => void;
  clear: () => void;
  clearAll: () => void;
  getPosition: () => ScrollPosition | null;
}

const STORAGE_PREFIX = 'scroll-restoration:';
const DEFAULT_RESTORE_DELAY = 50;
const DEFAULT_SAVE_THROTTLE = 100;

/**
 * Hook personnalisé pour la restauration de position de scroll
 * 
 * @param options Configuration du hook
 * @returns Méthodes pour gérer la position de scroll
 */
export function useScrollRestoration(options: UseScrollRestorationOptions): UseScrollRestorationReturn {
  const {
    key,
    enabled = true,
    restoreDelay = DEFAULT_RESTORE_DELAY,
    saveThrottle = DEFAULT_SAVE_THROTTLE,
    container = () => window,
    debug = false
  } = options;

  const storageKey = `${STORAGE_PREFIX}${key}`;
  const saveTimeoutRef = useRef<number | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const isRestoringRef = useRef<boolean>(false);

  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log(`[ScrollRestoration:${key}]`, ...args);
    }
  }, [debug, key]);

  /**
   * Vérifie si sessionStorage est disponible
   */
  const isStorageAvailable = useCallback((): boolean => {
    try {
      const test = '__storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }, []);

  /**
   * Obtient l'élément de scroll (window ou container personnalisé)
   */
  const getScrollContainer = useCallback((): Element | Window | null => {
    try {
      return container();
    } catch (error) {
      log('Erreur lors de l\'obtention du container:', error);
      return window;
    }
  }, [container, log]);

  /**
   * Obtient la position de scroll actuelle
   */
  const getCurrentPosition = useCallback((): { x: number; y: number } => {
    const scrollContainer = getScrollContainer();
    
    if (scrollContainer === window) {
      return {
        x: window.scrollX || window.pageXOffset || 0,
        y: window.scrollY || window.pageYOffset || 0
      };
    } else if (scrollContainer instanceof Element) {
      return {
        x: scrollContainer.scrollLeft || 0,
        y: scrollContainer.scrollTop || 0
      };
    }
    
    return { x: 0, y: 0 };
  }, [getScrollContainer]);

  /**
   * Sauvegarde la position de scroll actuelle
   */
  const save = useCallback((): void => {
    if (!enabled || !isStorageAvailable()) return;

    try {
      const position = getCurrentPosition();
      const scrollData: ScrollPosition = {
        ...position,
        timestamp: Date.now()
      };

      sessionStorage.setItem(storageKey, JSON.stringify(scrollData));
      log('Position sauvegardée:', scrollData);
    } catch (error) {
      log('Erreur lors de la sauvegarde:', error);
    }
  }, [enabled, storageKey, getCurrentPosition, isStorageAvailable, log]);

  /**
   * Sauvegarde avec throttling pour éviter trop d'écritures
   */
  const saveThrottled = useCallback((): void => {
    const now = Date.now();
    
    // Annule la sauvegarde précédente si elle existe
    if (saveTimeoutRef.current !== null) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Si assez de temps s'est écoulé, sauvegarde immédiatement
    if (now - lastSaveTimeRef.current >= saveThrottle) {
      save();
      lastSaveTimeRef.current = now;
    } else {
      // Sinon, programme une sauvegarde
      saveTimeoutRef.current = window.setTimeout(() => {
        save();
        lastSaveTimeRef.current = Date.now();
        saveTimeoutRef.current = null;
      }, saveThrottle - (now - lastSaveTimeRef.current));
    }
  }, [save, saveThrottle]);

  /**
   * Restaure la position de scroll sauvegardée
   */
  const restore = useCallback((): void => {
    if (!enabled || !isStorageAvailable()) return;

    try {
      const savedData = sessionStorage.getItem(storageKey);
      if (!savedData) {
        log('Aucune position sauvegardée trouvée');
        return;
      }

      const scrollData: ScrollPosition = JSON.parse(savedData);
      const scrollContainer = getScrollContainer();

      if (!scrollContainer) {
        log('Container de scroll non trouvé');
        return;
      }

      isRestoringRef.current = true;
      
      const restorePosition = () => {
        if (scrollContainer === window) {
          window.scrollTo({
            left: scrollData.x,
            top: scrollData.y,
            behavior: 'instant'
          });
        } else if (scrollContainer instanceof Element) {
          scrollContainer.scrollLeft = scrollData.x;
          scrollContainer.scrollTop = scrollData.y;
        }

        log('Position restaurée:', scrollData);
        
        // Reset le flag après un délai pour éviter de sauvegarder immédiatement
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      };

      // Délai pour laisser le DOM se rendre
      setTimeout(restorePosition, restoreDelay);

    } catch (error) {
      log('Erreur lors de la restauration:', error);
      isRestoringRef.current = false;
    }
  }, [enabled, storageKey, restoreDelay, getScrollContainer, isStorageAvailable, log]);

  /**
   * Efface la position sauvegardée pour cette clé
   */
  const clear = useCallback((): void => {
    if (!isStorageAvailable()) return;

    try {
      sessionStorage.removeItem(storageKey);
      log('Position effacée');
    } catch (error) {
      log('Erreur lors de l\'effacement:', error);
    }
  }, [storageKey, isStorageAvailable, log]);

  /**
   * Efface toutes les positions de scroll sauvegardées
   */
  const clearAll = useCallback((): void => {
    if (!isStorageAvailable()) return;

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      log('Toutes les positions effacées:', keysToRemove.length);
    } catch (error) {
      log('Erreur lors de l\'effacement global:', error);
    }
  }, [isStorageAvailable, log]);

  /**
   * Obtient la position sauvegardée sans la restaurer
   */
  const getPosition = useCallback((): ScrollPosition | null => {
    if (!isStorageAvailable()) return null;

    try {
      const savedData = sessionStorage.getItem(storageKey);
      return savedData ? JSON.parse(savedData) : null;
    } catch (error) {
      log('Erreur lors de la lecture:', error);
      return null;
    }
  }, [storageKey, isStorageAvailable, log]);

  /**
   * Gestionnaire d'événement de scroll avec protection contre la restauration
   */
  const handleScroll = useCallback((): void => {
    // Ne pas sauvegarder si on est en train de restaurer
    if (isRestoringRef.current) return;
    
    saveThrottled();
  }, [saveThrottled]);

  /**
   * Gestionnaire avant déchargement de la page
   */
  const handleBeforeUnload = useCallback((): void => {
    // Sauvegarde finale avant fermeture/rechargement
    save();
  }, [save]);

  /**
   * Effect principal pour gérer les événements
   */
  useEffect(() => {
    if (!enabled) return;

    const scrollContainer = getScrollContainer();
    if (!scrollContainer) {
      log('Container de scroll non disponible');
      return;
    }

    log('Initialisation du scroll restoration');

    // Restaure la position au montage
    restore();

    // Ajoute les event listeners
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload, { passive: true });

    // Nettoyage
    return () => {
      log('Nettoyage des event listeners');
      
      // Sauvegarde finale
      save();
      
      // Nettoie le timeout en cours
      if (saveTimeoutRef.current !== null) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      // Retire les event listeners
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, handleScroll, handleBeforeUnload, restore, save, getScrollContainer, log]);

  return {
    save,
    restore,
    clear,
    clearAll,
    getPosition
  };
};