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
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 4000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 4000,
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
    console.log("📡 [get-films] Tentative de connexion MongoDB...");
    const connectStartTime = Date.now();

    await Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(() => {
          console.log("❌ [get-films] MongoDB connection timeout après 4s");
          reject(new Error("MongoDB connection timeout 4s"));
        }, 4000)
      ),
    ]);

    const connectTime = Date.now() - connectStartTime;
    console.log(`✅ [get-films] MongoDB connecté en ${connectTime}ms`);

    console.log("🔍 [get-films] Exécution de la requête Film.find()...");
    const queryStartTime = Date.now();

    const films = await Promise.race([
      Film.find().sort({ createdAt: 1 }).lean(),
      new Promise((_, reject) =>
        setTimeout(() => {
          console.log("❌ [get-films] Query timeout après 3s");
          reject(new Error("Query timeout 3s"));
        }, 3000)
      ),
    ]);

    const queryTime = Date.now() - queryStartTime;
    console.log(
      `📋 [get-films] Query terminée en ${queryTime}ms - ${films.length} films trouvés`
    );

    // LOG DÉTAILLÉ des films récupérés
    console.log("📊 [get-films] Films bruts de MongoDB:", films);
    films.forEach((film, index) => {
      console.log(
        `📄 [get-films] Film ${index + 1}: ${film.title} (${film._id})`
      );
    });

    if (films.length === 0) {
      console.log(
        "⚠️ [get-films] AUCUN FILM TROUVÉ - Vérification de la collection..."
      );

      try {
        const count = await Film.countDocuments();
        console.log(`📊 [get-films] countDocuments(): ${count} films en base`);

        if (count > 0) {
          console.log(
            "🔍 [get-films] Les films existent mais ne sont pas récupérés par find()"
          );
          // Essayer sans le sort pour voir
          const filmsWithoutSort = await Film.find().lean();
          console.log(
            `📋 [get-films] Films sans sort: ${filmsWithoutSort.length}`
          );
        }
      } catch (countError) {
        console.log(
          "❌ [get-films] Erreur countDocuments:",
          countError.message
        );
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([]),
      };
    }

    // Transform avec les covers existantes en /assets
    const transformedFilms = films.map((film, index) => {
      // Utiliser les covers existantes : film1.png à film12.png
      const coverNumber = index + 1;

      console.log(
        `🔄 [get-films] Transform ${index + 1}: ${
          film.title
        } → film${coverNumber}.png`
      );

      return {
        id: film._id.toString(),
        title: film.title,
        cover: `/assets/film${coverNumber}.png`, // Utiliser les covers existantes
        duration: film.duration,
        description: film.description,
        year: film.year,
        genre: film.genre.split(",").map((g) => g.trim()),
        videoUrl: film.videoUrl,
      };
    });

    const totalTime = Date.now() - functionStartTime;
    console.log(
      `🎉 [get-films] SUCCÈS TOTAL en ${totalTime}ms - Retour de ${transformedFilms.length} films`
    );
    console.log(
      `📋 [get-films] Films transformés:`,
      transformedFilms.map((f) => `${f.title} (${f.cover})`)
    );

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
