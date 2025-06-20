import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import type { Route } from "./+types/watch";
import { getFilmById } from '../data/films';

export function meta({ params }: Route.MetaArgs) {
  const film = getFilmById(params.id);
  return [
    { title: film ? `${film.title} - MovieStream` : "Film non trouvé" },
    { name: "description", content: film?.description || "Film non trouvé" },
  ];
}

export default function Watch({ params }: Route.ComponentProps) {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const film = getFilmById(params.id);

  useEffect(() => {
    if (!film) {
      setError('Film non trouvé');
      setLoading(false);
      return;
    }
    
    fetchVideoUrl(params.id);
  }, [params.id, film]);

  const fetchVideoUrl = async (filmId: string): Promise<void> => {
    try {
      const functionUrl = `/.netlify/functions/get-video?id=${filmId}`;
      setVideoUrl(functionUrl);
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
            className="w-full aspect-video bg-gray-900 rounded-lg"
            src={videoUrl}
            onContextMenu={(e) => e.preventDefault()}
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
          
          <button
            onClick={handleFullscreen}
            className="absolute top-4 right-4 bg-teal-500 hover:bg-teal-600 text-white px-3 py-2 rounded-lg transition-colors z-10"
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