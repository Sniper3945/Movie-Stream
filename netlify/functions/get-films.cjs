const mongoose = require("mongoose");

// Utilisateur avec permissions READ-ONLY pour l'application publique
const MONGODB_URI = process.env.MONGODB_URI_APP;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI_APP not found in environment variables");
}

// Film Schema
const filmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Film = mongoose.models.Film || mongoose.model("Film", filmSchema);

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState === 1) {
      return;
    }

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 3,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 3000,
      bufferCommands: false,
    });

    console.log("✅ MongoDB connected (READ-ONLY access)");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    await connectDB();

    // Requête optimisée - SANS coverUrl, avec tri chronologique
    const films = await Film.find({})
      .select("-__v -coverUrl") // Exclure __v et coverUrl
      .sort({ createdAt: 1 }) // Du plus ancien au plus récent
      .limit(20)
      .lean()
      .exec();

    console.log(`✅ Found ${films.length} films in MongoDB`);

    // Transformer les films pour ajouter les covers depuis /assets
    const filmsWithCovers = films.map((film, index) => ({
      ...film,
      id: film._id.toString(),
      cover: `/assets/film${13 + index}.png`, // film13.png, film14.png, etc.
      genre: Array.isArray(film.genre) ? film.genre : [film.genre],
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(filmsWithCovers),
    };
  } catch (error) {
    console.error("❌ MongoDB error:", error.message);

    // Retourner un tableau vide pour que le fallback fonctionne
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([]),
    };
  }
};
