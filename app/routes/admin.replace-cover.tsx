import { useState, useEffect } from "react";
import { useFilms } from "../contexts/FilmContext";

interface Film {
  _id?: string;
  id?: string;
  title: string;
  img?: { data: number[] };
}

type FilmCoverState = {
  film: Film;
  newFile: File | null;
  preview: string | null;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMsg?: string;
};

function getFilmKey(film: Film) {
  return film._id || film.id || film.title;
}

export default function AdminReplaceCover() {
  const { films, loading } = useFilms();
  const [covers, setCovers] = useState<FilmCoverState[]>([]);
  const [globalStatus, setGlobalStatus] = useState<'idle' | 'uploading' | 'success'>('idle');

  // Synchronise covers avec films dès que films change
  useEffect(() => {
    setCovers(
      films.map(film => ({
        film: film as Film,
        newFile: null,
        preview: null,
        status: 'idle'
      }))
    );
  }, [films]);

  // Met à jour la cover d'un film dans le state (par clé unique)
  const handleFileChange = (filmKey: string, file: File | null) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCovers(prev => prev.map((c) =>
        getFilmKey(c.film) === filmKey ? { ...c, newFile: file, preview: ev.target?.result as string } : c
      ));
    };
    if (file) reader.readAsDataURL(file);
    else setCovers(prev => prev.map((c) => getFilmKey(c.film) === filmKey ? { ...c, newFile: null, preview: null } : c));
  };

  // Upload toutes les nouvelles covers
  const handleUploadAll = async () => {
    setGlobalStatus('uploading');
    let anyError = false;
    await Promise.all(
      covers.map(async (c) => {
        if (!c.newFile) return;
        setCovers(prev => prev.map((cc) => getFilmKey(cc.film) === getFilmKey(c.film) ? { ...cc, status: 'uploading', errorMsg: undefined } : cc));
        try {
          const arrayBuffer = await c.newFile.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
          const filmId = c.film._id || c.film.id;
          const res = await fetch('/.netlify/functions/update-cover', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filmId, imgBase64: base64 }),
          });
          if (!res.ok) {
            const errText = await res.text();
            throw new Error('Erreur lors de la mise à jour: ' + errText);
          }
          setCovers(prev => prev.map((cc) => getFilmKey(cc.film) === getFilmKey(c.film) ? { ...cc, status: 'success' } : cc));
        } catch (e: any) {
          anyError = true;
          setCovers(prev => prev.map((cc) => getFilmKey(cc.film) === getFilmKey(c.film) ? { ...cc, status: 'error', errorMsg: e.message } : cc));
        }
      })
    );
    setGlobalStatus(anyError ? 'idle' : 'success');
  };

  // Reset la sélection d'une cover (par clé unique)
  const handleReset = (filmKey: string) => {
    setCovers(prev => prev.map((c) => getFilmKey(c.film) === filmKey ? { ...c, newFile: null, preview: null, status: 'idle', errorMsg: undefined } : c));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Remplacer les covers des films</h1>
      <p className="mb-6 text-gray-300">Sélectionne une nouvelle image WebP pour chaque film. Tu peux tout valider d'un coup !</p>
      {loading || films.length === 0 ? (
        <div className="text-center text-gray-400 text-lg py-12">Chargement des films...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {covers.map((c) => {
            const filmKey = getFilmKey(c.film);
            return (
              <div key={filmKey} className="bg-gray-900 rounded-lg p-4 border border-gray-700 flex flex-col items-center">
                <div className="mb-2 text-center font-semibold">{c.film.title}</div>
                <div className="mb-2">
                  <span className="text-xs text-gray-400">Cover actuelle :</span>
                  {c.film.img && c.film.img.data ? (
                    <img
                      src={`data:image/webp;base64,${btoa(String.fromCharCode(...new Uint8Array(c.film.img.data)))}`}
                      alt="cover actuelle"
                      className="w-28 h-auto rounded border mb-1"
                    />
                  ) : (
                    <div className="w-28 h-40 bg-gray-800 flex items-center justify-center text-gray-500 rounded mb-1">Aucune</div>
                  )}
                </div>
                <div className="mb-2 w-full">
                  <input
                    type="file"
                    accept="image/webp"
                    id={`file-${filmKey}`}
                    className="hidden"
                    onChange={e => handleFileChange(filmKey, e.target.files?.[0] || null)}
                  />
                  <label htmlFor={`file-${filmKey}`} className="block w-full bg-blue-700 hover:bg-blue-800 text-white text-center py-1 rounded cursor-pointer mb-1">
                    {c.newFile ? 'Changer' : 'Choisir une nouvelle cover'}
                  </label>
                  {c.preview && (
                    <div className="mb-1">
                      <span className="text-xs text-gray-400">Preview :</span>
                      <img src={c.preview} alt="preview" className="w-28 h-auto rounded border mt-1" />
                      <button onClick={() => handleReset(filmKey)} className="block text-xs text-red-400 mt-1 underline">Annuler</button>
                    </div>
                  )}
                </div>
                {c.status === 'success' && <div className="text-green-500 text-xs mt-1">✅ Succès</div>}
                {c.status === 'error' && <div className="text-red-500 text-xs mt-1">❌ {c.errorMsg}</div>}
                {c.status === 'uploading' && <div className="text-blue-400 text-xs mt-1">Envoi...</div>}
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-8 flex flex-col items-center">
        <button
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg disabled:opacity-50"
          onClick={handleUploadAll}
          disabled={globalStatus === 'uploading' || !covers.some(c => c.newFile)}
        >
          {globalStatus === 'uploading' ? 'Mise à jour en cours...' : 'Valider tous les changements'}
        </button>
        {globalStatus === 'success' && <div className="text-green-500 mt-4 text-lg">Toutes les covers ont été mises à jour !</div>}
      </div>
    </div>
  );
} 