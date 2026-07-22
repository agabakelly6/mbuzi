/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** Supabase project URL — Supabase Dashboard > Project Settings > API > Project URL. */
  readonly PUBLIC_SUPABASE_URL: string;
  /** Supabase anonymous/publishable key — Supabase Dashboard > Project Settings > API > anon public key. Safe to expose client-side; access is enforced by Row Level Security policies, not by keeping this secret. */
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
