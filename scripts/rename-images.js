import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le dossier des assets
const assetsDir = path.join(__dirname, "..", "public", "assets");

// Extensions d'images supportées
const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"];

// Fonction pour obtenir tous les fichiers d'images
const getImageFiles = (dir) => {
  try {
    const files = fs.readdirSync(dir);
    return files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext) && !file.startsWith('_');
      })
      .sort();
  } catch (error) {
    console.error(
      `❌ Erreur lors de la lecture du dossier ${dir}:`,
      error.message
    );
    return [];
  }
};

// Fonction principale pour renommer les images
const renameImages = () => {
  console.log("🔄 Début du renommage des images...");

  // Vérifier si le dossier assets existe
  if (!fs.existsSync(assetsDir)) {
    console.error(`❌ Le dossier ${assetsDir} n'existe pas.`);
    console.log("📁 Créez le dossier public/assets et placez-y vos images.");
    return;
  }

  // Obtenir tous les fichiers d'images
  const imageFiles = getImageFiles(assetsDir);

  if (imageFiles.length === 0) {
    console.log("⚠️  Aucune image trouvée dans le dossier assets.");
    return;
  }

  console.log(`📸 ${imageFiles.length} image(s) trouvée(s):`);
  imageFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });

  // Créer un dossier backup avec timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(assetsDir, `_backup_${timestamp}`);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
    console.log(`💾 Dossier de sauvegarde créé: _backup_${timestamp}`);
  }

  let renamedCount = 0;
  const renameOperations = [];

  // Première phase : planifier les renommages
  imageFiles.forEach((file, index) => {
    const oldPath = path.join(assetsDir, file);
    const newName = `film${index + 1}.webp`;
    const newPath = path.join(assetsDir, newName);
    const backupPath = path.join(backupDir, file);

    renameOperations.push({
      oldPath,
      newPath,
      backupPath,
      oldName: file,
      newName,
      index: index + 1
    });
  });

  // Deuxième phase : sauvegarder tous les fichiers
  console.log("\n💾 Sauvegarde des fichiers originaux...");
  renameOperations.forEach((op) => {
    try {
      fs.copyFileSync(op.oldPath, op.backupPath);
      console.log(`💾 ${op.oldName} sauvegardé`);
    } catch (error) {
      console.error(`❌ Erreur lors de la sauvegarde de ${op.oldName}:`, error.message);
    }
  });

  // Troisième phase : renommer avec un nom temporaire pour éviter les conflits
  console.log("\n🔄 Renommage temporaire...");
  renameOperations.forEach((op) => {
    const tempName = `temp_${op.index}_${Date.now()}.webp`;
    const tempPath = path.join(assetsDir, tempName);
    
    try {
      fs.renameSync(op.oldPath, tempPath);
      op.tempPath = tempPath;
      op.tempName = tempName;
      console.log(`🔄 ${op.oldName} → ${tempName} (temporaire)`);
    } catch (error) {
      console.error(`❌ Erreur lors du renommage temporaire de ${op.oldName}:`, error.message);
    }
  });

  // Quatrième phase : renommer vers les noms finaux
  console.log("\n✅ Renommage final...");
  renameOperations.forEach((op) => {
    if (op.tempPath && fs.existsSync(op.tempPath)) {
      try {
        fs.renameSync(op.tempPath, op.newPath);
        console.log(`✅ ${op.tempName} → ${op.newName}`);
        renamedCount++;
      } catch (error) {
        console.error(`❌ Erreur lors du renommage final de ${op.tempName}:`, error.message);
        // Restaurer depuis le temporaire si échec
        try {
          fs.renameSync(op.tempPath, op.oldPath);
          console.log(`🔄 Restauré: ${op.tempName} → ${op.oldName}`);
        } catch (restoreError) {
          console.error(`❌ Erreur lors de la restauration de ${op.tempName}:`, restoreError.message);
        }
      }
    }
  });

  console.log(`\n🎉 Renommage terminé! ${renamedCount} image(s) renommée(s).`);
  console.log(`💾 Sauvegardes disponibles dans le dossier _backup_${timestamp}`);

  // Afficher la liste finale
  const finalImages = getImageFiles(assetsDir);
  console.log("\n📁 Images finales:");
  finalImages.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });

  // Vérifier que nous avons le bon nombre d'images
  if (finalImages.length !== imageFiles.length) {
    console.warn(`⚠️  Attention: ${imageFiles.length} images originales mais ${finalImages.length} images finales!`);
    console.log("🔍 Vérifiez le dossier de sauvegarde pour récupérer les images manquantes.");
  }
};

// Exécuter le script
renameImages();
