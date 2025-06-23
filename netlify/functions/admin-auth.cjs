const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "sniper3945";

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const { password } = JSON.parse(event.body);

    if (password === ADMIN_PASSWORD) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ success: true }),
      };
    } else {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid password" }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
    };
  }
};
