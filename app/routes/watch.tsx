import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useFilms } from '../contexts/FilmContext';
import { initialize, trackPageView, trackFilmView } from '../utils/analytics';
import { NetflixVideoPlayer } from '../components/NetflixVideoPlayer';

// Fonction pour obtenir la couleur d'un genre - couleur grise uniforme
const getGenreColor = (genreName: string) => {
  return 'bg-gray-600'; // Couleur grise pour s'harmoniser avec le thème
};

export function meta({ params }: { params: { id: string } }) {
  // Note: Cette fonction est appelée côté serveur, on ne peut pas accéder aux films ici
  // On utilisera un titre générique et on mettra à jour dynamiquement côté client
  return [
    { title: `Film - MovieStream` },
    { name: "description", content: "Regarder ce film en streaming sur MovieStream" },
  ];
}

export default function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { films, loading } = useFilms();
  const [currentFilm, setCurrentFilm] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Initialiser Google Analytics et suivre la vue de page
  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (films.length > 0 && id) {
      const film = films.find(f => f.id === id);
      if (film) {
        setCurrentFilm(film);
        
        // Debug: analyser le type de film et URL
        const isHLSStream = film.videoUrl.includes('.m3u8') || film.videoUrl.includes('playlist');
        const isDirectVideo = film.videoUrl.includes('.mp4') || film.videoUrl.includes('.mkv') || 
                             film.videoUrl.includes('.avi') || film.videoUrl.includes('.webm');
        const isEphemere = film.ephemere;
        
        const debug = {
          filmTitle: film.title,
          videoUrl: film.videoUrl,
          isEphemere: isEphemere,
          isHLSStream: isHLSStream,
          isDirectVideo: isDirectVideo,
          urlExtension: film.videoUrl.substring(film.videoUrl.lastIndexOf('.')),
          detectedType: isHLSStream ? 'HLS Stream' : isDirectVideo ? 'Direct Video' : 'Unknown',
          shouldUseHLS: isEphemere && isHLSStream
        };
        
        setDebugInfo(debug);
        console.log('🎬 [Watch] Film analysis:', debug);
        
        // Mettre à jour le titre de la page dynamiquement
        document.title = `${film.title} - MovieStream`;
        
        // Mettre à jour la description de la page
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', `Regarder ${film.title} (${film.year}) en streaming gratuit sur MovieStream. ${film.description?.substring(0, 100)}...`);
        }
        
        // Suivre la vue du film avec son titre
        trackFilmView(film.title);
        trackPageView(`/watch/${id}`, `Film: ${film.title}`);
      } else {
        navigate('/');
      }
    }
  }, [films, id, navigate]);

  // Fonction pour sauvegarder la progression
  const handleProgress = (currentTime: number, duration: number) => {
    if (id && currentTime > 5) { // Sauvegarder seulement après 5 secondes
      localStorage.setItem(`film-progress-${id}`, String(currentTime));
    }
  };

  // Récupérer la position sauvegardée
  const getSavedTime = () => {
    if (!id) return 0;
    const saved = localStorage.getItem(`film-progress-${id}`);
    return saved ? parseFloat(saved) : 0;
  };

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
      <header className="bg-[#0D0D0D] py-4 md:px-8 sticky top-0 z-50 border-b border-gray-700">
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
          >
            <span className="text-xl md:text-2xl font-bold select-none">
              Movie<span className="font-normal">Stream</span>
            </span>
          </button>
        </div>
      </header>

      {/* Debug Info Visible */}
      {debugInfo && (
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-bold mb-3 text-yellow-400">🔍 Debug Info (Mobile)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono">
              <div><span className="text-gray-400">Film:</span> <span className="text-white">{debugInfo.filmTitle}</span></div>
              <div><span className="text-gray-400">Type:</span> <span className="text-green-400">{debugInfo.detectedType}</span></div>
              <div><span className="text-gray-400">Éphémère:</span> <span className={debugInfo.isEphemere ? 'text-red-400' : 'text-gray-400'}>{debugInfo.isEphemere ? 'Oui' : 'Non'}</span></div>
              <div><span className="text-gray-400">HLS Stream:</span> <span className={debugInfo.isHLSStream ? 'text-green-400' : 'text-gray-400'}>{debugInfo.isHLSStream ? 'Oui' : 'Non'}</span></div>
              <div><span className="text-gray-400">Vidéo Directe:</span> <span className={debugInfo.isDirectVideo ? 'text-green-400' : 'text-gray-400'}>{debugInfo.isDirectVideo ? 'Oui' : 'Non'}</span></div>
              <div><span className="text-gray-400">Extension:</span> <span className="text-blue-400">{debugInfo.urlExtension}</span></div>
              <div><span className="text-gray-400">Use HLS.js:</span> <span className={debugInfo.shouldUseHLS ? 'text-green-400' : 'text-orange-400'}>{debugInfo.shouldUseHLS ? 'Oui' : 'Non'}</span></div>
            </div>
            <div className="mt-3 text-xs text-gray-400">
              <span className="text-gray-400">URL:</span> <span className="text-blue-300 break-all">{debugInfo.videoUrl}</span>
            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <NetflixVideoPlayer
            src={currentFilm.videoUrl}
            poster={currentFilm.cover}
            title={currentFilm.title}
            isHLS={currentFilm.ephemere && currentFilm.videoUrl?.includes('.m3u8')}
            onProgress={handleProgress}
            savedTime={getSavedTime()}
          />
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



