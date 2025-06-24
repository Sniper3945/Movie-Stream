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
    <div className="min-h-screen bg-[#0D0D0D] text-white p-4 md:p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-red-500 to-teal-400 bg-clip-text text-transparent mb-4">
          MovieStream
        </h1>
        <p className="text-lg text-gray-300">
          Découvrez une sélection de films classiques et modernes
        </p>
      </div>

      {/* Films Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {films.map((film, index) => (
          <Link
            key={film.id}
            to={`/watch/${film.id}`}
            className="group block transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
            onClick={() => trackFilmClick(film.title, index)}
          >
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
              {/* Image Section */}
              <div className="relative">
                <img 
                  src={film.cover} 
                  alt={`${film.title} movie poster`}
                  loading="lazy"
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/assets/placeholder.png";
                  }}
                />
                
                {/* Mobile Overlay */}
                <div className="md:hidden absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold">
                    Regarder
                  </button>
                </div>

                {/* Desktop Overlay */}
                <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-4 left-4 right-4">
                    <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      ▶ Regarder maintenant
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2 text-white leading-tight"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                  {film.title}
                </h3>
                <p className="text-teal-400 text-sm mb-2">{film.duration}</p>
                <p className="text-gray-400 text-sm leading-relaxed"
                   style={{
                     display: '-webkit-box',
                     WebkitLineClamp: 3,
                     WebkitBoxOrient: 'vertical',
                     overflow: 'hidden'
                   }}>
                  {film.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}