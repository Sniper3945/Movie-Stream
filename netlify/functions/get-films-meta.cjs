const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI_APP;

// ...existing schema and connectDB...

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    await connectDB();

    // Récupérer seulement les métadonnées (sans les images base64)
    const films = await Film.find()
      .select("title duration year genre description videoUrl createdAt")
      .sort({ createdAt: 1 })
      .lean();

    const lightweightFilms = films.map((film) => ({
      id: film._id.toString(),
      title: film.title,
      cover: `/assets/mongodb-${film._id.toString().slice(-6)}.png`, // Cover générée
      duration: film.duration,
      description: film.description,
      year: film.year,
      genre: film.genre.split(",").map((g) => g.trim()),
      videoUrl: film.videoUrl,
    }));

    console.log(`✅ Returning ${lightweightFilms.length} lightweight films`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(lightweightFilms),
    };
  } catch (error) {
    console.error("❌ Metadata fetch failed:", error.message);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([]),
    };
  }
};
