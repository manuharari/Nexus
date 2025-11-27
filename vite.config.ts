import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  // Priority: System Env (Netlify/Vercel) > .env file > Empty string
  const apiKey = process.env.API_KEY || env.API_KEY || process.env.VITE_API_KEY || env.VITE_API_KEY || '';

  return {
    plugins: [react()],
    define: {
      // Define process.env.API_KEY specifically to avoid replacing the entire process.env object destructively
      'process.env.API_KEY': JSON.stringify(apiKey),
      // Polyfill standard process.env for other potential library usages (safe fallback)
      'process.env': JSON.stringify({
        NODE_ENV: mode,
        API_KEY: apiKey
      }),
    }
  };
});