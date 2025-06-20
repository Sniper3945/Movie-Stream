import type { Route } from "./+types/_index";
import { Link } from "react-router";
import { films } from "../data/films";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "MovieStream - Votre collection de films personnelle" },
    { name: "description", content: "Découvrez votre collection de films en streaming" },
  ];
}

export default function Index() {
  return (
    <div className="min-h-screen bg-black text-white p-5">
      <header className="text-center mb-10">
        <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-red-400 to-teal-400 bg-clip-text text-transparent">
          MovieStream
        </h1>
        <p className="text-gray-300 text-xl">Votre collection de films personnelle</p>
      </header>
      
      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {films.map(film => (
            <div key={film.id} className="bg-gray-900 rounded-xl overflow-hidden transform transition-transform hover:-translate-y-2 min-h-[500px]">
              <div className="relative group">
                <img 
                  src={film.cover} 
                  alt={film.title}
                  className="w-full h-80 object-cover object-top transition-transform group-hover:scale-100"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/placeholder.png';
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link 
                    to={`/watch/${film.id}`} 
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold transition-colors flex items-center gap-2"
                  >
                    ▶ Regarder
                  </Link>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold mb-2">{film.title}</h3>
                <p className="text-teal-400 font-bold mb-2">{film.duration}</p>
                <p className="text-gray-400 leading-relaxed">{film.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
