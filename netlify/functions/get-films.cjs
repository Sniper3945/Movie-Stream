const mongoose = require("mongoose");

// Utilisateur avec permissions READ-ONLY pour l'application publique
const MONGODB_URI = process.env.MONGODB_URI_APP;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI_APP is not defined");
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

const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState === 1) {
      console.log("✅ Already connected to MongoDB (READ-ONLY)");
      return;
    }

    console.log("🔄 Connecting to MongoDB with READ-ONLY user...");

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 1, // Réduit pour Netlify
      serverSelectionTimeoutMS: 5000, // 5 secondes
      socketTimeoutMS: 30000,
      connectTimeoutMS: 5000,
      bufferCommands: false,
      retryWrites: true,
      w: "majority",
    });

    console.log("✅ MongoDB connected (READ-ONLY access)");
  } catch (error) {
    console.error("❌ MongoDB READ-ONLY connection failed:", error.message);
    throw error;
  }
};

exports.handler = async (event, context) => {
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
    console.log("🚀 Function started - get-films (optimized)");

    // Connexion MongoDB rapide
    await Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("MongoDB timeout 2s")), 2000)
      ),
    ]);

    // Query rapide
    const films = await Promise.race([
      Film.find().sort({ createdAt: 1 }).lean(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout 1s")), 1000)
      ),
    ]);

    console.log(`📋 MongoDB films: ${films.length}`);

    if (films.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([]),
      };
    }

    // Transform avec pattern film[x].png automatique
    const transformedFilms = films.map((film, index) => {
      // Numérotation automatique : film13, film14, film15, etc.
      const filmNumber = 13 + index; // Commence après les 12 films statiques

      return {
        id: film._id.toString(),
        title: film.title,
        cover: `/assets/film${filmNumber}.png`, // Pattern standard film[x].png
        duration: film.duration,
        description: film.description,
        year: film.year,
        genre: film.genre.split(",").map((g) => g.trim()),
        videoUrl: film.videoUrl,
      };
    });

    console.log(
      "✅ Returning",
      transformedFilms.length,
      "films with auto covers"
    );
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedFilms),
    };
  } catch (error) {
    console.log("❌ MongoDB failed:", error.message);

    // Retourner tableau vide = utiliser films statiques
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([]),
    };
  }
};
