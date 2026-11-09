import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/fiche-perso/',
  build: {
    // read by public/sw.js to precache every build file, lazily loaded chunks included
    manifest: 'asset-manifest.json',
  },
});
