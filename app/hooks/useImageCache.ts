import { useState, useEffect, useCallback } from 'react';

interface ImageCacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
}

class ImageCacheManager {
  private cache = new Map<string, ImageCacheEntry>();
  private preloadQueue = new Set<string>();
  private maxCacheSize = 50; // Limite du cache
  private maxAge = 30 * 60 * 1000; // 30 minutes

  async preloadImage(url: string): Promise<void> {
    if (this.cache.has(url) || this.preloadQueue.has(url)) {
      return;
    }

    this.preloadQueue.add(url);

    try {
      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        this.addToCache(url, blob);
      }
    } catch (error) {
      console.warn(`Failed to preload image: ${url}`);
    } finally {
      this.preloadQueue.delete(url);
    }
  }

  private addToCache(url: string, blob: Blob) {
    // Nettoyer le cache si nécessaire
    if (this.cache.size >= this.maxCacheSize) {
      this.cleanupCache();
    }

    this.cache.set(url, {
      url,
      blob,
      timestamp: Date.now()
    });
  }

  private cleanupCache() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Supprimer les entrées expirées
    entries.forEach(([url, entry]) => {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(url);
      }
    });

    // Si encore trop d'entrées, supprimer les plus anciennes
    if (this.cache.size >= this.maxCacheSize) {
      const sortedEntries = entries
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(this.maxCacheSize * 0.3));
      
      sortedEntries.forEach(([url]) => this.cache.delete(url));
    }
  }

  getCachedImage(url: string): string | null {
    const entry = this.cache.get(url);
    if (entry && Date.now() - entry.timestamp < this.maxAge) {
      return URL.createObjectURL(entry.blob);
    }
    return null;
  }

  preloadBatch(urls: string[], delay = 100) {
    urls.forEach((url, index) => {
      setTimeout(() => this.preloadImage(url), index * delay);
    });
  }
}

const imageCache = new ImageCacheManager();

export const useImageCache = () => {
  const [cachedUrls, setCachedUrls] = useState<Set<string>>(new Set());

  const preloadImages = useCallback((urls: string[]) => {
    imageCache.preloadBatch(urls);
    // Mettre à jour l'état pour déclencher les re-renders
    setTimeout(() => {
      setCachedUrls(new Set(urls.filter(url => imageCache.getCachedImage(url))));
    }, 1000);
  }, []);

  const getCachedImageUrl = useCallback((url: string): string | null => {
    return imageCache.getCachedImage(url);
  }, []);

  return {
    preloadImages,
    getCachedImageUrl,
    cachedUrls
  };
};
