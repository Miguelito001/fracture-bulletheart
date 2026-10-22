import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.GITHUB_PAGES_BUILD === 'true' ? '/fracture-bulletheart/' : '/',
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
