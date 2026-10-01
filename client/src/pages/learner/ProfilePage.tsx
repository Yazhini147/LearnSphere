import { useState, useEffect, useCallback } from 'react';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { userApi, type UserProfile } from '../../services/user.service';
import { useAuth } from '../../features/auth/AuthContext';

export default function ProfilePage() {
  const { refreshUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarPath, setAvatarPath] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userApi.getProfile();
      setProfile(data);
      setDisplayName(data.displayName || '');
      setBio(data.bio || '');
      setAvatarPath(data.avatarPath || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    try {
      const updated = await userApi.updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarPath: avatarPath.trim() || undefined,
      });
      setProfile(updated);
      setSaveSuccess('Profile updated successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      alert(err?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-deep">My Profile</h1>
          <p className="text-sm text-text-muted mt-1">
            Manage your public identity, bio, and student credentials.
          </p>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-success-soft text-success text-xs font-semibold rounded-lg border border-success/30 animate-fade-in">
            ✓ {saveSuccess}
          </div>
        )}

        {isLoading ? (
          <div className="card p-12 text-center text-text-muted animate-pulse">
            Loading profile information...
          </div>
        ) : error || !profile ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-error">{error || 'Unable to load profile'}</p>
            <button onClick={loadProfile} className="btn-sm btn-secondary mt-3" type="button">
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Identity Card */}
            <div className="card p-6 bg-surface border border-border flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center border border-primary/20 shrink-0">
                {avatarPath ? (
                  <img
                    src={avatarPath}
                    alt={displayName}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : displayName ? (
                  displayName.charAt(0).toUpperCase()
                ) : (
                  '👤'
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold text-text-deep">
                  {profile.displayName || profile.email}
                </h2>
                <div className="text-xs text-text-muted mt-0.5">{profile.email}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="badge badge-primary text-[10px] capitalize">
                    {profile.role}
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSave} className="card p-6 sm:p-8 bg-surface border border-border space-y-5">
              <h3 className="text-base font-bold text-text-deep">Edit Profile Information</h3>

              <div>
                <label className="label">Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="Your full name or handle"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Bio / About You</label>
                <textarea
                  rows={4}
                  placeholder="Share a brief overview of your background, learning goals, or engineering experience..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input resize-y"
                />
              </div>

              <div>
                <label className="label">Avatar Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or hosted image"
                  value={avatarPath}
                  onChange={(e) => setAvatarPath(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-md btn-primary"
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
