import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Génère une version basée sur la date/heure actuelle
const generateVersion = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");

  return `v${year}-${month}-${day}-${hour}${minute}`;
};

// Génère un timestamp unique pour éviter les collisions
const generateTimestamp = () => {
  return Date.now().toString(36); // Base 36 pour plus court
};

const version = generateVersion();
const timestamp = generateTimestamp();

// Créer le fichier de version
const versionData = {
  version,
  timestamp,
  buildDate: new Date().toISOString(),
  cacheBuster: `${version}-${timestamp}`,
};

// Créer le répertoire utils s'il n'existe pas
const utilsDir = path.join(__dirname, "..", "app", "utils");
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

const versionFilePath = path.join(utilsDir, "version.ts");

const versionFileContent = `// Auto-generated version file - DO NOT EDIT MANUALLY
// Generated at: ${versionData.buildDate}

export const VERSION_INFO = {
  version: '${versionData.version}',
  timestamp: '${versionData.timestamp}',
  buildDate: '${versionData.buildDate}',
  cacheBuster: '${versionData.cacheBuster}'
} as const;

export const getVersion = () => VERSION_INFO.version;
export const getCacheBuster = () => VERSION_INFO.cacheBuster;
export const getBuildDate = () => VERSION_INFO.buildDate;
`;

// Écrire le fichier
fs.writeFileSync(versionFilePath, versionFileContent, "utf8");

console.log(`✅ Version générée: ${version}`);
console.log(`📁 Fichier créé: ${versionFilePath}`);
console.log(`🔄 Cache buster: ${versionData.cacheBuster}`);
