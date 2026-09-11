import type { UserRole } from '../types/api';

/** Roles whose letter access is scoped to their own directorate: they
 *  only get letters where `senderDirectorateId` matches their own
 *  `directorateId` - enforced both here (client-side, for the query
 *  param + detail-page guard) and server-side in
 *  mock-server/server.cjs's GET /letters(/:id), since a client-supplied
 *  `directorate_id` can't be trusted on its own.
 *
 *  Deliberately an allow-list of the *restricted* roles rather than the
 *  inverse. `Courier` must NOT be listed here: a courier is scoped by
 *  assignment (`courierId`), not by directorate, and courier accounts
 *  carry no `directorateId` at all - so treating them as directorate-
 *  restricted made every letter they were assigned fail the detail
 *  page's `senderDirectorateId === user.directorateId` check and render
 *  as "Letter not found". Adding a role here is a decision about
 *  directorate scoping specifically, not about privilege level. */
const DIRECTORATE_RESTRICTED_ROLES: UserRole[] = ['ODU'];

export function isDirectorateRestricted(role: UserRole): boolean {
  return DIRECTORATE_RESTRICTED_ROLES.includes(role);
}
