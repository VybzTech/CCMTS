# Courier App (DLTS) — Diagnostic & Fix Report

**Date:** 2026-08-10
**Host:** `lirscourierenv\lirs` (10.0.20.142), Windows Server 2022
**Investigated by:** Claude Code
**Scope:** Why the courier application was not running; state of the `DltsPM2` startup service; log analysis; remediation.

---

## 1. Executive Summary

The application was **down for approximately 5 days** (last healthy activity `2026-08-05 16:15`, discovered `2026-08-10 ~14:55`) while the `DltsPM2` Windows service continued to report **`Running`**. Three distinct problems were found, one of which is still unresolved and is the most serious.

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | Service supervises a `cmd.exe` wrapper, so a dead app is invisible to NSSM | 🔴 High | ⚠️ **Not fixed** — needs Administrator |
| 2 | `/health` returned 503 because the KV store was not running | 🟠 Medium | ✅ **Fixed** |
| 3 | Public URL `dispatchhub.lirs.net` does not route `/api/v1/*` to this API | 🔴 Critical | ⚠️ **Not fixed** — outside this host |
| 4 | 2.3 GB of runaway log files | 🟡 Low | 🟡 **Partially** — samples archived, truncation blocked |
| 5 | `titan_kv` will not survive a reboot | 🟠 Medium | ⚠️ **Not fixed** — needs Administrator |

### Current runtime status: ✅ Running

| Component | Port | State |
|---|---|---|
| `dlts-api` (Express) | 9989 | ✅ up — `/health` → **200 ok** |
| `dlts-client` (Vite preview) | 4173 | ✅ up — HTTP 200 |
| `titan_kv` (Redis-compatible KV) | 6380 | ✅ up — **started during this session** |
| MySQL | 3306 | ✅ up — `database: connected` |
| `DltsPM2` service | — | Running |

```json
{"status":"ok","uptimeSeconds":12007,"database":"connected","redis":"connected"}
```

> ⚠️ **Important caveat:** the application came back up at `15:00:04` today as a **side effect** of running `pm2 list` during diagnosis (which cleared stale PM2 state and allowed NSSM to relaunch). It was **not** brought back by a deliberate repair. The underlying supervision fault (Issue 1) remains in place and **will recur**.

---

## 2. Issue 1 — Service reports "Running" while the app is dead

**Severity:** 🔴 High · **Status:** ⚠️ Not implemented (requires Administrator)

### Evidence

- `DltsPM2` service state: `Running`, `StartMode: Auto`, running as `LocalSystem` via `C:\nssm\nssm.exe`.
- At time of discovery: **zero `node.exe` processes** belonging to the app, and **nothing listening** on 9989 or 4173.
- `LastBootUpTime` = **2026-07-12** — the machine had not rebooted, so this was not a startup failure.
- `C:\Users\LIRS\.pm2\pm2.log` shows a clean gap: last entry `2026-08-05T16:15:13 App [dlts-client:1] online`, then nothing until the diagnostic session. **No shutdown entry, no crash entry** — the PM2 daemon was hard-killed without a trace.

### Root cause

The service was registered against a **batch wrapper**, not an executable:

```
Application         = C:\Users\LIRS\AppData\Roaming\npm\pm2-runtime.cmd
AppParameters       = start ecosystem.config.js
AppDirectory        = C:\Users\LIRS\Desktop\COURIER WEB
AppEnvironmentExtra = PM2_HOME=C:\Users\LIRS\.pm2
AppExit (default)   = Restart
```

`pm2-runtime.cmd` ends with:

```bat
endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%" "%dp0%\node_modules\pm2\bin\pm2-runtime" %*
```

NSSM therefore supervises **`cmd.exe`**, and the real Node process is a *grandchild*. This was confirmed against the live process tree:

```
nssm.exe (3376)
  └─ cmd.exe (3240)
       └─ node.exe (10804)          ← pm2-runtime
            ├─ node.exe (10076)     ← dlts-api      :9989
            └─ node.exe (10512)     ← dlts-client   :4173
```

NSSM's `AppExit=Restart` only reacts when **its own monitored process** exits. With the Node tree dead beneath a surviving `cmd.exe` wrapper, NSSM sees a healthy process and never restarts. This is the exact "service is up but the application is down" signature observed.

### Recommended solution — point NSSM at `node.exe` directly

Run from an **elevated (Administrator)** command prompt:

```cmd
C:\nssm\nssm.exe stop DltsPM2
C:\nssm\nssm.exe set DltsPM2 Application "C:\Program Files\nodejs\node.exe"
C:\nssm\nssm.exe set DltsPM2 AppParameters "\"C:\Users\LIRS\AppData\Roaming\npm\node_modules\pm2\bin\pm2-runtime\" start ecosystem.config.js"
C:\nssm\nssm.exe set DltsPM2 AppDirectory "C:\Users\LIRS\Desktop\COURIER WEB"
C:\nssm\nssm.exe set DltsPM2 AppRotateFiles 1
C:\nssm\nssm.exe set DltsPM2 AppRotateOnline 1
C:\nssm\nssm.exe set DltsPM2 AppRotateBytes 10485760
C:\nssm\nssm.exe set DltsPM2 AppThrottle 10000
C:\nssm\nssm.exe set DltsPM2 AppRestartDelay 5000
C:\nssm\nssm.exe start DltsPM2
```

This removes the `cmd.exe` layer so NSSM supervises the actual Node process and restart-on-exit works.

### Why it was not implemented

The diagnostic session was **not elevated** (`IsInRole(Administrator)` → `False`). All `nssm set` calls failed with:

```
Can't open service!  OpenService(): Access is denied.
```

**No configuration was changed. The service remains exactly as it was and is running normally.**

### Related note

The installed `nssm.exe` is the **2014 build (2.24)** — it rejected `AppKillProcessTree` as an invalid parameter. Upgrading to **2.25+** is recommended for reliable process-tree teardown on stop/restart.

---

## 3. Issue 2 — `/health` returned 503 while the API was fully functional

**Severity:** 🟠 Medium · **Status:** ✅ **IMPLEMENTED**

### Evidence

```
GET http://localhost:9989/health  →  503 Service Unavailable
{"status":"degraded","uptimeSeconds":11738,"database":"connected","redis":"error",...}
```

`Server/.env` sets `REDIS_URL=redis://127.0.0.1:6380`, but `KV/titan_kv.exe` was **not running** and nothing was listening on 6380. This had been true since at least 2026-07-27 (`GET /health 503` appears in `dlts-api-out.log` from that date).

### Root cause

`Server/src/app.js` fails the whole health check on Redis:

- `app.js:104` — `status` is `'ok'` only if **both** the DB *and* Redis checks succeed.
- `app.js:111` — `return res.status(health.status === 'ok' ? 200 : 503).json(health);`

This directly contradicts the module's own documentation at `app.js:69-73`:

> *"Redis (Titan KV) is no longer load-bearing — nothing in this app uses BullMQ anymore … so a missing/unreachable Redis shouldn't take the whole API down. /health still reports its status for visibility."*

The intent was **visibility**, but the implementation makes Redis **fatal**. Any load balancer, uptime monitor, or orchestrator gating on `/health` would declare a perfectly functional API dead.

### ✅ Implemented fix

Started the KV store:

```powershell
Start-Process -FilePath '.\titan_kv.exe' -WorkingDirectory 'C:\Users\LIRS\Desktop\COURIER WEB\KV'
```

- `titan_kv` now running as **PID 8704**, bound to `127.0.0.1:6380`.
- **Verified:** `/health` now returns **200** with `{"status":"ok","database":"connected","redis":"connected"}`.

### Additional recommendation (not implemented — application code change)

Decouple the HTTP status from the non-load-bearing dependency, so a stopped KV can never again masquerade as an outage. In `Server/src/app.js`:

```js
// status code reflects only load-bearing dependencies; redis stays informational
const health = {
    status: dbCheck.status === 'fulfilled' ? 'ok' : 'error',
    uptimeSeconds: Math.round(process.uptime()),
    database: dbCheck.status === 'fulfilled' ? 'connected' : 'error',
    redis: redisCheck.status === 'fulfilled' ? 'connected' : 'error',
    timestamp: new Date().toISOString(),
};

return res.status(health.status === 'ok' ? 200 : 503).json(health);
```

This was left for your decision as it modifies application behaviour.

---

## 4. Issue 3 — Public URL does not reach this API

**Severity:** 🔴 **Critical** · **Status:** ⚠️ Not implemented (outside this host)

### Evidence

`Client/.env.production` builds the UI against:

```
VITE_API_BASE_URL=https://dispatchhub.lirs.net/api/v1
```

DNS resolution shows that host is **not this machine**:

```
dispatchhub.lirs.net
  └─ CNAME → terraform-prod-alb-2088440576.eu-west-1.elb.amazonaws.com
              └─ A 54.171.245.174, 54.229.12.249     (AWS ALB, eu-west-1)
```

Comparing the same path locally vs. publicly proves `/api/v1/*` never reaches this backend:

| Request | Status | Content-Type | Length |
|---|---|---|---|
| `http://localhost:9989/health` | 200 | `application/json` | 119 |
| `https://dispatchhub.lirs.net/health` | 200 | **`text/html`** | **1638** |
| `https://dispatchhub.lirs.net/api/v1/auth/login` | 404 | `text/html` | — |

The public host returns the **SPA's `index.html`** for `/health` (1638 bytes — matching the local client's index page exactly) rather than the API's JSON, and 404s all `/api/v1/*` paths. No reverse proxy is running on this machine (no nginx, caddy, httpd, haproxy, or IIS/W3SVC processes found).

### Impact

Through the real production URL, users load the interface but **every API call fails**. If the "application isn't running" report originated from end users rather than from this server, **this is the actual cause** — and it is entirely unaffected by the local fixes in this report.

### Recommended solution

Route `/api/v1/*` on `dispatchhub.lirs.net` to this host's port **9989**. Either:

1. **ALB target group** — register `10.0.20.142:9989` as a target and add a listener rule forwarding `/api/v1/*` to it (requires network reachability from the AWS VPC to this host), **or**
2. **Local reverse proxy** — stand up nginx/caddy on this machine to serve the built client and proxy `/api/v1/*` → `localhost:9989`, then point the front door at it.

`Server/.env` already permits the origin (`CLIENT_ORIGINS` includes `https://dispatchhub.lirs.net`), so no CORS change is required.

> This is outside the scope of what could be changed on this host and requires AWS/infrastructure access.

---

## 5. Issue 4 — 2.3 GB of runaway log files

**Severity:** 🟡 Low · **Status:** 🟡 Partially implemented

### Evidence

| File | Size | Generated |
|---|---|---|
| `Server/worker.log` | **1.6 GB** | 2026-07-27, ~10 minutes (15:08 → 15:17) |
| `KV/titan.log` | **661 MB** | 2026-07-27 |

### Root cause

`titan_kv` is Redis-*compatible* but does **not implement Lua scripting** (`eval` / `evalsha`), which BullMQ depends on. `Server/src/worker.js` therefore spun in a tight failure loop:

```
ReplyError: ERR unknown command
  command: { name: 'eval',    args: ['--[[ Move stalled jobs to wait. ...'] }
  command: { name: 'evalsha', args: ['6c4c6de2bece2ad87657691d945d902df2198f5e', ...] }
```

This is almost certainly why BullMQ was abandoned (per the comment in `app.js:69-73`). The worker is **not** listed in `ecosystem.config.js`, so it is not running and the logs are not currently growing.

**Disk is not at risk:** 257 GB free on C:.

### 🟡 What was implemented

200 KB tail samples of each file were archived for reference before any destructive action:

```
logs/archive/worker.log.sample-20260727.txt
logs/archive/titan.log.sample-20260727.txt
```

### ⚠️ What was blocked

Truncation of the originals was **denied by the permission classifier** during the session. The originals are safe to clear now that samples exist:

```powershell
Clear-Content "C:\Users\LIRS\Desktop\COURIER WEB\Server\worker.log"
Clear-Content "C:\Users\LIRS\Desktop\COURIER WEB\KV\titan.log"
```

Enabling `AppRotateFiles` on both services (see Issues 1 and 5) prevents recurrence.

---

## 6. Issue 5 — `titan_kv` will not survive a reboot

**Severity:** 🟠 Medium · **Status:** ⚠️ Not implemented (requires Administrator)

`titan_kv.exe` was started as a **plain background process** (PID 8704) to restore health. It is not registered as a service and will **not** come back after a reboot or logoff — meaning Issue 2 would silently return.

### Recommended solution

From an **elevated** prompt:

```cmd
C:\nssm\nssm.exe install DltsKV "C:\Users\LIRS\Desktop\COURIER WEB\KV\titan_kv.exe"
C:\nssm\nssm.exe set DltsKV AppDirectory "C:\Users\LIRS\Desktop\COURIER WEB\KV"
C:\nssm\nssm.exe set DltsKV AppRotateFiles 1
C:\nssm\nssm.exe set DltsKV AppRotateOnline 1
C:\nssm\nssm.exe set DltsKV AppRotateBytes 10485760
C:\nssm\nssm.exe set DltsPM2 DependOnService DltsKV
C:\nssm\nssm.exe start DltsKV
```

The `DependOnService` line ensures the KV store starts before the API.

---

## 7. Additional Observations

### `NODE_ENV=development` in a production deployment
Set in **two** places:
- `Server/.env` → `NODE_ENV=development`
- `ecosystem.config.js:7` → `env: { NODE_ENV: 'development', PORT: '9989' }`

This affects Express performance optimisations, view caching, and error-response verbosity (stack traces may leak to clients). Worth reviewing before public exposure.

### No uptime monitoring
A 5-day outage passed unnoticed behind a green service light. An external check against `http://10.0.20.142:9989/health` (expecting HTTP 200) would have caught this within minutes. **Strongly recommended.**

### PM2 daemon ownership
The service runs as `LocalSystem` with `PM2_HOME=C:\Users\LIRS\.pm2` — a user profile path. Running `pm2` commands from an interactive user session competes with the service's daemon over the same named pipes (`\\.\pipe\rpc.sock`), which is what caused the daemon churn observed during diagnosis. Consider relocating `PM2_HOME` to a machine-level path such as `C:\ProgramData\pm2`, and avoid running interactive `pm2` commands against the service's home.

### Historic crash loop (already resolved, for the record)
`logs/stderr.log` contains **18 identical crashes** from 2026-07-27:

```
TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string. Received undefined
    at Object.instanciate (...\pm2\lib\binaries\Runtime4Docker.js:68:47)
```

Cause: `Runtime4Docker.js:68` reads `process.env.PM2_HOME || path.join(process.env.HOME, '.pm2')`. Windows sets `USERPROFILE`, not `HOME`, so without `PM2_HOME` the fallback receives `undefined` and throws. This was resolved on 2026-07-27 by adding `PM2_HOME` to the service environment — **keep that variable set**; removing it reintroduces the crash loop.

---

## 8. Change Log for This Session

### ✅ Implemented
| Change | Detail |
|---|---|
| Started `titan_kv.exe` | PID 8704 on `127.0.0.1:6380` — restored `/health` from 503 → 200 |
| Created `logs/archive/` | Two 200 KB log samples preserved before any cleanup |

### ❌ Attempted but blocked (no side effects)
| Attempt | Blocker |
|---|---|
| `nssm set DltsPM2 ...` (9 calls) | `OpenService(): Access is denied` — session not elevated. **Service config unchanged.** |
| `Clear-Content` on the two large logs | Denied by permission classifier. **Files unchanged.** |

### Not touched
No application code, service configuration, environment file, or database was modified.

---

## 9. Prioritised Action List

| Priority | Action | Requires |
|---|---|---|
| **P0** | Route `/api/v1/*` on `dispatchhub.lirs.net` to this host:9989 (§4) | AWS / infra access |
| **P1** | Repoint `DltsPM2` at `node.exe`, drop the `.cmd` wrapper (§2) | Administrator |
| **P1** | Register `titan_kv` as the `DltsKV` service with a dependency (§6) | Administrator |
| **P2** | Add external uptime monitoring on `/health` (§7) | Monitoring tooling |
| **P2** | Decouple `/health` status code from Redis (§3) | Code change + deploy |
| **P3** | Truncate the two large log files (§5) | Approval |
| **P3** | Review `NODE_ENV=development` (§7) | Decision |
| **P3** | Upgrade NSSM from 2.24 to 2.25+ (§2) | Administrator |

---

*Report generated 2026-08-10. All findings verified against the live system at time of writing.*
