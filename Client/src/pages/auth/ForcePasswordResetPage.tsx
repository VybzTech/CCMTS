/**
 * Shown when a Management user has reset this account's password to the
 * shared default (see userService.ts's resetUserPassword) - pixel-
 * matched to the PHP app's pages/auth/force-reset.php (same
 * .login-panel/.login-card markup as LoginPage, just the hero panel
 * dropped, exactly like the PHP original). ProtectedRoute redirects
 * here for any authenticated request while user.mustResetPassword is
 * true (see routes/ProtectedRoute.tsx) and exempts this one route from
 * that same redirect so it doesn't loop.
 *
 * One deliberate difference from the PHP page: its policy required 12+
 * chars, a letter, an uppercase letter, a number, AND a special
 * character (see app.css's password-requirements comment referencing
 * the old public/js/app.js). This page's policy is a fresh, explicit
 * product decision - 12+ chars, alphanumeric (letters and numbers only,
 * no special characters), at least one uppercase - kept in
 * utils/passwordPolicy.ts as the one source of truth for the checklist
 * below and for what the mock server actually enforces.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLogout } from '../../hooks/useLogout';
import { useToast } from '../../components/ui/Toast/useToast';
import { changePassword } from '../../services/authService';
import { extractErrorMessage } from '../../services/apiClient';
import { PASSWORD_POLICY_DESCRIPTION, isPasswordPolicyCompliant } from '../../utils/passwordPolicy';

interface PolicyRule {
  key: string;
  label: string;
  test: (pw: string) => boolean;
}

const RULES: PolicyRule[] = [
  { key: 'length', label: 'At least 12 characters', test: (pw) => pw.length >= 12 },
  {
    key: 'alphanumeric',
    label: 'Alphanumeric (letters and numbers only, no special characters)',
    test: (pw) => /^[A-Za-z0-9]+$/.test(pw) && /[a-zA-Z]/.test(pw) && /\d/.test(pw),
  },
  { key: 'uppercase', label: 'At least one uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
];

const STRENGTH_LABELS = [
  { text: '', className: '' },
  { text: 'Weak', className: 'danger' },
  { text: 'Fair', className: 'warning' },
  { text: 'Strong', className: 'success' },
];

export function ForcePasswordResetPage() {
  const { clearMustResetPassword } = useAuth();
  const confirmLogout = useLogout();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const metCount = RULES.filter((rule) => rule.test(password)).length;
  const strength = STRENGTH_LABELS[password ? metCount : 0];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isPasswordPolicyCompliant(password)) {
      setError(PASSWORD_POLICY_DESCRIPTION);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({ newPassword: password });
      clearMustResetPassword();
      showToast('success', 'Password changed successfully. Welcome!');
      navigate('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // Same confirm dialog as the top-bar Logout (see hooks/useLogout) -
  // the navigate is still needed here because this page sits outside
  // the normal shell and doesn't redirect on its own.
  async function handleLogout() {
    if (await confirmLogout()) navigate('/login');
  }

  return (
    <main className="login-shell">
      <section className="login-panel" style={{ minHeight: '100vh' }}>
        <div className="login-panel-overlay" aria-hidden="true" />

        <div className="login-card-wrap">
          <div className="login-card">
            <div className="login-card-head">
              <div className="login-card-icon">
                <i className="fas fa-key" />
              </div>
              <h2>Password Reset Required</h2>
              <p>Your password has been reset by an administrator. Please choose a new password to continue.</p>
            </div>

            {error && (
              <div role="alert" className="alert alert-danger mt-md mb-0">
                <i className="fas fa-circle-exclamation" />
                <span>{error}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group has-icon">
                <label htmlFor="password">New Password</label>
                <i className="fas fa-lock field-icon" aria-hidden="true" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 12 characters"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  autoFocus
                />

                <ul className="password-requirements">
                  {RULES.map((rule) => {
                    const met = rule.test(password);
                    return (
                      <li key={rule.key} className={met ? 'met' : undefined}>
                        <i className={`fas ${met ? 'fa-check-circle' : 'fa-circle'}`} />
                        {rule.label}
                      </li>
                    );
                  })}
                </ul>
                <div className="password-strength-bar mt-md">
                  <div
                    className={`password-strength-fill${password ? ` ${strength.className}` : ''}`}
                    style={{ width: password ? `${(metCount / RULES.length) * 100}%` : '0%' }}
                  />
                </div>
                {password && <span className={`password-strength-label ${strength.className}`}>{strength.text}</span>}
              </div>

              <div className="form-group has-icon">
                <label htmlFor="password_confirmation">Confirm New Password</label>
                <i className="fas fa-lock field-icon" aria-hidden="true" />
                <input
                  type="password"
                  id="password_confirmation"
                  name="password_confirmation"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your new password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                />
              </div>

              <button type="submit" className="btn-login-submit" disabled={isSubmitting}>
                <i className={`fas ${isSubmitting ? 'fa-spinner fa-spin' : 'fa-lock'}`} />
                {isSubmitting ? 'Saving…' : 'Set New Password'}
              </button>
            </form>

            <form className="mt-md" style={{ textAlign: 'center' }} onSubmit={(e) => e.preventDefault()}>
              <button type="button" className="btn-link-muted" onClick={() => void handleLogout()}>
                Not you? <span style={{ textDecoration: 'underline' }}>Logout</span>
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
