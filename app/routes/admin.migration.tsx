import { useState } from 'react';
import { useNavigate } from 'react-router';

export default function AdminMigration() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/.netlify/functions/admin-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setMessage('');
      } else {
        setMessage('Mot de passe incorrect');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
    }
  };

  const runMigration = async () => {
    setIsRunning(true);
    setMessage('Migration en cours...');

    try {
      const response = await fetch('/.netlify/functions/migrate-genres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'true'
        }
      });

      const result = await response.json();
      setMigrationResult(result);
      
      if (result.success) {
        setMessage(`✅ Migration réussie ! ${result.stats.migratedCount} films mis à jour.`);
      } else {
        setMessage(`❌ Erreur: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Erreur: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Migration Admin</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe admin"
            className="w-full p-3 bg-gray-800 rounded-lg mb-4"
          />
          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 p-3 rounded-lg font-bold"
          >
            Se connecter
          </button>
          {message && <p className="text-red-400 mt-4 text-center">{message}</p>}
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Migration des Genres</h1>
          <button
            onClick={() => navigate('/admin/ajout')}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
          >
            ← Retour Admin
          </button>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg space-y-6">
          <div className="bg-yellow-900 bg-opacity-50 p-4 rounded-lg border border-yellow-700">
            <h3 className="text-lg font-bold mb-2">⚠️ Attention</h3>
            <p className="text-sm">
              Cette opération va modifier tous les genres de films dans la base de données.
              Assurez-vous d'avoir une sauvegarde avant de continuer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-3">Mapping des Genres</h3>
              <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
                <div><span className="text-gray-400">Policier</span> → <span className="text-green-400">Crime</span></div>
                <div><span className="text-gray-400">Sci-Fi</span> → <span className="text-green-400">Science-Fiction</span></div>
                <div><span className="text-gray-400">Espionnage</span> → <span className="text-green-400">Thriller</span></div>
                <div><span className="text-gray-400">Drama</span> → <span className="text-green-400">Drame</span></div>
                <div><span className="text-gray-400">Comedy</span> → <span className="text-green-400">Comédie</span></div>
                <div className="text-gray-500">+ Conservation des genres valides existants</div>
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-3">Genres Disponibles</h3>
              <div className="flex flex-wrap gap-1 text-xs">
                {[
                  "Action", "Aventure", "Animation", "Comédie", "Crime", "Documentaire",
                  "Drame", "Familial", "Fantasy", "Histoire", "Horreur", "Musique",
                  "Mystère", "Romance", "Science-Fiction", "Thriller", "Guerre", 
                  "Western", "Biopic", "Policier", "Espionnage", "Catastrophe", "Survival"
                ].map(genre => (
                  <span key={genre} className="bg-blue-600 px-2 py-1 rounded-full">
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={runMigration}
            disabled={isRunning}
            className="w-full bg-yellow-600 hover:bg-yellow-700 p-4 rounded-lg font-bold disabled:opacity-50"
          >
            {isRunning ? 'Migration en cours...' : '🚀 Lancer la Migration'}
          </button>

          {message && (
            <div className={`p-4 rounded-lg text-center ${message.includes('✅') ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
              {message}
            </div>
          )}

          {migrationResult && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-3">Résultats de la Migration</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(migrationResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
