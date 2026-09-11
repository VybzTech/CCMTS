# Mock API server

Implements every endpoint in [`API_DOCUMENTATION.md`](../API_DOCUMENTATION.md)
for local development - request/response shapes, status codes, and
envelope keys all match the doc exactly, plus additions on top of it:
`GET/POST/PATCH /users` and `PATCH /users/:id/disable` for SuperAdmin
account management, `POST /users/:id/reset-password` to reset an
account to the shared default password, and `POST /auth/change-password`
for the resulting forced password-reset flow - none of this is in the
doc (see `server.cjs`'s file header and `src/types/api.ts`'s `UserRole`
comment for why). See the top-of-file comment
in [`server.cjs`](./server.cjs) for *why* this is a hand-written
Express server rather than a vanilla `json-server db.json`: the short
version is that every documented endpoint wraps its payload in a named
key (`{ "letters": [...] }`, not a bare array) and needs joined data
(a letter's directorate, courier, timeline) or isn't CRUD at all
(approve/reject/auto-allocate) - plain json-server's auto-generated
routes can't express any of that. `db.json` is still the single
source of truth for data and every mutation is written back to it, so
it behaves like a real json-server setup from a "does my data persist"
point of view.

## Running it

```bash
npm run mock-server        # from the project root - auto-restarts on save
# or
node mock-server/server.cjs
```

Listens on `http://localhost:4000/api/v1` by default (override with
`MOCK_SERVER_PORT`).

## Resetting the data

`db.json` is mutated as you use the app (new letters, approvals,
courier availability, etc.). To get back to the original seed data,
restore it from git:

```bash
git checkout mock-server/db.json
```

(If this repo isn't a git checkout yet, keep a copy of the original
file somewhere before you start clicking around.)

## This is a mock. Do not deploy it.

- **Passwords are plaintext**, stored and compared directly in
  `db.json`. A real backend must hash them (bcrypt/argon2/etc).
- **Tokens are not real JWTs.** `access_token` is a random string
  formatted to *look* like a JWT (three dot-separated segments) so the
  frontend's `Authorization: Bearer <token>` handling has something
  realistic to work with, but nothing is cryptographically signed or
  verified. Anyone with a token string gets access - there's no
  expiry, no revocation beyond restarting the server and losing the
  in-memory... actually the token map is persisted in `db.json` too
  (`"tokens": {}`), so tokens survive restarts, which a real system
  would specifically not want for anything but a dev convenience.
- **CORS is wide open** (`cors()` with no options = `Access-Control-Allow-Origin: *`).
  Fine for local dev against `localhost:5173`; restrict it if this
  ever runs anywhere else.
- **Auto-allocate runs synchronously**, not as a background job,
  despite the doc's response message ("Allocation engine started in
  the background"). For a handful of letters this is instant; it's
  not representative of how a real queue-backed implementation would
  behave under load.

## Extending it

Adding a new endpoint: pick the closest existing route in
`server.cjs` as a template (they're grouped by resource: Auth, Users,
Directorates, Couriers, Letters), and follow the same pattern -
`requireAuth` middleware first (add `requireRole('SuperAdmin')` etc.
after it if the route should be role-gated, like the `/users` routes
are), then read/mutate `db` in memory, then `saveDb()` before
responding. The `serialize*` helper functions
(`serializeLetterSummary`, `serializeLetterDetail`, etc.) are where the
joined/nested response shapes get built - reuse them rather than
hand-assembling nested objects again in a new route.
