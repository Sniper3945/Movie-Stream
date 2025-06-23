const mongoose = require("mongoose");

// Variables d'environnement Netlify (automatiquement disponibles)
const MONGODB_URI = process.env.MONGODB_URI;

// Validation des variables d'environnement
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined in environment variables");
  throw new Error("MongoDB URI not configured");
}

// Film Schema
const filmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  coverUrl: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Film = mongoose.models.Film || mongoose.model("Film", filmSchema);

// Connect to MongoDB avec gestion d'erreurs améliorée
const connectDB = async () => {
  try {
    // Vérifier si déjà connecté
    if (mongoose.connections[0].readyState === 1) {
      console.log("✅ Already connected to MongoDB");
      return;
    }

    console.log("🔄 Connecting to MongoDB...");
    console.log("📋 MongoDB URI exists:", !!MONGODB_URI);
    console.log(
      "📋 MongoDB URI starts with:",
      MONGODB_URI?.substring(0, 20) + "..."
    );

    await mongoose.connect(MONGODB_URI, {
      // Configuration optimisée pour Netlify Functions
      maxPoolSize: 3, // Réduit pour les fonctions serverless
      serverSelectionTimeoutMS: 8000, // 8 secondes
      socketTimeoutMS: 45000,
      bufferCommands: false,
      // Ajout pour MongoDB Atlas
      retryWrites: true,
      w: "majority",
    });

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error;
  }
};

exports.handler = async (event, context) => {
  // Optimisation pour les fonctions serverless
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    console.log("🚀 Function started - get-films");

    // Tentative de connexion avec timeout
    await Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("MongoDB connection timeout")), 10000)
      ),
    ]);

    console.log("📊 Fetching films from database...");
    const films = await Film.find().sort({ createdAt: 1 }).lean(); // .lean() pour optimiser
    console.log(`📋 Found ${films.length} films in database`);

    if (films.length === 0) {
      console.warn("⚠️ No films found in database");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([]),
      };
    }

    // Transform films
    const transformedFilms = films.map((film) => ({
      id: film._id.toString(),
      title: film.title,
      cover: film.coverUrl,
      duration: film.duration,
      description: film.description,
      year: film.year,
      genre: film.genre.split(",").map((g) => g.trim()),
      videoUrl: film.videoUrl,
    }));

    console.log("✅ Successfully returning", transformedFilms.length, "films");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedFilms),
    };
  } catch (error) {
    console.error("❌ Function error:", error.message);
    console.error("📍 Error stack:", error.stack);

    // Retourner une erreur au lieu du fallback pour diagnostiquer
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        details: error.message,
        mongodbUri: !!MONGODB_URI ? "present" : "missing",
      }),
    };
  }
};
