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
    console.log('🚀 [FilmContext] Démarrage du chargement des films');
    console.log('⏱️ [FilmContext] Tentative MongoDB en PRIORITÉ - timeout 4s (ajusté)');
    
    setLoading(true);
    setError(null);

    // 1. PRIORITÉ : Tentative MongoDB avec timeout ajusté à 4s
    const mongoStartTime = performance.now();
    
    try {
      const mongoTimeoutPromise = new Promise<Film[]>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.log('⏱️ [MongoDB] TIMEOUT après 4 secondes');
          reject(new Error('MongoDB timeout'));
        }, 4000); // 4 secondes pour éviter le timeout vu dans HAR (3.2s)

        console.log('📡 [MongoDB] Envoi de la requête...');
        fetch('/.netlify/functions/get-films')
          .then(response => {
            clearTimeout(timeoutId);
            const mongoTime = (performance.now() - mongoStartTime).toFixed(0);
            console.log(`📊 [MongoDB] Réponse reçue en ${mongoTime}ms, status: ${response.status}`);
            
            if (response.ok) {
              return response.json();
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          })
          .then(mongoFilms => {
            clearTimeout(timeoutId);
            const mongoTime = (performance.now() - mongoStartTime).toFixed(0);
            console.log(`✅ [MongoDB] Données parsées en ${mongoTime}ms:`, mongoFilms.length, 'films');
            resolve(mongoFilms);
          })
          .catch((error: any) => {
            clearTimeout(timeoutId);
            const mongoTime = (performance.now() - mongoStartTime).toFixed(0);
            console.log(`❌ [MongoDB] Erreur après ${mongoTime}ms:`, error.message);
            reject(error);
          });
      });

      // Attendre MongoDB en priorité
      const mongoFilms = await mongoTimeoutPromise;
      
      if (mongoFilms.length > 0) {
        const totalTime = (performance.now() - mongoStartTime).toFixed(0);
        console.log(`🎉 [MongoDB] SUCCÈS ! ${mongoFilms.length} films chargés en ${totalTime}ms`);
        setFilms(mongoFilms);
        setLoading(false);
        return; // MongoDB réussi, on s'arrête là
      } else {
        console.log('⚠️ [MongoDB] Réponse vide, passage au fallback');
        throw new Error('MongoDB returned empty array');
      }

    } catch (mongoError: any) {
      const totalTime = (performance.now() - mongoStartTime).toFixed(0);
      console.log(`❌ [MongoDB] ÉCHEC après ${totalTime}ms:`, mongoError.message || 'Unknown error');
      console.log('💾 [Fallback] Chargement des films statiques...');
      
      // 2. FALLBACK : Films statiques seulement si MongoDB échoue
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

      console.log(`📁 [Fallback] ${completeStaticFilms.length} films statiques chargés`);
      setFilms(completeStaticFilms);
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