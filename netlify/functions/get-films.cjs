const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

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

// Connect to MongoDB
const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState === 1) return;
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  // Handle preflight
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
    console.log("🔄 Attempting MongoDB connection...");
    console.log("📋 MONGODB_URI exists:", !!MONGODB_URI);

    // Augmenter le timeout MongoDB pour correspondre au timeout client
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("MongoDB connection timeout after 20s")),
        20000
      )
    );

    await Promise.race([connectDB(), timeoutPromise]);
    console.log("✅ Connected to MongoDB");

    const films = await Film.find().sort({ createdAt: 1 });
    console.log(`📋 Found ${films.length} films in database`);

    if (films.length === 0) {
      console.warn("⚠️ No films found in MongoDB, returning fallback");
      throw new Error("No films in database");
    }

    // Transform films
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

    console.log("✅ Returning", transformedFilms.length, "transformed films");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedFilms),
    };
  } catch (error) {
    console.error("❌ Error in get-films:", error.message);

    // Return complete fallback response with all films
    const fallbackFilms = [
      {
        id: "film1",
        title: "Gainsbourg vie héroïque",
        cover: "/assets/film1.png",
        duration: "2h 08min",
        description:
          "Biopic musical de Joann Sfar sur la vie tumultueuse de Serge Gainsbourg, de ses débuts jusqu'à sa renommée internationale. Un portrait intime et surréaliste du provocateur français.",
        year: 2010,
        genre: ["Biopic", "Drame"],
      },
      {
        id: "film2",
        title: "L'affaire Thomas Crown",
        cover: "/assets/film2.png",
        duration: "1h 42min",
        description:
          "Steve McQueen incarne un millionnaire qui braque des banques par ennui. Faye Dunaway est l'enquêtrice chargée de l'arrêter dans ce thriller élégant des années 60.",
        year: 1968,
        genre: ["Thriller", "Romance"],
      },
      {
        id: "film3",
        title: "La Piscine",
        cover: "/assets/film3.png",
        duration: "2h 02min",
        description:
          "Alain Delon et Romy Schneider dans un drame psychologique tendu. Vacances d'été qui tournent au cauchemar quand des amis perturbent l'harmonie d'un couple.",
        year: 1969,
        genre: ["Drame", "Thriller"],
      },
      {
        id: "film4",
        title: "Un Homme et Une Femme",
        cover: "/assets/film4.png",
        duration: "1h 38min",
        description:
          "Chef-d'œuvre romantique de Claude Lelouch. L'histoire d'amour entre un pilote automobile et une script-girl, tous deux veufs, qui se rencontrent à Deauville.",
        year: 1966,
        genre: ["Romance", "Drame"],
      },
      {
        id: "film5",
        title: "Le Samouraï",
        cover: "/assets/film5.png",
        duration: "1h 45min",
        description:
          "Alain Delon incarne Jef Costello, tueur à gages solitaire et méticuleux. Chef-d'œuvre de Jean-Pierre Melville qui influence encore le cinéma moderne.",
        year: 1967,
        genre: ["Thriller", "Policier"],
      },
      {
        id: "film6",
        title: "Le Clan des Siciliens",
        cover: "/assets/film6.png",
        duration: "2h 04min",
        description:
          "Alain Delon, Jean Gabin et Lino Ventura dans un polar haletant. L'histoire d'un braquage d'bijouterie orchestré par la mafia sicilienne à Paris.",
        year: 1969,
        genre: ["Policier", "Thriller"],
      },
      {
        id: "film7",
        title: "Orange mécanique vf",
        cover: "/assets/film7.png",
        duration: "2h 16min",
        description:
          "Dystopie culte de Stanley Kubrick. Dans un futur proche, Alex DeLarge et ses droogs sèment la terreur avant qu'Alex ne subisse un traitement controversé.",
        year: 1971,
        genre: ["Sci-Fi", "Drame"],
      },
      {
        id: "film8",
        title: "Les Dents de la mer vf",
        cover: "/assets/film8.png",
        duration: "2h 04min",
        description:
          "Premier blockbuster de Steven Spielberg. Un requin géant terrorise une station balnéaire américaine. Suspense aquatique qui a marqué l'histoire du cinéma.",
        year: 1975,
        genre: ["Thriller", "Horreur"],
      },
      {
        id: "film9",
        title: "Taxi Driver vf",
        cover: "/assets/film9.png",
        duration: "1h 54min",
        description:
          "Robert De Niro incarne Travis Bickle, chauffeur de taxi new-yorkais sombrant dans la paranoïa. Chef-d'œuvre sombre de Martin Scorsese sur l'aliénation urbaine.",
        year: 1976,
        genre: ["Drame", "Thriller"],
      },
      {
        id: "film10",
        title: "The Usual Suspects vf",
        cover: "/assets/film10.png",
        duration: "1h 40min",
        description:
          "Thriller labyrinthique de Bryan Singer. Cinq criminels se retrouvent dans un coup monté par le mystérieux Keyser Söze. Twist final légendaire garanti.",
        year: 1995,
        genre: ["Thriller", "Policier"],
      },
      {
        id: "film11",
        title: "Apocalypse Now",
        cover: "/assets/apocalypse-now-cover.png",
        duration: "3h 02min",
        description:
          "Chef-d'œuvre de Francis Ford Coppola sur la guerre du Vietnam. Un voyage hallucinant au cœur des ténèbres de la guerre.",
        year: 1979,
        genre: ["Drame", "Guerre"],
      },
      {
        id: "film12",
        title: "8½",
        cover: "/assets/huit et demie.png",
        duration: "2h 18min",
        description:
          "Fellini explore la crise créative d'un réalisateur dans ce chef-d'œuvre du cinéma italien. Rêve et réalité se mélangent.",
        year: 1963,
        genre: ["Drame", "Comédie"],
      },
    ];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackFilms),
    };
  }
};
