const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI_ADMIN;

// Film Schema
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
  img: { type: Buffer },
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
      retryWrites: true,
      w: "majority",
    });
    console.log("✅ MongoDB connected (ADMIN access)");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

// Decrypt function
const decryptData = (encryptedData) => {
  try {
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

  // Vérification admin
  const adminToken = event.headers["x-admin-token"];
  if (!adminToken) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Admin access required" }),
    };
  }

  try {
    await connectDB();

    const { updates } = JSON.parse(event.body);

    if (!updates || !Array.isArray(updates)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: "Format de données invalide",
        }),
      };
    }

    console.log(
      `🔄 [ADMIN] Mise à jour de ${updates.length} URLs de films éphémères`
    );

    let updatedCount = 0;
    let errors = [];

    // Traitement en lot avec transaction
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        for (const update of updates) {
          try {
            const { id, videoUrl } = update;

            if (!id) {
              errors.push("ID manquant pour une mise à jour");
              continue;
            }

            // Décrypter l'URL
            const decryptedUrl = decryptData(videoUrl);

            // Vérifier que le film est bien éphémère
            const film = await Film.findOne({
              _id: id,
              ephemere: true,
            }).session(session);

            if (!film) {
              errors.push(`Film éphémère non trouvé: ${id}`);
              continue;
            }

            // Mettre à jour l'URL
            await Film.findByIdAndUpdate(
              id,
              {
                $set: {
                  videoUrl: decryptedUrl,
                  updatedAt: new Date(),
                },
              },
              { session }
            );

            console.log(`✅ [ADMIN] URL mise à jour pour: ${film.title}`);
            updatedCount++;
          } catch (updateError) {
            console.error(
              `❌ [ADMIN] Erreur mise à jour ${update.id}:`,
              updateError.message
            );
            errors.push(`Erreur pour ${update.id}: ${updateError.message}`);
          }
        }
      });
    } finally {
      await session.endSession();
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `${updatedCount} URL(s) mise(s) à jour avec succès`,
        updatedCount,
        errors: errors.length > 0 ? errors.slice(0, 5) : [], // Limiter les erreurs affichées
      }),
    };
  } catch (error) {
    console.error("❌ Admin update ephemere URLs error:", error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
};
