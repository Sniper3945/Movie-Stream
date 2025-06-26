import { useState, useEffect } from 'react';
import AdminGuard from "./admin.guard";
import { useNavigate } from "react-router";

interface EnvData {
  environmentVariables: {
    [key: string]: string;
  };
  mongoDetails?: {
    app_uri: string;
    admin_uri: string;
  };
  timestamp: string;
  region: string;
}

interface MongoTest {
  success?: boolean;
  message?: string;
  details?: any;
  error?: string;
}

interface IpData {
  message: string;
  detectedIPs: any;
  recommendation?: {
    primary: string;
    action: string;
  };
  netlifyRegion: string;
  timestamp: string;
}

function Debug() {
  const navigate = useNavigate();
  const [envData, setEnvData] = useState<EnvData | null>(null);
  const [mongoTest, setMongoTest] = useState<MongoTest | null>(null);
  const [ipData, setIpData] = useState<IpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [genreAnalysis, setGenreAnalysis] = useState<any>(null);

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        // Test environment variables
        const envResponse = await fetch('/.netlify/functions/debug-env');
        const envResult = await envResponse.json();
        setEnvData(envResult);

        // Test MongoDB connection
        const mongoResponse = await fetch('/.netlify/functions/test-mongo');
        const mongoResult = await mongoResponse.json();
        setMongoTest(mongoResult);

        // Get Netlify IP
        const ipResponse = await fetch('/.netlify/functions/get-netlify-ip');
        const ipResult = await ipResponse.json();
        setIpData(ipResult);

        // Analyser les genres des films
        const filmsResponse = await fetch('/.netlify/functions/get-films');
        const filmsData = await filmsResponse.json();
        
        if (filmsData && filmsData.length > 0) {
          const genreSet = new Set<string>();
          const genreCount: { [key: string]: number } = {};
          
          filmsData.forEach((film: any) => {
            if (film.genre) {
              const genres = Array.isArray(film.genre) ? film.genre : film.genre.split(', ');
              genres.forEach((genre: string) => {
                const cleanGenre = genre.trim();
                genreSet.add(cleanGenre);
                genreCount[cleanGenre] = (genreCount[cleanGenre] || 0) + 1;
              });
            }
          });

          setGenreAnalysis({
            uniqueGenres: Array.from(genreSet),
            genreCount,
            totalFilms: filmsData.length
          });
        }
        
      } catch (error) {
        console.error('Debug error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold mb-6">Debug MovieStream</h1>
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-teal-400 border-t-transparent border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p>Diagnostic en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Debug MovieStream</h1>
      
      {/* Environment Variables */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Variables d'environnement</h2>
        <pre className="bg-black p-4 rounded text-sm overflow-auto">
          {JSON.stringify(envData, null, 2)}
        </pre>
      </div>

      {/* MongoDB Test */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Test MongoDB</h2>
        <div className={`p-4 rounded ${mongoTest?.success ? 'bg-green-900' : 'bg-red-900'}`}>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(mongoTest, null, 2)}
          </pre>
        </div>
      </div>

      {/* IP Information */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">IP Netlify</h2>
        <pre className="bg-black p-4 rounded text-sm overflow-auto">
          {JSON.stringify(ipData, null, 2)}
        </pre>
        {ipData?.recommendation && (
          <div className="mt-4 p-4 bg-yellow-900 rounded">
            <p className="font-bold">Action requise :</p>
            <p>IP à ajouter : {ipData.recommendation.primary}</p>
            <p>{ipData.recommendation.action}</p>
          </div>
        )}
      </div>

      {/* Genre Analysis */}
      {genreAnalysis && (
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Analyse des Genres Actuels</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-bold mb-3">Genres Uniques ({genreAnalysis.uniqueGenres.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {genreAnalysis.uniqueGenres.map((genre: string, index: number) => (
                  <div key={index} className="flex justify-between items-center bg-gray-800 p-2 rounded">
                    <span>{genre}</span>
                    <span className="text-gray-400">({genreAnalysis.genreCount[genre]})</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-3">Mapping Suggéré</h3>
              <div className="space-y-2 text-sm">
                <div className="p-3 bg-blue-900 rounded">
                  <p className="font-bold mb-2">Genres à conserver :</p>
                  <p className="text-gray-300">Action, Drame, Thriller, Romance, Comédie</p>
                </div>
                <div className="p-3 bg-yellow-900 rounded">
                  <p className="font-bold mb-2">Genres à renommer :</p>
                  <p className="text-gray-300">
                    "Policier" → "Crime"<br/>
                    "Sci-Fi" → "Science-Fiction"<br/>
                    "Espionnage" → "Thriller"
                  </p>
                </div>
                <div className="p-3 bg-green-900 rounded">
                  <p className="font-bold mb-2">Nouveaux genres disponibles :</p>
                  <p className="text-gray-300">Animation, Fantasy, Horreur, Western, Biopic</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => navigate("/admin")}
        className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg transition-colors"
      >
        ← Retour Admin
      </button>
    </div>
  );
}

export default function DebugPage() {
  const navigate = useNavigate();
  return (
    <AdminGuard>
      <Debug />
      <button
        onClick={() => navigate("/admin")}
        className="text-white hover:text-gray-300 transition-colors"
      >
        Retour au dashboard
      </button>
    </AdminGuard>
  );
}
