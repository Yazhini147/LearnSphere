import { useState } from 'react';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { userApi } from '../../services/user.service';
import { useAuth } from '../../features/auth/AuthContext';
import { PasswordField } from '../../components/ui/PasswordField';

export default function SettingsPage() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await userApi.changePassword({
        currentPassword,
        newPassword,
      });
      setSuccess(res.message || 'Password successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.message || 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-deep">Account Settings</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage your credentials, authentication security, and session privacy.
          </p>
        </div>

        {/* Security / Password Form */}
        <div className="card p-6 sm:p-8 bg-surface border border-border space-y-6">
          <div>
            <h2 className="text-lg font-bold text-text-deep">Change Password</h2>
            <p className="text-xs text-text-muted mt-1">
              Updating your password will immediately revoke all other active refresh sessions for safety.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-error-soft text-error text-xs rounded-lg border border-error/20">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-success-soft text-success text-xs font-semibold rounded-lg border border-success/30 animate-fade-in">
              ✓ {success}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="current-pw" className="label">Current Password *</label>
              <PasswordField
                id="current-pw"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div>
              <label htmlFor="new-pw" className="label">New Password *</label>
              <PasswordField
                id="new-pw"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <p className="helper-text">Minimum 8 characters with letters, numbers, and symbols.</p>
            </div>

            <div>
              <label htmlFor="confirm-new-pw" className="label">Confirm New Password *</label>
              <PasswordField
                id="confirm-new-pw"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                type="submit"
                disabled={isUpdating}
                className="btn-md btn-primary"
              >
                {isUpdating ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Security Policy Information */}
        <div className="card p-6 bg-surface border border-border space-y-3">
          <h3 className="text-base font-bold text-text-deep">Session & Cookie Security Policy</h3>
          <ul className="text-xs text-text-muted space-y-1.5 list-disc pl-4">
            <li>JWT access tokens are stored in-memory only and never written to localStorage or sessionStorage.</li>
            <li>Refresh tokens are stored in HttpOnly, Secure, SameSite=Lax cookies with automatic rotation.</li>
            <li>Raw refresh tokens are never persisted in the database; only cryptographic SHA-256 digests are stored.</li>
            <li>Signed in as <strong className="text-text-deep">{user?.email}</strong> with role <span className="capitalize font-semibold text-primary">{user?.role}</span>.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
