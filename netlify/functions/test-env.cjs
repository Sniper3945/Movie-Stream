exports.handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      environmentVariables: {
        MONGODB_URI: !!process.env.MONGODB_URI ? "✅ Present" : "❌ Missing",
        ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD
          ? "✅ Present"
          : "❌ Missing",
        ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY
          ? "✅ Present"
          : "❌ Missing",
      },
      mongoUri: process.env.MONGODB_URI
        ? process.env.MONGODB_URI.substring(0, 30) + "..."
        : "Not configured",
    }),
  };
};
