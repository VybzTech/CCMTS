/**
 * Top-level page chrome - wraps every authenticated page in the
 * sidebar + top bar, same as the PHP app's templates/header.php +
 * sidebar.php + footer.php trio. Use it explicitly per page rather than
 * as a router layout route wrapping <Outlet/>:
 *
 *   export function DashboardPage() {
 *     return (
 *       <AppShell pageTitle="Dashboard">
 *         ...page content...
 *       </AppShell>
 *     );
 *   }
 *
 * That mirrors the PHP app's `$title = 'Dashboard';` pattern closely
 * enough that porting a PHP page over means copying its body into an
 * AppShell wrapper, not restructuring how titles/counts flow through
 * the app.
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

const COLLAPSE_STORAGE_KEY = 'ccmts-sidebar-collapsed';
const DESKTOP_BREAKPOINT_PX = 992;
const MOBILE_BREAKPOINT_PX = 768;

interface AppShellProps {
  pageTitle: string;
  departmentName?: string;
  pendingApprovalsCount?: number;
  children: ReactNode;
}

export function AppShell({
  pageTitle,
  departmentName,
  pendingApprovalsCount,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore the desktop collapse preference - same condition the PHP
  // app's restoreSidebarCollapse() used (only apply it above the
  // desktop breakpoint, so a phone that visited on a previous session
  // doesn't load pre-collapsed).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY) === '1';
      if (stored && window.innerWidth > DESKTOP_BREAKPOINT_PX) {
        setCollapsed(true);
      }
    } catch {
      // Ignore - localStorage can throw in private browsing.
    }
  }, []);

  // Prevent background scroll while the mobile off-canvas sidebar is
  // open, matching app.js's `body.classList.toggle('sidebar-open', ...)`.
  useEffect(() => {
    const shouldLockScroll = mobileOpen && window.innerWidth <= MOBILE_BREAKPOINT_PX;
    document.body.classList.toggle('sidebar-open', shouldLockScroll);
    return () => document.body.classList.remove('sidebar-open');
  }, [mobileOpen]);

  function toggleCollapse() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // Best-effort persistence only.
      }
      return next;
    });
  }

  return (
    <div className={`app-container${collapsed ? ' sidebar-collapsed' : ''}`}>
      <button
        type="button"
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <i className="fas fa-bars" aria-hidden="true" />
      </button>
      <div
        className={`sidebar-overlay${mobileOpen ? ' active' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        pendingApprovalsCount={pendingApprovalsCount}
      />

      <main className="main-content">
        <TopBar pageTitle={pageTitle} departmentName={departmentName} />
        {children}
      </main>
    </div>
  );
}
