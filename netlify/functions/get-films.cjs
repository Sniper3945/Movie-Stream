const mongoose = require("mongoose");

// Utilisateur avec permissions READ-ONLY pour l'application publique
const MONGODB_URI = process.env.MONGODB_URI_APP;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI_APP not found in environment variables");
}

// Film Schema avec champ img
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
  img: { type: Buffer }, // Buffer pour l'image
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
    "Cache-Control": "no-store",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    await connectDB();

    try {
      const dbFilms = await Film.find({}).select("-img").lean().exec();

      const mappedFilms = dbFilms.map((film) => ({
        id: film._id.toString(),
        title: film.title,
        duration: film.duration,
        year: film.year,
        genre: film.genre,
        description: film.description,
        videoUrl: film.videoUrl,
        director: film.director || "",
        ephemere: film.ephemere || false,
        cover: `/.netlify/functions/get-cover?id=${film._id}`,
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          films: mappedFilms,
          pagination: null,
        }),
      };
    } catch (dbError) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          films: [],
          pagination: null,
        }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        films: [],
        pagination: null,
        error: "Erreur serveur",
      }),
    };
  }
};
