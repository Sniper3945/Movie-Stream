import { useState } from 'react';
import { useNavigate } from 'react-router';
import AdminGuard from './admin.guard';

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

  const runUpdateDirectors = async () => {
    setIsRunning(true);
    setMessage('Mise à jour des réalisateurs en cours...');

    try {
      const response = await fetch('/.netlify/functions/update-directors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'true'
        }
      });

      const result = await response.json();
      setMigrationResult(result);

      if (result.success) {
        setMessage(`✅ Mise à jour réussie ! ${result.updatedCount} films modifiés.`);
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
    <AdminGuard>
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Mise à jour des Réalisateurs</h1>
            <button
              onClick={() => navigate('/admin')}
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
            >
              ← Retour Admin
            </button>
          </div>

          <div className="bg-gray-900 p-6 rounded-lg space-y-6">
            <div className="bg-yellow-900 bg-opacity-50 p-4 rounded-lg border border-yellow-700">
              <h3 className="text-lg font-bold mb-2">⚠️ Attention</h3>
              <p className="text-sm">
                Cette opération va ajouter le champ "director" pour les 12 premiers films de la base.<br />
                Assurez-vous d'avoir une sauvegarde avant de continuer.
              </p>
            </div>

            <button
              onClick={runUpdateDirectors}
              disabled={isRunning}
              className="w-full bg-yellow-600 hover:bg-yellow-700 p-4 rounded-lg font-bold disabled:opacity-50"
            >
              {isRunning ? 'Mise à jour en cours...' : '🚀 Mettre à jour les Réalisateurs'}
            </button>

            {message && (
              <div className={`p-4 rounded-lg text-center ${message.includes('✅') ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                {message}
              </div>
            )}

            {migrationResult && (
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold mb-3">Résultats de la mise à jour</h3>
                <pre className="text-sm overflow-auto">
                  {JSON.stringify(migrationResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <button
            onClick={() => navigate("/admin")}
            className="text-white hover:text-gray-300 transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    </AdminGuard>
  );
};