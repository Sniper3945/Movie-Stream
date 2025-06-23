const mongoose = require("mongoose");

// Utilisateur READ-ONLY pour les vidéos publiques
const MONGODB_URI = process.env.MONGODB_URI_APP;

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
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "no-cache",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  const staticVideoLinks = {
    film1: "https://0x0.st/8IpD.mp4",
    film2: "https://0x0.st/8Ipf.mp4",
    film3: "https://0x0.st/8IpQ.mp4",
    film4: "https://0x0.st/8IJ8.mp4",
    film5: "https://0x0.st/8IId.mp4",
    film6: "https://0x0.st/8IvB.mp4",
    film7: "https://0x0.st/8ICS.mp4",
    film8: "https://0x0.st/8ICg.mp4",
    film9: "https://0x0.st/8IC1.mp4",
    film10: "https://0x0.st/8Iv1.mp4",
    // Ajouter les liens pour les nouveaux films
    film11: "https://0x0.st/8lrT.mp4",
    film12: "https://0x0.st/8lzm.mp4",
  };

  const { id } = event.queryStringParameters || {};

  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "ID manquant" }),
    };
  }

  console.log(`🎬 Video request for: ${id} (READ-ONLY mode)`);

  // Try MongoDB with READ-ONLY user
  if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      await connectDB(); // READ-ONLY connection
      const film = await Film.findById(id).lean(); // .lean() pour optimiser

      if (film && film.videoUrl) {
        console.log(`✅ Found video via READ-ONLY user: ${film.videoUrl}`);
        return {
          statusCode: 302,
          headers: { ...headers, Location: film.videoUrl },
        };
      }
    } catch (error) {
      console.warn("⚠️ READ-ONLY MongoDB error:", error.message);
    }
  }

  // Fallback to static links
  if (staticVideoLinks[id]) {
    console.log(`✅ Using static video: ${staticVideoLinks[id]}`);
    return {
      statusCode: 302,
      headers: { ...headers, Location: staticVideoLinks[id] },
    };
  }

  console.log(`❌ Video not found for: ${id}`);
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: "Film non trouvé" }),
  };
};
