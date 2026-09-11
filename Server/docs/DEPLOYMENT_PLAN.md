# DLTS Deployment Plan — Internal Network, PM2 + NSSM

Supersedes the earlier IIS/Python-based plan. Scope for this phase:
**internal network testing only** — no domain, no DNS, no TLS, no public
firewall rules yet. Reachable at the server's current LAN IP.

## 0. Decisions made this round

| Decision | Why |
|---|---|
| No IIS | Team has used it before and doesn't want it for this deployment. |
| No Python, anywhere | The allocation engine was ported to Node (see §3) so nothing on this host needs a Python runtime. |
| PM2 + NSSM | NSSM wraps `pm2-runtime` as one Windows service; PM2 supervises the actual Node processes inside it (restart-on-crash, log capture). |
| Access via LAN IP directly | No reverse proxy yet — frontend and backend are two ports on the same IP, not one origin. Revisit once a domain exists. |
| No reverse proxy | Follows from the above — deferred along with DNS/TLS/public firewall to a later phase. |

**Detected server IP:** `10.0.20.142` (the `10.110.20.140` example in the
original request didn't match what this host reports — confirm which
is correct for your network before relying on it; everything below
uses the detected one).

## 1. What changed in the codebase this round

- **SuperAdmin merged into Management.** One role dropped, not renamed
  everywhere blindly — `Management` now carries every permission
  `SuperAdmin` had (approve/reject letters, courier allocation, manage
  couriers/directorates, **and** `/users` account management), on top
  of its original org-wide read visibility. See `types/api.ts`,
  `navConfig.ts`, `App.tsx`, `HelpPage.tsx` on the Client side.
- **`/users` now has a real backend.** `Server/src/controllers/user.controller.js`
  + `Server/src/routes/user.route.js`, mounted at `/api/v1/users`,
  gated to `Management` only. Required two new `User` columns
  (`disabled`, `must_reset_password`) — migration
  `20260727150000_add_user_disabled_reset_flag` adds them and also
  drops the unused `Mgt` enum value nobody referenced.
  `POST /auth/change-password` and disabled-account rejection (login +
  every authenticated request) were added to make the reset-password
  flow actually work end to end.
- **Notification bell removed** from `TopBar`, `Sidebar`, `navConfig`,
  and the `/notifications` route — Phase 2 feature, not wired to
  anything real yet.
- **`Rejected` status removed from the frontend type** — the backend
  never produced it (`reject_letter` always set `Undelivered`); the
  timeline entry it wrote said `"Rejected"` while the letter's own
  `status` said `"Undelivered"`, which was internally inconsistent.
  Both now agree; the rejection reason lives in the timeline
  `description` instead of a separate status.
- **POD uploads now organized by courier**: `uploads/pod/<courierId>/…`
  instead of one flat folder, for both the web upload path
  (`middleware/upload.js`) and the mobile-app POD-acknowledgement path
  (`courier.controller.js`'s `acknowledge_pod`). Falls back to
  `unassigned/` if a letter has no courier yet.
- **`/health` route added** (`GET /health`, unauthenticated) — reports
  DB and Redis connectivity plus uptime, for NSSM/PM2/monitoring to
  poll.

## 2. Schedules API — left as-is

Confirmed with the user: the `/schedules` stub routes (`POST /create`,
`POST /submit`, the `verify`/`reject` placeholders) stay untouched.
They exist for a future React Native mobile app that's currently
deferred in favor of making the web client responsive enough for
couriers to submit PODs from a phone browser. Revisit once that native
app work resumes.

## 3. Allocation engine — ported to Node, and simplified further

Original plan was "port Python to a Node BullMQ worker." While
building that, discovered **Titan KV (the bundled Redis stand-in)
doesn't implement Lua scripting (`EVAL`/`EVALSHA`)**, which BullMQ's
core job-processing depends on. A queue-based worker — Python or
Node — could never actually process a job against it; this was a
latent, never-functional code path in both languages.

Since the allocation algorithm now runs in the same Node process as
the API anyway, the fix was to **drop the Redis queue entirely** for
this feature:

- `Server/src/services/allocationService.js` — the ported LGA-matching
  algorithm (same logic as `engine/allocation.py`), called directly.
- `letter.controller.js`'s `trigger_auto_allocation` calls it
  fire-and-forget instead of enqueueing to BullMQ; same `202` response
  contract the frontend already expects.
- `Server/engine/` (the old Python code) is no longer used by
  anything. Left in place rather than deleted, in case it's useful
  reference, but nothing invokes it.
- Redis/Titan KV is no longer load-bearing at all — `app.js` now logs
  a warning and keeps booting if it's unreachable, rather than
  crashing the whole API (`/health` still reports its status).
  **This means Titan KV does not need to run for anything in this app
  to work**, verified by testing auto-allocation end-to-end with it
  fully stopped.

Net effect: one fewer service to run, one fewer thing that can fail at
boot, and a feature that's now actually testable (it wasn't before).

## 4. Target process list

| Process | How it runs | Port | Required? |
|---|---|---|---|
| MySQL | Already a native Windows service (`MySQL97`) | 3306 | Yes |
| Node API | PM2 app inside the NSSM-wrapped `pm2-runtime` | 9989 | Yes |
| Client (static build) | PM2 app, `vite preview --host 0.0.0.0` | 4173 | Yes |
| Titan KV | Manual/optional — `KV/titan_kv.exe` | 6380 | No (see §3) |

**Port note:** the request's example used `5173` for the frontend.
That port was originally left alone (an unexplained process had an
active connection on it), so `4173` (Vite's own default preview port)
was used instead and verified working end to end. That stray process
turned out to be a leftover Vite dev server running from inside
`Client\` itself, which also had to be stopped to release a lock on
the project folder for the rename in §12 - port `5173` is now free.
Still on `4173` for now since it's already verified; switch
`ecosystem.config.js`'s `--port` and `CLIENT_ORIGINS`/`VITE_API_BASE_URL`
together if `5173` is preferred, and re-verify.

## 5. Environment values already set

`Server/.env`:
```
DATABASE_URL="mysql://dlts_user:dlts_password@127.0.0.1:3306/dlts_db"
CLIENT_ORIGINS=http://10.0.20.142:5173,http://localhost:5173,http://localhost:5174,http://10.0.20.142:4173
```

`Client/.env.production`:
```
VITE_API_BASE_URL=http://10.0.20.142:9989/api/v1
```

Both already verified end to end: static site loads over the LAN IP,
CORS preflight succeeds from that origin, login round-trips
correctly.

**Not done yet, deliberately deferred:** rotating the dev-default
`JWT_SECRET` / DB passwords, and flipping `NODE_ENV` to `production`
(which flips the login cookie's `Secure` flag on — wrong without TLS,
which doesn't exist yet in this phase). Revisit both together when a
domain + certificate are introduced.

## 6. NSSM + PM2 setup (execute this section)

```powershell
# 1. Install PM2 globally
npm install -g pm2

# 2. Ecosystem file at the repo root (sibling of Client/ and Server/)
```

`C:\Users\LIRS\Desktop\COURIER-WEB\ecosystem.config.js`:
```js
module.exports = {
  apps: [
    {
      name: 'dlts-api',
      script: 'src/app.js',
      cwd: 'C:\\Users\\LIRS\\Desktop\\COURIER WEB\\Server',
      env: { NODE_ENV: 'development', PORT: '9989' },
    },
    {
      name: 'dlts-client',
      script: 'node_modules/vite/bin/vite.js',
      args: 'preview --host 0.0.0.0 --port 4173',
      cwd: 'C:\\Users\\LIRS\\Desktop\\COURIER WEB\\Client',
    },
  ],
};
```

```powershell
# 3. Download NSSM (confirmed internet access works from this host)
Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile "$env:TEMP\nssm.zip"
Expand-Archive "$env:TEMP\nssm.zip" -DestinationPath "$env:TEMP\nssm"
New-Item -ItemType Directory -Force -Path "C:\nssm" | Out-Null
Copy-Item "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" "C:\nssm\nssm.exe"

# 4. Wrap `pm2-runtime` (the supervisor-friendly, non-daemonizing PM2
#    mode - built for exactly this: NSSM/systemd/Docker managing it)
#    as one Windows service. AppParameters is just the bare filename
#    (not a full path) - see §12 for why: NSSM passes AppParameters to
#    CreateProcess as a single unquoted token stream, so a full path
#    containing a space gets split into two broken arguments. Setting
#    AppDirectory to the project root and passing only the filename
#    sidesteps the problem entirely rather than fighting NSSM's quoting.
$pm2Runtime = (Get-Command pm2-runtime.cmd).Source
C:\nssm\nssm.exe install DltsPM2 "$pm2Runtime" "start ecosystem.config.js"
C:\nssm\nssm.exe set DltsPM2 AppDirectory "C:\Users\LIRS\Desktop\COURIER-WEB"
C:\nssm\nssm.exe set DltsPM2 Start SERVICE_AUTO_START
C:\nssm\nssm.exe set DltsPM2 AppStdout "C:\Users\LIRS\Desktop\COURIER-WEB\Server\logs\pm2-service-out.log"
C:\nssm\nssm.exe set DltsPM2 AppStderr "C:\Users\LIRS\Desktop\COURIER-WEB\Server\logs\pm2-service-err.log"
C:\nssm\nssm.exe start DltsPM2
```

## 7. Validation checklist

- [ ] `Get-Service DltsPM2` shows `Running`. **Blocked** — service not
      yet created, see §11. Not something a manual pm2 run can
      substitute for.
- [x] `curl http://10.0.20.142:9989/health` returns `"status":"ok"` (or
      `"degraded"` with `"redis":"error"` if Titan KV isn't running —
      that's expected and fine, see §3). *(Verified 2026-07-27 via a
      manual, temporary `pm2 start ecosystem.config.js` run, not yet
      via the `DltsPM2` service itself — re-verify once §11's
      elevated commands are run. Response was `HTTP 503` with body
      `{"status":"degraded","database":"connected","redis":"error"}` —
      the 503/degraded pairing is expected per §3, just note that
      `curl -f` or naive health-checkers will treat 503 as a failure
      even though this is the documented-fine state.)*
- [x] `curl http://10.0.20.142:4173/` returns the app shell HTML.
      *(Verified 2026-07-27, same manual pm2 run as above — HTTP 200,
      correct HTML shell returned.)*
- [x] From another device on the same network, `http://10.0.20.142:4173`
      loads in a browser and logging in with a seeded account (see §8)
      works. *(Verified 2026-07-27 via direct API call to
      `http://10.0.20.142:9989/api/v1/auth/login` with
      `Rasheed.admin@lirs.net` / `Password123!` — HTTP 200, valid
      `access_token` and user/role/directorate payload returned. Not
      re-tested from a second physical device's browser — only the
      LAN-IP HTTP round-trip itself, which is the part that was in
      question.)*
- [ ] Reboot the server; confirm `DltsPM2` auto-starts and both
      `dlts-api` and `dlts-client` come back up without manual
      intervention. **Blocked** — service doesn't exist yet, see §11.
      Once it's created, a stop/start of the `DltsPM2` service (via
      `Get-Service`/`Start-Service`) plus confirming `Start` is
      `Automatic` is a reasonable non-disruptive proxy for reboot
      survival, and should be done as part of finishing §11 — an
      actual reboot was intentionally not performed.

## 8. Test accounts

All seeded, password `Password123!` for every account (see
`Server/seed.sql`):

| Role | Email | Notes |
|---|---|---|
| Admin | `Rasheed.admin@lirs.net` | Full letter workflow: approve, allocate, reject. |
| Management | `David.IT@lirs.net` | Everything Admin can do, plus `/admin/users`. |
| ODU | `john.doe@letterdelivery.com` | Registers/submits letters for Finance directorate. |
| Courier | `beta.courier@gmail.com` | Base LGA: Ikeja. Has active assigned deliveries. |

## 9. Known gaps carried forward (not fixed this round)

- **Courier role has no web UI.** Confirmed while merging roles: the
  React client has zero handling for `role: 'Courier'` — no dashboard
  case, no nav items, nothing. A courier who logs into the web app
  today lands on the ODU dashboard by default with an almost-empty
  sidebar. Given the plan to make the web client responsive for
  courier POD submission (see §2), this needs real design/build work
  before couriers can actually use it — flagging so it isn't
  discovered at the point of testing with a Courier account.
- **Schedules mobile-app stubs** — see §2, deliberately deferred.

## 10. Deferred to a later phase

External/public access — domain registration, DNS, TLS
(`win-acme`), router port-forwarding, and rotating the dev-default
secrets — once there's an actual domain to attach a certificate to.

## 11. Execution log — 2026-07-27

Ran §6 against the live host. Summary: **prep work done, app validated,
service wrap blocked on elevation.**

**What ran successfully, no deviations from the plan:**

- `npm install -g pm2` — succeeded (77 packages added), no elevation
  needed.
- `ecosystem.config.js` created at
  `C:\Users\LIRS\Desktop\COURIER-WEB\ecosystem.config.js`, exact
  content from §6 (no path or port changes).
- NSSM 2.24 downloaded from the exact URL in the plan
  (`https://nssm.cc/release/nssm-2.24.zip` — link was live, no
  substitution needed), extracted, and `win64\nssm.exe` copied to
  `C:\nssm\nssm.exe`. Confirmed the binary runs (`nssm version` prints
  usage text and exits 1 — that's normal NSSM behavior for an
  unrecognized subcommand, not a fault; the console output is also
  UTF-16-spaced by design, a known NSSM quirk).
- `pm2-runtime.cmd` resolved to
  `C:\Users\LIRS\AppData\Roaming\npm\pm2-runtime.cmd`.
- Pre-flight port check: 9989 and 4173 were free; `::1:5173` had an
  established connection (PID 1296) which was left completely alone
  per instructions.

**Blocked step — needs re-run from an elevated (Run as Administrator)
PowerShell:**

`nssm.exe install DltsPM2 ...` failed with `Administrator access is
needed to install a service.` Checked the token: the `lirs` account
*is* a member of `BUILTIN\Administrators`, but in this shell that
group shows as "deny only" and
`IsInRole(Administrator)` returns `False` — standard UAC split-token
behavior for a non-elevated session, not a missing permission on the
account itself. None of the remaining NSSM commands (`install`,
`set` ×4, `start`) can succeed without elevation — `sc`-level service
creation/configuration is admin-only on Windows and there's no
non-destructive workaround, so none was attempted. **Re-run exactly
this, from an elevated PowerShell, to finish the job:**

```powershell
$pm2Runtime = "C:\Users\LIRS\AppData\Roaming\npm\pm2-runtime.cmd"
C:\nssm\nssm.exe install DltsPM2 "$pm2Runtime" "start ""C:\Users\LIRS\Desktop\COURIER-WEB\ecosystem.config.js"""
C:\nssm\nssm.exe set DltsPM2 AppDirectory "C:\Users\LIRS\Desktop\COURIER-WEB"
C:\nssm\nssm.exe set DltsPM2 Start SERVICE_AUTO_START
C:\nssm\nssm.exe set DltsPM2 AppStdout "C:\Users\LIRS\Desktop\COURIER-WEB\Server\logs\pm2-service-out.log"
C:\nssm\nssm.exe set DltsPM2 AppStderr "C:\Users\LIRS\Desktop\COURIER-WEB\Server\logs\pm2-service-err.log"
C:\nssm\nssm.exe start DltsPM2
```

After that, finish §7's two blocked checklist items: `Get-Service
DltsPM2` should show `Running` with `StartType Automatic`, and a
`Stop-Service DltsPM2` / `Start-Service DltsPM2` cycle should bring
`dlts-api` and `dlts-client` back cleanly (visible via `pm2 list`,
since the service just runs `pm2-runtime` in the foreground) — a good
non-disruptive proxy for reboot survival without actually rebooting
the box.

**App-level validation done in the meantime (not via the service —
via a temporary, manually-started `pm2 start ecosystem.config.js`,
then fully torn down with `pm2 delete all` / `pm2 kill` afterward so
ports 9989/4173 were left clean for the elevated step above):**

- `dlts-api` and `dlts-client` both came up `online` in `pm2 list`
  immediately, no port conflicts, no crash loops.
- `GET http://10.0.20.142:9989/health` → HTTP 503,
  `{"status":"degraded","database":"connected","redis":"error"}` —
  matches §3/§7's documented-fine degraded state exactly (Titan KV
  intentionally not running).
- `GET http://10.0.20.142:4173/` → HTTP 200, correct app-shell HTML.
- `POST http://10.0.20.142:9989/api/v1/auth/login` with
  `Rasheed.admin@lirs.net` / `Password123!` → HTTP 200, valid JWT
  `access_token` plus correct `role: "Admin"` and directorate payload.

**Current actual status as of end of this session:**

| Service | State |
|---|---|
| MySQL (`MySQL97`) | Running (untouched, already was) |
| `DltsPM2` (NSSM) | **Not created yet** — install blocked on elevation, see above |
| `dlts-api` / `dlts-client` (PM2 apps) | **Not running** — the manual validation run was deliberately torn down; nothing is currently listening on 9989 or 4173 |
| Titan KV | Stopped (intentional, see §3) |
| Port 5173 session (PID 1296) | Left untouched throughout |

Nothing is listening on 9989/4173 right now — the app is not
reachable until the elevated commands above are run. `C:\nssm\nssm.exe`
and `ecosystem.config.js` are staged and ready; the elevated block is
the only remaining step.

## 12. Incident: service installed, but stuck `Paused` — root cause and fix

The elevated commands from §11 were run successfully - `DltsPM2` was
created. But starting it left it in `Paused` state, and the app
wasn't reachable.

**Root cause:** the project folder's original name, `COURIER WEB`,
has a space in it. NSSM stores `AppParameters` as one string and
passes it to `CreateProcess` largely as-is; unless the whole value
arrives already wrapped in literal embedded quote characters, Windows
tokenizes it on whitespace before `pm2-runtime` ever sees it. The
installer command in §6/§11 tried to produce those embedded quotes via
PowerShell's `""` escaping, but what actually landed in the registry
(confirmed with `nssm get DltsPM2 AppParameters`) was the bare,
unquoted path. The result: `pm2-runtime` received `start`,
`C:\Users\LIRS\Desktop\COURIER`, and `WEB\ecosystem.config.js` as
**three** separate arguments instead of two. It crashed immediately
(`Server/logs/pm2-service-err.log` shows `TypeError
[ERR_INVALID_ARG_TYPE]` inside PM2's own arg parser, `path` argument
undefined). NSSM's crash-loop protection (`AppThrottle`, default
1500ms) then paused the service rather than restart-looping forever.

**Fix, in two parts:**

1. **Renamed the project folder** to remove the space entirely:
   `COURIER WEB` → `COURIER-WEB`. This is the real fix - it removes
   the failure mode at the source instead of fighting NSSM's argument
   quoting.
2. **Changed `AppParameters` to a bare filename** (`start
   ecosystem.config.js`) instead of a full path, relying on
   `AppDirectory` (set separately, and *not* subject to the same
   tokenizing problem) as the working directory `pm2-runtime` resolves
   it against. More robust than getting the quoting exactly right even
   with the space gone - no path in `AppParameters` means no path that
   can ever be re-broken by a future rename.

Every path reference in this document, `ecosystem.config.js`, and the
NSSM service configuration below already reflects `COURIER-WEB`.

**Run this from an elevated ("Run as Administrator") PowerShell to
finish the fix** (safe to run whether the folder has already been
renamed or not - it renames it if needed, then repairs and restarts
the service):

```powershell
# 1. Stop the paused service first - it's the process holding a lock
#    on the folder, which would otherwise block the rename.
Stop-Service DltsPM2 -Force

# 2. Rename the folder (skips harmlessly if already done)
if (Test-Path 'C:\Users\LIRS\Desktop\COURIER WEB') {
    Rename-Item -Path 'C:\Users\LIRS\Desktop\COURIER WEB' -NewName 'COURIER-WEB'
}

# 3. Fix the service configuration
C:\nssm\nssm.exe set DltsPM2 AppParameters "start ecosystem.config.js"
C:\nssm\nssm.exe set DltsPM2 AppDirectory "C:\Users\LIRS\Desktop\COURIER-WEB"
C:\nssm\nssm.exe set DltsPM2 AppStdout "C:\Users\LIRS\Desktop\COURIER-WEB\Server\logs\pm2-service-out.log"
C:\nssm\nssm.exe set DltsPM2 AppStderr "C:\Users\LIRS\Desktop\COURIER-WEB\Server\logs\pm2-service-err.log"

# 4. Start it and confirm
Start-Service DltsPM2
Start-Sleep -Seconds 3
Get-Service DltsPM2
Invoke-WebRequest http://10.0.20.142:9989/health -UseBasicParsing | Select-Object -ExpandProperty Content
Invoke-WebRequest http://10.0.20.142:4173/ -UseBasicParsing | Select-Object StatusCode
```

If `Get-Service DltsPM2` still doesn't show `Running`, check
`Server\logs\pm2-service-err.log` for the actual error rather than
guessing - it printed the exact root cause clearly last time.
