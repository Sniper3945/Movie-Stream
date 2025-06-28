import { useEffect, useRef, useCallback } from "react";

// Utilitaire pour vérifier la disponibilité de sessionStorage
function isSessionStorageAvailable() {
  try {
    const testKey = "__scroll_test__";
    sessionStorage.setItem(testKey, "1");
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

type UseScrollRestorationOptions = {
  key?: string; // Clé unique pour la page
  enabled?: boolean; // Désactiver la restauration si besoin
  container?: HTMLElement | Window | null; // Par défaut window
};

export function useScrollRestoration({
  key = "scroll-pos",
  enabled = true,
  container = typeof window !== "undefined" ? window : null,
}: UseScrollRestorationOptions = {}) {
  const scrollKey = `scroll-restoration:${key}`;
  const isAvailable = isSessionStorageAvailable();
  const restoreTimeout = useRef<number | null>(null);

  // Sauvegarde la position de scroll
  const save = useCallback(() => {
    if (!enabled || !isAvailable || !container) return;
    let y = 0, x = 0;
    if (container === window) {
      y = window.scrollY;
      x = window.scrollX;
    } else if (container instanceof HTMLElement) {
      y = container.scrollTop;
      x = container.scrollLeft;
    }
    sessionStorage.setItem(scrollKey, JSON.stringify({ x, y }));
  }, [enabled, isAvailable, container, scrollKey]);

  // Restaure la position de scroll
  const restore = useCallback(() => {
    if (!enabled || !isAvailable || !container) return;
    const raw = sessionStorage.getItem(scrollKey);
    if (!raw) return;
    try {
      const { x, y } = JSON.parse(raw);
      setTimeout(() => {
        if (container === window) {
          window.scrollTo({ top: y, left: x, behavior: "instant" as ScrollBehavior });
        } else if (container instanceof HTMLElement) {
          container.scrollTo({ top: y, left: x, behavior: "instant" as ScrollBehavior });
        }
      }, 50); // Laisse le DOM se rendre
    } catch {}
  }, [enabled, isAvailable, container, scrollKey]);

  // Nettoie la position sauvegardée
  const clear = useCallback(() => {
    if (!isAvailable) return;
    sessionStorage.removeItem(scrollKey);
  }, [isAvailable, scrollKey]);

  // Nettoie toutes les positions sauvegardées
  const clearAll = useCallback(() => {
    if (!isAvailable) return;
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith("scroll-restoration:"))
      .forEach((k) => sessionStorage.removeItem(k));
  }, [isAvailable]);

  useEffect(() => {
    if (!enabled || !isAvailable || !container) return;

    // Handler de scroll passif
    const handler = () => save();
    const opts = { passive: true } as AddEventListenerOptions;

    if (container === window) {
      window.addEventListener("scroll", handler, opts);
    } else if (container instanceof HTMLElement) {
      container.addEventListener("scroll", handler, opts);
    }

    // Restaure à l'arrivée
    restore();

    return () => {
      if (container === window) {
        window.removeEventListener("scroll", handler);
      } else if (container instanceof HTMLElement) {
        container.removeEventListener("scroll", handler);
      }
      if (restoreTimeout.current) {
        clearTimeout(restoreTimeout.current);
      }
    };
  }, [enabled, isAvailable, container, save, restore]);

  return { save, restore, clear, clearAll };
}
