import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

interface FilmForm {
  title: string;
  duration: string;
  year: number;
  genre: string;
  description: string;
  videoUrl: string;
}

// Simple encryption function - FIX pour les caractères spéciaux
const encryptData = (data: string): string => {
  try {
    // Gestion correcte des caractères UTF-8
    return btoa(unescape(encodeURIComponent(data)));
  } catch (error) {
    console.error('Encryption error:', error);
    return btoa(data);
  }
};

export default function AdminAjout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FilmForm>({
    title: '',
    duration: '',
    year: new Date().getFullYear(),
    genre: '',
    description: '',
    videoUrl: ''
  });
  const [message, setMessage] = useState('');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        sessionStorage.setItem('adminAuth', 'true');
        setMessage('');
      } else {
        setMessage('Mot de passe incorrect');
      }
    } catch (error) {
      setMessage('Erreur de connexion');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate required fields
      if (!form.title || !form.description || !form.videoUrl) {
        setMessage('Tous les champs sont requis');
        setSubmitting(false);
        return;
      }

      // Use JSON instead of FormData since we're not uploading covers to MongoDB
      const filmData = {
        title: encryptData(form.title),
        duration: form.duration,
        year: form.year.toString(),
        genre: form.genre,
        description: encryptData(form.description),
        videoUrl: encryptData(form.videoUrl)
      };
      
      const response = await fetch('/.netlify/functions/admin-add-film', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'true'
        },
        body: JSON.stringify(filmData)
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ ${result.message}`);
        if (result.coverInstruction) {
          setMessage(prev => prev + `\n\n📁 ${result.coverInstruction}`);
        }
        
        // Reset form
        setForm({
          title: '',
          duration: '',
          year: new Date().getFullYear(),
          genre: '',
          description: '',
          videoUrl: ''
        });
      } else {
        setMessage(`❌ ${result.error}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`❌ Erreur: ${error.message}`);
      } else {
        setMessage('❌ Erreur inconnue');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Access</h1>
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
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Ajouter un Film</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
          >
            ← Retour
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 p-6 rounded-lg space-y-4">
          <div>
            <label className="block mb-2 font-bold">Titre du film</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({...form, title: e.target.value})}
              className="w-full p-3 bg-gray-800 rounded-lg"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-bold">Durée</label>
              <input
                type="text"
                value={form.duration}
                onChange={(e) => setForm({...form, duration: e.target.value})}
                placeholder="1h 30min"
                className="w-full p-3 bg-gray-800 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-bold">Année</label>
              <input
                type="number"
                value={form.year}
                onChange={(e) => setForm({...form, year: parseInt(e.target.value)})}
                className="w-full p-3 bg-gray-800 rounded-lg"
                required
              />
            </div>
          </div>

          <div>
            <label className="block mb-2 font-bold">Genre</label>
            <input
              type="text"
              value={form.genre}
              onChange={(e) => setForm({...form, genre: e.target.value})}
              placeholder="Action, Drame, etc."
              className="w-full p-3 bg-gray-800 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-bold">URL de la vidéo</label>
            <input
              type="url"
              value={form.videoUrl}
              onChange={(e) => setForm({...form, videoUrl: e.target.value})}
              placeholder="https://0x0.st/example.mp4"
              className="w-full p-3 bg-gray-800 rounded-lg"
              required
            />
            <p className="text-gray-400 text-sm mt-1">
              URL directe vers le fichier vidéo (0x0.st, etc.)
            </p>
          </div>

          <div>
            <label className="block mb-2 font-bold">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              rows={4}
              className="w-full p-3 bg-gray-800 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block mb-2 font-bold">Cover (Information)</label>
            <div className="w-full p-3 bg-gray-800 rounded-lg text-gray-300">
              📋 Les covers sont maintenant gérées dans /public/assets/
              <br />
              Après ajout du film, placez votre image cover dans le dossier assets
              avec le nom indiqué dans la confirmation.
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-red-500 hover:bg-red-600 p-3 rounded-lg font-bold disabled:opacity-50"
          >
            {submitting ? 'Ajout en cours...' : 'Ajouter le Film'}
          </button>

          {message && (
            <div className={`p-4 rounded-lg text-center whitespace-pre-line ${message.includes('✅') ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}