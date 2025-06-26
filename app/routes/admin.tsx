import { useNavigate } from "react-router";
import AdminGuard from "./admin.guard";

export default function AdminDashboard() {
  const navigate = useNavigate();

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
              title="Debug"
              description="Outils de debug et informations techniques."
              onClick={() => navigate("/admin/debug")}
            />
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
