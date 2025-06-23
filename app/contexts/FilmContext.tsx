import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { films as staticFilms } from '../data/films';

interface Film {
  id: string;
  title: string;
  cover: string;
  duration: string;
  description: string;
  year?: number;
  genre?: string[];
  videoUrl?: string; // Add this property for MongoDB films
}

interface FilmContextType {
  films: Film[];
  loading: boolean;
  error: string | null;
  refetchFilms: () => Promise<void>;
  getFilmById: (id: string) => Film | undefined;
}

const FilmContext = createContext<FilmContextType | null>(null);

export const useFilms = () => {
  const context = useContext(FilmContext);
  if (!context) {
    throw new Error('useFilms must be used within FilmProvider');
  }
  return context;
};

interface FilmProviderProps {
  children: ReactNode;
}

export const FilmProvider = ({ children }: FilmProviderProps) => {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilms = async () => {
    // Charger immédiatement les données statiques
    const completeStaticFilms = [
      ...staticFilms,
      {
        id: "film11",
        title: "Apocalypse Now",
        cover: "/assets/apocalypse-now-cover.png",
        duration: "3h 02min",
        description: "Chef-d'œuvre de Francis Ford Coppola sur la guerre du Vietnam.",
        year: 1979,
        genre: ["Drame", "Guerre"],
      },
      {
        id: "film12",
        title: "8½",
        cover: "/assets/huit et demie.png",
        duration: "2h 18min",
        description: "Fellini explore la crise créative d'un réalisateur.",
        year: 1963,
        genre: ["Drame", "Comédie"],
      }
    ];

    // Affichage immédiat des films statiques
    setFilms(completeStaticFilms);
    setLoading(false);

    // Tentative MongoDB en arrière-plan (sans bloquer l'UI)
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 3000); // 3s max
      
      const response = await fetch('/.netlify/functions/get-films', {
        signal: controller.signal
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Films MongoDB chargés en arrière-plan:', data.length);
        setFilms(data); // Remplacer les données statiques par MongoDB
      }
    } catch (err) {
      console.log('💾 Utilisation des données statiques (MongoDB indisponible)');
      // Garder les données statiques, pas d'erreur
    }
  };

  useEffect(() => {
    fetchFilms();
  }, []);

  const getFilmById = (id: string): Film | undefined => {
    return films.find(film => film.id === id);
  };

  const value: FilmContextType = {
    films,
    loading,
    error,
    refetchFilms: fetchFilms,
    getFilmById
  };

  return (
    <FilmContext.Provider value={value}>
      {children}
    </FilmContext.Provider>
  );
};