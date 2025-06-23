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
        MONGODB_URI_APP: !!process.env.MONGODB_URI_APP
          ? "✅ Present"
          : "❌ Missing",
        MONGODB_URI_ADMIN: !!process.env.MONGODB_URI_ADMIN
          ? "✅ Present"
          : "❌ Missing",
        ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD
          ? "✅ Present"
          : "❌ Missing",
        ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY
          ? "✅ Present"
          : "❌ Missing",
        NODE_ENV: process.env.NODE_ENV || "not set",
      },
      mongoDetails: {
        app_uri: process.env.MONGODB_URI_APP
          ? process.env.MONGODB_URI_APP.substring(0, 50) + "..."
          : "Not configured",
        admin_uri: process.env.MONGODB_URI_ADMIN
          ? process.env.MONGODB_URI_ADMIN.substring(0, 50) + "..."
          : "Not configured",
      },
      timestamp: new Date().toISOString(),
      region: process.env.AWS_REGION || "unknown",
    }),
  };
};
