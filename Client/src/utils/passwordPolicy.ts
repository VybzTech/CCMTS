/**
 * The password policy enforced by POST /auth/change-password after a
 * Management user resets an account (which now issues a unique one-time
 * password per reset - see mock-server/server.cjs's
 * generateTemporaryPassword, not a shared constant). The pattern below
 * is kept in sync BY HAND with the identical one in
 * mock-server/server.cjs (a TS module and a CommonJS mock server can't
 * share code across that boundary here). If you change the rule in one
 * place, change it in the other.
 */
export const PASSWORD_POLICY_DESCRIPTION =
  'At least 12 characters, alphanumeric only, with at least one uppercase letter.';

const PASSWORD_POLICY_PATTERN = /^(?=.*[A-Z])(?=.*[a-zA-Z])(?=.*\d)[A-Za-z0-9]{12,}$/;

export function isPasswordPolicyCompliant(password: string): boolean {
  return PASSWORD_POLICY_PATTERN.test(password);
}
