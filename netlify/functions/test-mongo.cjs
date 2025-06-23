const mongoose = require("mongoose");

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const MONGODB_URI_APP = process.env.MONGODB_URI_APP;

  if (!MONGODB_URI_APP) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "MONGODB_URI_APP not configured",
        env_check: {
          MONGODB_URI_APP: "❌ Missing",
          suggestion: "Add MONGODB_URI_APP to Netlify environment variables",
        },
      }),
    };
  }

  try {
    console.log("🧪 Testing MongoDB connection...");
    console.log("📋 URI configured:", !!MONGODB_URI_APP);
    console.log("📋 URI preview:", MONGODB_URI_APP.substring(0, 50) + "...");

    // Test de connexion avec timeout court
    await mongoose.connect(MONGODB_URI_APP, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      w: "majority",
    });

    console.log("✅ MongoDB connection successful");

    // Test de lecture
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📊 Collections found:",
      collections.map((c) => c.name)
    );

    // Fermer la connexion
    await mongoose.disconnect();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "MongoDB connection successful",
        details: {
          connected: true,
          collections: collections.map((c) => c.name),
          database: mongoose.connection.name,
          timestamp: new Date().toISOString(),
        },
      }),
    };
  } catch (error) {
    console.error("❌ MongoDB test failed:", error.message);

    let errorType = "unknown";
    let solution = "Check MongoDB configuration";

    if (error.message.includes("IP")) {
      errorType = "ip_whitelist";
      solution = "Add Netlify IPs to MongoDB Atlas Network Access";
    } else if (error.message.includes("authentication")) {
      errorType = "authentication";
      solution = "Check MongoDB username/password";
    } else if (error.message.includes("timeout")) {
      errorType = "timeout";
      solution = "Check MongoDB cluster status or network";
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "MongoDB connection failed",
        details: {
          message: error.message,
          type: errorType,
          solution: solution,
          timestamp: new Date().toISOString(),
        },
      }),
    };
  }
};
