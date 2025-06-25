const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI_ADMIN;

// Mapping des anciens genres vers les nouveaux
const GENRE_MAPPING = {
  // Genres à conserver tels quels
  Action: "Action",
  Aventure: "Aventure",
  Animation: "Animation",
  Comédie: "Comédie",
  Drame: "Drame",
  Romance: "Romance",
  Thriller: "Thriller",
  Guerre: "Guerre",
  Western: "Western",
  Fantasy: "Fantasy",
  Horreur: "Horreur",
  Musique: "Musique",
  Histoire: "Histoire",
  Documentaire: "Documentaire",
  Familial: "Familial",

  // Genres à renommer/fusionner
  Policier: "Crime",
  Crime: "Crime",
  "Sci-Fi": "Science-Fiction",
  "Science-Fiction": "Science-Fiction",
  Mystère: "Mystère",
  Espionnage: "Thriller", // Fusionner avec Thriller
  Biopic: "Biopic",
  Survival: "Survival",
  Catastrophe: "Catastrophe",

  // Anciens genres possibles (à adapter selon vos données)
  Drama: "Drame",
  Comedy: "Comédie",
  "Sci-fi": "Science-Fiction",
  Horror: "Horreur",
  Adventure: "Aventure",
};

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

const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState === 1) return;
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log("✅ MongoDB connected (ADMIN access)");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
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

  // Vérification admin simple
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

    const films = await Film.find({}).exec();
    let migratedCount = 0;
    let errors = [];

    console.log(`🔄 Starting genre migration for ${films.length} films...`);

    for (const film of films) {
      try {
        const oldGenres = film.genre.split(", ").map((g) => g.trim());
        const newGenres = [];

        oldGenres.forEach((oldGenre) => {
          const mappedGenre = GENRE_MAPPING[oldGenre];
          if (mappedGenre) {
            if (!newGenres.includes(mappedGenre)) {
              newGenres.push(mappedGenre);
            }
          } else {
            console.warn(
              `⚠️ Genre non mappé: "${oldGenre}" pour le film "${film.title}"`
            );
            // Garder le genre original si pas de mapping
            if (!newGenres.includes(oldGenre)) {
              newGenres.push(oldGenre);
            }
          }
        });

        const newGenreString = newGenres.join(", ");

        if (newGenreString !== film.genre) {
          await Film.findByIdAndUpdate(film._id, {
            genre: newGenreString,
          });

          console.log(
            `✅ Updated "${film.title}": "${film.genre}" → "${newGenreString}"`
          );
          migratedCount++;
        }
      } catch (error) {
        const errorMsg = `Error updating film "${film.title}": ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: `Migration completed successfully`,
        stats: {
          totalFilms: films.length,
          migratedCount,
          errorsCount: errors.length,
          errors: errors.slice(0, 10), // Limite à 10 erreurs pour éviter les réponses trop grandes
        },
      }),
    };
  } catch (error) {
    console.error("❌ Migration error:", error);
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
