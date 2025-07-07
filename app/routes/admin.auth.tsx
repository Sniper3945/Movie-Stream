import { useState } from "react";
import { useNavigate } from "react-router";

const ADMIN_TOKEN_KEY = "admin_token";
const API_URL = "/.netlify/functions/admin-auth"; // Toujours utiliser Netlify Functions, même en prod

export default function AdminAuth() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      localStorage.setItem(ADMIN_TOKEN_KEY, "ok");
      navigate("/admin");
    } else {
      setError("Mot de passe incorrect");
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-8 rounded-lg shadow-lg flex flex-col gap-6 min-w-[300px]"
      >
        <h1 className="text-2xl font-bold mb-2">Authentification Admin</h1>
        <input
          type="password"
          className="swiss-input px-4 py-2 rounded"
          placeholder="Mot de passe admin"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <div className="text-red-500">{error}</div>}
        <button className="swiss-button px-4 py-2 rounded" type="submit">
          Se connecter
        </button>
      </form>
    </div>
  );
}