import { useState, useMemo } from "react";
import { Link } from "react-router";
import { useFilms } from "../contexts/FilmContext";
import { trackFilmClick } from "../utils/analytics";

export function meta() {
  return [
    { title: "MovieStream - Films en streaming" },
    { 
      name: "description", 
      content: "Découvrez une sélection de films classiques et modernes en streaming gratuit." 
    },
    // Ajout d'un meta version pour forcer le cache à se rafraîchir
    { name: "version", content: "2025-06-26-2" }
  ];
}

// Fonction pour obtenir la couleur d'un genre - couleur grise uniforme
const getGenreColor = (genreName: string) => {
  return 'bg-gray-600'; // Couleur grise pour s'harmoniser avec le thème
};

export default function Index() {
  const { films, loading, error } = useFilms();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [filterGenre, setFilterGenre] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

    // Filtrage par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(film => {
        // Search by title
        if (film.title.toLowerCase().includes(query)) {
          return true;
        }

        // Search by exact year
        if (film.year && film.year.toString() === query) {
          return true;
        }

        // Search by década (handle "Années XXXs" format)
        if (query.startsWith('années ') && query.endsWith('s')) {
          const decadeStr = query.replace('années ', '').replace('s', '');
          const decade = parseInt(decadeStr);
          if (!isNaN(decade) && film.year) {
            const filmDecade = Math.floor(film.year / 10) * 10;
            return filmDecade === decade;
          }
        }

        // Search by decade (e.g., "1960" matches 1960-1969)
        if (query.length === 4 && /^\d{4}$/.test(query)) {
          const searchYear = parseInt(query);
          const decade = Math.floor(searchYear / 10) * 10;
          const filmDecade = film.year ? Math.floor(film.year / 10) * 10 : null;
          
          if (filmDecade === decade) {
            return true;
          }
        }

        // Search by genre
        // if (film.genre) {
        //   const genres = Array.isArray(film.genre) ? film.genre : [film.genre];
        //   return genres.some(genre => genre.toLowerCase().includes(query));
        // }

        return false;
      });
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
      // case "genre":
      //   result.sort((a, b) => {
      //     const genreA = Array.isArray(a.genre) ? a.genre[0] : a.genre || "";
      //     const genreB = Array.isArray(b.genre) ? b.genre[0] : b.genre || "";
      //     return genreA.localeCompare(genreB);
      //   });
      //   break;
      default:
        // Garder l'ordre par défaut (par ID ou date de création)
        break;
    }

    return result;
  }, [films, searchQuery, sortBy]);

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
        const genres = Array.isArray(film.genre) ? film.genre : [film.genre];
        genres.forEach(genre => {
          if (genre.toLowerCase().includes(lowerQuery)) {
            suggestions.add(genre);
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

  // Séparer les films éphémères et non éphémères
  const ephemereFilms = filteredAndSortedFilms.filter(film => film.ephemere);
  const regularFilms = filteredAndSortedFilms.filter(film => !film.ephemere);

  return (
    <div className="flex flex-col min-h-screen">
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
              <span className="material-icons absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">search</span>
              
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
                <span className="material-icons absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">search</span>
                
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
        {/* Section Éphémère */}
        {ephemereFilms.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6  flex items-center">
              Film Éphémère
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
              {ephemereFilms.map((film, index) => (
                <Link
                  key={film.id}
                  to={`/watch/${film.id}`}
                  className="movie-card block group"
                  onClick={() => trackFilmClick(film.title, index)}
                >
                  <div className="relative">
                    <img 
                      alt={`Affiche du film ${film.title}`} 
                      className="w-full aspect-[2/3] object-cover rounded-lg" 
                      src={film.cover}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/assets/placeholder.png";
                      }}
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
                            .map((genre, genreIndex) => (
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
          </section>
        )}
        {/* Section À l'affiche (hors éphémère) */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 space-y-2 sm:space-y-0 sm:space-x-4">
            <h2 className="text-2xl font-semibold">
              {searchQuery ? `Résultats de recherche pour "${searchQuery}"` : "À l'affiche"}
              {sortBy !== "default" && (
                <span className="block sm:inline text-sm text-gray-400 sm:ml-2">
                  • {getCurrentSortLabel()}
                </span>
              )}
            </h2>
            {(searchQuery || sortBy !== "default") && (
              <div className="flex items-center gap-x-4">
                <span className="text-sm text-gray-400">
                  {regularFilms.length} film{regularFilms.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSortBy("default");
                  }}
                  className="min-h-0 h-[20px] p-4 px-2 text-xs leading-none bg-gray-700 hover:bg-gray-600 rounded inline-flex items-center justify-center"
                >
                  <span className="leading-none inline-block">Réinitialiser</span>
                </button>
              </div>
            )}
          </div>
          {regularFilms.length === 0 && searchQuery ? (
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
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
              {regularFilms.map((film, index) => (
                <Link
                  key={film.id}
                  to={`/watch/${film.id}`}
                  className="movie-card block group"
                  onClick={() => trackFilmClick(film.title, index)}
                >
                  <div className="relative">
                    <img 
                      alt={`Affiche du film ${film.title}`} 
                      className="w-full aspect-[2/3] object-cover rounded-lg" 
                      src={film.cover}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/assets/placeholder.png";
                      }}
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
                            .map((genre, genreIndex) => (
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
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0D0D0D] border-t border-gray-700 mt-auto">
        <div className="container mx-auto px-4 md:px-8 py-8">
          <div className="flex justify-center items-center text-sm text-gray-400">
          {/* <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400"> */}
            {/* <div className="flex space-x-6 mb-4 md:mb-0">
              <a className="hover:text-white" href="#">À propos</a>
              <a className="hover:text-white" href="#">Contact</a>
              <a className="hover:text-white" href="#">Mentions légales</a>
            </div> */}
            <p>© 2025 MovieStream. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}