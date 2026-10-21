import { defineConfig } from '@playwright/test';
export default defineConfig({
  timeout:85_000,workers:1,retries:1,
  reporter:'list',
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1440,height:900},headless:true},
  webServer:{command:'npm run preview -- --port 4173',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:25_000},
  outputDir:'qa/rebuild/screenshots'
});