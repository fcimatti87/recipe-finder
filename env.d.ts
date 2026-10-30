// this file declare to TypeScript what environment variables exist
declare namespace NodeJS {
  interface ProcessEnv {
    GOOGLE_GENERATIVE_AI_API_KEY?: string;
    GEMINI_MODEL?: string;
  }
}