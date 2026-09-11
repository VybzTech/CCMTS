/**
 * Mock API server implementing API_DOCUMENTATION.md exactly (request/
 * response shapes, status codes, envelope keys) for local development
 * and testing against the React app.
 *
 * Why this isn't a vanilla `json-server db.json`: every documented
 * endpoint wraps its payload in a named key (`{ "letters": [...] }`,
 * `{ "directorate": {...} }`, `{ "message": ..., "courier": {...} }`)
 * and several need joined/nested data (a letter's senderDirectorate,
 * createdBy, courier, timelines) or aren't plain CRUD at all
 * (approve/reject/auto-allocate/allocate). Plain json-server's
 * auto-generated routes return bare resources/arrays and can't express
 * those actions, so this is a small hand-written Express server
 * instead - db.json is still the single source of truth for data, and
 * every mutation is written back to it (see saveDb()), so state
 * persists across restarts the same way a real json-server setup would.
 *
 * This is a MOCK for local development only:
 *  - Passwords are stored and compared in plaintext (see db.json).
 *  - The "access_token" is an opaque random string, not a real signed
 *    JWT - it looks JWT-shaped (three dot-separated segments) so the
 *    frontend's `Authorization: Bearer <token>` handling gets a
 *    realistic value to work with, but there is no cryptographic
 *    verification behind it.
 *  - Auto-allocate runs synchronously, not as a background job.
 *  - There is a Rejected value on `status` used only for the reject
 *    endpoint's result - API_DOCUMENTATION.md documents the reject
 *    endpoint but its "Data Types Reference" table never lists a
 *    matching status value, so this fills that specific gap; every
 *    other status value matches the doc exactly. See
 *    src/types/api.ts's LetterStatus comment on the frontend side.
 *  - The `/users` routes (list/create/update/disable/reset-password),
 *    `POST /auth/change-password`, and the `SuperAdmin` role are NOT in
 *    API_DOCUMENTATION.md at all - only `/auth/signup` is documented
 *    for creating accounts, and it's unauthenticated. These were added
 *    so a SuperAdmin user can fully manage accounts (including forcing
 *    a password reset) from within the app; see src/types/api.ts's
 *    UserRole comment for the full reasoning.
 *
 * Run: npm run mock-server (see package.json) - or `node mock-server/server.js`.
 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'db.json');
const PORT = process.env.MOCK_SERVER_PORT || 4000;

/** PASSWORD_POLICY_PATTERN is kept in sync BY HAND with
 *  src/utils/passwordPolicy.ts (a CommonJS mock server and a TS module
 *  can't share code across that boundary here) - change one, change the
 *  other. There is deliberately no shared reset-password constant any
 *  more: an admin reset now mints a unique, policy-compliant one-time
 *  password per user (see generateTemporaryPassword + POST
 *  /users/:id/reset-password) instead of a predictable shared secret. */
const PASSWORD_POLICY_PATTERN = /^(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\d)[A-Za-z0-9]{12,}$/;
const PASSWORD_POLICY_MESSAGE =
  'New password must be at least 12 characters, alphanumeric only, with at least one uppercase letter.';

/** Generates a random alphanumeric password that satisfies
 *  PASSWORD_POLICY_PATTERN (>=12 chars, at least one uppercase and one
 *  digit). Used for admin password resets so every reset produces a
 *  distinct one-time credential rather than a shared, guessable default.
 *  crypto.randomInt gives a uniform, unbiased index into each charset. */
function generateTemporaryPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O - avoid look-alikes
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const all = upper + lower + digits;
  const pick = (set) => set[crypto.randomInt(set.length)];
  // Seed the two policy-required character classes, then fill to length.
  const chars = [pick(upper), pick(digits)];
  while (chars.length < 14) chars.push(pick(all));
  // Fisher-Yates shuffle so the required chars aren't always in front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Routes still reachable while a user's mustResetPassword flag is set -
 *  everything else 403s until they change their password (see
 *  requireAuth below). Paths are relative to the /api/v1 router mount. */
const ALLOWED_DURING_PASSWORD_RESET = ['/auth/me', '/auth/change-password'];

// ---------------------------------------------------------------------
// Data store - loaded once, mutated in memory, flushed to disk on every
// write so `npm run mock-server` restarts pick up where you left off.
// ---------------------------------------------------------------------
let db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

function saveDb() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function nextId(collection) {
  const ids = db[collection].map((row) => Number(row.id) || 0);
  return String((ids.length ? Math.max(...ids) : 0) + 1);
}

function nextTrackingId() {
  const year = new Date().getFullYear();
  const sequence = db.letters.length + 1;
  return `LTR-${year}-${String(sequence).padStart(3, '0')}`;
}

function addTimeline(letterId, status, description, userId) {
  db.timelines.push({
    id: nextId('timelines'),
    letterId: String(letterId),
    status,
    description,
    userId: userId ? String(userId) : null,
    createdAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------
// Auth - opaque bearer tokens mapped to user ids, held in db.json's
// `tokens` object so a token survives a server restart during a dev
// session (real JWTs wouldn't need this since they're self-contained;
// this mock's tokens are just random strings, so *something* has to
// remember what they mean).
// ---------------------------------------------------------------------
function issueToken(userId) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'MOCK' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, iat: Date.now() })).toString('base64url');
  const signature = crypto.randomBytes(16).toString('base64url');
  const token = `${header}.${payload}.${signature}`;
  db.tokens[token] = String(userId);
  saveDb();
  return token;
}

function publicUser(user) {
  const { password: _password, ...rest } = user;
  return rest;
}

/** Applied to every route below except /auth/signup and /auth/login -
 *  mirrors the three 401 variants API_DOCUMENTATION.md documents
 *  (no token / invalid token / expired token), collapsed here into one
 *  check since this mock's tokens don't actually expire. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  const cookieToken = req.headers.cookie?.match(/(?:^|;\s*)jwt=([^;]+)/)?.[1];
  const resolvedToken = token || cookieToken;

  const userId = resolvedToken && db.tokens[resolvedToken];
  if (!resolvedToken) return res.status(401).json({ message: 'Not authorized, no token provided' });
  if (!userId) return res.status(401).json({ message: 'Not authorized, invalid token' });

  const user = db.users.find((u) => u.id === userId);
  if (!user) return res.status(401).json({ message: 'Not authorized, invalid token' });

  // Neither check is part of API_DOCUMENTATION.md - see types/api.ts's
  // User.disabled/mustResetPassword comment. A disabled account loses
  // access immediately, even mid-session, rather than only at the next
  // login. A mustResetPassword account keeps just enough access to read
  // its own profile and change its password - everything else 403s
  // until that's done, so this can't be bypassed by simply not visiting
  // /force-password-reset in the UI.
  if (user.disabled) {
    return res.status(403).json({ message: 'This account has been disabled. Contact an administrator.' });
  }
  if (user.mustResetPassword && !ALLOWED_DURING_PASSWORD_RESET.includes(req.path)) {
    return res.status(403).json({ message: 'Password reset required before continuing.' });
  }

  req.currentUser = user;
  next();
}

/** Mirrors src/utils/permissions.ts's DIRECTORATE_UNRESTRICTED_ROLES -
 *  keep both in sync if the role list ever changes. Duplicated rather
 *  than imported since this file is CommonJS and that one's an ES
 *  module meant for the Vite/React bundle. */
const DIRECTORATE_UNRESTRICTED_ROLES = ['SuperAdmin', 'Admin', 'Management'];
function isDirectorateRestricted(role) {
  return !DIRECTORATE_UNRESTRICTED_ROLES.includes(role);
}

/** Not part of API_DOCUMENTATION.md's documented auth model - added
 *  alongside the /users routes below so SuperAdmin-only actions return
 *  a proper 403 instead of silently succeeding for every role. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.currentUser.role)) {
      return res.status(403).json({ message: 'Not authorized for this action' });
    }
    next();
  };
}

/** Role groups for the authorization guards on the mutating routes
 *  below. These mirror the <ProtectedRoute allow={...}> lists in
 *  src/App.tsx and the per-item `roles` in src/components/layout/
 *  navConfig.ts - but those client guards are UX only (a hidden button
 *  is not access control); THESE are the real enforcement, since any
 *  authenticated caller can hit these endpoints directly regardless of
 *  what the UI shows them. Keep the two lists in sync. */
const ADMIN_ROLES = ['Admin', 'SuperAdmin'];
const LETTER_CREATE_ROLES = ['ODU']; // Register Letter is ODU-only (see App.tsx)
const BULK_UPLOAD_ROLES = ['ODU', 'Admin', 'SuperAdmin'];
const DIRECTORATE_MANAGE_ROLES = ['Admin', 'Management', 'SuperAdmin'];

// ---------------------------------------------------------------------
// Serialization - joins related collections into the nested shapes
// API_DOCUMENTATION.md's examples show.
// ---------------------------------------------------------------------
function serializeDirectorateRef(directorateId) {
  const dir = db.directorates.find((d) => d.id === String(directorateId));
  return dir ? { id: dir.id, name: dir.name, code: dir.code } : null;
}

function serializeUserRef(userId, fields = ['id', 'name']) {
  const user = db.users.find((u) => u.id === String(userId));
  if (!user) return null;
  return Object.fromEntries(fields.map((f) => [f, user[f]]));
}

function serializeCourierRef(courierId) {
  const courier = db.couriers.find((c) => c.id === String(courierId));
  return courier ? { name: courier.name, phone: courier.phone } : null;
}

/** List-view shape - lighter than the detail view (no timelines/createdBy/approvedBy),
 *  matching API_DOCUMENTATION.md's GET /letters example exactly. */
function serializeLetterSummary(letter) {
  return {
    ...letter,
    senderDirectorate: serializeDirectorateRef(letter.senderDirectorateId),
    courier: letter.courierId ? serializeCourierRef(letter.courierId) : null,
  };
}

/** Detail-view shape - GET /letters/:id's example additionally embeds
 *  createdBy, approvedBy, and the full timeline (newest first, matching
 *  the doc's example ordering). */
function serializeLetterDetail(letter) {
  return {
    ...serializeLetterSummary(letter),
    senderDirectorate: {
      ...serializeDirectorateRef(letter.senderDirectorateId),
      description: db.directorates.find((d) => d.id === letter.senderDirectorateId)?.description,
    },
    createdBy: serializeUserRef(letter.createdById, ['id', 'name', 'email']),
    approvedBy: letter.approvedById ? serializeUserRef(letter.approvedById, ['id', 'name']) : null,
    timelines: db.timelines
      .filter((t) => t.letterId === letter.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((t) => ({ ...t, user: serializeUserRef(t.userId, ['name']) ?? { name: 'System' } })),
  };
}

function serializeDirectorateDetail(dir) {
  return {
    ...dir,
    users: db.users.filter((u) => u.directorateId === dir.id).map((u) => publicUser(u)),
    letters: db.letters
      .filter((l) => l.senderDirectorateId === dir.id)
      .map((l) => ({ id: l.id, trackingId: l.trackingId, subject: l.subject, status: l.status, createdAt: l.createdAt })),
  };
}

function serializeCourierDetail(courier) {
  return {
    ...courier,
    letters: db.letters
      .filter((l) => l.courierId === courier.id)
      .map((l) => ({
        id: l.id,
        trackingId: l.trackingId,
        recipientName: l.recipientName,
        recipientAddress: l.recipientAddress,
        subject: l.subject,
        priority: l.priority,
        status: l.status,
        senderDirectorateId: l.senderDirectorateId,
        createdById: l.createdById,
        courierId: l.courierId,
        approvedById: l.approvedById,
      })),
  };
}

// ---------------------------------------------------------------------
// App
// ---------------------------------------------------------------------
const app = express();

// Restrict CORS to local dev origins instead of reflecting any origin.
// A wide-open `cors()` lets any website your browser visits call this
// API with the user's credentials; a real backend should pin this to
// its known frontend origin(s). Requests with no Origin header
// (curl/server-to-server, same-origin) are allowed through.
const ALLOWED_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGIN_PATTERN.test(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());

// ---------------------------------------------------------------------
// Brute-force throttle for POST /auth/login. In-memory and per-process
// (resets on restart), keyed by client IP + email - enough to blunt
// trivial credential stuffing against this mock. A real backend should
// use a shared store (Redis) via express-rate-limit so the limit holds
// across instances and restarts.
// ---------------------------------------------------------------------
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map(); // key -> { count, firstAt }

function loginAttemptKey(req) {
  return `${req.ip}:${String(req.body?.email || '').toLowerCase()}`;
}

function loginThrottle(req, res, next) {
  const key = loginAttemptKey(req);
  const record = loginAttempts.get(key);
  if (record && Date.now() - record.firstAt > LOGIN_WINDOW_MS) {
    loginAttempts.delete(key); // window expired - start fresh
  }
  const current = loginAttempts.get(key);
  if (current && current.count >= LOGIN_MAX_ATTEMPTS) {
    const retryMinutes = Math.ceil((LOGIN_WINDOW_MS - (Date.now() - current.firstAt)) / 60000);
    return res.status(429).json({ message: `Too many login attempts. Try again in ${retryMinutes} minute(s).` });
  }
  next();
}

function recordLoginFailure(req) {
  const key = loginAttemptKey(req);
  const record = loginAttempts.get(key);
  if (record) record.count += 1;
  else loginAttempts.set(key, { count: 1, firstAt: Date.now() });
}

function clearLoginFailures(req) {
  loginAttempts.delete(loginAttemptKey(req));
}

const router = express.Router();
app.use('/api/v1', router);

// ---- Authentication --------------------------------------------------

router.post('/auth/signup', (req, res) => {
  // `role` is intentionally NOT destructured from the body: self-service
  // signup is unauthenticated, so honouring a client-supplied role would
  // let anyone mint a SuperAdmin/Admin account just by POSTing
  // { role: 'SuperAdmin' }. New accounts are always the lowest-privilege
  // role (ODU); elevating a role is a SuperAdmin-only action through the
  // role-gated /users routes below.
  const { name, email, password, directorateId } = req.body ?? {};
  if (!name || !email || !password) {
    return res.status(500).json({ message: 'Internal Server Error', error: 'name, email, and password are required' });
  }
  if (db.users.some((u) => u.email === email)) {
    return res.status(500).json({ message: 'Internal Server Error', error: 'Email already in use' });
  }

  const user = {
    id: nextId('users'),
    name,
    email,
    password,
    role: 'ODU',
    directorateId: directorateId ? String(directorateId) : null,
  };
  db.users.push(user);
  saveDb();

  res.status(201).json({
    message: 'User Created',
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.post('/auth/login', loginThrottle, (req, res) => {
  const { email, password } = req.body ?? {};
  const user = db.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    recordLoginFailure(req);
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  if (user.disabled) {
    // A disabled account is a valid credential match, so don't count it
    // against the brute-force limit - but also don't clear prior
    // failures; it simply isn't a successful auth.
    return res.status(403).json({ message: 'This account has been disabled. Contact an administrator.' });
  }

  clearLoginFailures(req); // successful auth - reset the counter
  const token = issueToken(user.id);
  const directorate = user.directorateId ? db.directorates.find((d) => d.id === user.directorateId) : null;

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    directorate: directorate ?? null,
    access_token: token,
    // Not in API_DOCUMENTATION.md - see types/api.ts's LoginResponse comment.
    mustResetPassword: !!user.mustResetPassword,
  });
});

router.get('/auth/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.currentUser.id,
      name: req.currentUser.name,
      email: req.currentUser.email,
      role: req.currentUser.role,
      directorateId: req.currentUser.directorateId,
      mustResetPassword: !!req.currentUser.mustResetPassword,
    },
  });
});

/** Not in API_DOCUMENTATION.md - see types/api.ts's ChangePasswordRequest
 *  comment. No current-password field: the bearer token already proves
 *  the caller authenticated with whatever password is on file (in
 *  practice, the temporary one a SuperAdmin set via reset-password
 *  below), mirroring the PHP app's pages/auth/force-reset.php. */
router.post('/auth/change-password', requireAuth, (req, res) => {
  const { newPassword } = req.body ?? {};
  if (!PASSWORD_POLICY_PATTERN.test(newPassword || '')) {
    return res.status(400).json({ message: PASSWORD_POLICY_MESSAGE });
  }

  req.currentUser.password = newPassword;
  req.currentUser.mustResetPassword = false;
  saveDb();

  res.json({ message: 'Password updated successfully.' });
});

// ---- Users (SuperAdmin only - see the file header comment; not in
// API_DOCUMENTATION.md) -------------------------------------------------

router.get('/users', requireAuth, requireRole('SuperAdmin'), (_req, res) => {
  res.json({ users: db.users.map(publicUser) });
});

router.post('/users', requireAuth, requireRole('SuperAdmin'), (req, res) => {
  const { name, email, password, role, directorateId } = req.body ?? {};
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'name, email, password, and role are required' });
  }
  if (db.users.some((u) => u.email === email)) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  const user = {
    id: nextId('users'),
    name,
    email,
    password,
    role,
    directorateId: directorateId ? String(directorateId) : null,
  };
  db.users.push(user);
  saveDb();

  res.status(201).json({
    message: 'User Created',
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.patch('/users/:id', requireAuth, requireRole('SuperAdmin'), (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { name, email, role, directorateId } = req.body ?? {};
  if (email !== undefined && email !== user.email && db.users.some((u) => u.email === email)) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  if (directorateId !== undefined) user.directorateId = directorateId ? String(directorateId) : null;
  saveDb();

  res.json({ message: 'User updated', user: publicUser(user) });
});

router.patch('/users/:id/disable', requireAuth, requireRole('SuperAdmin'), (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const disabled = !!req.body?.disabled;
  if (disabled && user.id === req.currentUser.id) {
    return res.status(400).json({ message: 'You cannot disable your own account.' });
  }

  user.disabled = disabled;
  saveDb();

  res.json({ message: disabled ? 'User disabled' : 'User enabled', user: publicUser(user) });
});

/** Generates a fresh one-time password (see generateTemporaryPassword)
 *  and flags the account so requireAuth/ProtectedRoute force a change
 *  before anything else works - see PASSWORD_POLICY_PATTERN up top and
 *  POST /auth/change-password below. The generated password is returned
 *  in the response so the SuperAdmin can relay it to the user; a real
 *  backend should instead deliver it out-of-band (email/SMS) and never
 *  echo it back. */
router.post('/users/:id/reset-password', requireAuth, requireRole('SuperAdmin'), (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const temporaryPassword = generateTemporaryPassword();
  user.password = temporaryPassword;
  user.mustResetPassword = true;
  saveDb();

  res.json({
    message: `Temporary password generated - ${user.name} must set a new password on next login.`,
    temporaryPassword,
  });
});

// ---- Directorates -----------------------------------------------------

router.get('/directorates', requireAuth, (_req, res) => {
  res.json({ directorates: db.directorates });
});

router.get('/directorates/:id', requireAuth, (req, res) => {
  const dir = db.directorates.find((d) => d.id === req.params.id);
  if (!dir) return res.status(404).json({ message: 'Directorate not found' });
  res.json({ directorate: serializeDirectorateDetail(dir) });
});

router.post('/directorates', requireAuth, requireRole(...DIRECTORATE_MANAGE_ROLES), (req, res) => {
  const { name, code, description } = req.body ?? {};
  if (!name || !code) {
    return res.status(400).json({ message: 'name and code are required' });
  }
  if (db.directorates.some((d) => d.code === code)) {
    return res.status(400).json({ message: 'Directorate code already exists' });
  }

  const directorate = {
    id: nextId('directorates'),
    name,
    code,
    description: description ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
  db.directorates.push(directorate);
  saveDb();

  res.status(201).json({
    message: 'Directorate Created',
    directorate: { id: directorate.id, name: directorate.name, code: directorate.code },
  });
});

router.patch('/directorates/:id', requireAuth, requireRole(...DIRECTORATE_MANAGE_ROLES), (req, res) => {
  const dir = db.directorates.find((d) => d.id === req.params.id);
  if (!dir) return res.status(404).json({ message: 'Directorate not found' });

  const { name, description } = req.body ?? {};
  if (name !== undefined) dir.name = name;
  if (description !== undefined) dir.description = description;
  dir.updatedAt = new Date().toISOString();
  saveDb();

  res.json({ message: 'Directorate updated', directorate: dir });
});

router.delete('/directorates/:id', requireAuth, requireRole(...DIRECTORATE_MANAGE_ROLES), (req, res) => {
  const dir = db.directorates.find((d) => d.id === req.params.id);
  if (!dir) return res.status(404).json({ message: 'Directorate not found' });

  const hasUsers = db.users.some((u) => u.directorateId === dir.id);
  const hasLetters = db.letters.some((l) => l.senderDirectorateId === dir.id);
  if (hasUsers || hasLetters) {
    return res.status(400).json({ message: 'Cannot delete directorate with associated users or letters' });
  }

  db.directorates = db.directorates.filter((d) => d.id !== dir.id);
  saveDb();
  res.json({ message: 'Directorate deleted' });
});

// ---- Couriers -----------------------------------------------------

router.get('/couriers', requireAuth, (_req, res) => {
  res.json({ couriers: db.couriers });
});

router.get('/couriers/:id', requireAuth, (req, res) => {
  const courier = db.couriers.find((c) => c.id === req.params.id);
  if (!courier) return res.status(404).json({ message: 'Courier not found' });
  res.json({ courier: serializeCourierDetail(courier) });
});

router.post('/couriers', requireAuth, requireRole(...ADMIN_ROLES), (req, res) => {
  const { name, email, phone } = req.body ?? {};
  if (!name) return res.status(400).json({ message: 'name is required' });

  const courier = {
    id: nextId('couriers'),
    name,
    email: email ?? null,
    phone: phone ?? null,
    availability: true,
    activeTasks: 0,
    performance: 100,
    completedDeliveries: 0,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
  db.couriers.push(courier);
  saveDb();

  res.status(201).json({
    message: 'Courier Created',
    courier: { id: courier.id, name: courier.name, email: courier.email, phone: courier.phone },
  });
});

router.patch('/couriers/:id/availability', requireAuth, requireRole(...ADMIN_ROLES), (req, res) => {
  const courier = db.couriers.find((c) => c.id === req.params.id);
  if (!courier) return res.status(404).json({ message: 'Courier not found' });

  courier.availability = !!req.body?.availability;
  courier.updatedAt = new Date().toISOString();
  saveDb();

  res.json({
    message: 'Courier availability updated',
    courier: { id: courier.id, name: courier.name, availability: courier.availability },
  });
});

router.patch('/couriers/:id/performance', requireAuth, requireRole(...ADMIN_ROLES), (req, res) => {
  const courier = db.couriers.find((c) => c.id === req.params.id);
  if (!courier) return res.status(404).json({ message: 'Courier not found' });

  if (req.body?.delivered) {
    courier.completedDeliveries += 1;
  }
  courier.activeTasks = Math.max(0, courier.activeTasks - 1);
  courier.updatedAt = new Date().toISOString();
  saveDb();

  res.json({
    message: 'Courier stats updated',
    courier: {
      id: courier.id,
      name: courier.name,
      completedDeliveries: courier.completedDeliveries,
      activeTasks: courier.activeTasks,
    },
  });
});

// ---- Letters -----------------------------------------------------

router.get('/letters', requireAuth, (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const { status, priority, directorate_id: directorateId } = req.query;

  let filtered = db.letters;
  if (status) filtered = filtered.filter((l) => l.status === status);
  if (priority) filtered = filtered.filter((l) => l.priority === priority);
  if (directorateId) filtered = filtered.filter((l) => l.senderDirectorateId === String(directorateId));
  // Directorate-restricted roles (see utils/permissions.ts on the
  // frontend) only ever get their own directorate's letters, no matter
  // what `directorate_id` the client sends - the query param above is
  // just an extra filter on top of this, never a way around it.
  if (isDirectorateRestricted(req.currentUser.role)) {
    filtered = filtered.filter((l) => l.senderDirectorateId === String(req.currentUser.directorateId));
  }

  filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = filtered.length;
  const start = (page - 1) * limit;
  const pageRows = filtered.slice(start, start + limit);

  res.json({
    letters: pageRows.map(serializeLetterSummary),
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
});

router.get('/letters/:id', requireAuth, (req, res) => {
  const letter = db.letters.find((l) => l.id === req.params.id);
  if (!letter) return res.status(404).json({ message: 'Letter not found' });
  // Same directorate restriction as GET /letters above, applied here so
  // it can't be bypassed by requesting a single letter by id directly.
  if (
    isDirectorateRestricted(req.currentUser.role) &&
    letter.senderDirectorateId !== String(req.currentUser.directorateId)
  ) {
    return res.status(404).json({ message: 'Letter not found' });
  }
  res.json({ letter: serializeLetterDetail(letter) });
});

function buildLetterFromPayload(payload, createdById) {
  return {
    id: nextId('letters'),
    trackingId: nextTrackingId(),
    senderDirectorateId: String(payload.sender_directorate_id),
    createdById: String(createdById),
    recipientName: payload.recipient_name,
    recipientAddress: payload.recipient_address,
    subject: payload.subject,
    priority: payload.priority || 'Medium',
    status: 'Pending_Approval',
    liabilityValue: Number(payload.liability_value || 0).toFixed(2),
    courierId: null,
    assignedAt: null,
    approvedById: null,
    approvedAt: null,
    deliveredAt: null,
    attachmentPath: null,
    notes: payload.notes ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
}

router.post('/letters/single', requireAuth, requireRole(...LETTER_CREATE_ROLES), (req, res) => {
  const payload = req.body ?? {};
  if (!payload.sender_directorate_id || !payload.recipient_name || !payload.recipient_address || !payload.subject) {
    return res.status(400).json({ message: 'sender_directorate_id, recipient_name, recipient_address, and subject are required' });
  }

  const letter = buildLetterFromPayload(payload, req.currentUser.id);
  db.letters.push(letter);
  addTimeline(letter.id, 'Pending_Approval', 'Letter registered in the system', req.currentUser.id);
  saveDb();

  res.status(201).json({
    message: 'Letter Created',
    letter: { id: letter.id, trackingId: letter.trackingId, subject: letter.subject, priority: letter.priority, status: letter.status },
  });
});

router.post('/letters/bulk', requireAuth, requireRole(...BULK_UPLOAD_ROLES), (req, res) => {
  const rows = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ message: 'Invalid input: Expected a non-empty array of letters.' });
  }

  rows.forEach((payload) => {
    const letter = buildLetterFromPayload(payload, req.currentUser.id);
    db.letters.push(letter);
    addTimeline(letter.id, 'Pending_Approval', 'Letter registered in the system', req.currentUser.id);
  });
  saveDb();

  res.status(201).json({ message: 'Letters Created successfully', count: rows.length });
});

router.patch('/letters/:id/approve', requireAuth, requireRole(...ADMIN_ROLES), (req, res) => {
  const letter = db.letters.find((l) => l.id === req.params.id);
  if (!letter) return res.status(404).json({ message: 'Letter not found' });

  letter.status = 'Approved';
  letter.approvedById = req.currentUser.id;
  letter.approvedAt = new Date().toISOString();
  addTimeline(letter.id, 'Approved', `Letter approved by ${req.currentUser.name}`, req.currentUser.id);
  saveDb();

  res.json({ message: 'Letter Approved', letter: { id: letter.id, trackingId: letter.trackingId, status: letter.status } });
});

router.patch('/letters/:id/reject', requireAuth, requireRole(...ADMIN_ROLES), (req, res) => {
  const letter = db.letters.find((l) => l.id === req.params.id);
  if (!letter) return res.status(404).json({ message: 'Letter not found' });

  // See the file header comment: "Rejected" fills a gap in the doc's
  // status enum (the reject endpoint is documented, its resulting
  // status value isn't).
  letter.status = 'Rejected';
  addTimeline(letter.id, 'Rejected', req.body?.reason || 'Letter rejected', req.currentUser.id);
  saveDb();

  res.json({ message: 'Letter Rejected' });
});

// Business rule (not in API_DOCUMENTATION.md, which describes auto-
// allocate as pure load-balancing): High-priority or high-liability
// letters always route to DHL - see requiresDhl below. Mirrored on the
// frontend in src/utils/courierRouting.ts so the UI can show a "DHL
// Priority" hint before the request is even sent.
const DHL_LIABILITY_THRESHOLD = 25_000_000;

function requiresDhl(letter) {
  return letter.priority === 'High' || Number(letter.liabilityValue) > DHL_LIABILITY_THRESHOLD;
}

router.post('/letters/auto-allocate', requireAuth, requireRole(...ADMIN_ROLES), (req, res) => {
  const { letterIds = [] } = req.body ?? {};
  const candidates = db.letters.filter((l) => letterIds.includes(l.id) && l.status === 'Approved');

  if (candidates.length === 0) {
    return res.status(400).json({ message: 'No approved letters found among the provided IDs.', skipped: letterIds.length });
  }

  // Load-balancing (fewest active tasks) is still the fallback for
  // everything else, but a High-priority or >25M-liability letter
  // skips that and goes straight to DHL whenever DHL is available.
  const availableCouriers = db.couriers.filter((c) => c.availability);
  const dhlCourier = db.couriers.find((c) => c.name === 'DHL');
  candidates.forEach((letter) => {
    if (availableCouriers.length === 0) return;
    const courier =
      requiresDhl(letter) && dhlCourier?.availability
        ? dhlCourier
        : availableCouriers.reduce((lowest, c) => (c.activeTasks < lowest.activeTasks ? c : lowest));
    letter.status = 'Assigned';
    letter.courierId = courier.id;
    letter.assignedAt = new Date().toISOString();
    courier.activeTasks += 1;
    addTimeline(letter.id, 'Assigned', `Assigned to courier ${courier.name}`, req.currentUser.id);
  });
  saveDb();

  res.status(202).json({
    message: 'Allocation engine started in the background',
    processing: candidates.length,
    skipped: letterIds.length - candidates.length,
  });
});

router.post('/letters/:id/allocate/:courierId', requireAuth, requireRole(...ADMIN_ROLES), (req, res) => {
  const letter = db.letters.find((l) => l.id === req.params.id);
  if (!letter) return res.status(404).json({ message: 'Letter not found. Check the letter ID.' });
  const courier = db.couriers.find((c) => c.id === req.params.courierId);
  if (!courier) return res.status(404).json({ message: 'Courier not found.' });

  letter.status = 'Assigned';
  letter.courierId = courier.id;
  letter.assignedAt = new Date().toISOString();
  courier.activeTasks += 1;
  addTimeline(letter.id, 'Assigned', `Assigned to courier ${courier.name}`, req.currentUser.id);
  saveDb();

  res.json({
    message: 'Letter successfully allocated to courier.',
    data: { ...letter, courier: { name: courier.name, phone: courier.phone } },
  });
});

router.patch('/letters/:id/in-transit', requireAuth, requireRole(...ADMIN_ROLES), (req, res) => {
  const letter = db.letters.find((l) => l.id === req.params.id);
  if (!letter) return res.status(404).json({ message: 'Letter not found' });

  letter.status = 'In_Transit';
  addTimeline(letter.id, 'In_Transit', 'Courier picked up the letter', req.currentUser.id);
  saveDb();

  res.json({ message: 'Letter marked as in transit', letter: { id: letter.id, trackingId: letter.trackingId, status: letter.status } });
});

router.patch('/letters/:id/delivered', requireAuth, requireRole(...ADMIN_ROLES), (req, res) => {
  const letter = db.letters.find((l) => l.id === req.params.id);
  if (!letter) return res.status(404).json({ message: 'Letter not found' });

  letter.status = 'Delivered';
  letter.deliveredAt = new Date().toISOString();
  addTimeline(letter.id, 'Delivered', 'Successfully delivered to recipient', req.currentUser.id);

  if (letter.courierId) {
    const courier = db.couriers.find((c) => c.id === letter.courierId);
    if (courier) {
      courier.completedDeliveries += 1;
      courier.activeTasks = Math.max(0, courier.activeTasks - 1);
    }
  }
  saveDb();

  res.json({
    message: 'Letter marked as delivered',
    letter: { id: letter.id, trackingId: letter.trackingId, status: letter.status, deliveredAt: letter.deliveredAt },
  });
});

router.patch('/letters/:id/undelivered', requireAuth, requireRole(...ADMIN_ROLES), (req, res) => {
  const letter = db.letters.find((l) => l.id === req.params.id);
  if (!letter) return res.status(404).json({ message: 'Letter not found' });

  letter.status = 'Undelivered';
  addTimeline(letter.id, 'Undelivered', req.body?.reason || 'Delivery failed', req.currentUser.id);

  if (letter.courierId) {
    const courier = db.couriers.find((c) => c.id === letter.courierId);
    if (courier) courier.activeTasks = Math.max(0, courier.activeTasks - 1);
  }
  saveDb();

  res.json({ message: 'Letter marked as undelivered', letter: { id: letter.id, trackingId: letter.trackingId, status: letter.status } });
});

// ---- Fallbacks -----------------------------------------------------

app.use((req, res) => {
  res.status(404).json({ message: `No mock route for ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Mock CCMS API listening on http://localhost:${PORT}/api/v1`);
  console.log('Demo logins (see mock-server/db.json): superadmin@lirs.net / admin@lirs.net / management@lirs.net / accounts@lirs.net / it@lirs.net / legal@lirs.net - password123');
});
