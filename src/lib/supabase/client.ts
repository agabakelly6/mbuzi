// src/lib/supabase/client.ts
//
// The one Supabase client instance for the whole app. This project builds
// as a fully static site (no SSR adapter configured in astro.config.mjs),
// so this is a browser-only client using the anon/publishable key — there
// is no server request context to hold a service-role key or manage
// cookie-based sessions in. Supabase's own client already persists the
// session to localStorage and silently refreshes the access token; see
// hooks/useAuthBootstrap.ts for how that gets reflected into AuthContext.
//
// No `Database` generic yet — there are no tables to generate types from
// in this milestone. Pass `createClient<Database>(...)` once a schema
// exists and `supabase gen types typescript` has something to generate.
//
// Falls back to placeholder values instead of throwing when the env vars
// are unset — `astro build` now actually prerenders pages that import
// this module (the /order page renders a real component tree during
// SSG), and a top-level throw here used to fail the entire static build
// on any machine without a live Supabase project configured. The client
// itself does nothing at construction time; every real network call only
// happens client-side in the browser after hydration, so an unconfigured
// placeholder is harmless at build time and simply won't authenticate
// anything until real values are set in .env.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables (PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY) — see .env.example. Supabase-backed features won't work until these are set."
  );
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
