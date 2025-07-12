import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import { useFilms } from "../contexts/FilmContext";
import { trackFilmClick, initialize, trackPageView } from "../utils/analytics";
import Fuse from "fuse.js";
import { useScrollRestoration } from "../hooks/useScrollRestoration";
import { useWaveLoader } from "../hooks/useWaveLoader";
import { LazyImage } from "../components/LazyImage";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon, type SparklesIconHandle } from "../components/SparklesIcon";
import { VERSION_INFO } from "../utils/version";
import { useImageCache } from "../hooks/useImageCache";
import { useGlobalLoader } from "../hooks/useGlobalLoader";
import { WelcomePopup } from "../components/WelcomePopup";
import { useWelcomePopup } from "../hooks/useWelcomePopup";

export function meta() {
  return [
    { title: "MovieStream - Films en streaming" },
    { 
      name: "description", 
      content: "Découvrez une sélection de films classiques et modernes en streaming gratuit." 
    },
    // Version auto-générée - plus besoin de modification manuelle
    { name: "version", content: VERSION_INFO.version },
    { name: "cache-buster", content: VERSION_INFO.cacheBuster }
  ];
}

// Fonction pour obtenir la couleur d'un genre - couleur grise uniforme
const getGenreColor = (genreName: string) => {
  return 'bg-gray-600'; // Couleur grise pour s'harmoniser avec le thème
};

// Composant pour gérer les images avec placeholder
const FilmImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  if (imageError) {
    return (
      <div className={`${className} bg-gray-800 flex items-center justify-center border border-gray-600`}>
        <div className="text-center text-gray-400">
          <span className="material-icons text-4xl mb-2 block">movie</span>
          <p className="text-xs">Image non disponible</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gray-800 flex items-center justify-center border border-gray-600 absolute inset-0`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
};

// Composant pour la section "Idée de film"
const FilmIdeaSection = ({ onClose }: { onClose?: () => void }) => {
  const sparkleRef = useRef<SparklesIconHandle>(null);
  const [formData, setFormData] = useState({
    title: '',
    director: ''
  });
  const [movieSearchResults, setMovieSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);

  // Fonction de nettoyage des caractères dangereux (sans supprimer les espaces)
  const sanitizeInput = (input: string): string => {
    return input
      .replace(/[<>'"&]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .trim()
      .substring(0, 100);
  };

  const searchTMDB = async () => {
    if (!formData.title.trim()) {
      setMessage('Veuillez entrer un titre de film');
      return;
    }

    setIsSearching(true);
    setMessage('');
    setSelectedMovie(null);
    
    try {
      const params = new URLSearchParams({
        title: formData.title,
        ...(formData.director && { director: formData.director })
      });

      const response = await fetch(`/.netlify/functions/search-tmdb?${params}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setMovieSearchResults(data.results);
        setShowResults(true);
      } else {
        setMessage('Aucun film trouvé. Essayez avec un autre titre.');
        setMovieSearchResults([]);
        setShowResults(false);
      }
    } catch (error) {
      setMessage('Erreur lors de la recherche');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectMovie = (movie: any) => {
    setSelectedMovie(movie);
    setFormData({
      title: movie.title,
      director: movie.director || ''
    });
    setShowResults(false);
    setMessage('');
  };

  const submitFilmIdea = async () => {
    setIsSubmitting(true);
    setMessage('');

    try {
      const cleanTitle = sanitizeInput(formData.title);
      const cleanDirector = sanitizeInput(formData.director);

      if (!cleanTitle) {
        setMessage('Le titre du film est requis');
        setIsSubmitting(false);
        return;
      }

      const ideaData = selectedMovie ? {
        title: selectedMovie.title,
        director: selectedMovie.director,
        year: selectedMovie.year,
        overview: selectedMovie.overview,
        tmdbId: selectedMovie.id
      } : {
        title: cleanTitle,
        director: cleanDirector,
        year: null,
        overview: '',
        tmdbId: null
      };

      const response = await fetch('/.netlify/functions/submit-film-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ideaData)
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message);
        // Réinitialiser le formulaire
        setFormData({ title: '', director: '' });
        setMovieSearchResults([]);
        setShowResults(false);
        setSelectedMovie(null);
      } else {
        setMessage(result.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      setMessage('Erreur lors de l\'envoi de votre suggestion');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: 'title' | 'director', value: string) => {
    // Ne pas supprimer les espaces lors de la saisie
    const cleanValue = value
      .replace(/[<>'"&]/g, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+=/gi, "")
      .substring(0, 100);
    
    setFormData(prev => ({ ...prev, [field]: cleanValue }));
    setMessage('');
    setSelectedMovie(null);
    if (showResults) {
      setShowResults(false);
      setMovieSearchResults([]);
    }
  };

  useEffect(() => {
    // Démarrer l'animation de l'icône à l'ouverture du popup
    sparkleRef.current?.startAnimation();
    
    return () => {
      sparkleRef.current?.stopAnimation();
    };
  }, []);

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 w-full max-w-2xl mx-auto max-h-[80vh] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold flex items-center">
          <SparklesIcon 
            ref={sparkleRef}
            size={28} 
            className="mr-3 text-blue-400" 
          />
          Idée de film 
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            aria-label="Fermer"
          >
            <span className="material-icons text-xl">close</span>
          </button>
        )}
      </div>
      
      <p className="text-gray-300 mb-6 text-sm">
        Vous avez une idée de film à ajouter ? Recherchez-le et proposez-le nous !
      </p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom du film <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Ex: Le Parrain"
              className="swiss-input w-full p-3 rounded-lg text-sm"
              maxLength={100}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Réalisateur (optionnel)
            </label>
            <input
              type="text"
              value={formData.director}
              onChange={(e) => handleInputChange('director', e.target.value)}
              placeholder="Ex: Francis Ford Coppola"
              className="swiss-input w-full p-3 rounded-lg text-sm"
              maxLength={100}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={searchTMDB}
            disabled={isSearching || !formData.title.trim()}
            className="flex-1 bg-blue-800 hover:bg-blue-900 text-white p-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center transition-colors"
          >
            {isSearching ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Recherche...
              </>
            ) : (
              <>
                <span className="material-icons text-sm mr-2">search</span>
                Rechercher
              </>
            )}
          </button>
          
          {selectedMovie && (
            <button
              onClick={submitFilmIdea}
              disabled={isSubmitting || !formData.title.trim()}
              className="flex-1 swiss-button p-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  <span className="material-icons text-sm mr-2">send</span>
                  Envoyer
                </>
              )}
            </button>
          )}
        </div>

        {showResults && movieSearchResults.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="font-medium text-gray-300">Sélectionnez un film :</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
              {movieSearchResults.slice(0, 3).map((movie: any, index) => {
                const isSelected = selectedMovie?.id === movie.id;
                return (
                  <div 
                    key={index} 
                    onClick={() => selectMovie(movie)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 group ${
                      isSelected 
                        ? 'border-blue-400 bg-blue-900 bg-opacity-20 ring-2 ring-blue-400 ring-opacity-50' 
                        : 'border-gray-600 bg-gray-800 hover:border-blue-500 hover:bg-gray-750'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0 pr-4">
                        <h5 className={`font-medium text-base transition-colors ${
                          isSelected ? 'text-blue-300' : 'text-white group-hover:text-blue-300'
                        }`}>
                          {movie.title}
                        </h5>
                        <p className="text-xs text-gray-400 mt-2">
                          {movie.year} • {movie.director} • {movie.genres.join(', ')}
                        </p>
                        <p className="text-sm md:text-sm text-xs text-gray-300 mt-2 line-clamp-3">
                          {movie.overview?.substring(0, 200)}...
                        </p>
                      </div>
                      <div className="flex-shrink-0 flex items-center justify-center h-full">
                        <label className="custom-radio-label">
                          <input
                            type="radio"
                            name="movie-selection"
                            checked={isSelected}
                            onChange={() => selectMovie(movie)}
                            className="custom-radio-input"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('Merci') || message.includes('déjà dans notre catalogue') || message.includes('suggérée')
              ? 'bg-blue-900 text-blue-300 border border-blue-700' 
              : 'bg-red-900 text-red-400 border border-red-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default function Index() {
  const { films, loading, error } = useFilms();
  const { preloadImages } = useImageCache();
  const { showLoader, updateProgress, hideLoader } = useGlobalLoader();
  const { showWelcomePopup, closeWelcomePopup } = useWelcomePopup(); // Plus de isLoading
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFilmIdeaPopup, setShowFilmIdeaPopup] = useState(false);
  const [showFilmIdeaTooltip, setShowFilmIdeaTooltip] = useState(false);
  const [hasSeenFilmIdeaFeature, setHasSeenFilmIdeaFeature] = useState(false);

  // Vérifier si l'utilisateur a déjà vu la feature
  useEffect(() => {
    const hasSeenFeature = localStorage.getItem('hasSeenFilmIdeaFeature');
    if (!hasSeenFeature) {
      // Montrer le tooltip après 3 secondes
      setTimeout(() => {
        setShowFilmIdeaTooltip(true);
      }, 3000);
    } else {
      setHasSeenFilmIdeaFeature(true);
    }
  }, []);

  // Marquer la feature comme vue quand l'utilisateur ouvre le popup
  const handleOpenFilmIdea = () => {
    setShowFilmIdeaPopup(true);
    setShowFilmIdeaTooltip(false);
    
    if (!hasSeenFilmIdeaFeature) {
      localStorage.setItem('hasSeenFilmIdeaFeature', 'true');
      setHasSeenFilmIdeaFeature(true);
    }
  };

  // Options de tri
  const sortOptions = [
    { value: "default", label: "Par défaut" },
    { value: "title-asc", label: "Titre (A-Z)" },
    { value: "title-desc", label: "Titre (Z-A)" },
    { value: "year-asc", label: "Année (croissant)" },
    { value: "year-desc", label: "Année (décroissant)" },
    { value: "duration-asc", label: "Durée (courte)" },
    { value: "duration-desc", label: "Durée (longue)" }
  ];

  // Convertir la durée en minutes pour le tri
  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)h\s*(\d+)min/);
    if (match) {
      return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    const hourMatch = duration.match(/(\d+)h/);
    if (hourMatch) {
      return parseInt(hourMatch[1]) * 60;
    }
    const minMatch = duration.match(/(\d+)min/);
    if (minMatch) {
      return parseInt(minMatch[1]);
    }
    return 0;
  };

  // Filtrer et trier les films
  const filteredAndSortedFilms = useMemo(() => {
    let result = [...films];

    if (searchQuery.trim()) {
      const fuse = new Fuse(films, {
        keys: [
          "title",
          {
            name: "genre",
            getFn: (film) => Array.isArray(film.genre) ? film.genre : (film.genre ? film.genre.split(",") : []),
          },
          "year"
        ],
        threshold: 0.4,
      });

      result = fuse.search(searchQuery.trim()).map(res => res.item);
    }

    // Tri
    switch (sortBy) {
      case "title-asc":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "year-asc":
        result.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
      case "year-desc":
        result.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case "duration-asc":
        result.sort((a, b) => parseDuration(a.duration) - parseDuration(b.duration));
        break;
      case "duration-desc":
        result.sort((a, b) => parseDuration(b.duration) - parseDuration(a.duration));
        break;
      default:
        // Garder l'ordre par défaut (par ID ou date de création)
        break;
    }

    return result;
  }, [films, searchQuery, sortBy]);

  // Séparer les films éphémères et non éphémères
  const ephemereFilms = filteredAndSortedFilms.filter(film => film.ephemere);
  const regularFilms = filteredAndSortedFilms.filter(film => !film.ephemere);

  // Utilise le hook pour la page d'accueil (clé unique)
  const { save: saveScrollPosition } = useScrollRestoration({ 
    key: "home",
    enabled: true,
    debug: false, // Désactiver le debug pour réduire les logs
    restoreDelay: 50,
    saveThrottle: 500 // Augmenter le throttle pour moins de logs
  });

  // Système de vagues pour les films réguliers
  const {
    visibleItems: visibleRegularFilms,
    hasMoreWaves: hasMoreRegular,
    isLoading: isLoadingRegular,
    sentinelRef: sentinelRegularRef,
    currentWave: currentRegularWave,
    totalWaves: totalRegularWaves,
    progress: regularProgress,
  } = useWaveLoader({
    items: regularFilms,
    waveCount: 3,
    initialWave: 1,
    debug: false, // Production: pas de debug
  });

  // Système de vagues pour les films éphémères
  const {
    visibleItems: visibleEphemereFilms,
    hasMoreWaves: hasMoreEphemere,
    isLoading: isLoadingEphemere,
    sentinelRef: sentinelEphemereRef,
  } = useWaveLoader({
    items: ephemereFilms,
    waveCount: 2, // Moins de vagues pour les éphémères
    initialWave: 1,
    debug: false, // Production: pas de debug
  });

  // Générer des suggestions basées sur les films disponibles
  const generateSuggestions = (query: string): string[] => {
    if (!query.trim() || query.length < 1) return [];

    const suggestions = new Set<string>();
    const lowerQuery = query.toLowerCase();

    films.forEach(film => {
      // Suggestions par titre
      if (film.title.toLowerCase().includes(lowerQuery)) {
        suggestions.add(film.title);
      }
      
      // Suggestions par genre
      if (film.genre) {
        const genres = Array.isArray(film.genre)
          ? film.genre
          : film.genre.split(','); // Découpe la chaîne en genres individuels
        genres.forEach(genre => {
          if (genre.toLowerCase().includes(lowerQuery)) {
            suggestions.add(genre.trim());
          }
        });
      }
      
      // Suggestions par année/décennie
      if (film.year && film.year.toString().includes(query)) {
        suggestions.add(film.year.toString());
        const decade = Math.floor(film.year / 10) * 10;
        suggestions.add(`Années ${decade}s`);
      }
    });

    return Array.from(suggestions).slice(0, 6);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 0) {
      const suggestions = generateSuggestions(value);
      setSearchSuggestions(suggestions);
      setShowSearchSuggestions(suggestions.length > 0);
    } else {
      setShowSearchSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSearchSuggestions(false);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setShowSortDropdown(false);
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : "Trier par";
  };

  useEffect(() => {
    // Restaure la position de scroll si elle existe (SPA ou retour)
    setTimeout(() => {
      const sessionScroll = sessionStorage.getItem("scroll-restoration:home");
      if (sessionScroll) {
        try {
          const { y, x } = JSON.parse(sessionScroll);
          let tries = 0;
          const maxTries = 30;
          const tryRestore = () => {
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const targetY = Math.min(y, maxScroll);
            window.scrollTo({ top: targetY, left: x || 0, behavior: "auto" });
            if (
              (Math.abs(window.scrollY - targetY) > 2 || (targetY !== 0 && window.scrollY === 0)) &&
              tries < maxTries
            ) {
              tries++;
              setTimeout(tryRestore, 50);
            } else {
              sessionStorage.removeItem("scroll-restoration:home");
            }
          };
          tryRestore();
        } catch (e) {
          // Gestion d'erreur silencieuse
        }
      }
    }, 0);

    // Sauvegarde la position à chaque scroll (sans log flood)
    let lastScroll = window.scrollY;
    let lastSave = Date.now();

    const saveScroll = () => {
      const now = Date.now();
      if (window.scrollY === 0 && sessionStorage.getItem("scroll-restoration:home") === null) {
        return;
      }
      if (Math.abs(window.scrollY - lastScroll) > 100 || now - lastSave > 2000) {
        lastScroll = window.scrollY;
        lastSave = now;
      }
      sessionStorage.setItem("scroll-restoration:home", JSON.stringify({ y: window.scrollY, x: window.scrollX }));
    };
    window.addEventListener("scroll", saveScroll);

    return () => {
      if (window.scrollY !== 0 || sessionStorage.getItem("scroll-restoration:home") !== null) {
        sessionStorage.setItem("scroll-restoration:home", JSON.stringify({ y: window.scrollY, x: window.scrollX }));
      }
      window.removeEventListener("scroll", saveScroll);
    };
  }, []);

  // Initialiser GA et suivre la vue de page avec un titre explicite
  useEffect(() => {
    initialize();
    trackPageView('/', 'Accueil');
  }, []);

  // Force la mise à jour du Service Worker + clear cache - VERSION AUTO
  useEffect(() => {
    console.log(`🚀 App version: ${VERSION_INFO.version} (${VERSION_INFO.buildDate})`);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => {
          reg.update();
          
          if (reg.waiting) {
            const channel = new MessageChannel();
            channel.port1.onmessage = (event) => {
              if (event.data.success) {
                clearAllCaches();
                window.location.reload();
              }
            };
            reg.waiting.postMessage({ type: 'SKIP_WAITING' }, [channel.port2]);
          }
        });
      });

      clearAllCaches();
    }
  }, []);

  // Fonction pour vider tous les caches
  const clearAllCaches = async () => {
    try {
      // Clear service worker caches
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          console.log('✅ Cache SW vidé:', event.data);
        };
        navigator.serviceWorker.controller.postMessage(
          { type: 'CLEAR_CACHE' }, 
          [channel.port2]
        );
      }

      // Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(name => name.includes('moviestream'))
            .map(name => {
              console.log(`🗑️ Suppression cache browser: ${name}`);
              return caches.delete(name);
            })
        );
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des caches:', error);
    }
  };

  // Préchargement intelligent basé sur le comportement utilisateur
  useEffect(() => {
    if (films.length > 0) {
      // Précharger immédiatement les 10 premières images
      const priorityImages = films.slice(0, 10).map(film => film.cover);
      preloadImages(priorityImages);

      // Précharger progressivement le reste avec délai
      setTimeout(() => {
        const remainingImages = films.slice(10, 30).map(film => film.cover);
        preloadImages(remainingImages);
      }, 2000);

      // Précharger le reste en arrière-plan
      setTimeout(() => {
        if (films.length > 30) {
          const backgroundImages = films.slice(30).map(film => film.cover);
          preloadImages(backgroundImages);
        }
      }, 10000);
    }
  }, [films, preloadImages]);

  // Préchargement au hover pour une navigation fluide
  const handleFilmHover = useCallback((film: any) => {
    // Précharger les images des films similaires/suivants
    const currentIndex = films.findIndex(f => f.id === film.id);
    if (currentIndex !== -1) {
      const nextFilms = films.slice(currentIndex + 1, currentIndex + 4);
      const nextImages = nextFilms.map(f => f.cover);
      preloadImages(nextImages);
    }
  }, [films, preloadImages]);

  // Supprimer la condition welcomeLoading qui bloquait tout
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>Chargement des films...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Popup de bienvenue - s'affiche par-dessus sans bloquer */}
      <WelcomePopup 
        isOpen={showWelcomePopup} 
        onClose={closeWelcomePopup} 
      />

      {/* Header */}
      <header className="bg-[#0D0D0D] py-4 md:px-8 sticky top-0 z-50 border-b border-gray-700">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center mb-4 md:mb-0">
            <Link to="/" className="text-2xl md:text-3xl font-bold select-none hover:opacity-80 transition-opacity cursor-pointer">
              Movie<span className="font-normal text-white">Stream</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6 md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
            <a className="hover:text-gray-300" href="#">Accueil</a>
            <a className="hover:text-gray-300" href="#">Films</a>
          </nav>
          
          <div className="hidden md:flex items-center space-x-2 md:space-x-4 mt-4 md:mt-0">
            <div className="relative flex-grow max-w-xs">
              <input 
                className="swiss-input w-full py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]" 
                placeholder="Rechercher" 
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setShowSearchSuggestions(searchSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
              />
              {/* Icône croix si texte, sinon loupe */}
              {searchQuery ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400 text-base focus:outline-none"
                  onClick={() => setSearchQuery("")}
                  tabIndex={-1}
                  aria-label="Effacer la recherche"
                  style={{ width: 24, height: 24, padding: 0 }}
                >
                  <span className="material-icons" style={{ fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>close</span>
                </button>
              ) : (
                <span
                  className="material-icons absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg flex items-center justify-center"
                  style={{ fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  search
                </span>
              )}
              
              {/* Suggestions dropdown */}
              {showSearchSuggestions && (
                <div className="absolute z-20 w-full mt-1 bg-[#1A202C] border border-gray-600 rounded-lg shadow-lg">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg text-sm"
                    >
                      <span className="material-icons text-xs mr-2">search</span>
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center text-sm swiss-input py-2 px-3 rounded-md hover:bg-gray-700 transition-colors"
              >
                {getCurrentSortLabel()}
                <span className="material-icons text-sm ml-1">arrow_drop_down</span>
              </button>
              
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1A202C] border border-gray-700 rounded-md shadow-lg z-20 sort-dropdown">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 first:rounded-t-md last:rounded-b-md transition-colors ${
                        sortBy === option.value ? 'bg-gray-700 text-white' : 'text-gray-300'
                      }`}
                    >
                      {sortBy === option.value && (
                        <span className="material-icons text-xs mr-2">check</span>
                      )}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden w-full">
            {/* Top bar: Logo + Burger */}
            <div className="flex items-center justify-between mb-4">
              <Link to="/" className="text-xl font-bold select-none hover:opacity-80 transition-opacity">
                Movie<span className="font-normal text-white">Stream</span>
              </Link>
              
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <span className="material-icons">
                  {showMobileMenu ? 'close' : 'menu'}
                </span>
              </button>
            </div>

            {/* Search bar + Filter button */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="relative flex-1">
                <input 
                  className="swiss-input w-full h-11 px-4 pr-10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]" 
                  placeholder="Rechercher..." 
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery && setShowSearchSuggestions(searchSuggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                />
                {/* Icône croix si texte, sinon loupe */}
                {searchQuery ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-gray-400 text-base focus:outline-none"
                    onClick={() => setSearchQuery("")}
                    tabIndex={-1}
                    aria-label="Effacer la recherche"
                    style={{ width: 24, height: 24, padding: 0 }}
                  >
                    <span className="material-icons" style={{ fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>close</span>
                  </button>
                ) : (
                  <span
                    className="material-icons absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg flex items-center justify-center"
                    style={{ fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    search
                  </span>
                )}
                
                {/* Mobile suggestions dropdown */}
                {showSearchSuggestions && (
                  <div className="absolute z-20 w-full mt-1 bg-[#1A202C] border border-gray-600 rounded-lg shadow-lg">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg text-sm"
                      >
                        <span className="material-icons text-xs mr-2">search</span>
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Filter button */}
              <div className="relative">
                 <button 
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                    className={`h-11 w-11 flex items-center justify-center rounded-md text-sm transition-colors ${
                      sortBy !== 'default' 
                        ? 'bg-blue-600 text-white' 
                        : 'swiss-input hover:bg-gray-700'
                    }`}
                    title="Filtrer"
                  >
                  <span className="material-icons text-[20px]">tune</span>
                </button>
                
                {showSortDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1A202C] border border-gray-700 rounded-md shadow-lg z-20 sort-dropdown">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 first:rounded-t-md last:rounded-b-md transition-colors ${
                          sortBy === option.value ? 'bg-gray-700 text-white' : 'text-gray-300'
                        }`}
                      >
                        {sortBy === option.value && (
                          <span className="material-icons text-xs mr-2">check</span>
                        )}
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Navigation Menu */}
            {showMobileMenu && (
              <div className="bg-gray-900 rounded-lg p-1 border border-gray-700">
                <nav className="space-y-3">
                  <a 
                    className="block py-2 px-3 rounded-md hover:bg-gray-800 transition-colors" 
                    href="#"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="material-icons text-sm mr-3 align-middle">home</span>
                    Accueil
                  </a>
                  <a 
                    className="block py-2 px-3 rounded-md hover:bg-gray-800 transition-colors" 
                    href="#"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span className="material-icons text-sm mr-3 align-middle">movie</span>
                    Films
                  </a>
                </nav>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 md:px-8 py-8 flex-grow">

        {/* Bandeau résultats de recherche en haut */}
        {searchQuery && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 space-y-2 sm:space-y-0 sm:space-x-4">
            <h2 className="text-2xl font-semibold">
              Résultats de recherche pour "{searchQuery}"
              <span className="block sm:inline text-sm text-gray-400 sm:ml-2">
                {sortBy !== "default" && <>• {getCurrentSortLabel()} </>}
                {regularFilms.length + ephemereFilms.length} film{(regularFilms.length + ephemereFilms.length) !== 1 ? "s" : ""}
              </span>
            </h2>
            {(sortBy !== "default" || searchQuery) && (
              <div className="flex items-center gap-x-4">
                {sortBy !== "default" && (
                  <button
                    onClick={() => setSortBy("default")}
                    className="min-h-0 h-[20px] p-4 px-2 text-xs leading-none bg-gray-700 hover:bg-gray-600 rounded inline-flex items-center justify-center"
                  >
                    <span className="leading-none inline-block">Réinitialiser le tri</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSortBy("default");
                  }}
                  className="min-h-0 h-[20px] p-4 px-2 text-xs leading-none bg-gray-700 hover:bg-gray-600 rounded inline-flex items-center justify-center ml-0 sm:ml-4"
                >
                  <span className="leading-none inline-block">Réinitialiser</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bandeau de tri en haut si tri actif et pas de recherche */}
        {!searchQuery && sortBy !== "default" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 space-y-2 sm:space-y-0 sm:space-x-4">
            <h2 className="text-2xl font-semibold">
              Tri : {getCurrentSortLabel()}
              <span className="block sm:inline text-sm text-gray-400 sm:ml-2">
                {regularFilms.length + ephemereFilms.length} film{(regularFilms.length + ephemereFilms.length) !== 1 ? "s" : ""}
              </span>
            </h2>
            <button
              onClick={() => setSortBy("default")}
              className="min-h-0 h-[20px] p-4 px-2 text-xs leading-none bg-gray-700 hover:bg-gray-600 rounded inline-flex items-center justify-center ml-0 sm:ml-4"
            >
              <span className="leading-none inline-block">Réinitialiser le tri</span>
            </button>
          </div>
        )}

        {/* Affichage catalogue séparé (par défaut, pas de tri, pas de recherche) */}
        {!searchQuery && sortBy === "default" && (
          <>
            {/* Section Éphémère */}
            {ephemereFilms.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-6 flex items-center">
                  Film Éphémère
                  <span className="ml-2 text-sm text-gray-400">
                    ({visibleEphemereFilms.length}/{ephemereFilms.length})
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                  {visibleEphemereFilms.map((film, index) => (
                    <Link
                      key={film.id}
                      to={`/watch/${film.id}`}
                      className="movie-card block group"
                      onClick={() => {
                        saveScrollPosition();
                        trackFilmClick(film.title, index);
                      }}
                    >
                      <div className="relative">
                        <LazyImage
                          src={film.cover}
                          alt={`Affiche du film ${film.title}`}
                          className="w-full aspect-[2/3] object-cover rounded-lg"
                          priority={index < 5} // Les 5 premières images éphémères sont prioritaires
                        />
                        {/* Badge éphémère */}
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg z-10">
                          Éphémère
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end">
                          <div className="p-3 w-full">
                            <h3 className="font-semibold text-sm sm:text-base text-white leading-tight mb-1">{film.title}</h3>
                            <p className="text-xs text-gray-300 mb-2">
                              {film.year} • {film.duration}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {(Array.isArray(film.genre) ? film.genre : film.genre?.split(', ') || [])
                                .slice(0, 2)
                                .map((genre: string, genreIndex: number) => (
                                <span
                                  key={genreIndex}
                                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white ${getGenreColor(genre.trim())}`}
                                >
                                  {genre.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                {/* Sentinel pour les films éphémères */}
                {hasMoreEphemere && (
                  <div ref={sentinelEphemereRef} className="w-full py-8 flex justify-center">
                    {isLoadingEphemere && (
                      <div className="flex items-center space-x-2 text-gray-400">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                        <span>Chargement des films éphémères...</span>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {/* Section À l'affiche */}
            <section className="mb-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 space-y-2 sm:space-y-0 sm:space-x-4">
                <h2 className="text-2xl font-semibold">
                  À l'affiche
                  <span className="ml-2 text-sm text-gray-400">
                    ({visibleRegularFilms.length}/{regularFilms.length})
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                {visibleRegularFilms.map((film, index) => (
                  <Link
                    key={film.id}
                    to={`/watch/${film.id}`}
                    className="movie-card block group"
                    onClick={() => {
                      saveScrollPosition();
                      trackFilmClick(film.title, index);
                    }}
                  >
                    <div className="relative">
                      <LazyImage
                        src={film.cover}
                        alt={`Affiche du film ${film.title}`}
                        className="w-full aspect-[2/3] object-cover rounded-lg"
                        priority={index < 10} // Les 10 premières images régulières sont prioritaires
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end">
                        <div className="p-3 w-full">
                          <h3 className="font-semibold text-sm sm:text-base text-white leading-tight mb-1">{film.title}</h3>
                          <p className="text-xs text-gray-300 mb-2">
                            {film.year} • {film.duration}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(film.genre) ? film.genre : film.genre?.split(', ') || [])
                              .slice(0, 2)
                              .map((genre: string, genreIndex: number) => (
                              <span
                                key={genreIndex}
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white ${getGenreColor(genre.trim())}`}
                              >
                                {genre.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Sentinel pour charger plus de films */}
              {hasMoreRegular && (
                <div ref={sentinelRegularRef} className="w-full py-8 flex justify-center">
                  {isLoadingRegular ? (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                      <span>Chargement de la vague suivante...</span>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">
                      Scroll pour charger plus de films...
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Section d'explication sur les limitations */}
            <section className="mb-12">
              <div className="bg-gray-900/80 rounded-xl p-4 md:p-6 lg:p-8 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-4">
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-800 rounded-full hidden md:flex items-center justify-center border border-gray-600">
                      <span className="material-icons text-gray-300 text-2xl md:text-3xl lg:text-4xl">info</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white mb-3 md:mb-4">
                      Pourquoi si peu de films pour le moment ?
                    </h3>
                    
                    <div className="space-y-3 md:space-y-4 text-gray-300 leading-relaxed">
                      <p className="text-sm md:text-base">
                        Actuellement, MovieStream fonctionne sur un <span className="text-teal-400 font-medium">service payant</span> qui propose un essai gratuit de 14 jours, pour des questions financières
                        je bénéficie de plusieurs essai gratuit en alternant entre plusieurs comptes <span className="text-teal-400 font-medium">(d'ou les films "éphémères")</span>. Cette méthode, bien que peu éthique me permet de 
                        maintenir le site sans frais, mais limite considérablement le nombre de films disponibles.
                      </p>
                      
                      <div className="bg-gray-800/50 rounded-lg p-3 md:p-4 border-l-4 border-teal-500">
                        <div className="flex flex-col md:flex-row md:items-start space-y-2 md:space-y-0 md:space-x-3">
                          <span className="material-icons text-teal-400 text-xl md:text-xl lg:text-2xl flex-shrink-0 mx-auto md:mx-0 md:mt-0.5">lightbulb</span>
                          <div className="text-center md:text-left">
                            <h4 className="font-semibold text-teal-400 mb-2 text-sm md:text-base">Solution pour plus de contenu</h4>
                            <p className="text-sm md:text-base text-gray-300">
                              Si chaque utilisateur contribuait seulement <span className="text-white font-bold">3€</span>, 
                              je pourrais investir dans un serveur dédié (≈ 80-90€) et devenir complètement autonome. 
                              Cela me permettrait d'ajouter <span className="text-white font-bold">plus de 500 films </span> 
                              sans dépendre de services externes !
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-2 sm:space-y-0 sm:space-x-4 pt-2">
                        <div className="flex items-center text-xs md:text-sm text-gray-400">
                          <span className="material-icons text-teal-500 mr-2 text-base md:text-lg">check_circle</span>
                          Actuellement gratuit
                        </div>
                        <div className="flex items-center text-xs md:text-sm text-gray-400">
                          <span className="material-icons text-gray-500 mr-2 text-base md:text-lg">cloud</span>
                          Limité par les services tiers
                        </div>
                        <div className="flex items-center text-xs md:text-sm text-gray-400">
                          <span className="material-icons text-gray-500 mr-2 text-base md:text-lg">trending_up</span>
                          En cours d'amélioration
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Affichage catalogue mélangé (tri actif ou recherche) */}
        {(searchQuery || sortBy !== "default") && (
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
              {filteredAndSortedFilms.map((film, index) => (
                <Link
                  key={film.id}
                  to={`/watch/${film.id}`}
                  className="movie-card block group"
                  onClick={() => {
                    saveScrollPosition();
                    trackFilmClick(film.title, index);
                  }}
                >
                  <div className="relative">
                    <LazyImage
                      src={film.cover}
                      alt={`Affiche du film ${film.title}`}
                      className="w-full aspect-[2/3] object-cover rounded-lg"
                      priority={index < 10} // Les 10 premières images de la recherche sont prioritaires
                    />
                    {/* Badge éphémère si besoin */}
                    {film.ephemere && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-lg z-10">
                        Éphémère
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-end">
                      <div className="p-3 w-full">
                        <h3 className="font-semibold text-sm sm:text-base text-white leading-tight mb-1">{film.title}</h3>
                        <p className="text-xs text-gray-300 mb-2">
                          {film.year} • {film.duration}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(film.genre) ? film.genre : film.genre?.split(', ') || [])
                            .slice(0, 2)
                            .map((genre: string, genreIndex: number) => (
                            <span
                              key={genreIndex}
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white ${getGenreColor(genre.trim())}`}
                            >
                              {genre.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {filteredAndSortedFilms.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <span className="material-icons text-6xl mb-4 block">search_off</span>
                  <p className="text-xl mb-2">Aucun film trouvé</p>
                  <p className="text-sm">
                    Essayez de rechercher par titre, année (ex: 1967) ou décennie (ex: 1960 pour les années 60)
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setSortBy("default");
                  }}
                  className="swiss-button px-6 py-2 rounded-lg hover:bg-opacity-80 transition-colors"
                >
                  Voir tous les films
                </button>
              </div>
            )}
          </section>
        )}

        {/* Popup de bienvenue - doit être rendu en premier pour être au-dessus */}
        <WelcomePopup 
          isOpen={showWelcomePopup} 
          onClose={closeWelcomePopup} 
        />
      </main>

      {/* Footer */}
      <footer className="bg-[#0D0D0D] border-t border-gray-700 mt-auto">
        <div className="container mx-auto px-4 md:px-8 py-8">
          <div className="flex justify-center items-center text-sm text-gray-400">
            <p>© 2025 MovieStream. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Bandeau d'introduction à la feature (première visite) */}
      {!hasSeenFilmIdeaFeature && films.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="hidden md:block fixed top-20 right-4 z-50 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-600 overflow-hidden"
          style={{ maxWidth: '320px' }}
        >
          <div className="flex items-center space-x-2 p-3 text-sm">
            <SparklesIcon size={16} className="text-teal-400 flex-shrink-0" />
            <span className="font-medium flex-1 min-w-0">💡 Nouveau ! Proposez vos idées</span>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={handleOpenFilmIdea}
                className="text-xs bg-teal-600 text-white px-2 py-1 rounded-full font-semibold hover:bg-teal-700 transition-colors"
              >
                Voir
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('hasSeenFilmIdeaFeature', 'true');
                  setHasSeenFilmIdeaFeature(true);
                }}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Bouton flottant amélioré pour idée de film */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40">
        {/* Tooltip de découverte */}
        <AnimatePresence>
          {showFilmIdeaTooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="absolute bottom-full right-0 mb-3 bg-gray-900 text-white p-3 rounded-lg shadow-xl border border-gray-600 max-w-xs"
            >
              <div className="flex items-center space-x-2">
                <SparklesIcon size={16} className="text-teal-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold whitespace-nowrap">Idée de film ?</p>
                  <p className="text-xs text-gray-300">Proposez vos suggestions !</p>
                </div>
                <button
                  onClick={() => setShowFilmIdeaTooltip(false)}
                  className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                >
                  <span className="material-icons text-sm">close</span>
                </button>
              </div>
              {/* Flèche du tooltip */}
              <div className="absolute top-full right-6 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton principal plus grand et plus visible */}
        <motion.button
          onClick={handleOpenFilmIdea}
          className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-blue-700 hover:to-purple-700 rounded-full flex items-center justify-center shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 group overflow-hidden"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={showFilmIdeaTooltip ? { 
            boxShadow: ["0 0 0 0 rgba(59, 130, 246, 0.7)", "0 0 0 10px rgba(59, 130, 246, 0)", "0 0 0 0 rgba(59, 130, 246, 0.7)"]
          } : {}}
          transition={{ 
            boxShadow: { duration: 2, repeat: Infinity }
          }}
        >
          {/* Effet de brillance */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-700 -translate-x-full"></div>
          
          {/* Icône principale */}
          <SparklesIcon 
            size={24} 
            className="text-white group-hover:animate-pulse md:!w-7 md:!h-7 relative z-10" 
          />
          
          {/* Badge de notification (pour les nouveaux utilisateurs) */}
          {!hasSeenFilmIdeaFeature && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
          
          {/* Texte sur hover (desktop seulement) */}
          <div className="hidden md:block absolute -left-32 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Proposer un film
          </div>
        </motion.button>

        {/* Bouton alternatif en cas de petit écran (version compacte avec texte) */}
        <div className="md:hidden absolute bottom-full right-0 mb-2">
          <motion.button
            onClick={handleOpenFilmIdea}
            initial={{ opacity: 0 }}
            animate={{ opacity: hasSeenFilmIdeaFeature ? 0 : 1 }}
            className="bg-gray-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-600"
          >
            <div className="flex items-center space-x-1">
              <SparklesIcon size={12} className="text-teal-400 flex-shrink-0" />
              <span className="whitespace-nowrap">Idée de film</span>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Popup pour idée de film */}
      <AnimatePresence>
        {showFilmIdeaPopup && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilmIdeaPopup(false)}
              className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
            >
              {/* Popup content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full"
              >
                <FilmIdeaSection onClose={() => setShowFilmIdeaPopup(false)} />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}