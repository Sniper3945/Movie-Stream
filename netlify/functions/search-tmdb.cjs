// Clé API TMDB - à ajouter dans les variables d'environnement Netlify
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Mapping des genres TMDB vers français
const GENRE_MAPPING = {
  28: "Action",
  12: "Aventure",
  16: "Animation",
  35: "Comédie",
  80: "Crime",
  99: "Documentaire",
  18: "Drame",
  10751: "Familial",
  14: "Fantasy",
  36: "Histoire",
  27: "Horreur",
  10402: "Musique",
  9648: "Mystère",
  10749: "Romance",
  878: "Science-Fiction",
  10770: "Téléfilm",
  53: "Thriller",
  10752: "Guerre",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (!TMDB_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "TMDB API key not configured" }),
    };
  }

  const { title, director, year } = event.queryStringParameters || {};

  if (!title) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Title parameter required" }),
    };
  }

  try {
    // Recherche de films par titre
    let searchUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      title
    )}&language=fr-FR`;

    if (year) {
      searchUrl += `&year=${year}`;
    }

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.results || searchData.results.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ results: [] }),
      };
    }

    // Traitement des résultats avec détails supplémentaires
    const detailedResults = await Promise.all(
      searchData.results.slice(0, 5).map(async (movie) => {
        try {
          // Récupérer les détails du film incluant les crédits
          const detailsUrl = `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=credits&language=fr-FR`;
          const detailsResponse = await fetch(detailsUrl);
          const details = await detailsResponse.json();

          // Trouver le réalisateur
          const director_name =
            details.credits?.crew?.find((person) => person.job === "Director")
              ?.name || "";

          // Filtrer par réalisateur si spécifié
          if (
            director &&
            director_name.toLowerCase().indexOf(director.toLowerCase()) === -1
          ) {
            return null;
          }

          // Mapper les genres
          const genres =
            details.genres?.map((g) => GENRE_MAPPING[g.id] || g.name) || [];

          return {
            id: movie.id,
            title: details.title || movie.title,
            original_title: movie.original_title,
            overview: details.overview || movie.overview,
            release_date: details.release_date || movie.release_date,
            year: details.release_date
              ? new Date(details.release_date).getFullYear()
              : null,
            runtime: details.runtime,
            genres: genres,
            director: director_name,
            poster_path: movie.poster_path,
            vote_average: movie.vote_average,
          };
        } catch (error) {
          console.error(`Error fetching details for movie ${movie.id}:`, error);
          return null;
        }
      })
    );

    // Filtrer les résultats null
    const validResults = detailedResults.filter((result) => result !== null);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results: validResults }),
    };
  } catch (error) {
    console.error("TMDB search error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Search failed" }),
    };
  }
};
