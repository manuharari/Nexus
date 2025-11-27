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
      // We define the whole object to ensure properties are accessible
      'process.env': JSON.stringify({
        API_KEY: apiKey,
        NODE_ENV: mode,
      }),
    }
  };
});