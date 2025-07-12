import { useState, useEffect, useRef, useCallback } from 'react';
import Hls from 'hls.js';

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  isHLS?: boolean;
  onProgress?: (currentTime: number, duration: number) => void;
  savedTime?: number;
}

export const CustomVideoPlayer = ({ 
  src, 
  poster, 
  title = "Film",
  isHLS = false,
  onProgress,
  savedTime = 0
}: CustomVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  
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
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      // Configuration HLS
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          console.log('🎬 [Player] HLS manifest chargé');
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('🚨 [Player] Erreur HLS:', data);
          if (data.fatal) {
            setError('Erreur de lecture HLS');
            setIsLoading(false);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari natif
        video.src = src;
        video.addEventListener('canplay', () => setIsLoading(false));
        video.addEventListener('error', () => {
          setError('Erreur de lecture vidéo');
          setIsLoading(false);
        });
      } else {
        setError('Format HLS non supporté');
        setIsLoading(false);
      }
    } else {
      // Vidéo directe
      video.src = src;
      video.addEventListener('canplay', () => setIsLoading(false));
      video.addEventListener('error', () => {
        setError('Erreur de lecture vidéo');
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

  // Event listeners pour la vidéo
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

    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
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

  // Auto-hide des contrôles
  const hideControlsAfterDelay = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    hideControlsAfterDelay();
  }, [hideControlsAfterDelay]);

  // Fonctions de contrôle
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar || duration === 0) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    video.currentTime = newTime;
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
    const container = videoRef.current?.parentElement;
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

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  // Formatage du temps
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercentage = volume * 100;

  return (
    <div 
      className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && hideControlsAfterDelay()}
    >
      {/* Vidéo */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        preload="metadata"
      />

      {/* Overlay de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-sm">Chargement de {title}...</p>
          </div>
        </div>
      )}

      {/* Overlay d'erreur */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white">
            <span className="material-icons text-6xl text-red-500 mb-4 block">error</span>
            <h3 className="text-xl mb-2">Erreur de lecture</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="swiss-button px-6 py-2 rounded-lg"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {/* Overlay de lecture centrale */}
      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="bg-black bg-opacity-60 hover:bg-opacity-80 rounded-full p-6 transition-all duration-200 transform hover:scale-110"
          >
            <span className="material-icons text-white text-6xl">play_arrow</span>
          </button>
        </div>
      )}

      {/* Indicateurs de skip */}
      <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
        <button
          onClick={() => skip(-10)}
          className="opacity-0 group-hover:opacity-100 bg-black bg-opacity-60 rounded-full p-3 transition-all duration-200 pointer-events-auto"
        >
          <span className="material-icons text-white text-2xl">replay_10</span>
        </button>
        <button
          onClick={() => skip(10)}
          className="opacity-0 group-hover:opacity-100 bg-black bg-opacity-60 rounded-full p-3 transition-all duration-200 pointer-events-auto"
        >
          <span className="material-icons text-white text-2xl">forward_10</span>
        </button>
      </div>

      {/* Contrôles */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 transition-all duration-300 ${
        showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}>
        
        {/* Barre de progression */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          className="w-full h-2 bg-gray-600 rounded-full mb-4 cursor-pointer group/progress"
        >
          <div className="h-full bg-blue-500 rounded-full relative transition-all duration-150 group-hover/progress:h-3">
            <div 
              className="h-full bg-blue-400 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
            <div 
              className="absolute top-1/2 right-0 w-3 h-3 bg-blue-400 rounded-full transform -translate-y-1/2 translate-x-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ right: `${100 - progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Contrôles de gauche */}
          <div className="flex items-center space-x-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors p-1"
            >
              <span className="material-icons text-2xl">
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>

            {/* Volume */}
            <div className="flex items-center space-x-2 group/volume">
              <button
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className="text-white hover:text-blue-400 transition-colors p-1"
              >
                <span className="material-icons text-xl">
                  {isMuted || volume === 0 ? 'volume_off' : 
                   volume < 0.5 ? 'volume_down' : 'volume_up'}
                </span>
              </button>
              
              {/* Slider de volume */}
              <div className={`w-20 h-1 bg-gray-600 rounded-full cursor-pointer transition-all duration-200 ${
                showVolumeSlider ? 'opacity-100' : 'opacity-0'
              }`}
                ref={volumeRef}
                onClick={handleVolumeChange}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <div 
                  className="h-full bg-blue-400 rounded-full"
                  style={{ width: `${volumePercentage}%` }}
                />
              </div>
            </div>

            {/* Temps */}
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Contrôles de droite */}
          <div className="flex items-center space-x-2">
            {/* Vitesse de lecture */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-white hover:text-blue-400 transition-colors px-2 py-1 text-sm font-medium"
              >
                {playbackRate}x
              </button>
              
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-1 min-w-[80px]">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                    <button
                      key={rate}
                      onClick={() => changePlaybackRate(rate)}
                      className={`w-full px-3 py-1 text-sm text-left hover:bg-gray-700 transition-colors ${
                        playbackRate === rate ? 'text-blue-400' : 'text-white'
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
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors p-1"
            >
              <span className="material-icons text-xl">
                {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
