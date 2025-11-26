// The reference to "vite/client" is removed to prevent errors when the type definition is missing.
// /// <reference types="vite/client" />

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
