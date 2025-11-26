// Removed reference to vite/client which was causing type definition errors
// /// <reference types="vite/client" />

declare var process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};

interface ImportMetaEnv {
  readonly API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
