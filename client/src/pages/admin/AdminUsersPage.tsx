import { useState, useEffect, useCallback } from 'react';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { reportsApi, type AdminUserItem } from '../../services/reports.service';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Pending role change state for confirmation dialog
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: AdminUserItem;
    newRole: 'learner' | 'instructor' | 'admin';
  } | null>(null);
  const [isMutatingRole, setIsMutatingRole] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await reportsApi.listUsers({
        pageSize: 50,
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      });
      setUsers(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load user directory');
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function executeRoleChange() {
    if (!pendingRoleChange) return;
    const { user, newRole } = pendingRoleChange;

    setIsMutatingRole(true);
    setUpdatingUserId(user.id);
    setMutationError(null);

    try {
      await reportsApi.updateUserRole(user.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
      );
      setSuccessMsg(`User ${user.displayName || user.email} role updated to ${newRole}`);
      setTimeout(() => setSuccessMsg(null), 4000);
      setPendingRoleChange(null);
    } catch (err: any) {
      setMutationError(err?.message || 'Failed to update user role');
    } finally {
      setIsMutatingRole(false);
      setUpdatingUserId(null);
    }
  }

  const isTargetAdmin = pendingRoleChange?.newRole === 'admin';
  const targetUserName = pendingRoleChange
    ? pendingRoleChange.user.displayName || pendingRoleChange.user.email
    : '';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-deep">User Directory</h1>
            <p className="text-sm text-text-muted mt-1">
              Manage accounts, assign roles, and audit instructor and learner permissions.
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-success-soft text-success text-xs font-semibold rounded-lg border border-success/30 animate-fade-in">
            ✓ {successMsg}
          </div>
        )}

        {mutationError && (
          <div className="p-3 bg-error-soft text-error text-xs font-semibold rounded-lg border border-error/30 animate-fade-in flex items-center justify-between">
            <span>✕ {mutationError}</span>
            <button
              onClick={() => setMutationError(null)}
              className="text-error hover:text-error/80 text-sm font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Filter Bar */}
        <div className="card p-4 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-border">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input text-xs py-2 w-full sm:w-72"
          />

          <div className="flex items-center rounded-md bg-soft p-0.5 border border-border text-xs self-start sm:self-auto">
            {(['all', 'learner', 'instructor', 'admin'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1 font-medium capitalize rounded transition-colors ${
                  roleFilter === r
                    ? 'bg-surface text-text-deep shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text-deep'
                }`}
                type="button"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="card bg-surface overflow-hidden border border-border">
          {isLoading ? (
            <div className="p-12 text-center text-text-muted animate-pulse">
              Loading user accounts...
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-error">{error}</p>
              <button onClick={fetchUsers} className="btn-sm btn-secondary mt-3" type="button">
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-text-muted">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-soft/50 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-center">Enrolled</th>
                    <th className="py-3 px-4 text-center">Taught</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Assign Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-soft/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                            {u.displayName ? u.displayName.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-text-deep">
                              {u.displayName || 'No Name'}
                            </div>
                            <div className="text-[11px] text-text-muted">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`badge text-[10px] capitalize ${
                            u.role === 'admin'
                              ? 'badge-primary font-bold'
                              : u.role === 'instructor'
                              ? 'badge-warning font-semibold'
                              : 'badge-neutral'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-medium">{u.enrollmentCount}</td>
                      <td className="py-3 px-4 text-center font-medium">{u.coursesTaughtCount}</td>

                      <td className="py-3 px-4 text-text-muted">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <select
                          value={u.role}
                          disabled={updatingUserId === u.id}
                          aria-label={`Change role for ${u.displayName || u.email}`}
                          onChange={(e) => {
                            const newRole = e.target.value as 'learner' | 'instructor' | 'admin';
                            if (newRole !== u.role) {
                              setPendingRoleChange({ user: u, newRole });
                            }
                          }}
                          className="input py-1 px-2 text-xs w-28 capitalize bg-surface border-border cursor-pointer focus:ring-1 focus:ring-primary"
                        >
                          <option value="learner">Learner</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Role Change Confirmation Dialog */}
      <ConfirmDialog
        open={pendingRoleChange !== null}
        title={isTargetAdmin ? 'Grant Admin access?' : 'Change user role?'}
        description={
          isTargetAdmin ? (
            <div className="space-y-2">
              <p>
                You are about to change <strong className="text-text-deep">{targetUserName}</strong> from{' '}
                <span className="capitalize font-medium">{pendingRoleChange?.user.role}</span> to{' '}
                <span className="capitalize font-medium">Admin</span>.
              </p>
              <p className="text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 text-xs">
                ⚠️ This gives the user administrative permissions across the platform.
              </p>
            </div>
          ) : (
            <p>
              You are about to change <strong className="text-text-deep">{targetUserName}</strong> from{' '}
              <span className="capitalize font-medium">{pendingRoleChange?.user.role}</span> to{' '}
              <span className="capitalize font-medium">{pendingRoleChange?.newRole}</span>. This will
              immediately change the permissions available to this account.
            </p>
          )
        }
        confirmLabel={isTargetAdmin ? 'Grant Admin Access' : 'Change Role'}
        cancelLabel="Cancel"
        variant={isTargetAdmin ? 'warning' : 'default'}
        loading={isMutatingRole}
        onConfirm={executeRoleChange}
        onCancel={() => {
          if (!isMutatingRole) {
            setPendingRoleChange(null);
          }
        }}
      />
    </div>
  );
}
