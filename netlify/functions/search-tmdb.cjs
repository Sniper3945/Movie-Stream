const fetch = require("node-fetch");

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

exports.handler = async (event) => {
  const headers = { "Access-Control-Allow-Origin": "*" };

  console.log(
    "[TMDB] Function called with event:",
    event.queryStringParameters
  );

  if (!TMDB_API_KEY) {
    console.error("[TMDB] TMDB_API_KEY not set in env");
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "TMDB_API_KEY not set in env" }),
    };
  }

  const { title, year, director } = event.queryStringParameters || {};
  if (!title) {
    console.warn("[TMDB] Missing title parameter");
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Missing title parameter" }),
    };
  }

  // Fonction de comparaison tolérante (inclusion + Levenshtein <= 2)
  function isDirectorMatch(d1, d2) {
    if (!d1 || !d2) return false;
    const a = d1.toLowerCase().replace(/[^a-z]/g, "");
    const b = d2.toLowerCase().replace(/[^a-z]/g, "");
    if (a.includes(b) || b.includes(a)) return true;
    // Levenshtein distance simple
    function lev(s, t) {
      const dp = Array.from({ length: s.length + 1 }, () => []);
      for (let i = 0; i <= s.length; i++) dp[i][0] = i;
      for (let j = 0; j <= t.length; j++) dp[0][j] = j;
      for (let i = 1; i <= s.length; i++) {
        for (let j = 1; j <= t.length; j++) {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,
            dp[i][j - 1] + 1,
            dp[i - 1][j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1)
          );
        }
      }
      return dp[s.length][t.length];
    }
    return lev(a, b) <= 2;
  }

  try {
    // 1. Recherche de films par titre (et année si précisée)
    let url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
      title
    )}&language=fr-FR`;
    if (year) url += `&year=${encodeURIComponent(year)}`;

    console.log("[TMDB] Search URL:", url);

    const searchRes = await fetch(url);
    const searchData = await searchRes.json();

    console.log("[TMDB] Search response:", JSON.stringify(searchData, null, 2));

    if (!searchData.results || searchData.results.length === 0) {
      console.log("[TMDB] No results found for:", title, year);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ results: [] }),
      };
    }

    // 2. Pour chaque résultat, enrichir avec genres, overview, runtime, director
    const enrichedResults = await Promise.all(
      searchData.results.slice(0, 5).map(async (movie, idx) => {
        try {
          console.log(
            `[TMDB] Fetching details for movie #${idx + 1}:`,
            movie.title,
            movie.id
          );
          const detailsUrl = `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}&language=fr-FR&append_to_response=credits`;
          const detailsRes = await fetch(detailsUrl);
          const details = await detailsRes.json();

          console.log(
            `[TMDB] Details for ${movie.title}:`,
            JSON.stringify(details, null, 2)
          );

          // Genres (français)
          const genres =
            (details.genres || []).map(
              (g) => g.name || GENRE_MAPPING[g.id] || ""
            ) || [];

          // Réalisateur (director)
          let directorName = "";
          if (details.credits && details.credits.crew) {
            const dirObj = details.credits.crew.find(
              (c) => c.job === "Director"
            );
            if (dirObj) directorName = dirObj.name;
          }

          // Correction: comparaison tolérante
          if (
            director &&
            directorName &&
            !isDirectorMatch(directorName, director)
          ) {
            console.log(
              `[TMDB] Skipping ${movie.title} (director "${directorName}" does not match filter "${director}")`
            );
            return null;
          }

          return {
            id: movie.id,
            title: movie.title,
            original_title: movie.original_title,
            overview: movie.overview || details.overview || "",
            release_date: movie.release_date || details.release_date,
            year: movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : null,
            runtime: details.runtime || null,
            genres: genres,
            director: directorName,
            poster_path: movie.poster_path
              ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
              : null,
            vote_average: movie.vote_average,
          };
        } catch (err) {
          console.error(
            `[TMDB] Error fetching details for movie ${movie.title}:`,
            err
          );
          return null;
        }
      })
    );

    // Filtre les résultats nuls (si filtre director)
    const filteredResults = enrichedResults.filter(Boolean);

    console.log(
      "[TMDB] Final enriched results:",
      JSON.stringify(filteredResults, null, 2)
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ results: filteredResults }),
    };
  } catch (error) {
    console.error("[TMDB] General error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
