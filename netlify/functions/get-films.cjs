const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

// Film Schema (must match admin-add-film.cjs)
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
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

exports.handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    await connectDB();

    // Ordre chronologique : du plus ancien au plus récent
    const films = await Film.find().sort({ createdAt: 1 }); // 1 = ascending (premier ajouté en premier)

    // Transform to match your current film structure
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
    console.error("Error fetching films:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Erreur serveur",
        details: error.message,
      }),
    };
  }
};
