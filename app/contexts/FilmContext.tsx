import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  ephemere?: boolean;
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
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilms = async () => {
    try {
      setLoading(true);
      
      // Essayer MongoDB avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      try {
        const response = await fetch(
          '/.netlify/functions/get-films?all=true',
          { signal: controller.signal }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.films && data.films.length > 0) {
            setFilms(data.films);
            setError(null);
            return;
          }
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        // Log silencieux, fallback vers films statiques
      }
      
      // Fallback vers films statiques
      setFilms(staticFilms);
      setError(null);
      
    } catch (error: any) {
      setFilms(staticFilms);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const refetchFilms = useCallback(async () => {
    console.log(`🔄 [FilmContext] Refetch films`);
    await fetchFilms();
  }, []);

  const getFilmById = useCallback((id: string) => {
    return films.find(film => film.id === id);
  }, [films]);

  useEffect(() => {
    fetchFilms();
  }, []);

  const value = {
    films,
    loading,
    error,
    refetchFilms,
    getFilmById,
  };

  return (
    <FilmContext.Provider value={value}>
      {children}
    </FilmContext.Provider>
  );
};