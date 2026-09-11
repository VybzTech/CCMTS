/**
 * Wraps styles/app.css's .top-bar and everything inside it. The user
 * dropdown only contains Logout - Settings deliberately isn't repeated
 * here (it's already a sidebar nav item; the PHP app used to duplicate
 * both Settings and Logout in a second sidebar-footer menu, which was
 * later removed as redundant - see the comment in the PHP app's
 * templates/sidebar.php for that history. Don't re-add it here.)
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDismissableMenu } from '../../hooks/useDismissableMenu';
import { formatRoleLabel } from '../../utils/format';

interface TopBarProps {
  pageTitle: string;
  departmentName?: string;
}

export function TopBar({ pageTitle, departmentName }: TopBarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const userMenu = useDismissableMenu<HTMLDivElement>();

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = searchValue.trim();
    navigate(trimmed ? `/letters?search=${encodeURIComponent(trimmed)}` : '/letters');
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <a href="/dashboard" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            <i className="fas fa-home" aria-hidden="true" />
          </a>
          <span className="separator">
            <i className="fas fa-chevron-right" aria-hidden="true" />
          </span>
          <span className="current">{pageTitle}</span>
        </nav>
      </div>

      <form className="top-bar-search" role="search" onSubmit={handleSearchSubmit}>
        <i className="fas fa-search" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search tracking ID, recipient, subject..."
          aria-label="Search letters"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
        />
      </form>

      <div className="top-bar-right">
        <span className="top-bar-date">
          <i className="fas fa-calendar-day" aria-hidden="true" />
          {today}
        </span>

        {departmentName && <span className="top-bar-department">{departmentName}</span>}

        <div className="top-bar-user-menu" ref={userMenu.containerRef}>
          <button
            type="button"
            className="top-bar-user"
            onClick={userMenu.toggle}
            aria-haspopup="true"
            aria-expanded={userMenu.isOpen}
          >
            <div className="top-bar-user-avatar">{(user?.name ?? 'U').charAt(0).toUpperCase()}</div>
            <span className="top-bar-user-info">
              <span className="top-bar-user-name">{user?.name}</span>
              <span className="top-bar-user-role">{user ? formatRoleLabel(user.role) : ''}</span>
            </span>
            <i className="fas fa-chevron-down top-bar-user-caret" aria-hidden="true" />
          </button>

          <div className={`user-dropdown${userMenu.isOpen ? ' show' : ''}`}>
            <div className="user-dropdown-header">
              <strong>{user?.name}</strong>
              <span>{user?.email}</span>
            </div>
            <button
              type="button"
              className="user-dropdown-item user-dropdown-item-danger"
              onClick={logout}
            >
              <i className="fas fa-sign-out-alt" aria-hidden="true" /> Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
