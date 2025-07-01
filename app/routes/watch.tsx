import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useFilms } from '../contexts/FilmContext';
import Hls from "hls.js";

// Fonction pour obtenir la couleur d'un genre - couleur grise uniforme
const getGenreColor = (genreName: string) => {
  return 'bg-gray-600'; // Couleur grise pour s'harmoniser avec le thème
};

export function meta({ params }: { params: { id: string } }) {
  return [
    { title: `Film ${params.id} - MovieStream` },
    { name: "description", content: "Regarder ce film en streaming sur MovieStream" },
  ];
}

export default function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { films, loading } = useFilms();
  const [currentFilm, setCurrentFilm] = useState<any>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (films.length > 0 && id) {
      const film = films.find(f => f.id === id);
      if (film) {
        setCurrentFilm(film);
      } else {
        navigate('/');
      }
    }
  }, [films, id, navigate]);

  useEffect(() => {
    const hlsUrl = currentFilm?.ephemere ? currentFilm?.videoUrl : undefined;
    if (
      currentFilm &&
      currentFilm.ephemere &&
      hlsUrl &&
      videoRef.current
    ) {
      let hls: Hls | null = null;

      if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(hlsUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, (_, data) => {
          // Supprime les anciens tracks
          const video = videoRef.current;
          if (!video) return;
          // Retire les anciens tracks ajoutés dynamiquement
          Array.from(video.querySelectorAll('track[data-hlsjs]')).forEach(t => t.remove());

          data.subtitleTracks.forEach((track: any, i: number) => {
            if (!track.url) return;
            const trackEl = document.createElement('track');
            trackEl.kind = 'subtitles';
            trackEl.label = track.name || track.lang || `Sous-titres ${i+1}`;
            trackEl.srclang = track.lang || `lang${i+1}`;
            trackEl.src = track.url;
            trackEl.default = i === 0;
            trackEl.setAttribute('data-hlsjs', '1');
            video.appendChild(trackEl);
          });
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsVideoLoading(false);
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("[HLS] Erreur HLS :", data);
          setVideoError(true);
          setIsVideoLoading(false);
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = hlsUrl;
        videoRef.current.addEventListener('loadedmetadata', () => {
          setIsVideoLoading(false);
        });
        videoRef.current.addEventListener('error', (e) => {
          console.error("[HLS] Erreur native lors du chargement de la vidéo.", e);
          setVideoError(true);
          setIsVideoLoading(false);
        });
      } else {
        setVideoError(true);
        setIsVideoLoading(false);
      }

      return () => {
        if (hls) {
          hls.destroy();
        }
      };
    }
  }, [currentFilm, videoRef.current]);

  // Récupère l'id du film (ex: via useParams ou props)
  const filmId = id;

  // Charger la position sauvegardée au montage
  useEffect(() => {
    const savedTime = localStorage.getItem(`film-progress-${filmId}`);
    if (videoRef.current && savedTime) {
      videoRef.current.currentTime = parseFloat(savedTime);
    }
  }, [filmId]);

  // Sauvegarder la position régulièrement
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const saveProgress = () => {
      localStorage.setItem(`film-progress-${filmId}`, String(video.currentTime));
    };
    video.addEventListener("timeupdate", saveProgress);
    return () => {
      video.removeEventListener("timeupdate", saveProgress);
      // Sauvegarde finale à la sortie
      saveProgress();
    };
  }, [filmId]);

  // Sauvegarde la position de scroll de l'accueil juste avant de quitter pour aller sur /watch/*
  useEffect(() => {
    // Cette logique est mieux placée dans la page d'accueil (_index.tsx) au moment du clic sur un film.
    // Mais si tu veux le faire ici, tu peux utiliser la navigation type "popstate" ou "beforeunload" pour détecter le retour.
    // Cependant, la méthode la plus fiable en React est de sauvegarder le scroll AVANT de naviguer, dans le handler du clic sur le film (dans _index.tsx).
    // Ici, on ne fait rien de plus.
  }, []);

  if (loading || !currentFilm) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>Chargement du film...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <header className="bg-[#0D0D0D] py-4  md:px-8 sticky top-0 z-50 border-b border-gray-700">
        <div className="container mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <span className="material-icons mr-2">arrow_back</span>
            <span className="text-sm">Retour</span>
          </button>
          <button
            onClick={() => navigate('/')}
            ><span className="text-xl md:text-2xl font-bold select-none">
              Movie<span className="font-normal">Stream</span>
            </span>
          </button>
        </div>
      </header>

      {/* Video Player - Plus petit sur desktop */}
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="relative w-full max-w-4xl mx-auto aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
          {isVideoLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-500 mx-auto mb-4"></div>
                <p>Chargement de la vidéo...</p>
              </div>
            </div>
          )}
          
          {videoError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="text-center">
                <span className="material-icons text-6xl text-red-500 mb-4 block">error</span>
                <h3 className="text-xl mb-2">Erreur de lecture</h3>
                <p className="text-gray-400 mb-4">Impossible de charger la vidéo</p>
                <button 
                  onClick={() => {
                    setVideoError(false);
                    setIsVideoLoading(true);
                  }}
                  className="swiss-button px-6 py-2 rounded-lg"
                >
                  Réessayer
                </button>
              </div>
            </div>
          ) : (
            // HLS (.m3u8) ou film éphémère
            (currentFilm.ephemere && currentFilm.videoUrl && currentFilm.videoUrl.endsWith('.m3u8')) ? (
              <video
                ref={videoRef}
                className="w-full h-full"
                controls
                autoPlay
                onLoadStart={() => setIsVideoLoading(true)}
                onError={() => {
                  setVideoError(true);
                  setIsVideoLoading(false);
                }}
                poster={currentFilm.cover.replace(/\.png$/, '.webp')}
              />
            ) : (
              // Lien direct (mp4, 0x0.st, archive.org, etc)
              <video
                ref={videoRef}
                className="w-full h-full"
                controls
                autoPlay
                src={currentFilm.videoUrl}
                onLoadStart={() => setIsVideoLoading(true)}
                onCanPlay={() => setIsVideoLoading(false)}
                onError={() => {
                  setVideoError(true);
                  setIsVideoLoading(false);
                }}
                poster={currentFilm.cover.replace(/\.png$/, '.webp')}
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            )
          )}
        </div>

        {/* Film Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{currentFilm.title}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center text-gray-400">
                <span className="material-icons text-sm mr-1">schedule</span>
                {currentFilm.duration}
              </div>
              <div className="flex items-center text-gray-400">
                <span className="material-icons text-sm mr-1">calendar_today</span>
                {currentFilm.year}
              </div>
              {currentFilm.director && (
                <div className="flex items-center text-gray-400">
                  <span className="material-icons text-sm mr-1">person</span>
                  {currentFilm.director}
                </div>
              )}
            </div>

            {/* Genre Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(Array.isArray(currentFilm.genre) ? currentFilm.genre : currentFilm.genre?.split(', ') || [])
                .map((genre: string, index: number) => (
                <span
                  key={index}
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${getGenreColor(genre.trim())}`}
                >
                  {genre.trim()}
                </span>
              ))}
            </div>

            {/* Description */}
            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-semibold mb-3">Synopsis</h3>
              <p className="text-gray-300 leading-relaxed">
                {currentFilm.description}
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Film Details */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Détails du film</h3>
              <div className="space-y-3">
                {currentFilm.director && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Réalisateur</span>
                    <span>{currentFilm.director}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Année</span>
                  <span>{currentFilm.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Durée</span>
                  <span>{currentFilm.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Audio</span>
                  <span>Français</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0D0D0D] border-t border-gray-700 mt-auto">
        <div className="container mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-center items-center text-sm text-gray-400">
            <p>© 2025 MovieStream. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};


