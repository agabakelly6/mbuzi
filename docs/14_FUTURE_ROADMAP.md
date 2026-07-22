# Future Roadmap

Recommendations only — none of this exists yet. Grouped by how much architectural change each would require, given the current static/no-backend foundation.

## Short-term (no new infrastructure required)

These fit within the existing static-site, no-backend architecture, or require only a small serverless function.

- **Replace every placeholder phone/WhatsApp number and merchant payment code.** The single highest-priority item before real launch — see [10_DEPLOYMENT.md](./10_DEPLOYMENT.md).
- **Fill remaining content gaps.** A few images referenced in code were still missing as of the last audit in this session (see [06_MEDIA_SYSTEM.md](./06_MEDIA_SYSTEM.md) and the git history in [13_CHANGELOG.md](./13_CHANGELOG.md) for what's been added so far) — worth a final pass before launch.
- **Per-branch delivery fees.** `data/delivery.ts` currently applies one flat 3-zone schedule to every active branch. Extending `Location` with an optional per-branch fee override (falling back to `DEFAULT_DELIVERY` when absent) is a small, backward-compatible change.
- **A real map.** `LocationsMap.astro` is a deliberately provider-agnostic, zero-JS hand-rolled lat/lng projection. Swapping in Mapbox GL or Google Maps JS would need a real API key (the site's first true environment-variable requirement) and a new `client:*` island.
- **Analytics.** No analytics of any kind exist today (confirmed — no tracking script anywhere in `Layout.astro` or elsewhere). Adding Plausible/Fathom/GA4 is a single `<script>` addition to `Layout.astro`, no architecture change.
- **Sitemap generation.** `public/sitemap.xml` currently appears to be a static, hand-maintained file rather than generated from `src/pages/`. `@astrojs/sitemap` would keep it accurate as routes are added.

## Medium-term (needs a small amount of backend/serverless infrastructure)

- **A real LLM-backed AI assistant.** The `AssistantEngine` interface (`lib/assistant/assistantEngine.ts`) is already the intended swap point — see [08_AI_SYSTEM.md](./08_AI_SYSTEM.md). The real work is standing up a serverless function (Netlify/Cloudflare/Vercel function) to proxy the LLM API call, since an API key can't be shipped to the browser and this site currently has zero server infrastructure.
- **Online payments for the WhatsApp ordering system.** `useCart().buildOrderDetails()` already produces the exact `OrderDetails` shape a payment integration would consume — see [09_WHATSAPP_ORDERING.md](./09_WHATSAPP_ORDERING.md). Flutterwave and Pesapal both have strong Uganda/East-Africa support and hosted checkout options that minimize backend surface area; MTN MoMo/Airtel Money direct API integration would need a small backend to hold API secrets. Likely rollout: keep "Order via WhatsApp" as-is, add a "Pay Now" option alongside it rather than replacing it.
- **A reservations backend.** `BookingForm` currently has no persistence — a reservation only exists as a WhatsApp message once sent. A lightweight serverless function + a simple datastore (even just writing to a spreadsheet/Airtable via API, or a proper database) would let the business track reservations without relying on staff to manually log every WhatsApp message. This is a genuinely new capability, not a refactor of existing code.
- **Order tracking notifications.** Once orders exist as records somewhere (see reservations backend above), simple status updates ("Order confirmed", "Out for delivery") could be sent back to the customer via WhatsApp's Business API (not the plain `wa.me` deep link used today, which only supports outbound-from-customer messages).

## Long-term (meaningful new systems)

- **Owner/staff dashboard.** A real admin view of incoming reservations, orders, and catering inquiries — the natural next step once any backend/database exists at all. Would likely also want basic menu/hours/branch editing without a code deploy, at which point this starts to resemble a lightweight CMS.
- **Customer accounts.** Order history, saved delivery addresses, repeat-order shortcuts. A significant architectural addition (auth, user data storage) — not worth pursuing before the medium-term payment/reservations backend exists, since accounts without persisted orders/reservations to attach to have little value.
- **Loyalty program.** Natural extension once customer accounts exist — points per order, redeemable rewards. Needs order history to be meaningful.
- **Live delivery tracking.** Requires a driver-facing app or integration with a third-party delivery/logistics platform — a large scope increase beyond what this website currently does (which is: generate a WhatsApp message, then a human takes over entirely).
- **Kitchen display / inventory integration.** Only makes sense once there's a real order-management backend for orders to flow into — connecting the website's order stream to an in-restaurant kitchen display or a stock-management system is downstream of the medium-term reservations/orders backend, not something the website itself should own.
- **Push notifications.** Needs either a native app or web push (service worker) infrastructure — neither exists today. Lower priority than WhatsApp-based updates, which the business already relies on and customers already expect from this business.
- **CMS for content editing.** If the restaurant's non-technical staff need to update menu prices, hours, or photos without a developer, migrating `content/*.ts`/`data/*.ts` into a headless CMS (or even a simple admin form backed by the future dashboard) becomes worthwhile. The content/data split documented in [04_DATA_ARCHITECTURE.md](./04_DATA_ARCHITECTURE.md) was explicitly designed to make this migration a "re-implement where the data comes from" change rather than a rewrite — this is one of the reasons that split exists.

## A note on sequencing

Every medium/long-term item above depends on the same first step: **standing up *some* backend**, even a minimal serverless function. Right now this project has none, by design. The single highest-leverage architectural decision for the next phase of growth is choosing that backend's shape (a few small serverless functions vs. a full application server) — payments, reservations persistence, and the AI assistant's real LLM call would all likely share it rather than each getting its own separate infrastructure.
