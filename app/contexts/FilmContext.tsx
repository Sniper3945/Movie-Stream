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
  genre?: string | string[];
  videoUrl?: string;
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
    throw new Error('useFilms must be used within a FilmProvider');
  }
  return context;
};

interface FilmProviderProps {
  children: ReactNode;
}

export const FilmProvider = ({ children }: FilmProviderProps) => {
  const [films, setFilms] = useState<Film[]>(staticFilms); // ← Films statiques affichés immédiatement
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilms = async () => {
    try {
      setLoading(true);
      
      // Timeout de 4 secondes pour MongoDB
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const response = await fetch('/.netlify/functions/get-films', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const mongoFilms = await response.json();
        
        if (mongoFilms && mongoFilms.length > 0) {
          // Combine static films with MongoDB films
          const allFilms = [...staticFilms, ...mongoFilms];
          setFilms(allFilms);
          setError(null);
          return;
        }
      }
      
      // Keep static films if MongoDB fails
      setFilms(staticFilms);
      
    } catch (error: any) {
      // MongoDB timeout or error - keep static films
      setFilms(staticFilms);
      setError(null); // Don't show error, just use fallback
    } finally {
      setLoading(false);
    }
  };

  const getFilmById = (id: string) => {
    return films.find(film => film.id === id);
  };

  useEffect(() => {
    fetchFilms();
  }, []);

  const value = {
    films,
    loading,
    error,
    refetchFilms: fetchFilms,
    getFilmById,
  };

  return (
    <FilmContext.Provider value={value}>
      {children}
    </FilmContext.Provider>
  );
};