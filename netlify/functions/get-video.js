export const handler = async (event, context) => {
  // Tes vrais liens 0x0.st obtenus avec ton bot
  const videoLinks = {
    film1: "https://0x0.st/8IpD.mp4", // Gainsbourg (supprime le #nsfw)
    film2: "https://0x0.st/8Ipf.mp4", // L'affaire Thomas Crown (1968)
    film3: "https://0x0.st/8IpQ.mp4", // La piscine
  };

  const { id } = event.queryStringParameters || {};
  if (!id || !videoLinks[id]) {
    return {
      statusCode: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Film non trouvé" }),
    };
  }

  return {
    statusCode: 302,
    headers: {
      Location: videoLinks[id],
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    },
  };
};
