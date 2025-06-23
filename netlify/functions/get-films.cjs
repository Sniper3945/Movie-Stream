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

  const functionStartTime = Date.now();
  console.log("🚀 [get-films] Function started at", new Date().toISOString());

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
    console.log("🚀 [get-films] Function started at", new Date().toISOString());
    console.log("📡 [get-films] Tentative de connexion MongoDB...");
    const connectStartTime = Date.now();

    // Connexion MongoDB avec timeout réduit pour éviter les lenteurs
    await Promise.race([
      connectDB(),
      new Promise(
        (_, reject) =>
          setTimeout(() => {
            console.log("❌ [get-films] MongoDB connection timeout après 1.5s");
            reject(new Error("MongoDB connection timeout 1.5s"));
          }, 1500) // Réduit à 1.5s pour éviter les 3.2s observés
      ),
    ]);

    const connectTime = Date.now() - connectStartTime;
    console.log(`✅ [get-films] MongoDB connecté en ${connectTime}ms`);

    console.log("🔍 [get-films] Exécution de la requête...");
    const queryStartTime = Date.now();

    // Query avec timeout très court
    const films = await Promise.race([
      Film.find().sort({ createdAt: 1 }).lean(),
      new Promise(
        (_, reject) =>
          setTimeout(() => {
            console.log("❌ [get-films] Query timeout après 500ms");
            reject(new Error("Query timeout 500ms"));
          }, 500) // Très court pour forcer l'efficacité
      ),
    ]);

    const queryTime = Date.now() - queryStartTime;
    const totalTime = Date.now() - functionStartTime;

    console.log(
      `📋 [get-films] Query terminée en ${queryTime}ms - ${films.length} films trouvés`
    );
    console.log(
      `🎉 [get-films] SUCCÈS TOTAL en ${totalTime}ms - Retour de ${films.length} films`
    );

    if (films.length === 0) {
      console.log("⚠️ [get-films] Aucun film en base, retour tableau vide");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([]),
      };
    }

    // Transform avec pattern film[x].png automatique
    const transformedFilms = films.map((film, index) => {
      const filmNumber = 13 + index; // Commence après les 12 films statiques

      return {
        id: film._id.toString(),
        title: film.title,
        cover: `/assets/film${filmNumber}.png`,
        duration: film.duration,
        description: film.description,
        year: film.year,
        genre: film.genre.split(",").map((g) => g.trim()),
        videoUrl: film.videoUrl,
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedFilms),
    };
  } catch (error) {
    const totalTime = Date.now() - functionStartTime;
    console.log(`❌ [get-films] ÉCHEC après ${totalTime}ms:`, error.message);
    console.log(`💾 [get-films] Retour tableau vide pour fallback côté client`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([]),
    };
  }
};
