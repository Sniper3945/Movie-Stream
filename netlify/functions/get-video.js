export const handler = async (event, context) => {
  // Tes liens 0x0.st obtenus avec ton bot - ajoute-en plus selon tes besoins
  const videoLinks = {
    film1: "https://0x0.st/8IpD.mp4", // Gainsbourg (supprime le #nsfw)
    film2: "https://0x0.st/8Ipf.mp4", // L'affaire Thomas Crown (1968)
    film3: "https://0x0.st/8IpQ.mp4", // La piscine
    film4: "https://0x0.st/8IJ8.mp4", // Un Homme et Une Femme
    film5: "https://0x0.st/8IId.mp4", // Le Samouraï
    film6: "https://0x0.st/8IvB.mp4", // Clan des sciciliens
    film7: "https://0x0.st/AAAA.mp4", // À remplacer par ton lien
    film8: "https://0x0.st/BBBB.mp4", // À remplacer par ton lien
    film9: "https://0x0.st/CCCC.mp4", // À remplacer par ton lien
    film10: "https://0x0.st/8Iv1.mp4", // The Usual Suspect
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
