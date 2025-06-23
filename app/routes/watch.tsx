import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import type { Route } from "./+types/watch";
import { useFilms } from '../contexts/FilmContext';
import { trackFilmView, trackVideoPlay, trackVideoComplete } from '../utils/analytics';

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: "Film - MovieStream" },
    { name: "description", content: "Regarder un film en streaming" },
  ];
}

export default function Watch({ params }: Route.ComponentProps) {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { getFilmById } = useFilms();
  const film = getFilmById(params.id);

  useEffect(() => {
    if (!film) {
      setError('Film non trouvé');
      setLoading(false);
      return;
    }
    
    trackFilmView(params.id, film.title);
    fetchVideoUrl(params.id);
  }, [params.id, film]);

  const fetchVideoUrl = async (filmId: string): Promise<void> => {
    try {
      const functionUrl = `/.netlify/functions/get-video?id=${filmId}`;
      
      // If film has direct videoUrl from MongoDB, use it
      if (film && film.videoUrl) {
        setVideoUrl(film.videoUrl);
        setLoading(false);
        return;
      }
      
      // Otherwise, use the function (for old films)
      const response = await fetch(functionUrl);
      
      if (response.status === 302) {
        const location = response.headers.get('Location');
        setVideoUrl(location || functionUrl);
      } else {
        setVideoUrl(functionUrl);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement de la vidéo');
      setLoading(false);
    }
  };

  const handleFullscreen = (): void => {
    if (videoRef.current?.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleVideoPlay = (): void => {
    if (film) {
      trackVideoPlay(params.id, film.title);
    }
  };

  const handleVideoEnded = (): void => {
    if (film) {
      trackVideoComplete(params.id, film.title);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-teal-400 border-t-transparent border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Chargement de la vidéo...</p>
        </div>
      </div>
    );
  }

  if (error || !film) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Erreur</h2>
          <p className="mb-6">{error || 'Film non trouvé'}</p>
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
          <video 
            ref={videoRef}
            controls 
            className="w-full aspect-video rounded-lg"
            src={videoUrl}
            onContextMenu={(e) => e.preventDefault()}
            onPlay={handleVideoPlay}
            onEnded={handleVideoEnded}
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
          
          {/* Bouton plein écran visible uniquement sur desktop */}
          <button
            onClick={handleFullscreen}
            className="absolute top-4 right-4 bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-lg transition-colors z-10 hidden md:block"
          >
            📺 Plein écran
          </button>
        </div>
        
        <div>
          <h2 className="text-3xl font-bold mb-4">{film.title}</h2>
          <p className="text-teal-400 font-bold mb-4 text-lg">{film.duration}</p>
          <p className="text-gray-300 leading-relaxed text-lg">{film.description}</p>
        </div>
      </div>
    </div>
  );
}