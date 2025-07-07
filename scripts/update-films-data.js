import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le fichier des films
const filmsDataPath = path.join(__dirname, "..", "app", "data", "films.ts");

// Fonction pour mettre à jour les chemins des covers
const updateFilmsData = () => {
  console.log("🔄 Mise à jour des chemins des covers...");

  try {
    // Lire le fichier actuel
    let content = fs.readFileSync(filmsDataPath, "utf8");

    // Remplacer les extensions .png par .webp
    content = content.replace(
      /\/assets\/film(\d+)\.png/g,
      "/assets/film$1.webp"
    );

    // Écrire le fichier mis à jour
    fs.writeFileSync(filmsDataPath, content, "utf8");

    console.log(
      "✅ Fichier films.ts mis à jour avec les nouveaux chemins .webp"
    );

    // Afficher un aperçu des changements
    const lines = content.split("\n");
    const coverLines = lines.filter((line) =>
      line.includes('cover: "/assets/film')
    );

    console.log("\n📸 Nouveaux chemins des covers:");
    coverLines.forEach((line, index) => {
      const match = line.match(/cover: "([^"]+)"/);
      if (match) {
        console.log(`  ${index + 1}. ${match[1]}`);
      }
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error.message);
  }
};

// Exécuter le script
updateFilmsData();
