/**
 * Wraps styles/app.css's .theme-toggle-btn / .theme-switch-track /
 * .theme-switch-thumb - the sliding sun/moon pill switch. All of the
 * visual state (thumb position, which icon is lit up) is pure CSS keyed
 * off [data-theme] on <html> (see the app.css rules right after
 * .theme-toggle-btn), so this component only needs to toggle the theme
 * and reflect aria-checked - it never touches icon classes directly.
 */
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggleSwitch() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={toggleTheme}
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label="Dark mode"
      title="Switch color theme"
    >
      <span className="theme-switch-track" aria-hidden="true">
        <i className="fas fa-sun theme-switch-icon sun" />
        <i className="fas fa-moon theme-switch-icon moon" />
        <span className="theme-switch-thumb" />
      </span>
      <span>Dark Mode</span>
    </button>
  );
}
