import { useNavigate, Link } from "react-router";
import AdminGuard from "./admin.guard";
import { useWelcomePopup } from "../hooks/useWelcomePopup";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { resetWelcomePopup } = useWelcomePopup();

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col">
        <header className="bg-[#0D0D0D] py-4 px-4 md:px-8 border-b border-gray-700">
          <div className="container mx-auto flex items-center justify-between">
            <span className="text-xl md:text-2xl font-bold select-none">
              Admin <span className="font-normal">Dashboard</span>
            </span>
            <button
              onClick={() => navigate("/")}
              className="text-white hover:text-gray-300 transition-colors"
            >
              Retour au site
            </button>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 md:px-8 py-12 flex flex-col items-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Panneau d'administration
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
            <AdminCard
              title="Ajouter un film"
              description="Ajoutez un nouveau film à la plateforme."
              onClick={() => navigate("/admin/ajout")}
            />
            <AdminCard
              title="Migration"
              description="Importez ou migrez des données de films."
              onClick={() => navigate("/admin/migration")}
            />
            <AdminCard
              title="Utilisateurs"
              description="Gérez les comptes utilisateurs."
              onClick={() => navigate("/admin/utilisateurs")}
            />
            <AdminCard
              title="Gestion des films"
              description="Modifiez ou supprimez les films existants."
              onClick={() => navigate("/admin/gestion")}
            />
            <AdminCard
              title="Remplacer une cover"
              description="Remplacez facilement la cover d'un film par une nouvelle image WebP."
              onClick={() => navigate("/admin/replace-cover")}
            />
            <AdminCard
              title="Debug"
              description="Outils de debug et informations techniques."
              onClick={() => navigate("/admin/debug")}
            />
          </div>

          {/* Section Utilitaires */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Nouvelle carte pour les tests UI */}
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="material-icons mr-3 text-purple-400">
                  bug_report
                </span>
                Tests UI
              </h3>
              <p className="text-gray-400 mb-4 text-sm">
                Outils pour tester les composants d'interface
              </p>
              <button
                onClick={resetWelcomePopup}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <span className="material-icons text-sm mr-2">refresh</span>
                Réafficher popup bienvenue
              </button>
            </div>
          </div>

          {/* Section Films Éphémères */}
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <span className="material-icons text-red-500 mr-3">schedule</span>
              Films Éphémères
            </h3>
            <p className="text-gray-400 mb-6">
              Gérez les URLs des films éphémères en lot pour un changement rapide et efficace.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/admin/ephemere"
                className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-lg text-center transition-colors flex flex-col items-center"
              >
                <span className="material-icons text-2xl mb-2">link</span>
                <span className="font-medium">Gérer les URLs</span>
                <span className="text-sm text-red-200 mt-1">Modification en lot</span>
              </Link>
              <Link
                to="/admin/ajout"
                className="bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg text-center transition-colors flex flex-col items-center"
              >
                <span className="material-icons text-2xl mb-2">add_circle</span>
                <span className="font-medium">Ajouter Éphémère</span>
                <span className="text-sm text-gray-300 mt-1">Nouveau film</span>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}

function AdminCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-gray-900 rounded-lg p-6 text-left shadow-lg hover:bg-gray-800 transition-colors border border-gray-700"
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-400">{description}</p>
    </button>
  );
}
