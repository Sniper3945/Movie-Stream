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
  const [isMobile, setIsMobile] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout| null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Détection mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Gestion intelligente de l'auto-hide des contrôles
  const startHideControlsTimer = useCallback(() => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    
    hideControlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !showVolumeSlider && !showSpeedMenu) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying, showVolumeSlider, showSpeedMenu]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (isPlaying) {
      startHideControlsTimer();
    }
  }, [isPlaying, startHideControlsTimer]);

  // Gestionnaire de mouvement souris (desktop uniquement)
  const handleMouseMove = useCallback(() => {
    if (!isMobile) {
      setLastMouseMove(Date.now());
      showControlsTemporarily();
    }
  }, [isMobile, showControlsTemporarily]);

  // Gestionnaire de clic container (mobile = toggle controls, desktop = play/pause)
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Ne pas intercepter les clics sur les contrôles
    if ((e.target as HTMLElement).closest('.netflix-controls')) {
      return;
    }
    
    if (isMobile) {
      // Mobile: toggle contrôles
      if (showControls) {
        setShowControls(false);
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current);
        }
      } else {
        showControlsTemporarily();
      }
    } else {
      // Desktop: play/pause
      togglePlay();
    }
  }, [isMobile, showControls, showControlsTemporarily]);

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) {
      setIsHovering(true);
      showControlsTemporarily();
    }
  }, [isMobile, showControlsTemporarily]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      setIsHovering(false);
      if (isPlaying) {
        startHideControlsTimer();
      }
    }
  }, [isMobile, isPlaying, startHideControlsTimer]);

  // Auto-hide quand lecture commence/s'arrête
  useEffect(() => {
    if (isPlaying && !showVolumeSlider && !showSpeedMenu) {
      startHideControlsTimer();
    } else {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      if (!isPlaying) {
        setShowControls(true);
      }
    }

    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [isPlaying, showVolumeSlider, showSpeedMenu, startHideControlsTimer]);

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

  // Gestion du fullscreen avec détection des événements webkit
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFullscreenNow);
      console.log('🔄 Fullscreen changed:', isFullscreenNow);
    };

    // Événements de changement de fullscreen pour tous les navigateurs
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Nettoyage des timeouts
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
      if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current);
    };
  }, []);

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

    e.stopPropagation(); // Empêcher le toggle des contrôles
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    video.currentTime = newTime;
    showControlsTemporarily(); // Réafficher après seek
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
    const video = videoRef.current;
    
    if (!container || !video) {
      const msg = '❌ Container ou video manquant';
      console.error(msg);
      setDebugInfo(msg);
      setShowDebug(true);
      return;
    }

    const msg1 = `🎯 Toggle fullscreen - Mobile: ${isMobile}, Current: ${isFullscreen}`;
    console.log(msg1);
    setDebugInfo(msg1);
    setShowDebug(true);

    try {
      if (isFullscreen) {
        // Sortir du fullscreen
        const msg2 = '📤 Sortie du fullscreen...';
        console.log(msg2);
        setDebugInfo(prev => prev + '\n' + msg2);
        
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      } else {
        // Entrer en fullscreen
        const msg3 = '📥 Entrée en fullscreen...';
        console.log(msg3);
        setDebugInfo(prev => prev + '\n' + msg3);
        
        if (isMobile) {
          // Sur mobile, priorité au fullscreen vidéo natif
          const msg4 = '📱 Tentative fullscreen vidéo natif mobile...';
          console.log(msg4);
          setDebugInfo(prev => prev + '\n' + msg4);
          
          // Diagnostic des méthodes disponibles
          const diagnosticMsg = `🔍 Méthodes disponibles:
- video.webkitEnterFullscreen: ${!!(video as any).webkitEnterFullscreen}
- video.requestFullscreen: ${!!(video as any).requestFullscreen}
- container.webkitRequestFullscreen: ${!!(container as any).webkitRequestFullscreen}
- User Agent: ${navigator.userAgent.substring(0, 50)}...`;
          
          setDebugInfo(prev => prev + '\n' + diagnosticMsg);
          
          // 1. Essayer le fullscreen vidéo natif iOS
          if ((video as any).webkitEnterFullscreen) {
            const msg5 = '🍎 webkitEnterFullscreen détecté - tentative...';
            console.log(msg5);
            setDebugInfo(prev => prev + '\n' + msg5);
            
            try {
              // Vérifier si la vidéo est prête
              if (video.readyState < 2) {
                const msgWait = '⏳ Attente que la vidéo soit prête...';
                setDebugInfo(prev => prev + '\n' + msgWait);
                await new Promise(resolve => {
                  const checkReady = () => {
                    if (video.readyState >= 2) {
                      resolve(true);
                    } else {
                      setTimeout(checkReady, 100);
                    }
                  };
                  checkReady();
                });
              }
              
              // Forcer la lecture si pas déjà en cours
              if (video.paused) {
                const msgPlay = '▶️ Démarrage de la lecture...';
                setDebugInfo(prev => prev + '\n' + msgPlay);
                await video.play();
              }
              
              // Petit délai pour s'assurer que tout est prêt
              await new Promise(resolve => setTimeout(resolve, 200));
              
              (video as any).webkitEnterFullscreen();
              const msgSuccess = '✅ webkitEnterFullscreen appelé avec succès';
              console.log(msgSuccess);
              setDebugInfo(prev => prev + '\n' + msgSuccess);
              
              // Masquer le debug après succès
              setTimeout(() => setShowDebug(false), 3000);
              return;
            } catch (error) {
              const msgError = `⚠️ webkitEnterFullscreen échoué: ${error}`;
              console.warn(msgError);
              setDebugInfo(prev => prev + '\n' + msgError);
            }
          } else {
            const msgNoWebkit = '❌ webkitEnterFullscreen non disponible';
            setDebugInfo(prev => prev + '\n' + msgNoWebkit);
          }
          
          // 2. Essayer le fullscreen vidéo standard
          if ((video as any).requestFullscreen) {
            const msg6 = '📺 requestFullscreen vidéo détecté - tentative...';
            console.log(msg6);
            setDebugInfo(prev => prev + '\n' + msg6);
            try {
              await (video as any).requestFullscreen();
              const msgSuccess2 = '✅ requestFullscreen vidéo réussi';
              console.log(msgSuccess2);
              setDebugInfo(prev => prev + '\n' + msgSuccess2);
              setTimeout(() => setShowDebug(false), 3000);
              return;
            } catch (error) {
              const msgError2 = `⚠️ requestFullscreen vidéo échoué: ${error}`;
              console.warn(msgError2);
              setDebugInfo(prev => prev + '\n' + msgError2);
            }
          }
        }
        
        // Fallback : fullscreen du container
        const msg7 = '🔄 Fallback container fullscreen...';
        console.log(msg7);
        setDebugInfo(prev => prev + '\n' + msg7);
        
        if (container.requestFullscreen) {
          await container.requestFullscreen();
          const msgSuccess3 = '✅ Container requestFullscreen réussi';
          console.log(msgSuccess3);
          setDebugInfo(prev => prev + '\n' + msgSuccess3);
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
          const msgSuccess4 = '✅ Container webkitRequestFullscreen réussi';
          console.log(msgSuccess4);
          setDebugInfo(prev => prev + '\n' + msgSuccess4);
        } else if ((container as any).mozRequestFullScreen) {
          await (container as any).mozRequestFullScreen();
          const msgSuccess5 = '✅ Container mozRequestFullScreen réussi';
          console.log(msgSuccess5);
          setDebugInfo(prev => prev + '\n' + msgSuccess5);
        } else if ((container as any).msRequestFullscreen) {
          await (container as any).msRequestFullscreen();
          const msgSuccess6 = '✅ Container msRequestFullscreen réussi';
          console.log(msgSuccess6);
          setDebugInfo(prev => prev + '\n' + msgSuccess6);
        } else {
          const msgError3 = '❌ Aucune méthode de fullscreen disponible';
          console.error(msgError3);
          setDebugInfo(prev => prev + '\n' + msgError3);
        }
      }
      
      // Masquer le debug après 5 secondes si tout va bien
      setTimeout(() => setShowDebug(false), 5000);
      
    } catch (error) {
      const errorMsg = `💥 Erreur fullscreen: ${error}`;
      console.error(errorMsg);
      setDebugInfo(prev => prev + '\n' + errorMsg);
      
      // Afficher une notification à l'utilisateur
      if (isMobile) {
        const userMsg = '📱 Le plein écran n\'est pas disponible. Tournez votre téléphone en mode paysage.';
        setDebugInfo(prev => prev + '\n' + userMsg);
      }
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

  // Si mobile, utiliser le player natif
  if (isMobile) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          poster={poster}
          controls
          playsInline
          preload="metadata"
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (video && onProgress) {
              onProgress(video.currentTime, video.duration);
            }
          }}
          onLoadedData={() => {
            const video = videoRef.current;
            if (video && savedTime > 0) {
              video.currentTime = savedTime;
            }
          }}
        />
        
        {/* Overlay de chargement simple pour mobile */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white text-sm">Chargement de {title}...</p>
            </div>
          </div>
        )}

        {/* Overlay d'erreur pour mobile */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-95">
            <div className="text-center text-white p-4">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
                <span className="material-icons text-xl">error</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Erreur de lecture</h3>
              <p className="text-gray-300 mb-4 text-sm">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
              >
                Réessayer
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Player custom pour desktop uniquement
  return (
    <div 
      ref={containerRef}
      className={`netflix-player relative w-full aspect-video bg-black rounded-lg overflow-hidden group ${
        showControls || !isPlaying ? 'cursor-default' : 'cursor-none'
      }`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleContainerClick}
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

      {/* Debug overlay pour mobile - visible à l'écran */}
      {showDebug && isMobile && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs font-mono max-h-60 overflow-y-auto">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold text-yellow-400">🔧 Debug Fullscreen</span>
            <button 
              onClick={() => setShowDebug(false)}
              className="text-red-400 font-bold"
            >
              ✕
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-xs">{debugInfo}</pre>
        </div>
      )}

      {/* Contrôles Netflix-style optimisés - Desktop uniquement */}
      <div className={`netflix-controls absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ease-out ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
      }`}>
        
        {/* Barre de progression avec preview */}
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
                className="absolute bottom-full mb-3 bg-black bg-opacity-95 text-white px-3 py-1.5 rounded-md text-xs font-semibold pointer-events-none z-40 shadow-lg"
                style={{ 
                  left: `${(previewTime / duration) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {formatTime(previewTime)}
              </div>
            )}
            
            {/* Track */}
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

        {/* Contrôles desktop */}
        <div className="flex items-center justify-between px-3 pb-3 space-x-2">
          {/* Contrôles de gauche */}
          <div className="flex items-center space-x-2">
            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
                showControlsTemporarily();
              }}
              className="netflix-control-button-compact"
              aria-label={isPlaying ? "Pause" : "Lecture"}
            >
              <span className="material-icons text-xl">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Skip buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                skip(-10);
                showSkipIndicator('backward');
                showControlsTemporarily();
              }}
              className="netflix-control-button-compact"
              aria-label="Reculer de 10 secondes"
            >
              <span className="material-icons text-lg">replay_10</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                skip(10);
                showSkipIndicator('forward');
                showControlsTemporarily();
              }}
              className="netflix-control-button-compact"
              aria-label="Avancer de 10 secondes"
            >
              <span className="material-icons text-lg">forward_10</span>
            </button>

            {/* Volume */}
            <div className="flex items-center space-x-1 group/volume">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                  showControlsTemporarily();
                }}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="netflix-control-button-compact"
                aria-label={isMuted ? "Activer le son" : "Couper le son"}
              >
                <span className="material-icons text-lg">
                  {isMuted || volume === 0 ? 'volume_off' : 
                   volume < 0.5 ? 'volume_down' : 'volume_up'}
                </span>
              </button>
              
              {/* Slider de volume */}
              <div 
                className={`netflix-volume-slider-compact transition-all duration-200 ${
                  showVolumeSlider ? 'opacity-100 w-16' : 'opacity-0 w-0'
                }`}
                ref={volumeRef}
                onClick={(e) => {
                  e.stopPropagation();
                  handleVolumeChange(e);
                  showControlsTemporarily();
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

            {/* Temps */}
            <span className="text-white text-xs font-medium ml-2">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Contrôles de droite */}
          <div className="flex items-center space-x-1">
            {/* Vitesse de lecture */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSpeedMenu(!showSpeedMenu);
                  showControlsTemporarily();
                }}
                className="netflix-control-button-compact text-xs font-bold min-w-[2.5rem] h-8"
                aria-label="Vitesse de lecture"
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
                        showControlsTemporarily();
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
                showControlsTemporarily();
              }}
              className="netflix-control-button-compact"
              aria-label={isFullscreen ? "Quitter plein écran" : "Plein écran"}
            >
              <span className="material-icons text-lg">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
