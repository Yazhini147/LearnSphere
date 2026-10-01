import { useState, useEffect, useCallback } from 'react';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { learningApi, type GamificationData } from '../../services/learning.service';
import { ErrorState } from '../../components/feedback/ErrorState';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';

export default function AchievementsPage() {
  const [data, setData] = useState<GamificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await learningApi.getGamification();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load achievements and gamification data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardNav />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <LoadingState message="Loading your achievements, streak metrics, and mastery badges..." />
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardNav />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorState
            title="Unable to load achievements"
            message={error || 'An unexpected error occurred while fetching your learning progress.'}
            onRetry={loadData}
          />
        </main>
      </div>
    );
  }

  const filteredAchievements = data.achievements.filter((a) => {
    if (filter === 'unlocked') return a.isUnlocked;
    if (filter === 'locked') return !a.isUnlocked;
    return true;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="border-b border-border pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-deep tracking-tight">
            Achievements & Gamification
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Complete coursework, maintain your consecutive daily learning streak, and unlock platform mastery badges.
          </p>
        </div>

        {/* Gamification Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 bg-surface border-l-4 border-l-primary flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Total XP Points
              </div>
              <div className="text-3xl font-extrabold text-text-deep mt-2 flex items-center gap-2">
                <span className="text-primary text-2xl">⚡</span> {data.totalPoints}
              </div>
            </div>
            <div className="text-xs text-text-muted mt-3 pt-2 border-t border-border">
              Earned across lessons, quizzes & milestones
            </div>
          </div>

          <div className="card p-5 bg-surface border-l-4 border-l-amber-500 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Learning Streak
              </div>
              <div className="text-3xl font-extrabold text-text-deep mt-2 flex items-center gap-2">
                <span className="text-amber-500 text-2xl">🔥</span> {data.streakDays} {data.streakDays === 1 ? 'Day' : 'Days'}
              </div>
            </div>
            <div className="text-xs text-text-muted mt-3 pt-2 border-t border-border flex justify-between">
              <span>Best record:</span>
              <span className="font-semibold text-text-deep">{data.longestStreak || data.streakDays} days</span>
            </div>
          </div>

          <div className="card p-5 bg-surface border-l-4 border-l-emerald-600 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Achievements
              </div>
              <div className="text-3xl font-extrabold text-text-deep mt-2 flex items-center gap-2">
                <span className="text-emerald-600 text-2xl">🏆</span> {data.unlockedAchievementsCount} / {data.totalAchievementsCount}
              </div>
            </div>
            <div className="text-xs text-text-muted mt-3 pt-2 border-t border-border flex justify-between">
              <span>Completion:</span>
              <span className="font-semibold text-text-deep">
                {data.totalAchievementsCount > 0
                  ? Math.round((data.unlockedAchievementsCount / data.totalAchievementsCount) * 100)
                  : 0}%
              </span>
            </div>
          </div>

          <div className="card p-5 bg-surface border-l-4 border-l-indigo-500 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Mastery Badges
              </div>
              <div className="text-3xl font-extrabold text-text-deep mt-2 flex items-center gap-2">
                <span className="text-indigo-500 text-2xl">🎖️</span> {data.earnedBadgesCount} / {data.totalBadgesCount}
              </div>
            </div>
            <div className="text-xs text-text-muted mt-3 pt-2 border-t border-border flex justify-between">
              <span>Tiers unlocked:</span>
              <span className="font-semibold text-text-deep">
                {data.totalBadgesCount > 0
                  ? Math.round((data.earnedBadgesCount / data.totalBadgesCount) * 100)
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Badges Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-deep">Mastery Badges</h2>
              <p className="text-xs text-text-muted">Long-term distinction badges earned for learning milestones.</p>
            </div>
            <span className="text-xs font-medium text-text-muted">
              {data.earnedBadgesCount} of {data.totalBadgesCount} earned
            </span>
          </div>

          {data.badges.length === 0 ? (
            <EmptyState title="No Badges Available" message="Badges will appear here as you advance." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.badges.map((badge) => {
                const isEarned = badge.isEarned;
                const levelColors: Record<string, string> = {
                  bronze: 'border-amber-600/30 bg-amber-50/40 text-amber-800',
                  silver: 'border-slate-300 bg-slate-50 text-slate-700',
                  gold: 'border-yellow-500/40 bg-yellow-50/40 text-yellow-800',
                  platinum: 'border-cyan-500/40 bg-cyan-50/40 text-cyan-800',
                };

                return (
                  <div
                    key={badge.id}
                    className={`card p-5 border rounded-xl flex items-start gap-4 transition-all ${
                      isEarned
                        ? `${levelColors[badge.level] || 'border-border bg-surface'} shadow-xs`
                        : 'border-dashed border-border bg-soft/40 opacity-70'
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                        isEarned ? 'bg-surface shadow-xs text-primary' : 'bg-soft text-text-muted grayscale'
                      }`}
                    >
                      {badge.icon || '🎖️'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-text-deep line-clamp-1">{badge.name}</h3>
                        <span className="badge badge-neutral text-[10px] uppercase font-bold px-1.5 py-0.5">
                          {badge.level}
                        </span>
                      </div>

                      <p className="text-xs text-text-muted mt-1 leading-relaxed">
                        {badge.description || 'Mastery badge earned for milestones.'}
                      </p>

                      <div className="mt-3 text-[11px] font-medium">
                        {isEarned ? (
                          <span className="text-success font-semibold flex items-center gap-1">
                            <span>✓ Earned</span>
                            {badge.earnedAt && (
                              <span className="text-text-muted font-normal">
                                ({new Date(badge.earnedAt).toLocaleDateString()})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-text-muted italic">🔒 In Progress</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Achievements Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-text-deep">Achievements Checklist</h2>
              <p className="text-xs text-text-muted">Specific milestones that grant instant XP bonuses.</p>
            </div>

            <div className="flex items-center rounded-lg bg-soft p-1 border border-border text-xs self-start sm:self-auto">
              {(['all', 'unlocked', 'locked'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 font-medium capitalize rounded-md transition-colors ${
                    filter === f
                      ? 'bg-surface text-text-deep shadow-xs font-semibold'
                      : 'text-text-muted hover:text-text-deep'
                  }`}
                  type="button"
                >
                  {f} {f === 'unlocked' ? `(${data.unlockedAchievementsCount})` : f === 'locked' ? `(${data.totalAchievementsCount - data.unlockedAchievementsCount})` : `(${data.totalAchievementsCount})`}
                </button>
              ))}
            </div>
          </div>

          {filteredAchievements.length === 0 ? (
            <div className="card p-8 text-center bg-surface border border-border">
              <p className="text-sm text-text-muted">No achievements found in the "{filter}" category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`card p-5 border rounded-xl flex items-start gap-4 transition-colors ${
                    ach.isUnlocked
                      ? 'bg-surface border-success/30'
                      : 'bg-surface border-border'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      ach.isUnlocked
                        ? 'bg-success-soft text-success'
                        : 'bg-soft text-text-muted grayscale'
                    }`}
                  >
                    {ach.icon || '🏆'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm text-text-deep line-clamp-1">{ach.name}</h3>
                      <span className="badge badge-primary text-[11px] shrink-0 font-semibold">
                        +{ach.pointsReward} XP
                      </span>
                    </div>

                    <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">
                      {ach.description || 'Complete learning tasks to earn this reward.'}
                    </p>

                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-[11px] text-text-muted">
                        <span>
                          {ach.isUnlocked ? 'Completed' : 'Current progress'}
                        </span>
                        <span className="font-medium text-text-deep">
                          {ach.currentProgress} / {ach.criteriaValue}
                        </span>
                      </div>
                      <div className="w-full bg-soft h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            ach.isUnlocked ? 'bg-success' : 'bg-primary'
                          }`}
                          style={{
                            width: `${Math.min(100, (ach.currentProgress / ach.criteriaValue) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Points Ledger Activity */}
        <div className="card p-6 bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-deep">Recent Point Rewards</h2>
            <span className="text-xs text-text-muted">Authoritative PostgreSQL points ledger</span>
          </div>

          {data.recentTransactions.length === 0 ? (
            <p className="text-xs text-text-muted italic py-4">No point transactions recorded yet.</p>
          ) : (
            <div className="divide-y divide-border text-xs">
              {data.recentTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-primary font-bold text-base shrink-0">⚡</span>
                    <div className="min-w-0">
                      <div className="font-medium text-text-deep truncate">{tx.description}</div>
                      <div className="text-[10px] text-text-muted">
                        {new Date(tx.createdAt).toLocaleString()} • {tx.sourceType}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-success text-xs shrink-0">+{tx.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
