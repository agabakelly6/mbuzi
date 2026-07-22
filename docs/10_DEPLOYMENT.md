# Deployment

## Requirements

- Node.js ≥ 22.12.0 (declared in `package.json`'s `engines` field — no npm version constraint is specified).
- No environment variables — none exist in this project. Nothing to configure before a build.

## Installation

```bash
npm install
```

Installs everything in `package.json`. No `.env.example` to copy, no secrets to obtain — this codebase has zero external service dependencies at build or run time.

## Development

```bash
npm run dev          # astro dev — starts the dev server (default: http://localhost:4321)
```

**Project convention** (documented identically in both `CLAUDE.md` and `AGENTS.md` at the repo root, intended for AI coding agents but equally valid for a human): when starting the dev server, prefer background mode —

```bash
astro dev --background
astro dev stop
astro dev status
astro dev logs
```

## Validation

```bash
npm run check        # astro check — TypeScript + Astro diagnostics across the whole project
```

Run this before considering any change complete. It uses `astro/tsconfigs/strict` (see `tsconfig.json`) and will surface both TypeScript errors and Astro-specific issues (e.g. missing `client:*` directives, invalid props).

## Build

```bash
npm run build        # astro build — outputs static files to ./dist/
```

This is a **pure static build** — `astro.config.mjs` has no `output:` key (defaults to Astro's `"static"` mode) and no `adapter:` key. The result is plain HTML/CSS/JS in `dist/`, deployable to any static host with zero server runtime required.

```bash
npm run preview      # astro preview — serves the dist/ build locally, for a final check before deploying
```

## `astro.config.mjs` (verbatim)

```js
export default defineConfig({
  site: 'https://ypambuzichoma.com',
  prefetch: true,
  vite: { plugins: [tailwindcss()] },
  integrations: [react()],
});
```

- `site` is used to build absolute URLs (canonical links, Open Graph images, sitemap). **Update this if the site's real production domain differs.**
- `prefetch: true` enables hover/viewport-based prefetching of same-origin links — speeds up subsequent navigations, no effect on first load.

## Environment variables

**None.** Confirmed by exhaustive grep across the repository: zero usages of `import.meta.env` or `process.env`, and no `.env*` file exists. All configuration (business info, SEO defaults, theme tokens) is committed, plain-text TypeScript under `src/config/` and `src/data/`. There is nothing to set as a secret or environment-specific value for any hosting provider.

## Hosting recommendations

Since this is a pure static-output site with no API routes and no adapter, **any static host works identically well** — there's no framework-specific adapter lock-in to consider.

### Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- No environment variables needed.
- A `netlify.toml` is not currently present in the repo — Netlify's zero-config Astro detection should work out of the box, or add one specifying the above.

### Cloudflare Pages
- Build command: `npm run build`
- Build output directory: `dist`
- Framework preset: Astro (static).
- No environment variables needed.

### Vercel
- Framework preset: Astro (Vercel auto-detects `astro.config.mjs` with no adapter as static output).
- Build command: `npm run build`, Output directory: `dist`.
- No environment variables needed.

### GitHub Pages
- Requires setting `site` (already set) and, if deploying to a project page rather than a custom domain, a `base` path in `astro.config.mjs` (not currently configured — add `base: '/repo-name'` if deploying under `username.github.io/repo-name` rather than a custom domain).
- Deploy `dist/` via GitHub Actions (`astro build` then upload the `dist/` artifact) or the `withastro/action` community action.

## Pre-launch checklist (specific to this codebase)

1. **Replace every placeholder phone/WhatsApp number.** `config/site.ts`'s `SITE.phone`/`phoneDigits`/`whatsappNumber` and every branch's `phone`/`whatsapp` in `data/locations.ts` are currently `256700000000`-series placeholders. Every WhatsApp/call flow in the site (booking, contact, catering, cart checkout, AI assistant handoff) depends on these being real.
2. **Replace `data/booking.ts`'s `MERCHANT_PAYMENT_OPTIONS`** — the MTN/Airtel merchant codes are placeholder `000000` values, explicitly flagged in that file's own comment as needing replacement before real money changes hands through them.
3. **Verify `astro.config.mjs`'s `site` field** matches the actual production domain — it currently points to `https://ypambuzichoma.com`.
4. **Confirm every image referenced in code has a matching file in `src/assets/`** — see [06_MEDIA_SYSTEM.md](./06_MEDIA_SYSTEM.md) for how to audit this; a missing image degrades gracefully (placeholder panel) rather than breaking the build, so it's easy to miss without an explicit check.
5. Run `npm run check` and `npm run build` clean before deploying.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| An image doesn't render | Filename in `src/assets/` doesn't exactly match the basename referenced in `data/`/`content/`/`media/` (case-sensitive, extension must match) | See [06_MEDIA_SYSTEM.md](./06_MEDIA_SYSTEM.md) |
| Logo doesn't switch from the fallback monogram | File isn't named exactly `logo.png`/`.svg`/`.webp` at `src/assets/branding/` (note: `.jpg` is **not** supported for the logo specifically, unlike every other image) | Rename to one of the three supported extensions |
| WhatsApp link opens to the wrong/placeholder number | A phone/WhatsApp number in `config/site.ts` or `data/locations.ts` is still a placeholder | See pre-launch checklist above |
| `npm run dev` says the port is already in use | A previous background dev server is still running | `astro dev status`, then `astro dev stop` |
| `npm run check` fails on a file you didn't touch | Astro's generated types (`.astro/types.d.ts`) may be stale | Delete `.astro/` (gitignored, regenerated automatically) and rerun |
| Structured data / SEO meta looks wrong for a page | `content/*.ts`'s `seo` field or the page's `getPageStructuredData()` call needs updating | See [07_CONFIGURATION.md](./07_CONFIGURATION.md) and [05_ROUTES.md](./05_ROUTES.md) |
