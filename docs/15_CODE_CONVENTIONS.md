# Code Conventions

These are the patterns actually followed throughout the codebase — not aspirational rules. There is no ESLint or Prettier config in this project (confirmed — neither exists), so consistency here comes entirely from convention and review, not tooling. New code should match what's already here rather than introduce a new house style.

## Naming conventions

- **Files**: React/Astro components are `PascalCase` (`FoodCard.tsx`, `MenuGrid.astro`). Plain TypeScript modules (data, content, config, lib, hooks) are `camelCase` (`menu.ts`, `useCart.ts`) except `CartStore.ts`, which is capitalized to signal it's the module standing in for a "Context/Provider" role (see [09_WHATSAPP_ORDERING.md](./09_WHATSAPP_ORDERING.md)).
- **IDs**: kebab-case strings for anything that's a lookup key or URL fragment — menu item ids (`"mbuzi-choma-special"`), branch ids (`"rubaga"`), section ids (`"main-course"`).
- **Types/interfaces**: `PascalCase`, named for the thing they describe, not prefixed with `I` (`MenuItem`, `Location`, `CartLine`).
- **Booleans**: prefixed `is`/`has`/`show` (`isDark`, `hasVariations`, `showCta`, `orderable` is the one notable exception — a prop name chosen to read well as JSX (`<FoodCard orderable />`) rather than `isOrderable`).
- **Functions that build a URL or message**: prefixed `get`/`build` (`getWhatsAppUrl`, `getTelUrl`, `buildOrderWhatsAppMessage`, `buildAssistantWhatsAppMessage`) — `get` for a pure lookup/format, `build` for something assembled from multiple pieces.

## Folder conventions

- **The content/data split is the single most important convention in this codebase.** Prose/copy → `src/content/`. Structured, reusable, typed facts or logic → `src/data/`. See [04_DATA_ARCHITECTURE.md](./04_DATA_ARCHITECTURE.md). When adding a new file, ask "is this something a copywriter would edit, or something a developer would edit" — that's usually the right test.
- **A component's own subfolder groups by type** (`ui/`, `cards/`, `forms/`, `sections/`, `layout/`) **except for whole features** (`assistant/`, `cart/`), which group by feature instead, since they're self-contained systems with their own supporting `lib/`/`hooks/`/`types/`/`data/`/`content/` files that don't belong grouped by type either.
- **Shared layout primitives live in `sections/` alongside their thin wrappers**, not in a separate `primitives/` or `layouts/` folder — e.g. `StorySplit.astro`, `Timeline.astro`, `PillarGrid.astro`, `ImageGrid.astro` sit next to the page-specific components that wrap them (`FoodQualityStory.astro`, `FarmTimeline.astro`, etc.).

## TypeScript conventions

- **`astro/tsconfigs/strict`** is the base config — strict mode is on.
- **No path aliases.** `tsconfig.json` has no `paths`/`baseUrl` — every import is relative (`../../config/site`, not `@/config/site`). Follow this; don't introduce an alias.
- **Shared shapes live in `src/types/`**, one file per domain, and `content/*.ts`/`data/*.ts` files are typed against them using `satisfies` (e.g. `hero: {...} satisfies HeroContent`) rather than a type annotation — this preserves literal types for the object while still checking it against the shape.
- **Derived arrays over duplicated arrays.** `data/menu.ts` has one `MENU_ITEMS` array and computes `BREAKFAST_ITEMS`, `FEATURED_MENU_ITEMS`, `CHEF_PICK`, etc. via `.filter()`/`.find()` — never a second hand-maintained array holding the same data pre-filtered.
- **`as const`** on nearly every content/config object, for literal type narrowing.

## Astro conventions

- **A `.astro` file is static unless it explicitly needs to hydrate a React child** — don't reach for React/`.tsx` by default; most of this codebase's components are `.astro` precisely because they never needed client JS.
- **Server-side image resolution happens in the `.astro` parent, never inside a React child.** `MenuGrid.astro`, `LocationsGrid.astro`, and `pages/gallery/index.astro` all call `resolveImageSrc()` themselves and pass the resolved URL down as a plain string prop, because `astro:assets` is a server-only API that a `.tsx` component cannot call directly.
- **Client directives are chosen deliberately, not by habit.** `client:load` for anything that must be interactive immediately (nav, hero, global widgets); `client:visible` for anything below the fold that can wait (forms, gallery, the Menu page's ~44 order-control islands). See [12_PERFORMANCE.md](./12_PERFORMANCE.md).
- **Props interfaces are declared inline** in the component's frontmatter (`interface Props { ... }`), immediately followed by the destructure with defaults.

## React conventions

- **Function components, not `React.FC`.** `export function FoodCard({...}: FoodCardProps) { ... }`.
- **Props interfaces are named `{Component}Props`** and exported when another file needs to reference the shape (rare), otherwise kept local to the file.
- **Hooks are only extracted after duplication is found, not speculatively.** `useBodyScrollLock`, `useFormState` were both pulled out after the exact same logic appeared twice. Don't create a hook for logic used in only one place.
- **Context is used only when a genuine single-island tree needs shared state** (`AssistantContext.tsx`). For state that must span independently-hydrated islands, use a module-level external store read via `useSyncExternalStore` instead (`lib/cart/CartStore.ts` + `hooks/useCart.ts`) — see [09_WHATSAPP_ORDERING.md](./09_WHATSAPP_ORDERING.md) for the full reasoning. Don't assume Context is always the answer to "shared state" in an Astro-islands project.
- **`useReducedMotion()` is checked in every component with a nontrivial animation.** Not optional — every Framer Motion component in this codebase does this.

## Import ordering

No enforced tool, but the observed convention (consistent across nearly every file) is:
1. Framework/library imports (`react`, `astro:assets`, `framer-motion`, `lucide-react`).
2. Relative imports from other source files, ordered roughly by "distance" from the current file — sibling component imports first, then `../../data/`, `../../content/`, `../../lib/`, `../../config/`, `../../types/`.
3. Type-only imports are marked with `import type { ... }` where TypeScript allows separating them, or included inline with `type` keyword modifiers on individual named imports.

## Component organization within a file

The consistent shape, top to bottom:
1. File-path comment (`// src/components/.../Name.tsx`) plus, where the file's existence needs justifying, a header comment explaining *why* it exists (not what it does — the code shows what; the comment should carry information the code can't).
2. Imports.
3. Local types/interfaces (`{Component}Props`).
4. Any module-level constants (Framer Motion `Variants` objects, etc.) — defined outside the component so they aren't recreated every render.
5. The component function, props destructured with defaults inline.
6. Local helper functions/effects, generally kept inside the component unless reused elsewhere.

## Performance rules

- Never hydrate what doesn't need to be interactive — see the Astro conventions above.
- Reuse the shared `FadeIn` scroll-reveal system instead of adding a new per-instance animated island. This is the single most impactful performance convention in the codebase (see [12_PERFORMANCE.md](./12_PERFORMANCE.md)).
- Derive values on read rather than storing them redundantly — `useCart()`'s `subtotal`/`total`/`itemCount` are computed fresh from `lines` on every call rather than cached in `CartState`, specifically to avoid ever going stale.
- Don't add a new npm dependency for a problem the platform or an existing hand-rolled utility already solves. Check `lib/` and `hooks/` before reaching for a library.

## Accessibility rules

- Every modal/overlay: `role="dialog" aria-modal="true"` + a matching `aria-label`, a focus trap, Escape-to-close returning focus to the trigger, and `useBodyScrollLock()`.
- Every decorative icon paired with visible text: `aria-hidden="true"`.
- Every interactive element: visible `focus-visible:ring-2 focus-visible:ring-[#C89A4B]` styling — never remove focus outlines without replacing them.
- Prefer a native HTML element with built-in accessibility semantics over a hand-rolled ARIA pattern when one exists for the job — `FAQSection.astro`'s use of `<details>/<summary>` instead of a React accordion is the clearest example of this rule in practice.

## The one rule that overrides all others

**Never hardcode a business fact (phone number, price, address, hours) directly into a component.** If you find yourself typing one, it already has a home in `config/site.ts`, `data/*.ts`, or a page's `content/*.ts` — import it instead. This is checked more consistently than any other convention in this codebase and should be treated as close to a hard requirement as this project has.
