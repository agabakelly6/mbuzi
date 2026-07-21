// src/lib/logo.ts
//
// Optional custom brand mark. Drop a file at src/assets/branding/logo.png
// (or .svg / .webp) and Logo.tsx switches to it automatically, everywhere
// it's used — no code change required. Until that file exists, LOGO_SRC
// is undefined and Logo.tsx renders its built-in monogram instead.
//
// Uses a raw `?url` import rather than astro:assets' <Image> because
// Logo.tsx renders both server-side (Footer.astro) and inside a
// client-hydrated island (NavbarIsland/MobileMenu) — astro:assets is a
// server-only API, but a `?url` import resolves to a plain static URL at
// build time and works identically in both contexts.
const LOGO_MODULES = import.meta.glob("../assets/branding/logo.{png,svg,webp}", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

export const LOGO_SRC: string | undefined = Object.values(LOGO_MODULES)[0];
