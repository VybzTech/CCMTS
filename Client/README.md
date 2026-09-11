# CCMS (React) — Courier & Correspondence Management System

A pixel-for-pixel React + TypeScript rebuild of the original PHP CCMS
app, wired to talk to the REST API described in
[`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md). It ships with a
fully working mock server so you can run and click through the whole
app immediately, with no real backend required.

## Quick start

```bash
npm install
npm run dev:full
```

That starts the Vite dev server (`http://localhost:5173`) and the mock
API server (`http://localhost:4000/api/v1`) together. Open
`http://localhost:5173` and sign in with one of the seed accounts
below.

Run them separately if you'd rather see their logs apart:

```bash
npm run dev           # Vite dev server only
npm run mock-server    # mock API only (auto-restarts on change via nodemon)
```

### Demo logins

All seeded in `mock-server/db.json`, password `password123` for every
account:

| Email | Role | Directorate |
|---|---|---|
| `superadmin@lirs.net` | Super Admin | — |
| `admin@lirs.net` | Admin | — |
| `management@lirs.net` | Management | — |
| `accounts@lirs.net` | ODU | Accounts |
| `it@lirs.net` | ODU | IT |
| `legal@lirs.net` | ODU | Legal |

The mock server writes back to `mock-server/db.json` on every change
(new letters, approvals, courier updates, etc.), so your test data
persists across restarts. Delete the changes with `git checkout
mock-server/db.json` (or copy it from git history) if you want to
reset back to the original seed data.

## Project structure

```
src/
  components/
    layout/       Sidebar, TopBar, AppShell, ThemeToggleSwitch
    ui/            Button, Badge, Card, StatCard, ActionCard, DataTable,
                    FilterBar, EmptyState, Pagination, Toast, Modal/Confirm,
                    form/ (TextField, SelectField, TextareaField)
    charts/        ChartCard, LineChart, BarChart, DoughnutChart
  context/         AuthContext, ThemeContext
  hooks/           useAuth, useTheme, useAsyncData, useDismissableMenu
  services/        One file per API resource (authService, letterService,
                    courierService, directorateService) + apiClient.ts
                    (the shared axios instance - see "Connecting a real
                    backend" below)
  types/api.ts     Every request/response shape from API_DOCUMENTATION.md,
                    annotated with any gaps vs. the doc (see below)
  utils/           format.ts (currency/date/badge-color helpers),
                    letterStats.ts (client-side stats aggregation - see
                    "Why stats are computed client-side" below)
  pages/           One folder per feature area (auth, dashboard, letters,
                    admin, couriers, directorates, notifications, settings, help)
  routes/          ProtectedRoute (role-gated routing)
  styles/app.css   The PHP app's actual stylesheet, ported verbatim -
                    this is the single source of truth for how everything
                    looks; don't fork per-component CSS elsewhere.

mock-server/
  server.cjs       Express server implementing every endpoint in
                    API_DOCUMENTATION.md exactly (see mock-server/README.md)
  db.json          Seed data + persisted state
```

Every component and service file has a short comment at the top
explaining what it does and why it's shaped the way it is - start
there before reading the implementation.

## Connecting a real Node backend

The entire app talks to the API through the functions in
`src/services/*.ts`, which all go through the single axios instance in
`src/services/apiClient.ts`. Nothing else in the app calls `axios` or
`fetch` directly. That means pointing this app at a real backend
instead of the mock server is a one-line change:

1. Set `VITE_API_BASE_URL` in `.env` (or `.env.production`) to your
   real API's base URL, e.g. `https://api.example.com/api/v1`.
2. Make sure that backend matches `API_DOCUMENTATION.md` exactly -
   same envelope shapes (`{ "letters": [...] }`, `{ "directorate": {...} }`,
   etc.), same status codes, same field names. `src/types/api.ts` is a
   literal transcription of the doc, so if your backend matches the
   doc, it matches these types.
3. That's it - no frontend code changes. If your backend's responses
   ever drift from the doc, the mismatch will show up as a runtime
   error somewhere a component reads a field that isn't there, since
   TypeScript's types are a compile-time contract, not a runtime
   validator (nothing here calls Zod/io-ts on responses - see
   "Trade-offs" below).

### Known gaps vs. the API doc / PHP app

Decided explicitly when this app was built (see conversation history if
you need the full reasoning) - the frontend follows
`API_DOCUMENTATION.md` exactly, even where that's simpler than the
original PHP app:

- **Roles**: `ODU` / `Admin` / `Management` come straight from the doc;
  the PHP app's separate `Administrative Unit` role has no equivalent.
  `SuperAdmin` is an addition on top of the doc (not in it at all) -
  added per product request as a superset of Admin that can also
  manage user accounts (create, edit, disable/enable, reset password)
  via the `/users` endpoints (also not in the doc). See
  `src/types/api.ts`'s `UserRole` comment if you're reconciling this
  against a real backend's auth model.
- **Register Letter is ODU-only.** Admin/SuperAdmin briefly had access
  to it too (with an added directorate picker, since neither role has a
  home directorate) but that was deliberately removed per product
  decision - see `src/pages/letters/LetterCreatePage.tsx`. They keep
  Bulk Upload, which still has that picker.
- **Forced password reset.** When a SuperAdmin resets someone's
  password (see Manage Users), that account logs in with the shared
  default (`Lirs123`) and is immediately routed to
  `ForcePasswordResetPage` - every other route/API call 403s until a
  compliant new password is set (12+ chars, alphanumeric, at least one
  uppercase - see `src/utils/passwordPolicy.ts`). Not in
  API_DOCUMENTATION.md; loosely mirrors the PHP app's
  `pages/auth/force-reset.php`, but with a different, simpler policy -
  see that file's header comment for the distinction.
- **Priority**: `Low` / `Medium` / `High` - the PHP app's `Normal`/`Urgent`
  + DHL-based auto-routing rules don't exist here.
- **No 72-hour approval countdown** - the PHP app enforced one; the
  documented API has no concept of it.
- **No notifications endpoints** - `/notifications` in the sidebar
  nav exists and renders, but there's nowhere to fetch real data from
  (see `src/pages/notifications/NotificationsPage.tsx`). Wire up a
  real fetch there the moment a backend adds one.
- **No user delete endpoint** - `/users` supports list, create, edit,
  and disable/enable (all SuperAdmin-only, see the Roles bullet above),
  but there's still no way to permanently remove an account - disabling
  is the closest equivalent.
- **`Rejected` status**: `PATCH /letters/:id/reject` is documented,
  but the doc's own status enum never lists what a rejected letter's
  `status` becomes. The mock server sets it to `"Rejected"` - a real
  backend might do something different; see the comment on
  `LetterStatus` in `src/types/api.ts`.

### Why stats are computed client-side

The API has no aggregation/stats endpoint - just `GET /letters`. Every
dashboard fetches a large page of letters once and computes totals,
delivery trends, and courier/directorate breakdowns in
`src/utils/letterStats.ts`. That's fine at the data volumes a mock or
small real deployment would have; if a real backend ever adds a stats
endpoint, swap the dashboard pages' data source, not the shape those
functions return.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server only |
| `npm run mock-server` | Mock API only, restarts on file change |
| `npm run dev:full` | Both together (recommended for local dev) |
| `npm run build` | Type-check + production build |
| `npm run lint` | Oxlint |
| `npm run preview` | Preview a production build locally |

## Trade-offs worth knowing about

- **No runtime response validation.** TypeScript types in
  `src/types/api.ts` are compile-time only; if a backend (real or
  mock) ever sends a shape that doesn't match, nothing catches it
  until a component tries to render a missing field. Adding a
  validation layer (Zod, etc.) at the `apiClient` boundary would be
  the natural next step for a production app.
- **No test suite.** Everything here was verified by hand - typecheck,
  lint, and extensive manual/screenshot-driven testing against the
  mock server (including the full approve → allocate → deliver
  workflow). There's no Vitest/RTL/Playwright setup yet.
- **Mock server auth is not secure.** Plaintext passwords, unsigned
  opaque tokens - fine for local development, never deploy it as-is.
  See `mock-server/README.md`.
