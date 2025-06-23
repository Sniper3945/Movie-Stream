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
    try {
      setLoading(true);
      setError(null);
      
      // Réduire le timeout pour accélérer le fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes seulement
      
      const response = await fetch('/.netlify/functions/get-films', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error('Failed to fetch films from MongoDB');
      }
      
      const data = await response.json();
      console.log('Films récupérés:', data);
      setFilms(data);
    } catch (err) {
      // Fallback rapide aux données statiques
      console.warn('Using static data as fallback:', err);
      setFilms(staticFilms);
      setError(null);
    } finally {
      setLoading(false);
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