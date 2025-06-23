import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';

interface FilmForm {
  title: string;
  duration: string;
  year: number;
  genre: string;
  description: string;
  cover: File | null;
  url: string;
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
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FilmForm>({
    title: '',
    duration: '',
    year: new Date().getFullYear(),
    genre: '',
    description: '',
    cover: null,
    url: ''
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
      // Verify password with backend
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
    setLoading(true);
    setMessage('Traitement en cours...');

    // Validate required fields
    if (!form.title || !form.description || !form.url || !form.cover) {
      setMessage('Tous les champs sont requis');
      setLoading(false);
      return;
    }

    // Validate file size
    if (form.cover.size > 5 * 1024 * 1024) {
      setMessage('L\'image est trop lourde (max 5MB)');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      
      // Encrypt sensitive data with improved encoding
      formData.append('title', encryptData(form.title));
      formData.append('duration', form.duration);
      formData.append('year', form.year.toString());
      formData.append('genre', form.genre);
      formData.append('description', encryptData(form.description));
      formData.append('url', encryptData(form.url));
      formData.append('cover', form.cover);
      
      // Add timeout for large file uploads
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

      const response = await fetch('/.netlify/functions/admin-add-film', {
        method: 'POST',
        headers: {
          'X-Admin-Token': sessionStorage.getItem('adminAuth') || ''
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseData = await response.json();

      if (response.ok) {
        setMessage(`✅ Film "${responseData.title || form.title}" ajouté avec succès!`);
        setForm({
          title: '',
          duration: '',
          year: new Date().getFullYear(),
          genre: '',
          description: '',
          cover: null,
          url: ''
        });
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        const errorMsg = responseData.details || responseData.error || 'Erreur inconnue';
        setMessage(`❌ Erreur: ${errorMsg}`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setMessage('❌ Timeout - Le fichier est trop volumineux ou la connexion est lente');
      } else {
        setMessage('❌ Erreur réseau - Vérifiez votre connexion et réessayez');
      }
    } finally {
      setLoading(false);
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
              value={form.url}
              onChange={(e) => setForm({...form, url: e.target.value})}
              placeholder="https://0x0.st/example.mp4"
              className="w-full p-3 bg-gray-800 rounded-lg"
              required
            />
            <p className="text-gray-400 text-sm mt-1">
              URL directe vers le fichier vidéo (0x0.st, etc.)
            </p>
          </div>

          <div>
            <label className="block mb-2 font-bold">Cover (PNG/JPG - Max 3MB)</label>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file) {
                  const sizeKB = (file.size / 1024).toFixed(2);
                  console.log(`Fichier sélectionné: ${file.name}, Taille: ${sizeKB}KB`);
                  
                  if (file.size > 3 * 1024 * 1024) {
                    setMessage('Fichier trop lourd (max 3MB)');
                    e.target.value = '';
                    return;
                  }
                }
                setForm({...form, cover: file});
                setMessage('');
              }}
              className="w-full p-3 bg-gray-800 rounded-lg"
              required
            />
            <p className="text-gray-400 text-sm mt-1">
              Formats acceptés: PNG, JPG (max 3MB) - Vos images font entre 248KB et 997KB ✅
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 p-3 rounded-lg font-bold disabled:opacity-50"
          >
            {loading ? 'Ajout en cours...' : 'Ajouter le Film'}
          </button>

          {message && (
            <p className={`text-center ${message.includes('succès') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}