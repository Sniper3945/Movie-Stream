import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  server: {
    port: 8888,
    host: true
  },
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    rollupOptions: {
      external: ['crypto']
    }
  }
});
