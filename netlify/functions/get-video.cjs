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
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

exports.handler = async (event, context) => {
  // Static video links for existing films (fallback)
  const staticVideoLinks = {
    film1: "https://0x0.st/8IpD.mp4", // Gainsbourg
    film2: "https://0x0.st/8Ipf.mp4", // L'affaire Thomas Crown
    film3: "https://0x0.st/8IpQ.mp4", // La piscine
    film4: "https://0x0.st/8IJ8.mp4", // Un Homme et Une Femme
    film5: "https://0x0.st/8IId.mp4", // Le Samouraï
    film6: "https://0x0.st/8IvB.mp4", // Clan des siciliens
    film7: "https://0x0.st/8ICS.mp4", // Orange Méchanique
    film8: "https://0x0.st/8ICg.mp4", // Les Dents de la mer
    film9: "https://0x0.st/8IC1.mp4", // Taxi Driver
    film10: "https://0x0.st/8Iv1.mp4", // The Usual Suspect
  };

  const { id } = event.queryStringParameters || {};

  if (!id) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "ID manquant" }),
    };
  }

  try {
    // Try to get video URL from MongoDB first (for new films)
    await connectDB();

    // Check if it's a MongoDB ObjectId (24 hex characters) or old format
    if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
      const film = await Film.findById(id);

      if (film && film.videoUrl) {
        return {
          statusCode: 302,
          headers: {
            Location: film.videoUrl,
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache",
          },
        };
      }
    }
  } catch (error) {
    // Continue to fallback
  }

  // Fallback to static links for existing films
  if (staticVideoLinks[id]) {
    return {
      statusCode: 302,
      headers: {
        Location: staticVideoLinks[id],
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    };
  }

  return {
    statusCode: 404,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ error: "Film non trouvé" }),
  };
};
