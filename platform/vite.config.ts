import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The config runs in Node; this project deliberately ships no Node type packages.
declare const process: { env: Record<string, string | undefined> };

// Preview hostnames are supplied per environment; never allow wildcards.
const extraHosts = (process.env.__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8099",
        changeOrigin: true,
      },
    },
    ...(extraHosts.length ? { allowedHosts: extraHosts } : {}),
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
