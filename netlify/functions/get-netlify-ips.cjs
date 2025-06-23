exports.handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // Récupérer l'IP réelle de la fonction Netlify
  const ip =
    event.headers["x-forwarded-for"] ||
    event.headers["x-real-ip"] ||
    context.clientContext?.custom?.netlify_ip ||
    "IP not detected";

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      functionIP: ip,
      userAgent: event.headers["user-agent"],
      headers: event.headers,
      netlifyRegion: process.env.AWS_REGION || "unknown",
      message: "Add this IP to MongoDB Atlas whitelist",
    }),
  };
};
