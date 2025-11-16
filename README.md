# Expense Tracker

A collaborative expense tracker for couples/housemates built with React, TypeScript, Vite, and Convex. The UI focuses on quick data entry, rich filtering, and monthly summaries, while Convex handles real-time sync, authentication, and storage.

## Why Convex is the right fit
Convex stays in the stack because it directly solves the core product requirements:

- **Real-time multi-user updates** – expenses and summaries re-compute instantly without wiring up REST endpoints or WebSockets by hand.
- **Built-in authentication** – `@convex-dev/auth` gives us Google sign-in with session management, so the frontend code only needs to wrap components with `ConvexAuthProvider`.
- **Schema + serverless functions** – Convex’s document database and type-checked query/mutation layer keep business logic close to the data while remaining deployable without managing servers.

Given those benefits, removing Convex would require rebuilding auth, data access, and realtime primitives ourselves, so we keep it.

## Features
- Google-based authentication with gated routes (`AuthWrapper`) plus an optional passphrase gate for private deployments.
- Expense CRUD with categories, accounts, and type (income vs expense).
- Filterable expense list (category, type, date range) with contextual metadata.
- Monthly summary cards showing totals, net position, and category breakdowns.
- Default category seeding via Convex mutations.

## Tech stack
| Layer | Tech |
| --- | --- |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Utility CSS (see `src/index.css`) + Lucide icons |
| Backend | Convex (serverless database + functions) |
| Auth | `@convex-dev/auth` with Google OAuth |

## Repository layout
```
.
├── ARCHITECTURE.md        # Extended system/diagram documentation
├── public/                # Static assets served by Vite
├── src/
│   ├── components/        # Auth wrapper, header, expense form/list/summary
│   ├── index.css          # Utility classes used across the app
│   └── main.tsx           # Vite entry point
└── convex/
    ├── schema.ts          # Convex data model
    ├── auth.ts            # Google provider configuration
    ├── categories.ts      # Category queries/mutations
    ├── expenses.ts        # Expense queries/mutations
    └── users.ts           # User/profile helpers
```

## Getting started
1. **Install prerequisites**
   - Node.js 20+
   - npm 10+
   - [Convex CLI](https://docs.convex.dev/quickstart) (`npm install -g convex` or `npx convex ...`)
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure environment variables**
   Create `.env.local` (Vite automatically loads it) with:
   ```bash
   VITE_CONVEX_URL="https://<your-deployment>.convex.cloud"
   VITE_ACCESS_CODE_HASH="<sha256-of-your-passphrase>"
   ```
   Generate the hash locally so the passphrase itself never lands in source control:
   ```bash
   node -e "const crypto=require('crypto');console.log(crypto.createHash('sha256').update(process.argv[1]).digest('hex'))" "your shared phrase"
   ```
   The passphrase gate is optional - if `VITE_ACCESS_CODE_HASH` is empty the UI renders immediately.
   Convex itself also needs secrets in the dashboard or via `npx convex env set`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
4. **Run Convex locally** (one terminal)
   ```bash
   npx convex dev
   ```
   This spins up the Convex backend and prints a dev deployment URL to use as `VITE_CONVEX_URL`.
5. **Start Vite** (second terminal)
   ```bash
   npm run dev
   ```
6. **Seed default categories (optional but recommended)**
   Once signed in, run the mutation so the dropdowns have sensible values:
   ```bash
   npx convex run categories:createDefaultCategories
   ```

## Useful scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite in development mode (expects Convex dev running) |
| `npm run build` | Type-check and build the production bundle |
| `npm run preview` | Preview the built bundle |
| `npm run lint` | Run ESLint |
| `npx convex dev` | Run Convex backend locally |
| `npx convex deploy` | Deploy Convex functions to the cloud |

## Cloudflare Pages deployment
Cloudflare Pages can build the Vite site out of the box. The Convex backend remains hosted by Convex, so the only runtime configuration Pages needs is the public `VITE_CONVEX_URL`.

1. **Create a Pages project**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: 20 (set in the project settings or via the `NODE_VERSION` variable).
2. **Environment variables**
   - `VITE_CONVEX_URL` – point this at your Convex deployment (e.g. `https://<your-app>.convex.cloud`).
   - Optional preview overrides: Pages lets you supply a different `VITE_CONVEX_URL` per environment if you have multiple Convex deployments.
3. **GitHub Action deployment**
   - Add the following repository secrets so the workflow in `.github/workflows/deploy-cloudflare-pages.yml` can publish builds:
     - `CLOUDFLARE_ACCOUNT_ID`
     - `CLOUDFLARE_API_TOKEN` (needs the *Cloudflare Pages - Edit* scope).
     - `CLOUDFLARE_PAGES_PROJECT_NAME`
     - `VITE_CONVEX_URL` (matches the value used in the Pages dashboard).
   - Pushes to `main` (or manual `workflow_dispatch`) run `npm ci && npm run build` and hand the generated `dist/` folder to the official `cloudflare/pages-action` so production and preview deployments stay in sync with the repo.

## Data model highlights
- **users**: stored via Convex Auth; additional profile data is synced via `users.ts`.
- **categories**: emoji/name/isDefault metadata plus creator.
- **expenses**: amount, description, account, date, type, source metadata, and `category`/`addedBy` references.
- **budgets** and **importJobs**: defined in `schema.ts` for future budgeting/import flows.

## Onboarding & auth flow
- `App.tsx` wires `ConvexProvider` + `ConvexAuthProvider` around the tree.
- `AuthWrapper` reads `api.users.getCurrentUser` via `useQuery` to gate content:
  - `undefined` → loading spinner while auth resolves
  - `null` → Google sign-in CTA
  - user object → renders the tracker UI
- `ExpenseForm`/`ExpenseList` call Convex queries/mutations via the generated `api` client for real-time updates.

See `ARCHITECTURE.md` for system diagrams if you need a deeper architectural reference.

## Temporary private access gate
Google auth stays in the codebase, but in deployments where you want to keep the tracker private without wiring OAuth, `AccessGate` renders a full-screen prompt before the Convex client mounts.

1. Pick a shared passphrase with your partner.
2. Hash it via the command shown in the *Getting started* section and set the resulting value as `VITE_ACCESS_CODE_HASH` locally and in production.
3. When someone opens the app, `AccessGate` hashes the input with `crypto.subtle.digest`, compares it to the stored hash, and caches the positive result in `localStorage` so you only log in once per device.
4. Clearing storage or changing the hash will force the prompt to appear again.

This is intentionally lightweight security meant to discourage casual visitors until OAuth is ready. Anyone with access to the built JavaScript could eventually reverse-engineer the hash, so switch back to Google auth once you have time.
