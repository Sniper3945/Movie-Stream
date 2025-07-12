import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";

export function meta() {
  return [
    { title: "Page non trouvée - MovieStream" },
    { name: "description", content: "La page que vous recherchez n'existe pas." }
  ];
}

export default function CatchAll() {
  const navigate = useNavigate();
  const params = useParams();
  const pathname = params["*"] || "";

  useEffect(() => {
    // Gestion des anciennes URLs de films
    if (pathname.startsWith("film/")) {
      const filmId = pathname.replace("film/", "");
      if (filmId) {
        navigate(`/watch/${filmId}`, { replace: true });
        return;
      }
    }

    // Gestion des anciennes URLs de watch
    if (pathname.startsWith("watch/")) {
      const filmId = pathname.replace("watch/", "");
      if (filmId) {
        navigate(`/watch/${filmId}`, { replace: true });
        return;
      }
    }

    // Pour toutes les autres URLs non trouvées, rediriger vers l'accueil après 3 secondes
    const timeout = setTimeout(() => {
      navigate("/", { replace: true });
    }, 3000);

    return () => clearTimeout(timeout);
  }, [pathname, navigate]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-2">Page non trouvée</h2>
          <p className="text-gray-400 mb-6">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => navigate("/", { replace: true })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </button>
          
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            <span>Redirection automatique dans 3 secondes...</span>
          </div>
        </div>
        
        <div className="mt-8 text-xs text-gray-600">
          <p>Chemin demandé : /{pathname}</p>
        </div>
      </div>
    </div>
  );
};
