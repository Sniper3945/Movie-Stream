import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import AdminGuard from "./admin.guard";

interface EphemereFilm {
  _id: string;
  title: string;
  year: number;
  director: string;
  videoUrl: string;
  duration: string;
  genre: string;
}

// Simple encryption function
const encryptData = (data: string): string => {
  try {
    return btoa(unescape(encodeURIComponent(data)));
  } catch (error) {
    console.error('Encryption error:', error);
    return btoa(data);
  }
};

export default function AdminEphemere() {
  const [ephemereFilms, setEphemereFilms] = useState<EphemereFilm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [urls, setUrls] = useState<{[key: string]: string}>({});
  const [bulkUrl, setBulkUrl] = useState('');
  const [selectedFilms, setSelectedFilms] = useState<Set<string>>(new Set());
  
  const navigate = useNavigate();

  // Charger les films éphémères
  useEffect(() => {
    fetchEphemereFilms();
  }, []);

  const fetchEphemereFilms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/.netlify/functions/admin-get-ephemere', {
        headers: {
          'X-Admin-Token': 'true'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setEphemereFilms(data.films || []);
        
        // Initialiser les URLs dans l'état local
        const urlsState: {[key: string]: string} = {};
        data.films.forEach((film: EphemereFilm) => {
          urlsState[film._id] = film.videoUrl || '';
        });
        setUrls(urlsState);
      } else {
        setMessage('Erreur lors du chargement des films éphémères');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (filmId: string, newUrl: string) => {
    setUrls(prev => ({
      ...prev,
      [filmId]: newUrl
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFilms(new Set(ephemereFilms.map(film => film._id)));
    } else {
      setSelectedFilms(new Set());
    }
  };

  const handleSelectFilm = (filmId: string, checked: boolean) => {
    const newSelected = new Set(selectedFilms);
    if (checked) {
      newSelected.add(filmId);
    } else {
      newSelected.delete(filmId);
    }
    setSelectedFilms(newSelected);
  };

  const applyBulkUrl = () => {
    if (!bulkUrl.trim()) {
      setMessage('Veuillez entrer une URL pour l\'application en lot');
      return;
    }

    const newUrls = { ...urls };
    selectedFilms.forEach(filmId => {
      newUrls[filmId] = bulkUrl.trim();
    });
    setUrls(newUrls);
    setBulkUrl('');
    setMessage(`URL appliquée à ${selectedFilms.size} film(s) sélectionné(s)`);
  };

  const saveUrls = async () => {
    setSaving(true);
    setMessage('');

    try {
      const updates = ephemereFilms.map(film => ({
        id: film._id,
        videoUrl: encryptData(urls[film._id] || '')
      }));

      const response = await fetch('/.netlify/functions/admin-update-ephemere-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'true'
        },
        body: JSON.stringify({ updates })
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ ${result.updatedCount} URL(s) mise(s) à jour avec succès!`);
        // Recharger les données
        await fetchEphemereFilms();
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      setMessage('❌ Erreur lors de la sauvegarde');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    return ephemereFilms.some(film => urls[film._id] !== film.videoUrl);
  };

  const clearUrl = (filmId: string) => {
    setUrls(prev => ({
      ...prev,
      [filmId]: ''
    }));
  };

  const copyUrl = (filmId: string) => {
    const url = urls[filmId];
    if (url) {
      navigator.clipboard.writeText(url);
      setMessage(`URL copiée: ${ephemereFilms.find(f => f._id === filmId)?.title}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p>Chargement des films éphémères...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#0D0D0D] text-white">
        {/* Header */}
        <header className="bg-[#0D0D0D] py-4 px-4 md:px-8 sticky top-0 z-50 border-b border-gray-700">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="mr-4 p-2 rounded-full hover:bg-gray-700 transition-colors"
              >
                <span className="material-icons">arrow_back</span>
              </button>
              <h1 className="text-2xl md:text-3xl font-bold select-none">
                Movie<span className="font-normal">Stream</span> - Films Éphémères
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/gestion')}
                className="hidden sm:flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <span className="material-icons text-sm mr-2">delete</span>
                Gérer/Supprimer
              </button>
              <button
                onClick={() => navigate('/admin/ajout')}
                className="hidden sm:flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <span className="material-icons text-sm mr-2">add</span>
                Ajouter
              </button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 md:px-8 py-8">
          {/* Statistiques */}
          <div className="bg-gray-900 rounded-lg p-6 mb-8 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <span className="material-icons text-red-500 mr-3">schedule</span>
              Films Éphémères - Gestion des URLs
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-400">{ephemereFilms.length}</div>
                <div className="text-gray-400 text-sm">Films éphémères</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-400">{selectedFilms.size}</div>
                <div className="text-gray-400 text-sm">Sélectionnés</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-400">
                  {ephemereFilms.filter(film => urls[film._id]?.trim()).length}
                </div>
                <div className="text-gray-400 text-sm">Avec URL</div>
              </div>
            </div>

            {/* Application en lot */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="font-semibold mb-3 flex items-center">
                <span className="material-icons text-blue-400 mr-2">link</span>
                Application d'URL en lot
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={bulkUrl}
                  onChange={(e) => setBulkUrl(e.target.value)}
                  placeholder="https://0x0.st/example.mp4"
                  className="flex-1 swiss-input p-3 rounded-lg text-sm"
                />
                <button
                  onClick={applyBulkUrl}
                  disabled={!bulkUrl.trim() || selectedFilms.size === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Appliquer à {selectedFilms.size} film(s)
                </button>
              </div>
            </div>
          </div>

          {/* Actions globales */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFilms.size === ephemereFilms.length && ephemereFilms.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600"
                />
                <span className="text-sm text-gray-300">Tout sélectionner</span>
              </label>
              
              {selectedFilms.size > 0 && (
                <span className="text-sm text-blue-400">
                  {selectedFilms.size} film(s) sélectionné(s)
                </span>
              )}
            </div>

            <button
              onClick={saveUrls}
              disabled={saving || !hasChanges()}
              className="swiss-button px-6 py-3 rounded-lg font-medium disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sauvegarde...
                </>
              ) : (
                <>
                  <span className="material-icons text-sm mr-2">save</span>
                  Sauvegarder les modifications
                </>
              )}
            </button>
          </div>

          {/* Message de statut */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('✅') ? 'bg-green-900 text-green-400 border border-green-700' : 
              message.includes('❌') ? 'bg-red-900 text-red-400 border border-red-700' :
              'bg-blue-900 text-blue-400 border border-blue-700'
            }`}>
              {message}
            </div>
          )}

          {/* Liste des films */}
          {ephemereFilms.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-6xl text-gray-600 mb-4 block">movie_filter</span>
              <h3 className="text-xl text-gray-400 mb-2">Aucun film éphémère</h3>
              <p className="text-gray-500 mb-4">Ajoutez des films avec l'option "éphémère" activée</p>
              <button
                onClick={() => navigate('/admin/ajout')}
                className="swiss-button px-6 py-2 rounded-lg"
              >
                Ajouter un film
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {ephemereFilms.map((film) => (
                <div key={film._id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start space-x-4">
                    {/* Checkbox de sélection */}
                    <div className="flex-shrink-0 pt-2">
                      <input
                        type="checkbox"
                        checked={selectedFilms.has(film._id)}
                        onChange={(e) => handleSelectFilm(film._id, e.target.checked)}
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                    </div>

                    {/* Info du film */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-white flex items-center">
                            {film.title}
                            <span className="ml-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                              Éphémère
                            </span>
                          </h3>
                          <p className="text-sm text-gray-400">
                            {film.year} • {film.director} • {film.duration}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {film.genre}
                          </p>
                        </div>
                      </div>

                      {/* Gestion URL */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-300">
                          URL de la vidéo:
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="url"
                            value={urls[film._id] || ''}
                            onChange={(e) => handleUrlChange(film._id, e.target.value)}
                            placeholder="https://0x0.st/example.mp4"
                            className="flex-1 swiss-input p-3 rounded-lg text-sm"
                          />
                          
                          <button
                            onClick={() => copyUrl(film._id)}
                            disabled={!urls[film._id]?.trim()}
                            className="p-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors"
                            title="Copier l'URL"
                          >
                            <span className="material-icons text-sm">content_copy</span>
                          </button>
                          
                          <button
                            onClick={() => clearUrl(film._id)}
                            disabled={!urls[film._id]?.trim()}
                            className="p-3 bg-red-700 hover:bg-red-600 disabled:opacity-50 rounded-lg transition-colors"
                            title="Vider l'URL"
                          >
                            <span className="material-icons text-sm">clear</span>
                          </button>
                        </div>

                        {/* Indicateur de changement */}
                        {urls[film._id] !== film.videoUrl && (
                          <div className="flex items-center text-xs text-yellow-400">
                            <span className="material-icons text-sm mr-1">edit</span>
                            Modifié - nécessite une sauvegarde
                          </div>
                        )}

                        {/* Indicateur d'URL manquante */}
                        {!urls[film._id]?.trim() && (
                          <div className="flex items-center text-xs text-red-400">
                            <span className="material-icons text-sm mr-1">warning</span>
                            URL manquante - film non accessible
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions finales */}
          {ephemereFilms.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={saveUrls}
                disabled={saving || !hasChanges()}
                className="swiss-button px-8 py-4 rounded-lg font-bold text-lg disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    <span className="material-icons mr-2">save</span>
                    Sauvegarder toutes les modifications
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
