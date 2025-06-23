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
    // Afficher les films statiques immédiatement (fallback)
    const completeStaticFilms: Film[] = [
      ...staticFilms,
      {
        id: "film11",
        title: "Apocalypse Now",
        cover: "/assets/apocalypse-now-cover.png",
        duration: "3h 02min",
        description: "Chef-d'œuvre de Francis Ford Coppola sur la guerre du Vietnam.",
        year: 1979,
        genre: ["Drame", "Guerre"],
        videoUrl: "https://0x0.st/8lrT.mp4",
      },
      {
        id: "film12",
        title: "8½",
        cover: "/assets/huit et demie.png",
        duration: "2h 18min",
        description: "Fellini explore la crise créative d'un réalisateur.",
        year: 1963,
        genre: ["Drame", "Comédie"],
        videoUrl: "https://0x0.st/8lzm.mp4",
      }
    ];

    console.log('🚀 Affichage immédiat de', completeStaticFilms.length, 'films statiques');
    setFilms(completeStaticFilms);
    setLoading(false);

    // Tentative MongoDB pour récupérer les vraies données
    setTimeout(async () => {
      try {
        console.log('📡 Fetching MongoDB films with metadata...');
        
        const response = await fetch('/.netlify/functions/get-films');
        
        if (response.ok) {
          const mongoFilms = await response.json();
          
          if (mongoFilms.length > 0) {
            console.log('✅ MongoDB films loaded:', mongoFilms.length);
            // Remplacer complètement par les données MongoDB (qui incluent covers depuis /assets)
            setFilms(mongoFilms);
          } else {
            console.log('💾 MongoDB empty, keeping static films');
          }
        } else {
          console.log('⚠️ MongoDB request failed, keeping static films');
        }
      } catch (err) {
        console.log('💾 MongoDB unavailable, keeping static films');
      }
    }, 100);
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