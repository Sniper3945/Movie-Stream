import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router';
import { useFilms } from '../contexts/FilmContext';
import { trackFilmView, trackVideoPlay, trackVideoComplete } from '../utils/analytics';

export function meta({ params }: { params: { id: string } }) {
  return [
    { title: `Regarder ${params.id} - MovieStream` },
    { name: "description", content: "Regardez vos films préférés en streaming HD" },
  ];
}

export default function Watch() {
  const params = useParams();
  const { getFilmById } = useFilms();
  const [film, setFilm] = useState<any>(null); // Use any to avoid type conflicts
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [videoLoading, setVideoLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchFilm = async () => {
      if (!params.id) {
        setIsLoading(false);
        return;
      }

      const filmData = getFilmById(params.id);
      if (filmData) {
        setFilm(filmData);
        setVideoUrl(filmData.videoUrl || ''); // Handle optional videoUrl
        setIsLoading(false);
        trackFilmView(filmData.title);
      } else {
        setIsLoading(false);
      }
    };

    fetchFilm();
  }, [params.id, getFilmById]);

  const handleVideoPlay = () => {
    if (film) {
      trackVideoPlay(film.title);
    }
  };

  const handleVideoEnded = () => {
    if (film) {
      trackVideoComplete(film.title);
    }
  };

  const handleVideoLoadStart = () => {
    setVideoLoading(true);
  };

  const handleVideoCanPlay = () => {
    setVideoLoading(false);
  };

  const handleFullscreen = () => {
    if (videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-teal-400 border-t-transparent border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Chargement du film...</p>
        </div>
      </div>
    );
  }

  if (!film) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Film non trouvé</h2>
          <Link 
            to="/" 
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      <header className="flex items-center p-5 bg-black bg-opacity-90 sticky top-0 z-50">
        <Link 
          to="/" 
          className="text-teal-400 hover:bg-teal-400 hover:bg-opacity-10 px-4 py-2 rounded-lg transition-colors font-bold mr-5"
        >
          ← Retour
        </Link>
        <h1 className="text-xl font-bold">{film.title}</h1>
      </header>
      
      <div className="max-w-6xl mx-auto p-5">
        <div className="mb-8 relative">
          <div className="relative bg-black rounded-lg overflow-hidden">
            {/* Video Loading Overlay - Hidden on mobile */}
            {videoLoading && (
              <div className="hidden md:flex absolute inset-0 bg-black bg-opacity-75 items-center justify-center z-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-white font-semibold">Chargement du lecteur...</p>
                  <p className="text-gray-300 text-sm mt-2">Préparation de la vidéo</p>
                </div>
              </div>
            )}

            <video 
              ref={videoRef}
              controls 
              className="w-full aspect-video rounded-lg"
              src={videoUrl}
              onContextMenu={(e) => e.preventDefault()}
              onPlay={handleVideoPlay}
              onEnded={handleVideoEnded}
              onLoadStart={handleVideoLoadStart}
              onCanPlay={handleVideoCanPlay}
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
            
            {/* Bouton plein écran - Desktop uniquement */}
            <button
              onClick={handleFullscreen}
              className="absolute top-4 right-4 bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-lg transition-colors z-10 hidden md:block"
            >
              📺 Plein écran
            </button>
          </div>
          
          <div className="mt-4">
            <h2 className="text-3xl font-bold mb-2">{film.title}</h2>
            <p className="text-teal-400 font-bold mb-4 text-lg">{film.duration}</p>
            <p className="text-gray-300 leading-relaxed text-lg">{film.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}