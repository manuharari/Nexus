import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Fix: Use '.' as envDir to avoid "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY works in your code without changing it to import.meta.env
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});