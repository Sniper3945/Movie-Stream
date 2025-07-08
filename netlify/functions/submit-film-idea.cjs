const mongoose = require("mongoose");

// Utiliser la clé spécifique pour les idées avec permissions limitées
const MONGODB_URI =
  process.env.MONGODB_URI_IDEAS || process.env.MONGODB_URI_APP;

// Film Schema (pour vérifier les doublons seulement)
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
});

// FilmIdea Schema avec le compteur "asked"
const filmIdeaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  director: { type: String, default: "" },
  year: { type: Number },
  overview: { type: String, default: "" },
  tmdbId: { type: Number },
  asked: { type: Number, default: 1 }, // Compteur de demandes pour cette idée
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Film = mongoose.models.Film || mongoose.model("Film", filmSchema);
const FilmIdea =
  mongoose.models.FilmIdea || mongoose.model("FilmIdea", filmIdeaSchema);

const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState === 1) return;
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log("✅ MongoDB connected for film ideas");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

// Fonction de nettoyage des caractères dangereux
const sanitizeInput = (input) => {
  if (!input) return "";
  return input
    .replace(/[<>'"&]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .substring(0, 200); // Limite la longueur
};

// Vérifier si le film existe déjà dans notre catalogue
const checkExistingFilm = async (title, year, director) => {
  const normalizeTitle = (str) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();

  const films = await Film.find({});

  for (const film of films) {
    const titleMatch = normalizeTitle(film.title) === normalizeTitle(title);
    const yearMatch = Math.abs((film.year || 0) - (year || 0)) <= 1; // Tolérance d'1 an

    let directorMatch = true;
    if (director && film.director) {
      directorMatch =
        normalizeTitle(film.director).includes(normalizeTitle(director)) ||
        normalizeTitle(director).includes(normalizeTitle(film.director));
    }

    if (titleMatch && yearMatch && directorMatch) {
      return film;
    }
  }
  return null;
};

// Vérifier si l'idée existe déjà dans FilmIdea
const checkExistingIdea = async (title, year, director) => {
  const normalizeTitle = (str) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();

  const ideas = await FilmIdea.find({});

  for (const idea of ideas) {
    const titleMatch = normalizeTitle(idea.title) === normalizeTitle(title);
    const yearMatch = Math.abs((idea.year || 0) - (year || 0)) <= 1; // Tolérance d'1 an

    let directorMatch = true;
    if (director && idea.director) {
      directorMatch =
        normalizeTitle(idea.director).includes(normalizeTitle(director)) ||
        normalizeTitle(director).includes(normalizeTitle(idea.director));
    }

    if (titleMatch && yearMatch && directorMatch) {
      return idea;
    }
  }
  return null;
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    await connectDB();

    const { title, director, year, overview, tmdbId } = JSON.parse(event.body);

    const cleanTitle = sanitizeInput(title);
    const cleanDirector = sanitizeInput(director);
    const cleanOverview = sanitizeInput(overview);

    if (!cleanTitle) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Le titre du film est requis" }),
      };
    }

    // Vérifier si le film existe déjà dans notre catalogue
    const existingFilm = await checkExistingFilm(
      cleanTitle,
      year,
      cleanDirector
    );

    if (existingFilm) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Ce film est déjà dans notre catalogue !`,
          existing: true,
          film: {
            title: existingFilm.title,
            year: existingFilm.year,
            director: existingFilm.director,
          },
        }),
      };
    }

    // Vérifier si l'idée existe déjà dans FilmIdea
    const existingIdea = await checkExistingIdea(
      cleanTitle,
      year,
      cleanDirector
    );

    if (existingIdea) {
      await FilmIdea.findByIdAndUpdate(existingIdea._id, {
        $inc: { asked: 1 },
        $set: { updatedAt: new Date() },
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: `Cette idée a déjà été suggérée ${
            existingIdea.asked + 1
          } fois ! Merci pour votre soutien.`,
          existing: true,
          idea: {
            title: existingIdea.title,
            year: existingIdea.year,
            director: existingIdea.director,
            asked: existingIdea.asked + 1,
          },
        }),
      };
    }

    // Créer une nouvelle idée
    const filmIdea = new FilmIdea({
      title: cleanTitle,
      director: cleanDirector,
      year: year || null,
      overview: cleanOverview,
      tmdbId: tmdbId || null,
      asked: 1,
    });

    await filmIdea.save();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Merci pour votre suggestion ! Nous l'avons bien enregistrée.",
        existing: false,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: "Erreur lors de l'enregistrement de votre suggestion",
      }),
    };
  }
};
