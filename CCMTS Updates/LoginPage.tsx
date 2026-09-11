/**
 * Pixel-for-pixel port of the PHP app's pages/auth/login.php as it
 * currently stands (the flat split-hero layout with the photo
 * background on the right panel - NOT the wave-curve variant that was
 * tried and then reverted during the PHP app's design pass; if anyone
 * ever wants that version back, it's in the PHP app's session history,
 * not here).
 *
 * Two things the API doc has no backend for, kept visually present
 * for parity but functionally inert:
 *  - "Forgot password?" - no such endpoint exists, so it shows a toast
 *    instead of navigating anywhere.
 *  - "Remember me" - the API doc doesn't distinguish session length by
 *    this, so the checkbox is decorative only. Don't wire it up to
 *    anything without a real backend feature to back it.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import type { Location } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/Toast/useToast';
import { extractErrorMessage } from '../../services/apiClient';

export function LoginPage() {
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already-authenticated users shouldn't see the login form again -
  // equivalent to the PHP app's guest_only() guard.
  if (user) {
    const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const mustResetPassword = await login(email, password);
      navigate(mustResetPassword ? '/force-password-reset' : '/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleForgotPassword(event: React.MouseEvent) {
    event.preventDefault();
    showToast('info', 'Password reset isn’t available yet - contact your administrator.');
  }

  return (
    <main className="login-shell">
      {/* ============ Left Panel: Branding ============ */}
      <section className="login-hero" aria-label="About CCMS">
        <div className="login-hero-decor" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className="login-hero-skyline" aria-hidden="true">
          {SKYLINE_BARS.map(({ height, width }, index) => (
            <span key={index} style={{ height: `${height}%`, width: `${width}%` }} />
          ))}
        </div>

        <div className="login-hero-top">
          <div className="login-hero-brand">
            <div className="login-hero-logo">
              <img src="/images/lirs-logo.jpg" alt="LIRS logo" />
            </div>
            <span className="login-hero-org">Lagos State Internal Revenue Service</span>
          </div>

          <h1>CCMS</h1>
          <p className="login-hero-tagline">Courier &amp; Correspondence Management System</p>
          <p className="login-hero-desc">
            Streamlining courier operations and correspondence management for efficiency,
            transparency and accountability.
          </p>
        </div>

        <div className="login-hero-badges">
          <div className="login-hero-badge">
            <i className="fas fa-shield-halved" />
            <span>Secure</span>
          </div>
          <div className="login-hero-badge">
            <i className="fas fa-bolt" />
            <span>Efficient</span>
          </div>
          <div className="login-hero-badge">
            <i className="fas fa-clipboard-check" />
            <span>Accountable</span>
          </div>
        </div>
      </section>

      {/* ============ Right Panel: Login ============ */}
      <section className="login-panel" style={{ backgroundImage: "url('/images/transport.png')" }}>
        <div className="login-panel-overlay" aria-hidden="true" />

        <div className="login-card-wrap">
          <div className="login-card">
            <div className="login-card-head">
              <div className="login-card-icon">
                <i className="fas fa-envelope" />
              </div>
              <h2>Welcome Back!</h2>
            </div>

            {error && (
              <div role="alert" className="alert alert-danger mt-md mb-0">
                <i className="fas fa-circle-exclamation" />
                <span>{error}</span>
              </div>
            )}

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group has-icon">
                <label htmlFor="email">Email Address</label>
                <i className="fas fa-envelope field-icon" aria-hidden="true" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@lirs.net"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="form-group has-icon">
                <label htmlFor="password">Password</label>
                <i className="fas fa-lock field-icon" aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="field-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
                </button>
              </div>

              <div className="login-form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  Remember me
                </label>
                <a href="/forgot-password" onClick={handleForgotPassword}>
                  Forgot password?
                </a>
              </div>

              <button type="submit" className="btn-login-submit" disabled={isSubmitting}>
                <i className={`fas ${isSubmitting ? 'fa-spinner fa-spin' : 'fa-right-to-bracket'}`} />
                {isSubmitting ? 'Signing in…' : 'Sign In'}
              </button>

              <p className="login-secure-note">
                <i className="fas fa-shield-halved" />
                Secure Access
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

// Fixed pseudo-random-looking heights/widths for the decorative skyline
// silhouette - matches the exact values in the PHP app's login.php so
// the silhouette shape is identical, not just "a skyline shape".
const SKYLINE_BARS = [
  { height: 40, width: 8 },
  { height: 65, width: 6 },
  { height: 50, width: 9 },
  { height: 80, width: 7 },
  { height: 55, width: 10 },
  { height: 70, width: 6 },
  { height: 45, width: 8 },
  { height: 90, width: 5 },
  { height: 60, width: 9 },
  { height: 50, width: 7 },
  { height: 75, width: 6 },
  { height: 40, width: 8 },
];
