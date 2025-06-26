import { Handler, HandlerEvent } from "@netlify/functions";

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const { password } = JSON.parse(event.body || "{}");
  if (password === process.env.ADMIN_PASSWORD) {
    return { statusCode: 200, body: "OK" };
  }
  return { statusCode: 401, body: "Unauthorized" };
};
