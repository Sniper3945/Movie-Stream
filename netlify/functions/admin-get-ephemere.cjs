const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI_ADMIN;

// Film Schema
const filmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  director: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  ephemere: { type: Boolean, default: false },
  img: { type: Buffer },
});

const Film = mongoose.models.Film || mongoose.model("Film", filmSchema);

const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState === 1) return;
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      w: "majority",
    });
    console.log("✅ MongoDB connected (ADMIN access)");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  // Vérification admin
  const adminToken = event.headers["x-admin-token"];
  if (!adminToken) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Admin access required" }),
    };
  }

  try {
    await connectDB();

    // Récupérer uniquement les films éphémères
    const ephemereFilms = await Film.find({ ephemere: true })
      .select("title duration year genre director videoUrl createdAt")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`📊 [ADMIN] ${ephemereFilms.length} films éphémères trouvés`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        films: ephemereFilms,
        count: ephemereFilms.length,
      }),
    };
  } catch (error) {
    console.error("❌ Admin get ephemere error:", error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
