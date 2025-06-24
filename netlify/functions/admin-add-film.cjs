const mongoose = require("mongoose");

// Utilisateur ADMIN avec permissions WRITE pour les fonctions administratives
const MONGODB_URI = process.env.MONGODB_URI_ADMIN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validation des variables d'environnement
if (!MONGODB_URI || !ADMIN_PASSWORD || !ENCRYPTION_KEY) {
  console.error("❌ Missing environment variables:", {
    MONGODB_URI: !!MONGODB_URI,
    ADMIN_PASSWORD: !!ADMIN_PASSWORD,
    ENCRYPTION_KEY: !!ENCRYPTION_KEY,
  });
}

// Film Schema WITHOUT coverUrl - covers handled by static assets
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

// Connect to MongoDB with optimized settings
const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState === 1) {
      console.log("✅ Already connected to MongoDB (ADMIN)");
      return;
    }

    console.log("🔄 Connecting to MongoDB with ADMIN user...");

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      w: "majority",
    });

    console.log("✅ MongoDB connected (ADMIN access - READ/WRITE)");
  } catch (error) {
    console.error("❌ MongoDB ADMIN connection failed:", error.message);
    throw error;
  }
};

// Decrypt function - FIX pour les caractères spéciaux
const decryptData = (encryptedData) => {
  try {
    // Gestion des caractères UTF-8 corrects
    const decoded = atob(encryptedData);
    return decodeURIComponent(escape(decoded));
  } catch (error) {
    console.warn("Decrypt error, returning raw data:", error);
    return encryptedData;
  }
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    await connectDB();

    // Parse JSON data (no more multipart since no file upload)
    const formData = JSON.parse(event.body);

    // Get current film count to determine cover filename
    const filmCount = await Film.countDocuments();
    const nextFilmNumber = 13 + filmCount; // Start at film13.png

    // Create film without coverUrl - cover will be film[x].png
    const newFilm = new Film({
      title: decryptData(formData.title),
      duration: decryptData(formData.duration),
      year: parseInt(decryptData(formData.year)),
      genre: decryptData(formData.genre),
      description: decryptData(formData.description),
      videoUrl: decryptData(formData.videoUrl),
    });

    const savedFilm = await newFilm.save();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Film added successfully",
        filmId: savedFilm._id,
        coverInstruction: `Please add cover image as: /public/assets/film${nextFilmNumber}.png`,
      }),
    };
  } catch (error) {
    console.error("❌ Admin add film error:", error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
