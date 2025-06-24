import { useState, useEffect } from 'react';

export default function MongoDebug() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/.netlify/functions/debug-mongo')
      .then(res => res.json())
      .then(data => {
        setDebugData(data);
        setLoading(false);
      })
      .catch(err => {
        setDebugData({ success: false, error: err.message });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] text-white p-8">
        <h1 className="text-3xl font-bold mb-8">MongoDB Debug</h1>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white p-8">
      <h1 className="text-3xl font-bold mb-8">MongoDB Diagnostic</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Résultats</h2>
        <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(debugData, null, 2)}
        </pre>
        
        {debugData?.success && (
          <div className="mt-4 p-4 bg-green-900 rounded">
            <h3 className="font-semibold text-green-400">✅ MongoDB fonctionne !</h3>
            <p>Films trouvés : {debugData.filmCount}</p>
            <p>Taille estimée : {debugData.estimatedTotalSize}</p>
            <p>Payload OK : {debugData.payloadOk ? "✅ Oui" : "❌ Trop lourd"}</p>
          </div>
        )}
        
        {!debugData?.success && (
          <div className="mt-4 p-4 bg-red-900 rounded">
            <h3 className="font-semibold text-red-400">❌ Erreur MongoDB</h3>
            <p>{debugData?.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
