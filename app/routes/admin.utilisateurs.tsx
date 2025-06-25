import { useState } from 'react';
import { useNavigate } from 'react-router';

export default function AdminUtilisateurs() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Users</h1>
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
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          <button
            onClick={() => navigate('/admin/ajout')}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
          >
            ← Retour Admin
          </button>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <div className="text-center py-12">
            <h3 className="text-xl mb-4">🚧 En construction</h3>
            <p className="text-gray-400">
              La gestion des utilisateurs sera disponible dans une prochaine version.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
