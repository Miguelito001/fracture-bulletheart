import { defineConfig } from 'vite';
export default defineConfig({
  base:'/',
  build:{target:'es2022',sourcemap:false,chunkSizeWarningLimit:1800},
  server:{host:'0.0.0.0',port:4173,strictPort:true}
});