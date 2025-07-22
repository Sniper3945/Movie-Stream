const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI_ADMIN;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI_ADMIN not found in environment variables");
}

const filmSchema = new mongoose.Schema(
  {
    img: Buffer,
  },
  { strict: false }
);

const Film = mongoose.models.Film || mongoose.model("Film", filmSchema);

const connectDB = async () => {
  if (mongoose.connections[0].readyState === 1) return;
  await mongoose.connect(MONGODB_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    bufferCommands: false,
    retryWrites: true,
    w: "majority",
  });
  console.log("✅ MongoDB connected (ADMIN access)");
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    await connectDB();

    const { filmId, imgBase64 } = JSON.parse(event.body);
    if (!filmId || !imgBase64) {
      return { statusCode: 400, body: "Missing parameters" };
    }

    const imgBuffer = Buffer.from(imgBase64, "base64");
    const result = await Film.updateOne({ _id: filmId }, { img: imgBuffer });

    if (result.modifiedCount === 0) {
      return { statusCode: 404, body: "Film not found or not updated" };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message, stack: e.stack }),
    };
  }
};
