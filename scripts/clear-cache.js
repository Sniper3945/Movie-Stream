import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🧹 Nettoyage des caches de développement...");

// Générer une nouvelle version pour forcer le renouvellement
const generateVersion = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");

  return `v${year}-${month}-${day}-${hour}${minute}${second}`;
};

const timestamp = Date.now().toString(36);
const version = generateVersion();

// Mise à jour forcée du fichier de version
const versionData = {
  version,
  timestamp,
  buildDate: new Date().toISOString(),
  cacheBuster: `${version}-${timestamp}`,
};

const versionFilePath = path.join(
  __dirname,
  "..",
  "app",
  "utils",
  "version.ts"
);

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

// Créer le répertoire utils s'il n'existe pas
const utilsDir = path.dirname(versionFilePath);
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

fs.writeFileSync(versionFilePath, versionFileContent, "utf8");

console.log(`✅ Nouvelle version générée: ${version}`);
console.log(`🔄 Cache buster: ${versionData.cacheBuster}`);
console.log(
  `📝 Redémarrez votre serveur de développement pour appliquer les changements`
);
console.log(
  `📝 Redémarrez votre serveur de développement pour appliquer les changements`
);
