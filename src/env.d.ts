/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  // add other env vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}