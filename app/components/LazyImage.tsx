import { useState, useRef, useEffect } from 'react';
import { useImageCache } from '../hooks/useImageCache';

interface LazyImageProps {
  src: string;
  alt: string;
  className: string;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: React.ReactNode;
  priority?: boolean;
}

export const LazyImage = ({ 
  src, 
  alt, 
  className, 
  onLoad, 
  onError,
  placeholder,
  priority = false
}: LazyImageProps) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const intersectionRef = useRef<HTMLDivElement>(null);
  const { getCachedImageUrl } = useImageCache();

  useEffect(() => {
    // Vérifier d'abord le cache
    const cachedUrl = getCachedImageUrl(src);
    if (cachedUrl) {
      setImageSrc(cachedUrl);
      setImageState('loaded');
      return;
    }

    // Si c'est une image prioritaire, charger immédiatement
    if (priority) {
      setImageSrc(src);
      return;
    }

    // Sinon, utiliser l'Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // Vérifier une dernière fois le cache
          const latestCachedUrl = getCachedImageUrl(src);
          if (latestCachedUrl) {
            setImageSrc(latestCachedUrl);
            setImageState('loaded');
          } else {
            setImageSrc(src);
          }
          observer.disconnect();
        }
      },
      {
        rootMargin: '100px', // Augmenté pour un préchargement plus agressif
        threshold: 0.1,
      }
    );

    if (intersectionRef.current) {
      observer.observe(intersectionRef.current);
    }

    return () => observer.disconnect();
  }, [src, priority, getCachedImageUrl]);

  const handleImageLoad = () => {
    setImageState('loaded');
    onLoad?.();
  };

  const handleImageError = () => {
    setImageState('error');
    onError?.();
  };

  const defaultPlaceholder = (
    <div className={`${className} bg-gray-800 flex items-center justify-center border border-gray-600`}>
      <div className="text-center text-gray-400">
        {imageState === 'loading' ? (
          <>
            {/* Skeleton loader plus raffiné */}
            <div className="animate-pulse w-full h-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] animate-shimmer"></div>
          </>
        ) : (
          <>
            <span className="material-icons text-4xl mb-2 block">movie</span>
            <p className="text-xs">Image non disponible</p>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div ref={intersectionRef} className="relative overflow-hidden">
      {/* Placeholder avec animation shimmer */}
      {(imageState === 'loading' || imageState === 'error') && (
        <div className="absolute inset-0">
          {placeholder || defaultPlaceholder}
        </div>
      )}
      
      {/* Image réelle */}
      {imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          className={`${className} ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? "eager" : "lazy"}
        />
      )}
    </div>
  );
};
