declare const process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    [key: string]: string | undefined;
  }
}
