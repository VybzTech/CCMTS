# CCMTS Deployment

Two long-lived branches, one script.

| Branch | Role | Deployed to |
|---|---|---|
| `main` | staging / dev — everything lands here first | local dev, or a staging checkout |
| `production` | what the public site serves | `10.0.20.142` (`C:\Users\LIRS\Desktop\COURIER WEB`) |

## Why "just switch the branch" isn't enough

This was the plan, and it doesn't work on its own. Three of the things the
app actually serves are gitignored or generated, so they never arrive with
a `git checkout`:

| Thing | Why it doesn't travel |
|---|---|
| `Client/dist` | Gitignored. `dlts-client` runs `vite preview`, which serves this folder. **Without a rebuild the UI does not change at all.** |
| `node_modules` | Gitignored. A release that adds a dependency crashes on boot. |
| `Server/.env` | Gitignored. Secrets, DB URL, `CLIENT_ORIGINS` — none of it is in git. |

And nothing restarts PM2, so even correct source keeps serving the old
process. A branch switch alone changes the files on disk and nothing else.

`scripts/deploy.ps1` is the missing half: fetch → `npm ci` → `prisma
migrate deploy` → `vite build` → `pm2 reload` → verify `/health`.

## Deploying

On the server, from the repo root:

```powershell
.\scripts\deploy.ps1                    # deploys 'production'
.\scripts\deploy.ps1 -Branch main       # deploys staging
.\scripts\deploy.ps1 -SkipMigrate       # no schema change in this release
```

It refuses to run if the server's working tree is dirty, if `Server/.env`
is missing, or if `/health` doesn't return 200 within ~30s. It warns (but
continues) if `NODE_ENV=production` isn't set.

## Promoting staging to production

```bash
git checkout production
git merge --ff-only main
git push origin production
```

Then run the deploy script on the server. Keeping it fast-forward-only
means `production` is always a commit that existed on `main` first.

## First-time server setup

1. `git fetch origin && git checkout production`
2. Create `Server/.env` (it is not in git). Set at minimum
   `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, and
   `CLIENT_ORIGINS=https://dispatchhub.lirs.net`.
3. Run `.\scripts\deploy.ps1`.

## Known production problems this does NOT fix

Deployment is only half the story. These are live and predate any of this:

1. **`POST /api/v1/auth/signup` is public on the internet right now.**
   It is unauthenticated and its body accepts `role`, so anyone who can
   reach the API can create themselves a Management account. The route is
   removed in `main` — **this is the reason to deploy, and it should go
   first.** Verify afterwards that the endpoint returns 404.
2. **`NODE_ENV=development` in production** — set in both `Server/.env`
   and `ecosystem.config.js:7`. Leaks stack traces in error responses and
   leaves the login cookie's `Secure` flag off.
3. **The NSSM supervision fault** (`DIAGNOSTIC-REPORT-2026-08-10.md` §2).
   `DltsPM2` supervises a `cmd.exe` wrapper, so a dead app still reports
   `Running`. It hid a 5-day outage. Needs an Administrator to repoint the
   service at `node.exe`. **A deploy script cannot work around this** —
   if PM2 dies, nothing restarts it.
4. **`titan_kv` is not a service** (§6) and will not survive a reboot.
5. **No uptime monitoring.** An external check on `/health` expecting 200
   would have caught the outage in minutes.

`ecosystem.config.js` also hardcodes `C:\Users\LIRS\Desktop\COURIER WEB`,
so the repo can only be deployed to that exact path until those paths are
made relative.

## If you later want CI

The natural next step is GitHub Actions running `tsc --noEmit` and
`vite build` on every push and PR, so a broken build can't reach
`production`. That needs no runner on the server — deployment stays this
script. A self-hosted runner that deploys automatically is a step beyond
that, and is only worth it once items 1–5 above are closed.
