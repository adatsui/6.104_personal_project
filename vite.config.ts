import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

const stubs = fileURLToPath(new URL("./web/node-stubs.ts", import.meta.url));

// The frontend runs at http://127.0.0.1:8080 and passes /api and /health on to
// the backend, so the browser sees one origin and the session cookie just works.
export default defineConfig({
  root: "web",
  plugins: [vue()],
  // sync-engine's shared code imports two Node built-ins the browser never uses.
  resolve: { alias: { "node:crypto": stubs, "node:util": stubs } },
  // Its logger also reads process.env.LOG_LEVEL, which browsers do not have.
  define: { "process.env.LOG_LEVEL": JSON.stringify("warn") },
  server: {
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
    proxy: {
      "/api": process.env.BACKEND_URL ?? "http://127.0.0.1:3000",
      "/health": process.env.BACKEND_URL ?? "http://127.0.0.1:3000",
    },
  },
});
