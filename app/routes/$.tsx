import { Link } from "react-router";
import type { ActionFunction } from "react-router";

export const action: ActionFunction = async ({ request }) => {
  // Gérer toutes les requêtes POST/PUT/DELETE non trouvées
  console.warn(`Requête ${request.method} non gérée vers: ${request.url}`);
  
  return new Response(JSON.stringify({ 
    error: "Route non trouvée",
    method: request.method,
    path: new URL(request.url).pathname
  }), {
    status: 404,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Icône 404 */}
        <div className="mb-8">
          <span className="material-icons text-8xl text-gray-600 mb-4 block">error_outline</span>
          <h1 className="text-6xl font-bold text-gray-400 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">Page non trouvée</h2>
        </div>

        {/* Message d'erreur */}
        <div className="mb-8">
          <p className="text-gray-400 mb-4">
            Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <p className="text-sm text-gray-500">
            Vérifiez l'URL ou retournez à l'accueil pour découvrir nos films.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            to="/"
            className="inline-block swiss-button px-8 py-3 rounded-lg font-medium transition-colors hover:bg-opacity-80"
          >
            <span className="material-icons text-sm mr-2 align-middle">home</span>
            Retourner à l'accueil
          </Link>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <span className="material-icons text-sm mr-2 align-middle">arrow_back</span>
              Page précédente
            </button>
            
            <Link
              to="/admin"
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <span className="material-icons text-sm mr-2 align-middle">admin_panel_settings</span>
              Administration
            </Link>
          </div>
        </div>

        {/* Footer de la page 404 */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            MovieStream © 2025 - Erreur 404
          </p>
        </div>
      </div>
    </div>
  );
}

