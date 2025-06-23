const mongoose = require("mongoose");

exports.handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const MONGODB_URI = process.env.MONGODB_URI_APP;

  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "MONGODB_URI_APP not found",
        available_vars: Object.keys(process.env).filter((key) =>
          key.includes("MONGO")
        ),
      }),
    };
  }

  try {
    console.log("🧪 Testing MongoDB connection...");

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    console.log("✅ Connected successfully");

    // Test simple query
    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log(
      "📊 Collections:",
      collections.map((c) => c.name)
    );

    await mongoose.disconnect();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "MongoDB connection successful",
        collections: collections.map((c) => c.name),
        uri_preview: MONGODB_URI.substring(0, 50) + "...",
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("❌ MongoDB error:", error.message);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message,
        code: error.code,
        uri_preview: MONGODB_URI.substring(0, 50) + "...",
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
