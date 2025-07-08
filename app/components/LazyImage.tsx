import { useState, useRef, useEffect } from 'react';

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

  useEffect(() => {
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
          setImageSrc(src);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    if (intersectionRef.current) {
      observer.observe(intersectionRef.current);
    }

    return () => observer.disconnect();
  }, [src, priority]);

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
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
    <div ref={intersectionRef} className="relative">
      {/* Placeholder */}
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
          className={`${className} ${imageState === 'loaded' ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading={priority ? "eager" : "lazy"}
        />
      )}
    </div>
  );
};
