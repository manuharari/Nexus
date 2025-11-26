import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // loadEnv only loads vars from .env files, not system vars unless prefixed with VITE_
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // Explicitly pass the API_KEY from the system process (Vercel) or .env
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY || ''),
      // Polyfill the rest of process.env as an empty object to prevent crashes
      'process.env': JSON.stringify({})
    }
  };
});