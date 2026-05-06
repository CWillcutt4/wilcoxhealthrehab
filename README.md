# Wilcox Health and Rehab Center

Gym membership website: signup, plan selection, electronic waiver, Shopify payment, and Viztin electronic key issuance.

## Quick start

```bash
npm install
cp .env.example .env   # or edit .env directly
npm run db:push        # create SQLite schema
npm run db:seed        # create owner employee account
npm run dev
```

Open http://localhost:3000

### Default credentials

Owner login is at `/admin/login`. Defaults come from `.env`:
- `OWNER_EMAIL` (default `owner@wilcoxhealthrehab.local`)
- `OWNER_PASSWORD` (default `changeme123`)

**Change the password after first login.**

## Environment variables

See [.env](.env). Key vars:

| Var | What it's for |
|---|---|
| `DATABASE_URL` | Prisma connection string. SQLite in dev; swap to Postgres for prod. |
| `SESSION_SECRET` | Random string used for session token hashing. |
| `OWNER_EMAIL` / `OWNER_PASSWORD` | Seeded owner employee login. |
| `RESEND_API_KEY` | Resend API key. If blank, emails are logged to console. |
| `EMAIL_FROM` | "From" address on outgoing emails. |
| `SHOPIFY_*` | Shopify Storefront API creds for real checkout. If blank, dev simulation is used. |
| `VIZTIN_*` | Viztin API creds for automated key issuance. If blank, owner is emailed to manually issue. |
| `CRON_SECRET` | Bearer token required by `/api/cron/sweep`. |

## Signup flow

1. **Account** — `/signup`
2. **Plan** — `/onboarding/plan`
3. **Waiver** — `/onboarding/waiver` (emailed to member + owner, stored in DB)
4. **Payment** — `/onboarding/payment` (Shopify checkout; dev mode simulates)
5. **Complete** — `/onboarding/complete` (Viztin key issued via email)

## Member dashboard (`/dashboard`)

- Membership status badge (active / grace / disabled / expired)
- Next billing date
- Download signed waiver
- Update payment method (Shopify portal link)
- Cancel auto-renew / renew

## Admin (`/admin`)

- Member list with search + status filter
- Revenue (last 30 days) + status counts
- Per-member page: toggle Viztin key, extend membership, record refund (owner only), view/download waivers, add notes
- Manual member add (`/admin/add`) for in-person signups

## Cron (grace period sweep)

Hit once an hour:
```
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain/api/cron/sweep
```
The sweep:
- Moves `active` memberships past `endDate` → `grace` (warning email; 24h grace window)
- Moves `grace` memberships past `graceUntil` → `disabled` (revokes Viztin key; disabled email)

## Integration TODOs

Three places use stubs. Swap to real calls when credentials are ready:

- **Shopify checkout** — [src/lib/shopify.ts](src/lib/shopify.ts)
- **Viztin key issuance** — [src/lib/viztin.ts](src/lib/viztin.ts) (no public API found — currently emails owner to issue manually)
- **Shopify webhook signature verification** — [src/lib/shopify.ts](src/lib/shopify.ts) `verifyShopifyWebhook`

## Scripts

- `npm run dev` — Next dev server
- `npm run build` / `npm start` — production
- `npm run db:push` — push Prisma schema to DB (dev)
- `npm run db:studio` — open Prisma Studio
- `npm run db:seed` — seed owner employee

## Moving to production

1. Switch `DATABASE_URL` to Postgres (update `provider` in [prisma/schema.prisma](prisma/schema.prisma)), run `prisma migrate deploy`.
2. Fill in `SHOPIFY_*`, `RESEND_API_KEY`, `VIZTIN_*`, `SESSION_SECRET`, `CRON_SECRET`.
3. Configure a Shopify webhook at `/api/webhooks/shopify` for `orders/paid`.
4. Schedule `/api/cron/sweep` hourly (Vercel cron, GitHub Actions, etc).
5. Deploy. Host supports Next.js App Router + Node runtime.
