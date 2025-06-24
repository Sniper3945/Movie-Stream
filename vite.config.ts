import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  server: {
    port: 8888,
    host: true,
    strictPort: true,
    hmr: {
      port: 8889,
      host: 'localhost'
    }
  },
  build: {
    rollupOptions: {
      onwarn(warning: any, warn: any) {
        // Supprimer les warnings inutiles
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        warn(warning);
      }
    }
  }
});