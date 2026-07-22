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
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY — see .env.example."
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
