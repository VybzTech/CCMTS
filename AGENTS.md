# AGENTS.md — CCMTS / DispatchHub

## Overview
Courier & Correspondence Management System for LIRS. React 19 + Vite + TypeScript client
(`Client/`), Express + Prisma + MySQL API (`Server/`), PM2-supervised on Windows Server 2022.
Entry points: `Client/src/main.tsx`, `Server/src/app.js`. A React rebuild of an earlier PHP app —
many comments reference that lineage and the decisions carried over from it.

## Architecture
- API mounts everything under `/api/v1/*`; `/health` and `/uploads` sit outside it.
- Four roles: `ODU`, `Admin`, `Management`, `Courier`. Management is a superset of Admin.
- Route guards live in `Client/src/App.tsx` (`<ProtectedRoute allow={[...]}>`) and must agree
  with the per-item `roles` list in `components/layout/navConfig.ts`.
- See `docs/DEPLOYMENT.md` (branching + deploy), `DIAGNOSTIC-REPORT-2026-08-10.md` (production
  faults), `KV/DLTS Public Deployment Runbook.pdf` (host build-out).

## Patterns
- **One stylesheet.** `Client/src/styles/app.css` is the entire design system — every class
  components use is defined there. Don't fork per-component CSS.
- **Service layer.** Pages call `services/*Service.ts`, never `apiClient` directly.
- **Validation.** Controllers validate with `validateFields`/`sendValidationError`
  (`Server/src/utils/validate.js`) before any DB or bcrypt work.
- **Confirm dialogs.** `useConfirm()`; user-initiated sign-out goes through `hooks/useLogout.ts`.
- **Errors.** `extractErrorMessage` reads `message` off any status, so a server 400/429 message
  reaches the UI with no client change.

## Conventions
- `Server/` uses 4-space indent; `letter.controller.js` and `schema.prisma` are additionally
  indented one level inside the file. Match surrounding style exactly.
- Prisma `BigInt` ids are serialised to strings (`BigInt.prototype.toJSON` in `app.js`);
  client types treat all ids as `string`.
- `liabilityValue` is a string (e.g. `"8229.00"`) — `Number()` before arithmetic.
- Sidebar is dark in both themes; it has its own `--sidebar-*` token set.

## Gotchas
- **`findFirst({ where: { email: undefined } })` returns the FIRST USER IN THE TABLE**, not null.
  Prisma drops undefined filters. This was a live auth bypass in `login`; validation now runs first.
- **`AuthContext.logout` must stay silent** — the 401 interceptor and the 10-min idle timeout both
  call it. Only `useLogout()` prompts.
- **Chrome ignores `::-webkit-scrollbar`** on an element that also sets `scrollbar-width`/
  `scrollbar-color`. Don't mix the two.
- **`Client/dist` is gitignored** and is what `vite preview` serves. Switching branches on the
  server changes nothing until `vite build` runs. Same for `Server/.env` and `node_modules`.
- **`ecosystem.config.js` hardcodes `C:\Users\LIRS\Desktop\COURIER WEB`** and sets
  `NODE_ENV: 'development'` — both wrong for a portable production deploy.
- **UAT reports may describe a different build.** The Sep 2026 UAT's "Internal Server Error"
  cascade was not reproducible locally; production was running pre-validation code.

## Updates
- **2026-09-12**: Removed public `POST /auth/signup` (unauthenticated, accepted `role` — anyone
  could mint a Management account; confirmed live on the public URL). Pinned HSTS to 1 year and
  decoupled `/health` from Redis. Added Management Reporting page (UAT MGT-003/004/005: date
  filter + reset, date column, CSV export matching the filtered view). Restored Help page CSS,
  branching workflow diagram, and sidebar scrollbar tokens. Added `scripts/deploy.ps1`,
  `docs/DEPLOYMENT.md`, and the `production` branch.
- **2026-09-11**: Added `utils/validate.js` (UAT AUTH-004/005/006, ADM-004) and
  `services/loginThrottle.js` (AUTH-007: warn at 3, lock at 5 for 60 min, keyed per IP+email,
  backed by the previously-unused `rate_limits` table). Centralised logout confirmation.

## References
- `docs/DEPLOYMENT.md` — branches, deploy script, known production problems
- `DIAGNOSTIC-REPORT-2026-08-10.md` — NSSM supervision fault, ALB routing, log growth
- `docs/CCMS compiled report.xlsx` — consolidated UAT, 43 failures across four roles
- `Server/docs/` — API documentation and flowchart
