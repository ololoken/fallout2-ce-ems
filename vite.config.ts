import { defineConfig } from 'vite'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import react from '@vitejs/plugin-react'
import commonjs from 'vite-plugin-commonjs';

export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  plugins: [react(), commonjs({
    filter: id => id.endsWith('fallout2-ce.js')
  })],
  envPrefix: 'F2S',
  base: process.env.SITE_BASE ?? '/',
  clearScreen: false,
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  build: {
    outDir: './dist/',
    target: 'esnext',
    minify: 'esbuild',
    reportCompressedSize: true,
  },
});
