const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI_ADMIN;

// Mapping des titres exacts et années pour la recherche fiable
const FILM_INFOS = [
  {
    title: "Gainsbourg vie héroïque",
    year: 2010,
    director: "Joann Sfar",
    ephemere: false,
  },
  {
    title: "L'affaire Thomas Crown",
    year: 1968,
    director: "Norman Jewison",
    ephemere: false,
  },
  {
    title: "La Piscine",
    year: 1969,
    director: "Jacques Deray",
    ephemere: false,
  },
  {
    title: "Un Homme et Une Femme",
    year: 1966,
    director: "Claude Lelouch",
    ephemere: false,
  },
  {
    title: "Le Samouraï",
    year: 1967,
    director: "Jean-Pierre Melville",
    ephemere: false,
  },
  {
    title: "Le Clan des Siciliens",
    year: 1969,
    director: "Henri Verneuil",
    ephemere: false,
  },
  {
    title: "Orange mécanique vf",
    year: 1971,
    director: "Stanley Kubrick",
    ephemere: false,
  },
  {
    title: "Les Dents de la mer vf",
    year: 1975,
    director: "Steven Spielberg",
    ephemere: false,
  },
  {
    title: "Taxi Driver vf",
    year: 1976,
    director: "Martin Scorsese",
    ephemere: false,
  },
  {
    title: "The Usual Suspects vf",
    year: 1995,
    director: "Bryan Singer",
    ephemere: false,
  },
  {
    title: "Apocalypse Now vf",
    year: 1979,
    director: "Francis Ford Coppola",
    ephemere: false,
  },
  {
    title: "Huit et Demi",
    year: 1963,
    director: "Federico Fellini",
    ephemere: false,
  },
];

const filmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  director: { type: String, default: "" },
  ephemere: { type: Boolean, default: false }, // <-- Ajout du champ ephemere au schéma
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

    let updatedCount = 0;
    let errors = [];

    for (const filmInfo of FILM_INFOS) {
      try {
        // Recherche stricte sur le titre et l'année
        const film = await Film.findOne({
          title: filmInfo.title,
          year: filmInfo.year,
        });
        if (film) {
          // Met à jour toujours le champ ephemere à false, même s'il existe déjà
          await Film.findByIdAndUpdate(film._id, {
            $set: { director: filmInfo.director, ephemere: false },
          });
          updatedCount++;
          console.log(
            `✅ Updated director and ephemere=false for "${film.title}" (${film.year}): ${filmInfo.director}`
          );
        } else {
          errors.push(
            `Film not found for: "${filmInfo.title}" (${filmInfo.year})`
          );
          console.warn(
            `❌ Film not found for: "${filmInfo.title}" (${filmInfo.year})`
          );
        }
      } catch (error) {
        errors.push(`Error updating "${filmInfo.title}": ${error.message}`);
        console.error(`❌ Error updating "${filmInfo.title}":`, error);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Directors and ephemere updated",
        updatedCount,
        errors,
      }),
    };
  } catch (error) {
    console.error("❌ Update error:", error);
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
