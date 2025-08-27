import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  // Remove dangerous API key exposure - environment variables should be prefixed with VITE_
  // to be accessible in the client. This is still a security concern for production.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  
  // Security headers for development
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    }
  },
  
  // Build optimizations
  build: {
    // Enable tree shaking
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ai': ['@google/genai'],
        }
      }
    },
    // Enable source maps for debugging but exclude them in production
    sourcemap: process.env.NODE_ENV !== 'production',
    // Optimize chunk size
    chunkSizeWarningLimit: 600,
  },
});
