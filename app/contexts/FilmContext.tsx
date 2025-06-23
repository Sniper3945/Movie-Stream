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
    // 1. Charger immédiatement les 12 films statiques (film1.png à film12.png)
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

    // Affichage instantané - utilisable immédiatement
    console.log('⚡ Chargement instantané:', completeStaticFilms.length, 'films statiques');
    setFilms(completeStaticFilms);
    setLoading(false);

    // 2. Tentative MongoDB avec timeout strict de 4s
    const startTime = performance.now();
    
    const mongoTimeoutPromise = new Promise<Film[]>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.log('⏱️ MongoDB timeout après 4s - conserve les films statiques');
        reject(new Error('MongoDB timeout'));
      }, 4000); // 4 secondes MAX

      fetch('/.netlify/functions/get-films')
        .then(response => {
          clearTimeout(timeoutId);
          if (response.ok) {
            return response.json();
          }
          throw new Error(`HTTP ${response.status}`);
        })
        .then(mongoFilms => {
          clearTimeout(timeoutId);
          resolve(mongoFilms);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });

    // 3. Essayer MongoDB en arrière-plan
    try {
      const mongoFilms = await mongoTimeoutPromise;
      const loadTime = (performance.now() - startTime).toFixed(0);
      
      if (mongoFilms.length > 0) {
        // Combiner films statiques + MongoDB (film13.png, film14.png, etc.)
        const allFilms = [...completeStaticFilms, ...mongoFilms];
        console.log(`✅ MongoDB chargé en ${loadTime}ms:`, mongoFilms.length, 'nouveaux films');
        console.log(`📊 Total: ${allFilms.length} films (${completeStaticFilms.length} statiques + ${mongoFilms.length} MongoDB)`);
        setFilms(allFilms);
      } else {
        console.log('💾 MongoDB vide - films statiques conservés');
      }
    } catch (error) {
      console.log('💾 MongoDB indisponible - films statiques conservés');
      // Les films statiques sont déjà affichés, rien à faire
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