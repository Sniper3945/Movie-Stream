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
    console.log("🚀 Function started - get-films (READ-ONLY)");

    // Timeout très court pour éviter les timeouts Netlify
    await Promise.race([
      connectDB(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("MongoDB timeout after 4s")), 4000)
      ),
    ]);

    const films = await Promise.race([
      Film.find().sort({ createdAt: 1 }).lean(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Query timeout")), 3000)
      ),
    ]);

    console.log(`📋 Successfully fetched ${films.length} films`);

    if (films.length === 0) {
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

    console.log("✅ Successfully returning", transformedFilms.length, "films");
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(transformedFilms),
    };
  } catch (error) {
    console.error("❌ MongoDB failed, using fallback:", error.message);

    // Retourner immédiatement le fallback complet
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
        videoUrl: "https://0x0.st/8IpD.mp4",
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
        videoUrl: "https://0x0.st/8Ipf.mp4",
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
        videoUrl: "https://0x0.st/8IpQ.mp4",
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
        videoUrl: "https://0x0.st/8IJ8.mp4",
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
        videoUrl: "https://0x0.st/8IId.mp4",
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
        videoUrl: "https://0x0.st/8IvB.mp4",
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
        videoUrl: "https://0x0.st/8ICS.mp4",
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
        videoUrl: "https://0x0.st/8ICg.mp4",
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
        videoUrl: "https://0x0.st/8IC1.mp4",
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
        videoUrl: "https://0x0.st/8Iv1.mp4",
      },
      {
        id: "film11",
        title: "Apocalypse Now",
        cover: "/assets/apocalypse-now-cover.png",
        duration: "3h 02min",
        description:
          "Chef-d'œuvre de Francis Ford Coppola sur la guerre du Vietnam.",
        year: 1979,
        genre: ["Drame", "Guerre"],
        videoUrl: "https://0x0.st/8lrT.mp4",
      },
      {
        id: "film12",
        title: "8½",
        cover: "/assets/huit et demie.png",
        duration: "2h 18min",
        description: "Fellini explore la crise créative d'un réalisateur.",
        year: 1963,
        genre: ["Drame", "Comédie"],
        videoUrl: "https://0x0.st/8lzm.mp4",
      },
    ];

    console.log(
      "📁 Returning fallback data with",
      fallbackFilms.length,
      "films"
    );
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackFilms),
    };
  }
};
