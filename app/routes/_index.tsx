import type { Route } from "./+types/_index";
import { Link } from "react-router";
import { useFilms } from "../contexts/FilmContext";
import { trackFilmClick } from "../utils/analytics";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MovieStream - Votre collection de films personnelle" },
    { name: "description", content: "Découvrez votre collection de films en streaming" },
  ];
}

export default function Index() {
  const { films, loading, error } = useFilms();

  const handleFilmClick = (filmId: string, filmTitle: string) => {
    trackFilmClick(filmId, filmTitle);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-teal-400 border-t-transparent border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Chargement des films...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Erreur</h2>
          <p className="mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-5">
      <header className="text-center mb-8 md:mb-10">
        <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-red-400 to-teal-400 bg-clip-text text-transparent">
          MovieStream
        </h1>
        <p className="text-gray-300 text-lg md:text-xl">Votre collection de films personnelle</p>
      </header>
      
      <main className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {films.map(film => (
            <Link
              key={film.id}
              to={`/watch/${film.id}`}
              className="bg-gray-900 rounded-xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl block"
              onClick={() => handleFilmClick(film.id, film.title)}
            >
              <div className="relative group">
                <img 
                  src={film.cover} 
                  alt={film.title}
                  loading="lazy" // Lazy loading natif
                  className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-100"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/placeholder.png';
                  }}
                  style={{
                    minHeight: '300px', // Évite le layout shift
                    backgroundColor: '#1f2937' // Placeholder gris
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 md:hidden">
                  <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2 text-sm">
                    ▶ Regarder
                  </div>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-70 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex">
                  <div className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold transition-colors flex items-center gap-2">
                    ▶ Regarder
                  </div>
                </div>
              </div>
              <div className="p-4 md:p-5">
                <h3 className="text-lg md:text-xl font-bold mb-2 text-ellipsis overflow-hidden whitespace-nowrap">{film.title}</h3>
                <p className="text-teal-400 font-bold mb-2 text-sm md:text-base">{film.duration}</p>
                <p className="text-gray-400 leading-relaxed text-sm md:text-base line-clamp-3">{film.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}


