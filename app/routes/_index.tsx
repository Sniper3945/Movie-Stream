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
  ];
}

export default function Index() {
  const { films, loading, error } = useFilms();

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
      {/* Header */}
      <header className="bg-[#0D0D0D] py-4 px-4 md:px-8 sticky top-0 z-50 border-b border-gray-700">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-2xl md:text-3xl font-bold">
              Movie<span className="font-normal text-white">Stream</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6 md:absolute md:left-1/2 md:transform md:-translate-x-1/2">
            <a className="hover:text-gray-300" href="#">Home</a>
            <a className="hover:text-gray-300" href="#">Movies</a>
          </nav>
          
          <div className="flex items-center space-x-2 md:space-x-4 mt-4 md:mt-0">
            <div className="relative flex-grow max-w-xs hidden sm:block">
              <input 
                className="swiss-input w-full py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]" 
                placeholder="Rechercher un film..." 
                type="text"
              />
              <span className="material-icons absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">search</span>
            </div>
            
            <div className="relative hidden sm:block">
              <button className="flex items-center text-sm swiss-input py-2 px-3 rounded-md hover:bg-gray-700 transition-colors">
                Sort by
                <span className="material-icons text-sm ml-1">arrow_drop_down</span>
              </button>
              <div className="absolute right-0 mt-2 w-40 bg-[#1A202C] border border-gray-700 rounded-md shadow-lg hidden">
                <a className="block px-4 py-2 text-sm hover:bg-gray-700" href="#">Année</a>
                <a className="block px-4 py-2 text-sm hover:bg-gray-700" href="#">Durée</a>
                <a className="block px-4 py-2 text-sm hover:bg-gray-700" href="#">Genre</a>
              </div>
            </div>
            
            <button className="md:hidden p-2 rounded-full hover:bg-gray-700 transition-colors">
              <span className="material-icons">menu</span>
            </button>
          </div>
        </div>
        
        <div className="mt-4 sm:hidden px-4 flex flex-col items-center">
          <input 
            className="swiss-input w-full max-w-xs py-2 px-4 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]" 
            placeholder="Rechercher un film..." 
            type="text"
          />
          <button className="w-full max-w-xs mt-2 flex items-center justify-center text-sm swiss-input py-2 px-3 rounded-md hover:bg-gray-700 transition-colors">
            Sort by
            <span className="material-icons text-sm ml-1">arrow_drop_down</span>
          </button>
        </div>
        
        <nav className="md:hidden mt-4 px-4 space-y-2 text-center">
          <a className="block hover:text-gray-300 py-1" href="#">Home</a>
          <a className="block hover:text-gray-300 py-1" href="#">Movies</a>
        </nav>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 md:px-8 py-8 flex-grow">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">À l'affiche</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {films.map((film, index) => (
              <Link
                key={film.id}
                to={`/watch/${film.id}`}
                className="movie-card block"
                onClick={() => trackFilmClick(film.title, index)}
              >
                <img 
                  alt={`${film.title} movie poster`} 
                  className="w-full h-auto object-cover" 
                  src={film.cover}
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/assets/placeholder.png";
                  }}
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{film.title}</h3>
                  <p className="text-xs text-gray-400 mb-1">
                    {film.duration} • {film.year} • {Array.isArray(film.genre) ? film.genre.join(', ') : film.genre}
                  </p>
                  <p className="text-sm text-gray-300 leading-tight">
                    {film.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#0D0D0D] border-t border-gray-700 mt-auto">
        <div className="container mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a className="hover:text-white" href="#">À propos</a>
              <a className="hover:text-white" href="#">Contact</a>
              <a className="hover:text-white" href="#">Mentions légales</a>
            </div>
            <p>© 2024 MovieStream. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}