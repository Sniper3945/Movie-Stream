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
  preview: {
    port: 8888,
    host: true
  },
  build: {
    rollupOptions: {
      onwarn(warning: any, warn: any) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }
        warn(warning);
      }
    }
  }
});