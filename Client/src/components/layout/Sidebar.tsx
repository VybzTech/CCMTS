/**
 * Wraps styles/app.css's .sidebar and everything inside it. Purely
 * presentational - AppShell owns the collapsed/mobile-open state and
 * passes it down, so this component doesn't know *why* it's collapsed,
 * just that it is. Nav items come from navConfig.ts filtered by role.
 *
 * Per an explicit product decision partway through the PHP app's
 * design pass, the logo is NOT a link (it was made clickable, then
 * deliberately reverted) - don't re-wrap it in <Link> without checking
 * that decision still holds.
 */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getNavItemsForRole } from './navConfig';
import { ThemeToggleSwitch } from './ThemeToggleSwitch';
import { formatRoleLabel } from '../../utils/format';

const MOBILE_BREAKPOINT_PX = 768;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  /** Called when a nav link is clicked - Sidebar only invokes this
   *  below the mobile breakpoint (see MOBILE_BREAKPOINT_PX), matching
   *  app.js's "close sidebar when clicking a nav link (mobile)"
   *  behavior; on desktop, clicking a link shouldn't close anything. */
  onNavigate: () => void;
  pendingApprovalsCount?: number;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onNavigate,
  pendingApprovalsCount,
}: SidebarProps) {
  const { user } = useAuth();
  if (!user) return null;

  const navItems = getNavItemsForRole(user.role);
  const badgeCounts = {
    pendingApprovals: pendingApprovalsCount,
  };

  return (
    <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>
      <div className="sidebar-header">
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <i className="fas fa-angles-left" aria-hidden="true" />
        </button>

        <div className="logo">
          <img src="/images/lirs-logo.jpg" alt="LIRS Logo" className="logo-icon-img" />
          <div className="logo-text">
            <h2>CCMS</h2>
            <span className="role-badge">{formatRoleLabel(user.role)}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const badgeCount = item.badgeKey ? badgeCounts[item.badgeKey] : undefined;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => {
                if (window.innerWidth <= MOBILE_BREAKPOINT_PX) onNavigate();
              }}
            >
              <i className={`fas ${item.icon}`} aria-hidden="true" />
              <span>{item.label}</span>
              {!!badgeCount && <span className="badge">{badgeCount}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <ThemeToggleSwitch />
      </div>
    </aside>
  );
}
