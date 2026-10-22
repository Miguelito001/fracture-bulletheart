import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.RAW_PREVIEW === 'true' ? './' : process.env.GITHUB_PAGES_BUILD === 'true' ? '/fracture-bulletheart/' : '/',
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
