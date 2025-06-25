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
  const [films, setFilms] = useState<Film[]>(staticFilms);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilms = async () => {
    try {
      setLoading(true);
      
      // Essayer MongoDB d'abord (avec timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      try {
        const response = await fetch('/.netlify/functions/get-films', {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const mongoFilms = await response.json();
          
          if (mongoFilms && mongoFilms.length > 0) {
            setFilms(mongoFilms);
            setError(null);
            return;
          }
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.log('MongoDB fetch failed, using static films:', fetchError);
      }
      
      // Fallback vers films statiques
      setFilms(staticFilms);
      setError(null);
      
    } catch (error: any) {
      console.error('Error in fetchFilms:', error);
      setFilms(staticFilms);
      setError(null);
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