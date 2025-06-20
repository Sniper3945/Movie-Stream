import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    // Configuration pour servir les fichiers statiques correctement
    fs: {
      strict: false
    }
  },
  // S'assurer que les assets sont bien servis
  publicDir: 'public'
});
