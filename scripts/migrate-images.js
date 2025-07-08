import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const MONGODB_URI = process.env.MONGODB_URI_ADMIN;
const ASSETS_DIR = path.join(__dirname, "..", "public", "assets");
const BACKUP_DIR = path.join(ASSETS_DIR, `_migration_backup_${Date.now()}`);

// Film Schema avec img
const filmSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String, required: true },
  director: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  ephemere: { type: Boolean, default: false },
  img: { type: Buffer },
});

const Film = mongoose.model("Film", filmSchema);

// Fonction de connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log("✅ [MIGRATION] MongoDB connecté (ADMIN access)");
  } catch (error) {
    console.error("❌ [MIGRATION] Erreur connexion MongoDB:", error.message);
    throw error;
  }
};

// Fonction principale de migration
const migrateImages = async () => {
  console.log("🚀 [MIGRATION] Début de la migration des images vers MongoDB");

  // Vérifier les dossiers
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`❌ [MIGRATION] Dossier ${ASSETS_DIR} introuvable`);
    return;
  }

  // Créer le dossier de backup
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`💾 [MIGRATION] Dossier de backup créé: ${BACKUP_DIR}`);
  }

  try {
    await connectDB();

    // Récupérer tous les films
    const films = await Film.find({}).sort({ createdAt: 1 });
    console.log(`📊 [MIGRATION] ${films.length} films trouvés en base`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < films.length; i++) {
      const film = films[i];
      const expectedImagePath = path.join(ASSETS_DIR, `film${i + 1}.webp`);

      try {
        // Vérifier si le film a déjà une image
        if (film.img && film.img.length > 0) {
          console.log(
            `⏭️ [MIGRATION] ${film.title} - Image déjà présente (${film.img.length} bytes)`
          );
          skippedCount++;
          continue;
        }

        // Vérifier si l'image existe
        if (!fs.existsSync(expectedImagePath)) {
          console.warn(
            `⚠️ [MIGRATION] ${film.title} - Image non trouvée: film${
              i + 1
            }.webp`
          );
          errorCount++;
          continue;
        }

        console.log(
          `🔄 [MIGRATION] ${film.title} - Migration de film${i + 1}.webp`
        );

        // Lire l'image
        const imageBuffer = fs.readFileSync(expectedImagePath);
        console.log(
          `📸 [MIGRATION] ${film.title} - Image lue (${imageBuffer.length} bytes)`
        );

        // Backup de l'image
        const backupPath = path.join(BACKUP_DIR, `film${i + 1}.webp`);
        fs.copyFileSync(expectedImagePath, backupPath);

        // Mettre à jour le film en base
        await Film.findByIdAndUpdate(film._id, {
          $set: { img: imageBuffer },
        });

        console.log(`✅ [MIGRATION] ${film.title} - Image migrée avec succès`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ [MIGRATION] ${film.title} - Erreur:`, error.message);
        errorCount++;
      }
    }

    console.log("\n📊 [MIGRATION] Résumé de la migration:");
    console.log(`✅ Images migrées: ${migratedCount}`);
    console.log(`⏭️ Images ignorées (déjà présentes): ${skippedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`💾 Backup disponible dans: ${BACKUP_DIR}`);

    if (migratedCount > 0) {
      console.log("\n🎉 [MIGRATION] Migration terminée avec succès!");
      console.log(
        "🔄 [MIGRATION] Redémarrez votre application pour voir les changements"
      );
      console.log(
        "📝 [MIGRATION] Testez que toutes les images s'affichent correctement"
      );
      console.log(
        "🗑️ [MIGRATION] Une fois validé, vous pourrez supprimer les images statiques"
      );
    }
  } catch (error) {
    console.error("❌ [MIGRATION] Erreur générale:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 [MIGRATION] Déconnexion MongoDB");
  }
};

// Vérifier les paramètres et lancer la migration
const checkEnvironment = () => {
  if (!MONGODB_URI) {
    console.error("❌ [MIGRATION] MONGODB_URI_ADMIN non défini dans .env");
    process.exit(1);
  }

  console.log("🔧 [MIGRATION] Configuration:");
  console.log(`📁 Dossier assets: ${ASSETS_DIR}`);
  console.log(`💾 Dossier backup: ${BACKUP_DIR}`);
  console.log(`🔗 MongoDB: ${MONGODB_URI.replace(/\/\/.*@/, "//***@")}`);
  console.log("");

  return true;
};

// Point d'entrée
if (checkEnvironment()) {
  migrateImages().catch((error) => {
    console.error("❌ [MIGRATION] Erreur fatale:", error);
    process.exit(1);
  });
}
