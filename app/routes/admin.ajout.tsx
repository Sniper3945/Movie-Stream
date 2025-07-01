import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import AdminGuard from "./admin.guard";

interface FilmForm {
  title: string;
  duration: string;
  year: number;
  genre: string;
  description: string;
  videoUrl: string;
  director: string;
  ephemere: boolean; // Ajout du champ éphémère
}

// Simple encryption function - FIX pour les caractères spéciaux
const encryptData = (data: string): string => {
  try {
    // Gestion correcte des caractères UTF-8
    return btoa(unescape(encodeURIComponent(data)));
  } catch (error) {
    console.error('Encryption error:', error);
    return btoa(data);
  }
};

// Liste des genres disponibles avec couleur grise uniforme
const AVAILABLE_GENRES = [
  { name: "Action", color: "bg-gray-600" },
  { name: "Aventure", color: "bg-gray-600" },
  { name: "Animation", color: "bg-gray-600" },
  { name: "Comédie", color: "bg-gray-600" },
  { name: "Crime", color: "bg-gray-600" },
  { name: "Documentaire", color: "bg-gray-600" },
  { name: "Drame", color: "bg-gray-600" },
  { name: "Familial", color: "bg-gray-600" },
  { name: "Fantasy", color: "bg-gray-600" },
  { name: "Histoire", color: "bg-gray-600" },
  { name: "Horreur", color: "bg-gray-600" },
  { name: "Musique", color: "bg-gray-600" },
  { name: "Mystère", color: "bg-gray-600" },
  { name: "Romance", color: "bg-gray-600" },
  { name: "Science-Fiction", color: "bg-gray-600" },
  { name: "Thriller", color: "bg-gray-600" },
  { name: "Guerre", color: "bg-gray-600" },
  { name: "Western", color: "bg-gray-600" },
  { name: "Biopic", color: "bg-gray-600" },
  { name: "Policier", color: "bg-gray-600" },
  { name: "Espionnage", color: "bg-gray-600" },
  { name: "Catastrophe", color: "bg-gray-600" },
  { name: "Survival", color: "bg-gray-600" }
];

export default function AdminAjout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FilmForm>({
    title: '',
    duration: '',
    year: new Date().getFullYear(),
    genre: '',
    description: '',
    videoUrl: '',
    director: '',
    ephemere: false // Initialisation
  });
  const [message, setMessage] = useState('');
  const [movieSearchResults, setMovieSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [genreSuggestions, setGenreSuggestions] = useState<string[]>([]);
  const [directorQuery, setDirectorQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [genreInput, setGenreInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/.netlify/functions/admin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('adminAuth', 'true');
        setMessage('');
      } else {
        setMessage('Mot de passe incorrect');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!form.title || !form.description || !form.videoUrl) {
        setMessage('Tous les champs sont requis');
        setSubmitting(false);
        return;
      }

      // Use JSON instead of FormData since we're not uploading covers to MongoDB
      const filmData = {
        title: encryptData(form.title),
        duration: form.duration,
        year: form.year.toString(),
        genre: form.genre,
        description: encryptData(form.description),
        videoUrl: encryptData(form.videoUrl),
        director: form.director,
        ephemere: form.ephemere // Ajout à l'objet envoyé
      };
      
      const response = await fetch('/.netlify/functions/admin-add-film', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'true'
        },
        body: JSON.stringify(filmData)
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ ${result.message}`);
        if (result.coverInstruction) {
          setMessage(prev => prev + `\n\n📁 ${result.coverInstruction.replace(/\.png/, '.webp')}`);
        }
        
        // Reset form
        setForm({
          title: '',
          duration: '',
          year: new Date().getFullYear(),
          genre: '',
          description: '',
          videoUrl: '',
          director: '',
          ephemere: false
        });
        setSelectedGenres([]);
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`❌ Erreur: ${error.message}`);
      } else {
        setMessage('❌ Erreur inconnue');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Autocomplétion pour les genres
  const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setForm({...form, genre: value});
    
    if (value.length > 0) {
      const suggestions = AVAILABLE_GENRES.filter(genre => 
        genre.name.toLowerCase().includes(value.toLowerCase())
      );
      setGenreSuggestions(suggestions.map(g => g.name));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Gestion des genres avec badges
  const handleGenreInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGenreInput(value);
    
    if (value.length > 0) {
      const suggestions = AVAILABLE_GENRES.filter(genre => 
        genre.name.toLowerCase().includes(value.toLowerCase()) &&
        !selectedGenres.includes(genre.name)
      );
      setGenreSuggestions(suggestions.map(g => g.name));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const addGenre = (genreName: string) => {
    if (!selectedGenres.includes(genreName)) {
      const newGenres = [...selectedGenres, genreName];
      setSelectedGenres(newGenres);
      setForm({...form, genre: newGenres.join(', ')});
    }
    setGenreInput('');
    setShowSuggestions(false);
  };

  const removeGenre = (genreToRemove: string) => {
    const newGenres = selectedGenres.filter(genre => genre !== genreToRemove);
    setSelectedGenres(newGenres);
    setForm({...form, genre: newGenres.join(', ')});
  };

  const getGenreColor = (genreName: string) => {
    return 'bg-gray-600'; // Couleur grise uniforme pour tous les genres
  };

  // Recherche TMDB
  const searchMovie = async () => {
    if (!form.title.trim()) {
      setMessage('Veuillez entrer un titre de film');
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({
        title: form.title,
        ...(directorQuery && { director: directorQuery })
      });

      const response = await fetch(`/.netlify/functions/search-tmdb?${params}`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setMovieSearchResults(data.results);
        setMessage(`${data.results.length} film(s) trouvé(s)`);
      } else {
        setMessage('Aucun film trouvé');
        setMovieSearchResults([]);
      }
    } catch (error) {
      setMessage('Erreur lors de la recherche');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Sélectionner un film depuis les résultats TMDB
  const selectMovieFromTMDB = (movie: any) => {
    const movieGenres = Array.isArray(movie.genres) ? movie.genres : [];
    setSelectedGenres(movieGenres);

    setForm({
      ...form,
      title: movie.title || "",
      year: movie.year ? parseInt(movie.year) : new Date().getFullYear(),
      genre: movieGenres.join(', '),
      description: movie.overview || "",
      duration: movie.runtime
        ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}min`
        : form.duration,
      director: movie.director || ""
    });
    setDirectorQuery(movie.director || "");
    setMovieSearchResults([]);
    setMessage(`Film sélectionné: ${movie.title} (${movie.year})`);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        {/* Header */}
        <header className="bg-[#0D0D0D] py-4 px-4 md:px-8 sticky top-0 z-50 border-b border-gray-700">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <span className="material-icons">arrow_back</span>
              </button>
              <h1 className="text-2xl md:text-3xl font-bold select-none">
                Movie<span className="font-normal">Stream</span> Admin
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/migration')}
                className="hidden sm:flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
              >
                <span className="material-icons text-sm mr-2">sync</span>
                Migration
              </button>
              <button
                onClick={() => navigate('/admin/gestion')}
                className="hidden sm:flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors ml-2"
              >
                <span className="material-icons text-sm mr-2">delete</span>
                Gérer/Supprimer
              </button>
              <button className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                <span className="material-icons">settings</span>
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 md:px-8 py-8">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            
            {/* Section recherche TMDB */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <span className="material-icons mr-3 text-blue-400">search</span>
                Recherche automatique (TMDB)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block mb-2 font-bold text-gray-300">Titre du film</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({...form, title: e.target.value})}
                    className="swiss-input w-full p-3 rounded-lg"
                    placeholder="Ex: Le Samouraï"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-bold text-gray-300">Réalisateur (optionnel)</label>
                  <input
                    type="text"
                    value={directorQuery}
                    onChange={(e) => setDirectorQuery(e.target.value)}
                    className="swiss-input w-full p-3 rounded-lg"
                    placeholder="Ex: Jean-Pierre Melville"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={searchMovie}
                disabled={isSearching}
                className="w-full swiss-button p-4 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Recherche en cours...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">search</span>
                    Rechercher sur TMDB
                  </>
                )}
              </button>

              {/* Résultats de recherche */}
              {movieSearchResults.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-bold text-lg">Résultats trouvés :</h4>
                  {movieSearchResults.map((movie: any, index) => (
                    <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-bold text-lg mb-2">{movie.title}</h5>
                          <p className="text-sm text-gray-400 mb-3">
                            {movie.year} • {movie.director} • {movie.genres.join(', ')}
                          </p>
                          <p className="text-sm text-gray-300">{movie.overview?.substring(0, 150)}...</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => selectMovieFromTMDB(movie)}
                          className="ml-4 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Sélectionner
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
              {message && (
                <div className={`mt-6 p-4 rounded-lg text-center whitespace-pre-line ${
                  message.includes('✅') ? 'bg-green-900 text-green-400 border border-green-700' : 'bg-red-900 text-red-400 border border-red-700'
                }`}>
                  {message}
                </div>
              )}
            {/* Formulaire manuel */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <span className="material-icons mr-3 text-green-400">edit</span>
                Informations du film
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block mb-2 font-bold text-gray-300">Durée</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({...form, duration: e.target.value})}
                    placeholder="1h 30min"
                    className="swiss-input w-full p-3 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 font-bold text-gray-300">Année</label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({...form, year: parseInt(e.target.value)})}
                    className="swiss-input w-full p-3 rounded-lg"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-bold text-gray-300">Réalisateur</label>
                <input
                  type="text"
                  value={form.director}
                  onChange={(e) => setForm({...form, director: e.target.value})}
                  placeholder="Ex: Jean-Pierre Melville"
                  className="swiss-input w-full p-3 rounded-lg"
                />
                <p className="text-gray-400 text-sm mt-2">
                  Nom du réalisateur (optionnel)
                </p>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-bold text-gray-300">Genres</label>
                
                {/* Badges des genres sélectionnés */}
                {selectedGenres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
                    {selectedGenres.map((genre, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getGenreColor(genre)}`}
                      >
                        {genre}
                        <button
                          type="button"
                          onClick={() => removeGenre(genre)}
                          className="ml-2 hover:bg-black hover:bg-opacity-20 rounded-full p-1 transition-colors"
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Input pour ajouter des genres */}
                <div className="relative">
                  <input
                    type="text"
                    value={genreInput}
                    onChange={handleGenreInputChange}
                    placeholder="Tapez pour ajouter un genre..."
                    className="swiss-input w-full p-3 rounded-lg"
                  />
                  
                  {/* Suggestions dropdown */}
                  {showSuggestions && genreSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {genreSuggestions.map((genreName, index) => {
                        const genreData = AVAILABLE_GENRES.find(g => g.name === genreName);
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => addGenre(genreName)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg flex items-center transition-colors"
                          >
                            <span className={`w-3 h-3 rounded-full mr-3 ${genreData?.color || 'bg-gray-500'}`}></span>
                            {genreName}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Genres populaires en accès rapide */}
                <div className="mt-4">
                  <p className="text-sm text-gray-400 mb-3">Genres populaires :</p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_GENRES.slice(0, 8).map((genre) => (
                      !selectedGenres.includes(genre.name) && (
                        <button
                          key={genre.name}
                          type="button"
                          onClick={() => addGenre(genre.name)}
                          className={`px-3 py-1 rounded-full text-sm font-medium text-white hover:opacity-80 transition-opacity ${genre.color}`}
                        >
                          + {genre.name}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-bold text-gray-300">URL de la vidéo</label>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm({...form, videoUrl: e.target.value})}
                  placeholder="https://0x0.st/example.mp4"
                  className="swiss-input w-full p-3 rounded-lg"
                  required
                />
                <p className="text-gray-400 text-sm mt-2">
                  URL directe vers le fichier vidéo (0x0.st, etc.)
                </p>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-bold text-gray-300">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  rows={4}
                  className="swiss-input w-full p-3 rounded-lg"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-bold text-gray-300">Cover (Information)</label>
                <div className="w-full p-4 bg-gray-800 rounded-lg text-gray-300 border border-gray-600">
                  <div className="flex items-center">
                    <span className="material-icons mr-3 text-blue-400">info</span>
                    <div>
                      <p className="font-medium">Gestion des covers</p>
                      <p className="text-sm text-gray-400">
                        Les covers sont gérées dans /public/assets/. Après ajout du film, 
                        placez votre image cover dans le dossier assets avec le nom indiqué dans la confirmation.<br />
                        <span className="text-yellow-400">Format recommandé : <b>.webp</b> (ex : film13.webp)</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 font-bold text-gray-300">Film éphémère</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={form.ephemere}
                    onChange={e => setForm({ ...form, ephemere: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-blue-600"
                    id="ephemere-checkbox"
                  />
                  <label htmlFor="ephemere-checkbox" className="text-gray-300 select-none cursor-pointer">
                    Ce film sera affiché dans la section "Éphémère" sur la page d'accueil
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full swiss-button p-4 rounded-lg font-bold disabled:opacity-50 flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Ajout en cours...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">add</span>
                    Ajouter le Film
                  </>
                )}
              </button>
              {message && (
                <div className={`mt-6 p-4 rounded-lg text-center whitespace-pre-line ${
                  message.includes('✅') ? 'bg-green-900 text-green-400 border border-green-700' : 'bg-red-900 text-red-400 border border-red-700'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
}