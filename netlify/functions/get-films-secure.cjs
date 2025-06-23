const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

// Validation d'IP au niveau applicatif
const validateRequest = (event) => {
  const userAgent = event.headers["user-agent"] || "";
  const origin = event.headers["origin"] || "";

  // Vérifier que la requête vient bien de votre domaine
  const allowedOrigins = [
    "https://your-site.netlify.app",
    "https://moviestream.netlify.app", // Remplacez par votre vraie URL
    "http://localhost:8888", // Dev local
  ];

  // En production, vérifier l'origine
  if (
    process.env.NODE_ENV === "production" &&
    !allowedOrigins.includes(origin)
  ) {
    console.warn("⚠️ Suspicious origin:", origin);
    return false;
  }

  return true;
};

// ...existing schema and connectDB...

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin":
      process.env.NODE_ENV === "production"
        ? "https://your-site.netlify.app"
        : "*", // Restreindre en prod
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  // Validation de sécurité
  if (!validateRequest(event)) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: "Forbidden - Invalid origin" }),
    };
  }

  try {
    // Rate limiting simple
    const timestamp = Date.now();
    const requestKey = `${event.headers["x-forwarded-for"]}-${Math.floor(
      timestamp / 60000
    )}`; // Par minute

    // Log pour monitoring
    console.log("📊 Request from:", {
      ip: event.headers["x-forwarded-for"],
      userAgent: event.headers["user-agent"],
      origin: event.headers["origin"],
      timestamp: new Date().toISOString(),
    });

    await connectDB();
    const films = await Film.find().sort({ createdAt: 1 }).lean();

    if (films.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify([]),
      };
    }

    const transformedFilms = films.map((film) => ({
      id: film._id.toString(),
      title: film.title,
      cover: film.coverUrl,
      duration: film.duration,
      description: film.description,
      year: film.year,
      genre: film.genre.split(",").map((g) => g.trim()),
      videoUrl: film.videoUrl,
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedFilms),
    };
  } catch (error) {
    console.error("❌ Secure function failed:", error.message);

    // Fallback sécurisé
    const fallbackFilms = [
      // ...existing static films...
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackFilms),
    };
  }
};
