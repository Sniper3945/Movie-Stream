import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useFilms } from '../contexts/FilmContext';
import AdminGuard from './admin.guard';

export default function AdminGestionFilms() {
  const { films, refetchFilms, loading } = useFilms();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const authStatus = sessionStorage.getItem('adminAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/.netlify/functions/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (response.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('adminAuth', 'true');
        setMessage('');
      } else {
        setMessage('Mot de passe incorrect');
      }
    } catch {
      setMessage('Erreur de connexion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce film ?')) return;
    setDeletingId(id);
    try {
      const response = await fetch('/.netlify/functions/admin-delete-film', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': 'true' },
        body: JSON.stringify({ id })
      });
      const result = await response.json();
      if (result.success) {
        setMessage('Film supprimé');
        await refetchFilms();
      } else {
        setMessage(result.error || 'Erreur lors de la suppression');
      }
    } catch {
      setMessage('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-lg max-w-md w-full border border-gray-700">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Gestion Films</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe admin"
            className="swiss-input w-full p-3 rounded-lg mb-4"
          />
          <button type="submit" className="w-full swiss-button p-3 rounded-lg font-bold">Se connecter</button>
          {message && <p className="text-red-400 mt-4 text-center">{message}</p>}
        </form>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        <header className="bg-[#0D0D0D] py-4 px-4 md:px-8 sticky top-0 z-50 border-b border-gray-700">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => navigate('/admin')} className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors">
                <span className="material-icons">arrow_back</span>
              </button>
              <h1 className="text-2xl md:text-3xl font-bold select-none">Gestion des Films</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 md:px-8 py-8">
          <div className="flex justify-end mb-6">
            <button onClick={() => navigate('/admin/ajout')} className="swiss-button px-4 py-2 rounded-lg font-bold">
              <span className="material-icons mr-2">add</span>Ajouter un film
            </button>
          </div>
          {message && <div className="mb-6 p-4 rounded-lg text-center bg-gray-800 text-green-400 border border-green-700">{message}</div>}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-900 rounded-lg border border-gray-700">
              <thead>
                <tr>
                  <th className="p-3 text-left">Titre</th>
                  <th className="p-3 text-left">Année</th>
                  <th className="p-3 text-left">Éphémère</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="p-6 text-center">Chargement...</td></tr>
                ) : films.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center">Aucun film</td></tr>
                ) : films.map(film => (
                  <tr key={film.id} className="border-t border-gray-800">
                    <td className="p-3">{film.title}</td>
                    <td className="p-3">{film.year}</td>
                    <td className="p-3">{film.ephemere ? 'Oui' : 'Non'}</td>
                    <td className="p-3">
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium disabled:opacity-50"
                        onClick={() => handleDelete(film.id)}
                        disabled={deletingId === film.id}
                      >
                        {deletingId === film.id ? 'Suppression...' : 'Supprimer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/admin')}
              className="text-white hover:text-gray-300 transition-colors"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
