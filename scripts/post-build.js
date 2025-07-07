import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Lire la version générée
  const versionPath = path.join(__dirname, "..", "app", "utils", "version.ts");

  if (!fs.existsSync(versionPath)) {
    throw new Error(
      "Fichier version.ts introuvable. Exécutez generate-version.js d'abord."
    );
  }

  const versionContent = fs.readFileSync(versionPath, "utf8");

  // Extraire la version du fichier
  const versionMatch = versionContent.match(/version: '([^']+)'/);
  if (!versionMatch) {
    throw new Error("Impossible de trouver la version dans version.ts");
  }

  const version = versionMatch[1];
  console.log(`📦 Version détectée: ${version}`);

  // Mise à jour du Service Worker
  const swPath = path.join(__dirname, "..", "public", "sw.js");
  if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, "utf8");
    swContent = swContent.replace("__VERSION_PLACEHOLDER__", version);
    fs.writeFileSync(swPath, swContent, "utf8");
    console.log(`✅ Service Worker mis à jour avec la version: ${version}`);
  }

  // Mise à jour du build output (si présent)
  const buildSwPath = path.join(__dirname, "..", "build", "client", "sw.js");
  if (fs.existsSync(buildSwPath)) {
    let buildSwContent = fs.readFileSync(buildSwPath, "utf8");
    buildSwContent = buildSwContent.replace("__VERSION_PLACEHOLDER__", version);
    fs.writeFileSync(buildSwPath, buildSwContent, "utf8");
    console.log(`✅ Build SW mis à jour avec la version: ${version}`);
  }
} catch (error) {
  console.error("❌ Erreur lors du post-build:", error.message);
  process.exit(1);
}
