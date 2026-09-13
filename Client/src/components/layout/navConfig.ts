/**
 * Data-driven nav list, one entry per role, instead of the PHP
 * sidebar's role-conditional if/elseif blocks - adding a nav item is a
 * one-line addition here rather than editing markup.
 *
 * Covers the backend's four roles (ODU/Admin/Management/Courier) -
 * there is no separate "Administrative Unit" role, so the PHP app's
 * Admin + Administrative Unit nav sections are merged under Admin here.
 * See types/api.ts's UserRole comment for the full reasoning.
 *
 * `Management` is a superset of Admin: everywhere `'Admin'` appears in a
 * `roles` list below, `'Management'` is added alongside it, plus one
 * item (`Manage Users`) that's Management-exclusive.
 *
 * `badgeKey` items get their count filled in by Sidebar's caller
 * (AppShell) from whatever the relevant API call returns - Sidebar
 * itself does no data fetching, it just renders whatever counts it's
 * given.
 */
import type { UserRole } from '../../types/api';

export interface NavItem {
  to: string;
  icon: string;
  label: string;
  roles: UserRole[];
  badgeKey?: 'pendingApprovals';
}

export const NAV_ITEMS: NavItem[] = [
  // Dashboards (one path, label varies by role like the PHP app's did -
  // Sidebar picks the label at render time)
  { to: '/dashboard', icon: 'fa-home', label: 'Dashboard', roles: ['ODU', 'Admin', 'Management', 'Courier'] },

  // Courier only. A courier's sidebar is intentionally two working
  // items plus Settings/Help - they're using this one-handed on a phone
  // between stops, so anything they can't act on is noise. Everything
  // else in this list is either an office task (registering/approving/
  // allocating letters) or an org-wide view they have no access to.
  { to: '/my-deliveries', icon: 'fa-truck-fast', label: 'My Deliveries', roles: ['Courier'] },

  // ODU only - Admin/Management briefly had this too (with a
  // directorate picker, since neither has a home directorate) but it
  // was deliberately removed per product decision. They keep Bulk
  // Upload below, which still has that picker.
  { to: '/letters/create', icon: 'fa-paper-plane', label: 'Register Letter', roles: ['ODU'] },
  { to: '/letters/bulk', icon: 'fa-upload', label: 'Bulk Upload', roles: ['ODU', 'Admin', 'Management'] },

  // Admin (+ Management, which is a superset of Admin - see the file
  // header comment)
  {
    to: '/admin/pending',
    icon: 'fa-inbox',
    label: 'Pending Approvals',
    roles: ['Admin', 'Management'],
    badgeKey: 'pendingApprovals',
  },
  // Courier Allocation merges what used to be two separate nav items
  // (Assignments + Bulk Auto-Assign) into one - see
  // pages/admin/CourierAllocationPage.tsx's file header for why.
  { to: '/admin/courier-allocation', icon: 'fa-route', label: 'Courier Allocation', roles: ['Admin', 'Management'] },
  { to: '/couriers', icon: 'fa-truck', label: 'Courier Pool', roles: ['Admin', 'Management'] },

  // Management only
  { to: '/admin/users', icon: 'fa-user-shield', label: 'Manage Users', roles: ['Management'] },
  { to: '/management/analytics', icon: 'fa-chart-line', label: 'Analytics', roles: ['Management'] },
  // UAT MGT-003/004/005 - Management had no filterable, exportable view.
  { to: '/management/reporting', icon: 'fa-file-lines', label: 'Reporting', roles: ['Management'] },

  // Shared across roles that touch letters
  { to: '/letters', icon: 'fa-envelope', label: 'All Letters', roles: ['ODU', 'Admin', 'Management'] },
  { to: '/directorates', icon: 'fa-building', label: 'Directorates', roles: ['Admin', 'Management'] },

  // Every role
  { to: '/settings', icon: 'fa-gear', label: 'Settings', roles: ['ODU', 'Admin', 'Management', 'Courier'] },
  { to: '/help', icon: 'fa-question-circle', label: 'Help & Guide', roles: ['ODU', 'Admin', 'Management', 'Courier'] },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
