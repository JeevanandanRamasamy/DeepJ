/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Define all your custom VITE_ variables here
  readonly VITE_GEMINI_API_KEY: string;
  // readonly VITE_ANOTHER_VAR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}