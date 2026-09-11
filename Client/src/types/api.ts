/**
 * Data shapes for the DLTS API, transcribed directly from
 * API_DOCUMENTATION.md. These types are the contract between this app
 * and whatever server implements that doc (the bundled json-server mock
 * in /mock-server, or a real Node backend later) - if the backend
 * response shape ever differs from what's declared here, TypeScript
 * will only catch it where a field is actually used, so when wiring a
 * new page, cross-check the field names against the doc rather than
 * assuming this file is exhaustive.
 *
 * Deliberately follows the API doc as written, including places where
 * it's simpler than the original PHP app (three roles instead of four,
 * Low/Medium/High priority instead of Normal/Urgent, no DHL routing or
 * 72-hour countdown, no notifications endpoints at all) - see the
 * "Known gaps vs the PHP app" section of README.md for the full list.
 *
 * The /users endpoints (see userService.ts) are the one deliberate
 * exception to "follow the doc exactly" - API_DOCUMENTATION.md doesn't
 * define any user-management endpoints at all, but the product asked
 * for a way to create user accounts. That capability lives on
 * `Management` (the org-wide oversight role) rather than a separate
 * `SuperAdmin` role - the two were merged since every account that
 * needs one needs the other.
 */

// ---------------------------------------------------------------------
// Auth / Users
// ---------------------------------------------------------------------

/** Four roles, matching the backend's `UserRole` enum exactly. The PHP
 *  app's separate "Administrative Unit" role still has no equivalent
 *  here; treat it as folded into Admin if you're mapping old data in. */
export type UserRole = 'ODU' | 'Admin' | 'Management' | 'Courier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  directorateId?: string;
  /** Management-managed account state - neither field is in
   *  API_DOCUMENTATION.md (see the file header comment above).
   *  `disabled` blocks login and every subsequent authenticated request.
   *  `mustResetPassword` is set whenever a Management user resets
   *  someone's password to the shared default - see
   *  utils/passwordPolicy.ts and ForcePasswordResetPage. */
  disabled?: boolean;
  mustResetPassword?: boolean;
}

/** Shape returned by GET /auth/me - note it's `directorateId`, not a
 *  nested `directorate` object (that richer shape only comes back from
 *  POST /auth/login). */
export interface AuthMeResponse {
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /auth/login response - flatter than User (no wrapper object)
 *  and includes the nested directorate + the access_token. */
export interface LoginResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  directorate: Directorate | null;
  access_token: string;
  /** Not in API_DOCUMENTATION.md - see User's comment on this field.
   *  Optional so a real backend without this concept just omits it. */
  mustResetPassword?: boolean;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  directorateId?: number;
}

export interface SignupResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

/** Payload for POST /users - the Management-only account-creation
 *  endpoint (see the file header comment on UserRole for why this
 *  isn't in API_DOCUMENTATION.md). Deliberately shaped like
 *  SignupRequest above since it does the same thing authenticated and
 *  role-gated, rather than open. */
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  directorateId?: number;
}

export interface CreateUserResponse {
  message: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'role'>;
}

/** Payload for PATCH /users/:id - Management editing an existing
 *  account's core fields. All optional so a caller only sends what
 *  changed, matching UpdateDirectorateRequest's shape below. */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  directorateId?: number | null;
}

export interface UpdateUserResponse {
  message: string;
  user: User;
}

/** Payload for PATCH /users/:id/disable. */
export interface SetUserDisabledRequest {
  disabled: boolean;
}

export interface SetUserDisabledResponse {
  message: string;
  user: User;
}

/** POST /users/:id/reset-password takes no body - it generates a fresh
 *  one-time password, flags the account for a forced reset, and returns
 *  the generated password so the Management user can relay it to the user
 *  (see mock-server/server.cjs's generateTemporaryPassword). A real
 *  backend would deliver it out-of-band rather than in the response. */
export interface ResetUserPasswordResponse {
  message: string;
  temporaryPassword: string;
}

/** POST /auth/change-password - used by ForcePasswordResetPage. No
 *  current-password field, mirroring the PHP app's pages/auth/force-
 *  reset.php: the caller is already authenticated via the bearer token
 *  they just logged in with (using the temporary password), so proving
 *  the temp password a second time here would be redundant. `newPassword`
 *  must satisfy utils/passwordPolicy.ts's isPasswordPolicyCompliant(). */
export interface ChangePasswordRequest {
  newPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

// ---------------------------------------------------------------------
// Directorates
// ---------------------------------------------------------------------

export interface Directorate {
  id: string;
  name: string;
  code: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

/** GET /directorates/:id - the list endpoint only returns the bare
 *  Directorate fields; the detail endpoint additionally embeds these. */
export interface DirectorateDetail extends Directorate {
  users: Pick<User, 'id' | 'name' | 'email' | 'role'>[];
  letters: Array<
    Pick<Letter, 'id' | 'trackingId' | 'subject' | 'status' | 'createdAt'>
  >;
}

export interface CreateDirectorateRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateDirectorateRequest {
  name?: string;
  description?: string;
}

// ---------------------------------------------------------------------
// Letters
// ---------------------------------------------------------------------

/** Underscored per the API doc (Pending_Approval, In_Transit) - this is
 *  intentionally NOT the PHP app's "Pending Approval" / "In-Transit"
 *  spacing. Format for display with `formatStatusLabel()` in
 *  utils/format.ts rather than rendering the raw value.
 *
 *  There is no distinct "Rejected" status - PATCH /letters/:id/reject
 *  moves a letter straight to `Undelivered` (see reject_letter in
 *  Server/src/controllers/letter.controller.js). The letter's timeline
 *  entry still records the human-readable reason via its `description`
 *  field, so the rejection reason isn't lost, just folded into the same
 *  terminal "didn't reach the recipient" status as a failed delivery
 *  attempt. */
export type LetterStatus =
  | 'Pending_Approval'
  | 'Approved'
  | 'Assigned'
  | 'In_Transit'
  | 'Delivered'
  | 'Undelivered';

/** Three levels per the API doc - the PHP app's Normal/Urgent + DHL
 *  auto-routing rules have no equivalent here. */
export type LetterPriority = 'Low' | 'Medium' | 'High';

/** The delivery areas a letter can be addressed to, matching the
 *  backend's `LGA` Prisma enum exactly (Server/prisma/schema.prisma).
 *  Screaming-snake on the wire; render with `formatLga()` in
 *  utils/format.ts rather than showing the raw value.
 *
 *  `NOT_LAGOS` is the catch-all for anywhere outside the state, not a
 *  real LGA - it exists so out-of-state letters are still routable. */
export type LGA =
  | 'IKEJA'
  | 'VICTORIA_ISLAND'
  | 'SURULERE'
  | 'IKOYI'
  | 'OJODU'
  | 'ALIMOSHO'
  | 'OSHODI'
  | 'LAGOS_ISLAND'
  | 'LAGOS_MAINLAND'
  | 'EPE'
  | 'BADAGRY'
  | 'IKORODU'
  | 'NOT_LAGOS'
  | 'AGEGE'
  | 'AJEROMI_IFELODUN'
  | 'AMUWO_ODOFIN'
  | 'APAPA'
  | 'EGBEDA'
  | 'ETI_OSA'
  | 'IFAKO_IJAIYE'
  | 'MUSHIN'
  | 'YABA';

export interface LetterTimelineEntry {
  id: string;
  letterId: string;
  status: string;
  description: string;
  userId: string;
  createdAt: string;
  user: {
    name: string;
  };
}

export interface Letter {
  id: string;
  trackingId: string;
  senderDirectorateId: string;
  createdById: string;
  recipientName: string;
  recipientAddress: string;
  /** The delivery LGA - what couriers actually route by, and the field
   *  courier allocation matches against a courier's `baseLga`. Returned
   *  by both GET /letters and GET /letters/:id. */
  lgaAddress: LGA;
  subject: string;
  priority: LetterPriority;
  status: LetterStatus;
  /** String, not number, per the API's own examples (e.g. "8229.00") -
   *  parse with Number(...) before doing arithmetic; format for
   *  display with formatCurrency() in utils/format.ts. */
  liabilityValue: string;
  courierId: string | null;
  assignedAt: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  deliveredAt: string | null;
  attachmentPath: string | null;
  /** Server-relative path to the proof-of-delivery photo a courier
   *  uploaded when marking the letter delivered (e.g.
   *  "uploads/pod/12/pod-1699.jpg"). Null until then. Served by the
   *  backend's `/uploads` static mount, which sits at the API origin,
   *  NOT under /api/v1 - build a viewable URL with `podImageUrl()` in
   *  services/letterService.ts rather than joining it onto API_BASE_URL. */
  podImagePath: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  senderDirectorate?: Pick<Directorate, 'id' | 'name' | 'code'> & {
    description?: string;
  };
  createdBy?: Pick<User, 'id' | 'name' | 'email'>;
  approvedBy?: Pick<User, 'id' | 'name'>;
  courier?: Pick<Courier, 'name' | 'phone'> | null;
  timelines?: LetterTimelineEntry[];
}

export interface LetterListResponse {
  letters: Letter[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface LetterListParams {
  page?: number;
  limit?: number;
  status?: LetterStatus;
  priority?: LetterPriority;
  directorate_id?: number;
}

export interface CreateLetterRequest {
  sender_directorate_id: number;
  recipient_name: string;
  recipient_address: string;
  subject: string;
  priority?: LetterPriority;
  liability_value?: number;
  notes?: string;
}

export interface BulkCreateLetterRequest {
  sender_directorate_id: number;
  recipient_name: string;
  recipient_address: string;
  subject: string;
  priority?: LetterPriority;
  liability_value?: number;
  notes?: string;
}

export interface RejectLetterRequest {
  reason?: string;
}

export interface UndeliveredLetterRequest {
  reason?: string;
}

export interface AutoAllocateRequest {
  letterIds: string[];
}

export interface AutoAllocateResponse {
  message: string;
  processing: number;
  skipped: number;
}

// ---------------------------------------------------------------------
// Couriers
// ---------------------------------------------------------------------

export interface Courier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  availability: boolean;
  activeTasks: number;
  performance: number;
  completedDeliveries: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CourierDetail extends Courier {
  letters: Array<
    Pick<
      Letter,
      | 'id'
      | 'trackingId'
      | 'recipientName'
      | 'recipientAddress'
      | 'subject'
      | 'priority'
      | 'status'
      | 'senderDirectorateId'
      | 'createdById'
      | 'courierId'
      | 'approvedById'
    >
  >;
}

export interface CreateCourierRequest {
  name: string;
  email?: string;
  phone?: string;
}

export interface UpdateCourierAvailabilityRequest {
  availability: boolean;
}

export interface UpdateCourierPerformanceRequest {
  delivered: boolean;
}

// ---------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------

export interface ApiErrorResponse {
  message: string;
  error?: string;
}

/** Described in the doc's "Data Types Reference" but with no backing
 *  endpoints anywhere in the doc - there is nowhere to fetch, create,
 *  or mark these read. The Notifications page renders from local mock
 *  data only until a real endpoint exists; see README.md. */
export type NotificationType = 'success' | 'info' | 'warning' | 'error';
