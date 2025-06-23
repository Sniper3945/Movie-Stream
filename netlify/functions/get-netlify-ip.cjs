exports.handler = async (event, context) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // Récupérer toutes les informations d'IP possibles
  const ips = {
    xForwardedFor: event.headers["x-forwarded-for"],
    xRealIp: event.headers["x-real-ip"],
    clientIp: context.clientContext?.ip,
    sourceIp: event.requestContext?.identity?.sourceIp || event.sourceIp,
    allHeaders: event.headers,
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: "Add these IPs to MongoDB Atlas Network Access",
      detectedIPs: ips,
      recommendation: {
        primary: ips.xForwardedFor || ips.sourceIp || "IP not detected",
        action:
          "Add this IP to MongoDB Atlas -> Network Access -> IP Access List",
      },
      netlifyRegion: process.env.AWS_REGION || "unknown",
      timestamp: new Date().toISOString(),
    }),
  };
};
