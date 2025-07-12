import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';

interface NetflixVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  isHLS?: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  savedTime?: number;
}

export const NetflixVideoPlayer = ({ 
  src, 
  poster, 
  title = "Film",
  isHLS = false,
  onProgress,
  savedTime = 0
}: NetflixVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  // États du player
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [showSkipOverlay, setShowSkipOverlay] = useState<'backward' | 'forward' | null>(null);
  const [showVolumeOverlay, setShowVolumeOverlay] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [lastMouseMove, setLastMouseMove] = useState(Date.now());
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout| null>(null);

  // Initialisation du player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);
    setIsLoading(true);

    // Nettoyage HLS précédent
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHLS && src.includes('.m3u8')) {
      // Configuration HLS optimisée
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 3,
          maxMaxBufferLength: 600,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
        });
        
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          console.log('🎬 [NetflixPlayer] HLS manifest chargé');
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('🚨 [NetflixPlayer] Erreur HLS:', data);
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError('Erreur réseau - Vérifiez votre connexion');
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError('Erreur de lecture vidéo');
                break;
              default:
                setError('Erreur de lecture HLS');
                break;
            }
            setIsLoading(false);
          }
        });

        // Optimisations HLS pour une meilleure expérience
        hls.on(Hls.Events.BUFFER_APPENDING, () => setIsBuffering(false));
        hls.on(Hls.Events.BUFFER_CREATED, () => setIsBuffering(false));
        // hls.on(Hls.Events.BUFFER_FLUSHING, () => setIsBuffering(true));
        hls.on(Hls.Events.BUFFER_FLUSHING, () => setIsBuffering(true));
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari natif
        video.src = src;
        video.addEventListener('canplay', () => setIsLoading(false));
        video.addEventListener('error', () => {
          setError('Erreur de lecture vidéo');
          setIsLoading(false);
        });
      } else {
        setError('Format HLS non supporté par ce navigateur');
        setIsLoading(false);
      }
    } else {
      // Vidéo directe
      video.src = src;
      video.addEventListener('canplay', () => setIsLoading(false));
      video.addEventListener('error', () => {
        setError('Impossible de charger cette vidéo');
        setIsLoading(false);
      });
    }

    // Position sauvegardée
    if (savedTime > 0) {
      video.currentTime = savedTime;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, isHLS, savedTime]);

  // Event listeners optimisés
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const total = video.duration;
      setCurrentTime(current);
      setDuration(total);
      onProgress?.(current, total);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBufferedTime(video.buffered.end(video.buffered.length - 1));
      }
    };

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsBuffering(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
      setIsBuffering(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsBuffering(false);
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleLoadedData = () => setIsLoading(false);

    // Événements optimisés
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [onProgress]);

  // Gestion du fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Auto-hide des contrôles intelligent et plus rapide
  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isHovering) {
        setShowControls(false);
      }
    }, 2000); // Réduit de 3s à 2s
  }, [isPlaying, isHovering]);

  const handleMouseMove = useCallback(() => {
    setLastMouseMove(Date.now());
    if (!showControls) {
      setShowControls(true);
    }
    hideControlsAfterDelay();
  }, [hideControlsAfterDelay, showControls]);

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    setShowControls(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (isPlaying) {
      hideControlsAfterDelay();
    }
  }, [hideControlsAfterDelay, isPlaying]);

  // Auto-hide pendant la lecture (même sans mouvement)
  useEffect(() => {
    if (isPlaying && !isHovering) {
      const autoHideTimer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      
      return () => clearTimeout(autoHideTimer);
    }
  }, [isPlaying, isHovering]);

  // Raccourcis clavier comme Netflix
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video || (e.target as HTMLElement).tagName === 'INPUT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          showSkipIndicator('backward');
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          showSkipIndicator('forward');
          break;
        case 'ArrowUp':
          e.preventDefault();
          changeVolume(0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeVolume(-0.1);
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Fonctions de contrôle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
    video.currentTime = newTime;
  };

  const showSkipIndicator = (direction: 'backward' | 'forward') => {
    setShowSkipOverlay(direction);
    if (skipTimeoutRef.current) {
      clearTimeout(skipTimeoutRef.current);
    }
    skipTimeoutRef.current = setTimeout(() => {
      setShowSkipOverlay(null);
    }, 800);
  };

  const changeVolume = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = Math.max(0, Math.min(1, video.volume + delta));
    video.volume = newVolume;
    video.muted = newVolume === 0;
    
    setShowVolumeOverlay(true);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeOverlay(false);
    }, 1000);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar || duration === 0) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    video.currentTime = newTime;
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = progressRef.current;
    if (!progressBar || duration === 0) return;

    const rect = progressBar.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    const hoverTime = percentage * duration;
    
    setPreviewTime(hoverTime);
    setShowPreview(true);
  };

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const volumeBar = volumeRef.current;
    if (!video || !volumeBar) return;

    const rect = volumeBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    
    video.volume = percentage;
    video.muted = percentage === 0;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch (error) {
      console.error('Erreur fullscreen:', error);
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  // Formatage du temps
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercentage = duration > 0 ? (bufferedTime / duration) * 100 : 0;
  const volumePercentage = volume * 100;

  return (
    <div 
      ref={containerRef}
      className="netflix-player relative w-full aspect-video bg-black rounded-lg overflow-hidden group cursor-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={togglePlay}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        preload="metadata"
        playsInline
      />

      {/* Overlay de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
          <div className="text-center">
            <div className="netflix-spinner mb-4"></div>
            <p className="text-white text-lg font-medium">Chargement de {title}...</p>
          </div>
        </div>
      )}

      {/* Buffering indicator */}
      {isBuffering && !isLoading && (
        <div className="absolute top-4 right-4 z-30">
          <div className="netflix-spinner-small"></div>
        </div>
      )}

      {/* Overlay d'erreur */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-95">
          <div className="text-center text-white max-w-md">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-600 rounded-full flex items-center justify-center">
              <span className="material-icons text-3xl">error</span>
            </div>
            <h3 className="text-2xl font-bold mb-3">Impossible de lire la vidéo</h3>
            <p className="text-gray-300 mb-6 leading-relaxed">{error}</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.location.reload();
              }}
              className="netflix-button px-8 py-3 rounded-md font-semibold"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Indicateurs de skip */}
      {showSkipOverlay && (
        <div className={`absolute inset-0 flex items-center ${showSkipOverlay === 'backward' ? 'justify-start pl-12' : 'justify-end pr-12'} pointer-events-none z-20`}>
          <div className="netflix-skip-indicator">
            <div className="flex items-center space-x-2">
              <span className="material-icons text-4xl">
                {showSkipOverlay === 'backward' ? 'replay_10' : 'forward_10'}
              </span>
              <span className="text-xl font-bold">
                {showSkipOverlay === 'backward' ? '10 sec' : '10 sec'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur de volume */}
      {showVolumeOverlay && (
        <div className="absolute top-4 left-4 z-30">
          <div className="netflix-volume-indicator">
            <div className="flex items-center space-x-3">
              <span className="material-icons text-2xl">
                {isMuted || volume === 0 ? 'volume_off' : 
                 volume < 0.5 ? 'volume_down' : 'volume_up'}
              </span>
              <div className="w-20 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-150"
                  style={{ width: `${volumePercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton play central */}
      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="netflix-play-button"
          >
            <span className="material-icons text-6xl">play_arrow</span>
          </button>
        </div>
      )}

      {/* Contrôles Netflix-style optimisés */}
      <div className={`netflix-controls absolute bottom-0 left-0 right-0 z-20 transition-all duration-500 ease-out ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}>
        
        {/* Barre de progression avec preview - mobile optimisé et plus visible */}
        <div className="px-3">
          <div
            ref={progressRef}
            onClick={handleSeek}
            onMouseMove={handleProgressHover}
            onMouseLeave={() => setShowPreview(false)}
            className="netflix-progress-container-compact group/progress cursor-pointer"
          >
            {/* Preview tooltip */}
            {showPreview && (
              <div 
                className="absolute bottom-full mb-2 sm:mb-3 bg-black bg-opacity-95 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-semibold pointer-events-none z-40 shadow-lg"
                style={{ 
                  left: `${(previewTime / duration) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {formatTime(previewTime)}
              </div>
            )}
            
            {/* Track plus visible sur mobile */}
            <div className="netflix-progress-track-compact">
              {/* Buffer */}
              <div 
                className="netflix-progress-buffer-compact"
                style={{ width: `${bufferedPercentage}%` }}
              />
              
              {/* Progress */}
              <div 
                className="netflix-progress-fill-compact"
                style={{ width: `${progressPercentage}%` }}
              />
              
              {/* Thumb */}
              <div 
                className="netflix-progress-thumb-compact"
                style={{ left: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Contrôles compacts - mobile optimisé */}
        <div className="flex items-center justify-between px-2 sm:px-3 pb-1 sm:pb-3 space-x-1 sm:space-x-2">
          {/* Contrôles de gauche - plus compacts */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="netflix-control-button-compact"
            >
              <span className="material-icons text-lg sm:text-xl">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Skip buttons - masqués sur très petits écrans */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                skip(-10);
                showSkipIndicator('backward');
              }}
              className="netflix-control-button-compact hidden xs:block"
            >
              <span className="material-icons text-sm sm:text-lg">replay_10</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                skip(10);
                showSkipIndicator('forward');
              }}
              className="netflix-control-button-compact hidden xs:block"
            >
              <span className="material-icons text-sm sm:text-lg">forward_10</span>
            </button>

            {/* Volume - simplifié sur mobile */}
            <div className="flex items-center space-x-1 group/volume">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="netflix-control-button-compact"
              >
                <span className="material-icons text-sm sm:text-lg">
                  {isMuted || volume === 0 ? 'volume_off' : 
                   volume < 0.5 ? 'volume_down' : 'volume_up'}
                </span>
              </button>
              
              {/* Slider de volume compact - masqué sur petit mobile */}
              <div 
                className={`netflix-volume-slider-compact transition-all duration-200 hidden sm:block ${
                  showVolumeSlider ? 'opacity-100 w-12 sm:w-16' : 'opacity-0 w-0'
                }`}
                ref={volumeRef}
                onClick={(e) => {
                  e.stopPropagation();
                  handleVolumeChange(e);
                }}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <div className="netflix-volume-track-compact">
                  <div 
                    className="netflix-volume-fill-compact"
                    style={{ width: `${volumePercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Temps compact - format réduit sur mobile */}
            <span className="text-white text-xs font-medium ml-1 sm:ml-2 hidden sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <span className="text-white text-xs font-medium ml-1 block sm:hidden">
              {formatTime(currentTime)}
            </span>
          </div>

          {/* Contrôles de droite - plus compacts */}
          <div className="flex items-center space-x-1">
            {/* Vitesse de lecture - masquée sur petit mobile */}
            <div className="relative hidden sm:block">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeedMenu(!showSpeedMenu);
                }}
                className="netflix-control-button-compact text-xs font-bold min-w-[2rem] sm:min-w-[2.5rem] h-6 sm:h-8"
              >
                {playbackRate}x
              </button>
              
              {showSpeedMenu && (
                <div className="netflix-speed-menu-compact">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={(e) => {
                        e.stopPropagation();
                        changePlaybackRate(rate);
                      }}
                      className={`netflix-speed-option-compact ${
                        playbackRate === rate ? 'active' : ''
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="netflix-control-button-compact"
            >
              <span className="material-icons text-sm sm:text-lg">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
