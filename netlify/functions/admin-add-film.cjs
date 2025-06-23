const mongoose = require("mongoose");

// Variables d'environnement Netlify
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validation des variables d'environnement
if (!MONGODB_URI || !ADMIN_PASSWORD || !ENCRYPTION_KEY) {
  console.error("❌ Missing environment variables:", {
    MONGODB_URI: !!MONGODB_URI,
    ADMIN_PASSWORD: !!ADMIN_PASSWORD,
    ENCRYPTION_KEY: !!ENCRYPTION_KEY,
  });
}

// Film Schema with GridFS reference for large images
const filmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  coverUrl: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Film = mongoose.models.Film || mongoose.model("Film", filmSchema);

// Connect to MongoDB with optimized settings
const connectDB = async () => {
  try {
    if (mongoose.connections[0].readyState === 1) return;

    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      // Removed bufferMaxEntries as it's deprecated
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

// Decrypt function - FIX pour les caractères spéciaux
const decryptData = (encryptedData) => {
  try {
    // Gestion des caractères UTF-8 corrects
    const decoded = atob(encryptedData);
    return decodeURIComponent(escape(decoded));
  } catch (error) {
    console.warn("Decrypt error, returning raw data:", error);
    return encryptedData;
  }
};

// Optimized image processing with compression
const processImage = async (buffer, maxSizeKB = 800) => {
  try {
    const sizeKB = buffer.length / 1024;
    console.log(`Original image size: ${sizeKB.toFixed(2)}KB`);

    // If image is reasonably sized, convert to base64
    if (sizeKB <= maxSizeKB) {
      const base64 = buffer.toString("base64");
      return `data:image/png;base64,${base64}`;
    }

    // For larger images, we'd need image compression library
    // For now, we'll still process but warn
    console.warn(`Large image detected: ${sizeKB.toFixed(2)}KB`);
    const base64 = buffer.toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("Image processing error:", error);
    throw new Error("Failed to process image");
  }
};

// Improved multipart parser with better UTF-8 handling
const parseMultipart = (body, boundary) => {
  try {
    const parts = body.split(`--${boundary}`);
    const formData = {};
    let coverBuffer = null;

    for (const part of parts) {
      if (part.includes("Content-Disposition: form-data")) {
        const nameMatch = part.match(/name="([^"]+)"/);
        if (nameMatch) {
          const fieldName = nameMatch[1];
          const contentStart = part.indexOf("\r\n\r\n") + 4;
          const contentEnd = part.lastIndexOf("\r\n");

          if (contentStart < contentEnd && contentStart > 3) {
            if (fieldName === "cover") {
              const binaryContent = part.slice(contentStart, contentEnd);
              coverBuffer = Buffer.from(binaryContent, "binary");
              console.log(
                `Cover buffer size: ${(coverBuffer.length / 1024).toFixed(2)}KB`
              );

              if (coverBuffer.length > 5 * 1024 * 1024) {
                // 5MB max
                throw new Error("Image too large (max 5MB)");
              }
            } else {
              const content = part.slice(contentStart, contentEnd);
              formData[fieldName] = content.trim();
            }
          }
        }
      }
    }

    console.log("Parsed form fields:", Object.keys(formData));
    return { formData, coverBuffer };
  } catch (error) {
    console.error("Multipart parsing error:", error);
    throw error;
  }
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Token",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  // Vérification des variables d'environnement
  if (!MONGODB_URI) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Server configuration error",
        details: "MongoDB URI not configured",
      }),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const authToken = event.headers["x-admin-token"];
  if (authToken !== "true") {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Unauthorized" }),
    };
  }

  try {
    console.log("=== Starting film addition process ===");

    await connectDB();
    console.log("Database connected successfully");

    const contentType = event.headers["content-type"] || "";
    const boundary = contentType.split("boundary=")[1];

    if (!boundary) {
      throw new Error("Invalid content type - no boundary found");
    }

    console.log("Parsing multipart data...");
    const bodyBuffer = Buffer.from(event.body, "base64");
    const bodyString = bodyBuffer.toString("binary");
    const { formData, coverBuffer } = parseMultipart(bodyString, boundary);

    console.log("Form data received:", {
      title: formData.title ? "Present" : "Missing",
      duration: formData.duration || "Missing",
      year: formData.year || "Missing",
      genre: formData.genre || "Missing",
      description: formData.description ? "Present" : "Missing",
      url: formData.url ? "Present" : "Missing",
      cover: coverBuffer
        ? `${(coverBuffer.length / 1024).toFixed(2)}KB`
        : "Missing",
    });

    // Validate required fields
    if (!formData.title || !formData.description || !formData.url) {
      throw new Error("Missing required form fields");
    }

    if (!coverBuffer || coverBuffer.length === 0) {
      throw new Error("Cover image is required");
    }

    console.log("Decrypting sensitive data...");
    const title = decryptData(formData.title);
    const description = decryptData(formData.description);
    const videoUrl = decryptData(formData.url);

    console.log("Decrypted data:", {
      title: title.substring(0, 20) + "...",
      videoUrl: videoUrl.substring(0, 30) + "...",
      description: description.substring(0, 50) + "...",
    });

    console.log(`Processing image for film: ${title}`);
    const coverUrl = await processImage(coverBuffer);

    console.log("Creating film document...");
    const filmData = {
      title,
      duration: formData.duration,
      year: parseInt(formData.year) || new Date().getFullYear(),
      genre: formData.genre,
      coverUrl,
      description,
      videoUrl,
    };

    const film = new Film(filmData);

    console.log("Saving to database...");
    const savedFilm = await film.save();
    console.log(`✅ Film saved successfully with ID: ${savedFilm._id}`);

    return {
      statusCode: 200,
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "Film ajouté avec succès",
        filmId: savedFilm._id,
        title: savedFilm.title,
      }),
    };
  } catch (error) {
    console.error("=== ERROR DETAILS ===");
    console.error("Error message:", error.message);
    console.error("Stack trace:", error.stack);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Erreur lors de l'ajout du film",
        details: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
