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

// Fonction pour valider et traiter l'image
const processImage = (imageData) => {
  try {
    // Extraire les données base64
    const base64Match = imageData.match(/^data:image\/webp;base64,(.+)$/);
    if (!base64Match) {
      throw new Error(
        "Format d'image invalide. Seul le format WebP est supporté."
      );
    }

    const base64Data = base64Match[1];
    const buffer = Buffer.from(base64Data, "base64");

    // Vérifier la taille (6MB limit)
    const maxSize = 6 * 1024 * 1024; // 6MB
    if (buffer.length > maxSize) {
      throw new Error(
        `Image trop grande (${(buffer.length / 1024 / 1024).toFixed(
          2
        )}MB). Limite: 6MB.`
      );
    }

    console.log(
      `✅ [COVER] Image validée: ${(buffer.length / 1024).toFixed(2)}KB`
    );
    return buffer;
  } catch (error) {
    console.error("❌ [COVER] Erreur traitement image:", error.message);
    throw error;
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

    // Validation des données
    const {
      title,
      duration,
      year,
      genre,
      description,
      videoUrl,
      director,
      ephemere,
      cover, // Image en base64
    } = formData;

    if (!title || !duration || !year || !genre || !description || !videoUrl) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Tous les champs obligatoires doivent être remplis",
        }),
      };
    }

    console.log(`🎬 [COVER] Ajout nouveau film: ${title}`);

    // Traitement de l'image
    let imageBuffer = null;
    if (cover) {
      try {
        imageBuffer = processImage(cover);
        console.log(`✅ [COVER] Image traitée pour ${title}`);
      } catch (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: error.message,
          }),
        };
      }
    } else {
      console.log(`⚠️ [COVER] Pas d'image fournie pour ${title}`);
    }

    // Créer le film
    const newFilm = new Film({
      title: decryptData(title),
      duration,
      year: parseInt(year),
      genre,
      description: decryptData(description),
      videoUrl: decryptData(videoUrl),
      director: director || "",
      ephemere: !!ephemere,
      img: imageBuffer, // Stocker l'image
    });

    const savedFilm = await newFilm.save();
    console.log(
      `✅ [COVER] Film sauvegardé: ${savedFilm.title} (ID: ${savedFilm._id})`
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Film ajouté avec succès",
        filmId: savedFilm._id,
        hasCover: !!imageBuffer,
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
