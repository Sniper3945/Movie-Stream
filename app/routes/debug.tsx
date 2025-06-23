import { useState, useEffect } from 'react';

interface EnvData {
  environmentVariables: {
    [key: string]: string;
  };
  mongoDetails?: {
    app_uri: string;
    admin_uri: string;
  };
  timestamp: string;
  region: string;
}

interface MongoTest {
  success?: boolean;
  message?: string;
  details?: any;
  error?: string;
}

interface IpData {
  message: string;
  detectedIPs: any;
  recommendation?: {
    primary: string;
    action: string;
  };
  netlifyRegion: string;
  timestamp: string;
}

export default function Debug() {
  const [envData, setEnvData] = useState<EnvData | null>(null);
  const [mongoTest, setMongoTest] = useState<MongoTest | null>(null);
  const [ipData, setIpData] = useState<IpData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        // Test environment variables
        const envResponse = await fetch('/.netlify/functions/debug-env');
        const envResult = await envResponse.json();
        setEnvData(envResult);

        // Test MongoDB connection
        const mongoResponse = await fetch('/.netlify/functions/test-mongo');
        const mongoResult = await mongoResponse.json();
        setMongoTest(mongoResult);

        // Get Netlify IP
        const ipResponse = await fetch('/.netlify/functions/get-netlify-ip');
        const ipResult = await ipResponse.json();
        setIpData(ipResult);

      } catch (error) {
        console.error('Debug error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDebugData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold mb-6">Debug MovieStream</h1>
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-teal-400 border-t-transparent border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p>Diagnostic en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Debug MovieStream</h1>
      
      {/* Environment Variables */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Variables d'environnement</h2>
        <pre className="bg-black p-4 rounded text-sm overflow-auto">
          {JSON.stringify(envData, null, 2)}
        </pre>
      </div>

      {/* MongoDB Test */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Test MongoDB</h2>
        <div className={`p-4 rounded ${mongoTest?.success ? 'bg-green-900' : 'bg-red-900'}`}>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(mongoTest, null, 2)}
          </pre>
        </div>
      </div>

      {/* IP Information */}
      <div className="bg-gray-900 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">IP Netlify</h2>
        <pre className="bg-black p-4 rounded text-sm overflow-auto">
          {JSON.stringify(ipData, null, 2)}
        </pre>
        {ipData?.recommendation && (
          <div className="mt-4 p-4 bg-yellow-900 rounded">
            <p className="font-bold">Action requise :</p>
            <p>IP à ajouter : {ipData.recommendation.primary}</p>
            <p>{ipData.recommendation.action}</p>
          </div>
        )}
      </div>

      <a 
        href="/" 
        className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg transition-colors"
      >
        ← Retour à l'accueil
      </a>
    </div>
  );
}
