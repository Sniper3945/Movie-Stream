const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

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

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState === 1) return;
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  // Handle preflight
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
    console.log("🔄 Attempting MongoDB connection...");

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("MongoDB connection timeout")), 15000)
    );

    await Promise.race([connectDB(), timeoutPromise]);
    console.log("✅ Connected to MongoDB");

    const films = await Film.find().sort({ createdAt: 1 });
    console.log(`📋 Found ${films.length} films in database`);

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedFilms),
    };
  } catch (error) {
    console.error("❌ Error in get-films:", error);

    // Return fallback response instead of error
    const fallbackFilms = [
      {
        id: "film1",
        title: "Gainsbourg vie héroïque",
        cover: "/assets/film1.png",
        duration: "2h 08min",
        description:
          "Biopic musical de Joann Sfar sur la vie tumultueuse de Serge Gainsbourg...",
        year: 2010,
        genre: ["Biopic", "Drame"],
      },
      // Add other static films...
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackFilms),
    };
  }
};
