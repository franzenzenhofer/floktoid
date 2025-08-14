import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Generate version info before build
    {
      name: 'generate-version',
      buildStart() {
        execSync('node scripts/generate-version.js', { stdio: 'inherit' });
      }
    },
    // Copy og:image to dist
    {
      name: 'copy-og-image',
      closeBundle() {
        try {
          copyFileSync(
            resolve(__dirname, 'public/game-screenshot.png'),
            resolve(__dirname, 'dist/game-screenshot.png')
          );
          console.log('✅ Copied game-screenshot.png to dist/');
        } catch (err) {
          console.warn('⚠️ Could not copy game-screenshot.png:', err.message);
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    // iOS compatibility: transpile to older syntax
    target: ['es2015', 'safari12'],
    rollupOptions: {
      input: './index.html',
      output: {
        // Avoid dynamic imports on iOS
        manualChunks: undefined
      }
    },
    // Larger chunks to reduce module loading issues
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
});