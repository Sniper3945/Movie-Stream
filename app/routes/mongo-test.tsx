import { useState, useEffect } from 'react';

export default function MongoTest() {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testMongo = async () => {
      try {
        const response = await fetch('/.netlify/functions/test-mongo-simple');
        const result = await response.json();
        setTestResult(result);
      } catch (error) {
        setTestResult({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    testMongo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Test MongoDB</h1>
        <p>Test en cours...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Test MongoDB</h1>
      
      <div className={`p-4 rounded mb-4 ${testResult?.success ? 'bg-green-900' : 'bg-red-900'}`}>
        <h2 className="text-lg font-bold mb-2">
          {testResult?.success ? '✅ Succès' : '❌ Échec'}
        </h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(testResult, null, 2)}
        </pre>
      </div>

      <a href="/" className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded">
        ← Retour
      </a>
    </div>
  );
}
