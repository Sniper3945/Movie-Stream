const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const MONGODB_URI = process.env.MONGODB_URI_APP;

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

const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState === 1) return;
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log("✅ [COVER] MongoDB connected (READ-ONLY access)");
  } catch (error) {
    console.error("❌ [COVER] MongoDB connection failed:", error.message);
    throw error;
  }
};

// Fonction pour générer une image placeholder
const generatePlaceholder = (title) => {
  // SVG placeholder simple
  const svg = `
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="600" fill="#1A202C"/>
      <text x="200" y="280" text-anchor="middle" fill="#9CA3AF" font-family="Arial" font-size="14" font-weight="bold">MOVIESTREAM</text>
      <text x="200" y="320" text-anchor="middle" fill="#6B7280" font-family="Arial" font-size="12">${title.substring(
        0,
        25
      )}</text>
      <circle cx="200" cy="200" r="40" fill="#374151"/>
      <text x="200" y="210" text-anchor="middle" fill="#9CA3AF" font-family="Arial" font-size="30">🎬</text>
    </svg>
  `;
  return Buffer.from(svg);
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": "public, max-age=604800, s-maxage=604800", // 7 jours
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  const { id } = event.queryStringParameters || {};

  if (!id) {
    console.log("❌ [COVER] ID manquant");
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "ID manquant" }),
    };
  }

  console.log(`🖼️ [COVER] Demande d'image pour: ${id}`);

  // 1. Essayer MongoDB d'abord
  if (id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id)) {
    try {
      console.log(`🔍 [COVER] Recherche MongoDB pour ObjectId: ${id}`);
      await connectDB();

      const film = await Film.findById(id).select("img title").lean();

      if (film && film.img) {
        console.log(
          `✅ [COVER] Image trouvée en MongoDB: ${film.title} (${film.img.length} bytes)`
        );
        return {
          statusCode: 200,
          headers: {
            ...headers,
            "Content-Type": "image/webp",
          },
          body: film.img.toString("base64"),
          isBase64Encoded: true,
        };
      } else if (film) {
        console.log(`⚠️ [COVER] Film trouvé mais pas d'image: ${film.title}`);
      } else {
        console.log(`❌ [COVER] Film non trouvé en MongoDB: ${id}`);
      }
    } catch (error) {
      console.error(`❌ [COVER] Erreur MongoDB pour ${id}:`, error.message);
    }
  }

  // 2. Fallback vers fichiers statiques (temporaire)
  const staticMappings = {
    // Mapping des anciens IDs vers les fichiers statiques
    film1: "film1.webp",
    film2: "film2.webp",
    film3: "film3.webp",
    film4: "film4.webp",
    film5: "film5.webp",
    film6: "film6.webp",
    film7: "film7.webp",
    film8: "film8.webp",
    film9: "film9.webp",
    film10: "film10.webp",
    film11: "film11.webp",
    film12: "film12.webp",
  };

  if (staticMappings[id]) {
    const staticPath = path.join(
      process.cwd(),
      "public",
      "assets",
      staticMappings[id]
    );
    console.log(`📁 [COVER] Tentative fichier statique: ${staticPath}`);

    try {
      if (fs.existsSync(staticPath)) {
        const imageBuffer = fs.readFileSync(staticPath);
        console.log(
          `✅ [COVER] Image statique trouvée: ${staticMappings[id]} (${imageBuffer.length} bytes)`
        );
        return {
          statusCode: 200,
          headers: {
            ...headers,
            "Content-Type": "image/webp",
          },
          body: imageBuffer.toString("base64"),
          isBase64Encoded: true,
        };
      } else {
        console.log(`❌ [COVER] Fichier statique non trouvé: ${staticPath}`);
      }
    } catch (error) {
      console.error(
        `❌ [COVER] Erreur lecture fichier statique:`,
        error.message
      );
    }
  }

  // 3. Générer placeholder
  console.log(`🔄 [COVER] Génération placeholder pour: ${id}`);
  const placeholderBuffer = generatePlaceholder(id);

  return {
    statusCode: 200,
    headers: {
      ...headers,
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600", // 1 heure pour les placeholders
    },
    body: placeholderBuffer.toString("base64"),
    isBase64Encoded: true,
  };
};
