/**
 * Management-only "Manage Users" page - lists every account, lets a
 * Management user create new ones for any role, edit an existing account's
 * core fields, disable/enable an account, and reset a password to the
 * shared default (see userService.ts + utils/passwordPolicy.ts). There
 * is no PHP-app equivalent page to port from and no
 * API_DOCUMENTATION.md endpoint to follow (see types/api.ts's UserRole
 * comment): this is new surface built to match the visual/interaction
 * conventions the rest of the app already uses (compare
 * DirectoratesPage.tsx's list-plus-toggle-create-form layout, and
 * CouriersPage.tsx's per-row action buttons).
 *
 * Only one of "create" / "edit" is ever open at a time (`showForm` and
 * `editingUser` are set mutually exclusively) so there's never a second
 * form fighting for the same directorate-picker state.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/form/TextField';
import { SelectField } from '../../components/ui/form/SelectField';
import { DataTable } from '../../components/ui/DataTable';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useToast } from '../../components/ui/Toast/useToast';
import { useConfirm } from '../../components/ui/Modal/useConfirm';
import {
  createUser,
  fetchUsers,
  resetUserPassword,
  setUserDisabled,
  updateUser,
} from '../../services/userService';
import { fetchDirectorates } from '../../services/directorateService';
import { extractErrorMessage } from '../../services/apiClient';
import { formatRoleLabel } from '../../utils/format';
import type { Directorate, User, UserRole } from '../../types/api';

const ROLE_OPTIONS: UserRole[] = ['ODU', 'Admin', 'Management', 'Courier'];

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, error, reload } = useAsyncData(() => fetchUsers(), []);
  const { data: directorates } = useAsyncData(() => fetchDirectorates(), []);
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const directorateName = (id?: string) => directorates?.find((d) => d.id === id)?.name ?? '—';

  async function handleToggleDisabled(target: User) {
    const nextDisabled = !target.disabled;
    if (nextDisabled) {
      const ok = await confirm({
        title: 'Disable User',
        message: `Disable "${target.name}"? They won't be able to log in until re-enabled.`,
        variant: 'danger',
        confirmLabel: 'Disable',
      });
      if (!ok) return;
    }

    setBusyId(target.id);
    try {
      await setUserDisabled(target.id, nextDisabled);
      showToast('success', nextDisabled ? 'User disabled.' : 'User enabled.');
      reload();
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleResetPassword(target: User) {
    const ok = await confirm({
      title: 'Reset Password',
      message: `Reset "${target.name}"'s password? A unique one-time password will be generated, and they'll be required to set a new one on next login.`,
      variant: 'danger',
      confirmLabel: 'Reset Password',
    });
    if (!ok) return;

    setBusyId(target.id);
    try {
      const { temporaryPassword } = await resetUserPassword(target.id);
      // Show the generated password in a modal (not a toast) so it stays
      // on screen until dismissed - it's only returned this once.
      await confirm({
        title: 'Temporary Password',
        variant: 'info',
        confirmLabel: 'Done',
        cancelLabel: 'Close',
        message: (
          <span>
            Share this one-time password with <strong>{target.name}</strong> securely - it won't be
            shown again, and they must set a new password on next login.
            <code
              style={{
                display: 'block',
                marginTop: '0.75rem',
                fontSize: '1.15rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                userSelect: 'all',
              }}
            >
              {temporaryPassword}
            </code>
          </span>
        ),
      });
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell pageTitle="Manage Users">
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1>Manage Users</h1>
            <p>Create, edit, and review accounts for every role.</p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setEditingUser(null);
              setShowCreateForm((v) => !v);
            }}
          >
            <i className="fas fa-user-plus" /> Add User
          </Button>
        </div>

        {showCreateForm && (
          <UserFormCard
            directorates={directorates ?? []}
            onCancel={() => setShowCreateForm(false)}
            onSubmit={async (payload) => {
              await createUser({
                name: payload.name,
                email: payload.email,
                password: payload.password,
                role: payload.role,
                directorateId: payload.directorateId ? Number(payload.directorateId) : undefined,
              });
              showToast('success', 'User created.');
              setShowCreateForm(false);
              reload();
            }}
          />
        )}

        {editingUser && (
          <UserFormCard
            directorates={directorates ?? []}
            initialUser={editingUser}
            onCancel={() => setEditingUser(null)}
            onSubmit={async (payload) => {
              await updateUser(editingUser.id, {
                name: payload.name,
                email: payload.email,
                role: payload.role,
                directorateId: payload.directorateId ? Number(payload.directorateId) : null,
              });
              showToast('success', 'User updated.');
              setEditingUser(null);
              reload();
            }}
          />
        )}

        {error && (
          <div className="alert alert-danger">
            <i className="fas fa-circle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <Card>
            <CardHeader title={`${(users ?? []).length} User(s)`} />
            <CardBody>
              <DataTable<User>
                columns={[
                  { key: 'name', header: 'Name', render: (u) => u.name },
                  { key: 'email', header: 'Email', render: (u) => u.email },
                  {
                    key: 'role',
                    header: 'Role',
                    render: (u) => <span className="role-badge">{formatRoleLabel(u.role)}</span>,
                  },
                  { key: 'directorate', header: 'Directorate', render: (u) => directorateName(u.directorateId) },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (u) => (
                      <span className={`availability-badge ${u.disabled ? 'unavailable' : 'available'}`}>
                        {u.disabled ? 'Disabled' : 'Active'}
                      </span>
                    ),
                  },
                  {
                    key: 'actions',
                    header: '',
                    cellClassName: 'action-cell',
                    render: (u) => (
                      <div className="courier-actions">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setShowCreateForm(false);
                            setEditingUser(u);
                          }}
                        >
                          <i className="fas fa-pen" /> Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={busyId === u.id}
                          onClick={() => handleResetPassword(u)}
                        >
                          <i className="fas fa-key" /> Reset Password
                        </Button>
                        <Button
                          variant={u.disabled ? 'success' : 'danger'}
                          size="sm"
                          isLoading={busyId === u.id}
                          disabled={u.id === currentUser?.id}
                          onClick={() => handleToggleDisabled(u)}
                        >
                          {u.disabled ? 'Enable' : 'Disable'}
                        </Button>
                      </div>
                    ),
                  },
                ]}
                rows={users ?? []}
                keyExtractor={(u) => u.id}
                emptyState={<EmptyState icon="fa-user-shield" title="No users yet" description="Add the first account to get started." />}
              />
            </CardBody>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

interface UserFormPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  directorateId: string;
}

interface UserFormCardProps {
  directorates: Directorate[];
  /** Omit for "create" mode; pass the user being edited for "edit" mode -
   *  edit mode hides the password field entirely (there's no endpoint to
   *  set a password directly; use "Reset Password" for that). */
  initialUser?: User;
  onCancel: () => void;
  onSubmit: (payload: UserFormPayload) => Promise<void>;
}

function UserFormCard({ directorates, initialUser, onCancel, onSubmit }: UserFormCardProps) {
  const { showToast } = useToast();
  const isEditing = !!initialUser;
  const [form, setForm] = useState<UserFormPayload>({
    name: initialUser?.name ?? '',
    email: initialUser?.email ?? '',
    password: '',
    role: initialUser?.role ?? 'ODU',
    directorateId: initialUser?.directorateId ?? '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const needsDirectorate = form.role === 'ODU';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || (!isEditing && !form.password.trim())) return;
    if (needsDirectorate && !form.directorateId) {
      showToast('warning', 'Choose a directorate for this ODU account.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch (err) {
      showToast('error', extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title={isEditing ? `Edit ${initialUser.name}` : 'New User'} />
      <CardBody>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <TextField
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="form-row">
            {!isEditing && (
              <TextField
                label="Password"
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            )}
            <SelectField
              label="Role"
              required
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole, directorateId: '' }))}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {formatRoleLabel(role)}
                </option>
              ))}
            </SelectField>
          </div>

          {needsDirectorate && (
            <SelectField
              label="Directorate"
              required
              value={form.directorateId}
              onChange={(e) => setForm((f) => ({ ...f, directorateId: e.target.value }))}
            >
              <option value="">Choose a directorate…</option>
              {directorates.map((dir) => (
                <option key={dir.id} value={dir.id}>
                  {dir.name} ({dir.code})
                </option>
              ))}
            </SelectField>
          )}

          {isEditing && (
            <p className="secondary-text mt-sm">
              Password isn't editable here - use "Reset Password" from the table to reset it to the default.
            </p>
          )}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
