const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { password } = JSON.parse(event.body);

    console.log("🔐 Admin authentication attempt");

    if (password === ADMIN_PASSWORD) {
      console.log("✅ Admin authentication successful");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: "Authentication successful",
        }),
      };
    } else {
      console.log("❌ Admin authentication failed - wrong password");
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: "Invalid password",
        }),
      };
    }
  } catch (error) {
    console.error("❌ Admin auth error:", error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Authentication error",
      }),
    };
  }
};
