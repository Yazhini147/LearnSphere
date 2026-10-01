import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { reportsApi, type AdminReportSummary } from '../../services/reports.service';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';

export default function AdminDashboard() {
  const [data, setData] = useState<AdminReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getAdminReports();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load administrative reports.');
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
          <LoadingState message="Loading administrative metrics, user accounts, and platform logs..." />
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
            title="Unable to load admin control center"
            message={error || 'An unexpected error occurred while querying platform telemetry.'}
            onRetry={loadData}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header with Quick Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-deep tracking-tight">
              Admin Control Center
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Authoritative PostgreSQL platform telemetry, user governance, and curriculum oversight.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin/courses" className="btn-sm btn-secondary text-xs">
              Courses Catalog
            </Link>
            <Link to="/admin/users" className="btn-sm btn-primary text-xs">
              Manage Users
            </Link>
          </div>
        </div>

        {/* Primary Platform KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 bg-surface border-l-4 border-l-primary flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Total Users
              </div>
              <div className="text-3xl font-extrabold text-text-deep mt-2">
                {data.userCounts.total}
              </div>
            </div>
            <div className="text-xs text-text-muted mt-3 pt-2 border-t border-border flex items-center justify-between">
              <span>{data.userCounts.learners} learners</span>
              <span>•</span>
              <span>{data.userCounts.instructors} instructors</span>
              <span>•</span>
              <span className="font-semibold text-text-deep">{data.userCounts.admins} admins</span>
            </div>
          </div>

          <div className="card p-5 bg-surface border-l-4 border-l-emerald-600 flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Courses in Portfolio
              </div>
              <div className="text-3xl font-extrabold text-text-deep mt-2">
                {data.courseCounts.total}
              </div>
            </div>
            <div className="text-xs text-text-muted mt-3 pt-2 border-t border-border flex items-center justify-between">
              <span className="text-success font-semibold">{data.courseCounts.published} published</span>
              <span>•</span>
              <span className="text-warning font-semibold">{data.courseCounts.draft} drafts</span>
              {data.courseCounts.archived > 0 && (
                <>
                  <span>•</span>
                  <span>{data.courseCounts.archived} archived</span>
                </>
              )}
            </div>
          </div>

          <div className="card p-5 bg-surface border-l-4 border-l-sky-500 flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Total Enrollments
              </div>
              <div className="text-3xl font-extrabold text-text-deep mt-2">
                {data.learningStats.totalEnrollments}
              </div>
            </div>
            <div className="text-xs text-text-muted mt-3 pt-2 border-t border-border flex items-center justify-between">
              <span>{data.learningStats.totalCompletions} course completions</span>
              <span className="font-semibold text-text-deep">
                {data.learningStats.totalEnrollments > 0
                  ? Math.round((data.learningStats.totalCompletions / data.learningStats.totalEnrollments) * 100)
                  : 0}%
              </span>
            </div>
          </div>

          <div className="card p-5 bg-surface border-l-4 border-l-amber-500 flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Learning Velocity
              </div>
              <div className="text-3xl font-extrabold text-text-deep mt-2">
                {data.learningStats.totalLessonsCompleted}
              </div>
            </div>
            <div className="text-xs text-text-muted mt-3 pt-2 border-t border-border flex items-center justify-between">
              <span>Lessons completed</span>
              <span>•</span>
              <span className="text-text-deep font-semibold">{data.learningStats.totalQuizzesPassed} quizzes passed</span>
            </div>
          </div>
        </div>

        {/* Dual-Column Intelligence Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Courses Portfolio Performance */}
          <div className="card p-6 bg-surface border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text-deep">Top Courses by Enrollment</h2>
                <p className="text-xs text-text-muted">Most popular learning curricula across the platform.</p>
              </div>
              <Link to="/admin/courses" className="text-xs text-primary font-semibold hover:underline">
                View All Courses →
              </Link>
            </div>

            {data.topCourses && data.topCourses.length > 0 ? (
              <div className="divide-y divide-border/60 text-xs">
                {data.topCourses.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-text-deep truncate">{c.title}</div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        Instructor: {c.instructorName || 'Platform Instructor'}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-bold text-text-deep">{c.enrollmentCount} enrolled</div>
                        <div className="text-[10px] text-text-muted">{c.completionCount} completed</div>
                      </div>
                      <span
                        className={`badge text-[10px] capitalize font-medium ${
                          c.status === 'published' ? 'badge-success' : 'badge-warning'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic py-4">No course enrollment records found.</p>
            )}
          </div>

          {/* Recent User Registrations */}
          <div className="card p-6 bg-surface border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text-deep">Recent Account Registrations</h2>
                <p className="text-xs text-text-muted">Newly onboarded learners and platform staff.</p>
              </div>
              <Link to="/admin/users" className="text-xs text-primary font-semibold hover:underline">
                User Directory →
              </Link>
            </div>

            {data.recentRegistrations && data.recentRegistrations.length > 0 ? (
              <div className="divide-y divide-border/60 text-xs">
                {data.recentRegistrations.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-text-deep truncate">
                        {u.displayName || u.email.split('@')[0]}
                      </div>
                      <div className="text-[11px] text-text-muted truncate">{u.email}</div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-text-muted">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`badge text-[10px] uppercase font-bold px-2 py-0.5 ${
                          u.role === 'admin'
                            ? 'badge-primary'
                            : u.role === 'instructor'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted italic py-4">No recent user registrations found.</p>
            )}
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="card p-6 bg-surface border border-border space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-deep">Platform Security & Audit Trail</h2>
              <p className="text-xs text-text-muted">
                Cryptographic and operational audit log recorded in PostgreSQL.
              </p>
            </div>
            <Link to="/admin/reports" className="text-xs text-primary font-semibold hover:underline">
              Inspect Full Log →
            </Link>
          </div>

          {data.recentAuditLogs.length === 0 ? (
            <p className="text-xs text-text-muted italic py-4">No audit events recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-soft/60 text-text-muted font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity Type</th>
                    <th className="py-2.5 px-3">Entity ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                  {data.recentAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-soft/40 transition-colors">
                      <td className="py-2.5 px-3 text-text-muted whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-primary">{log.action}</td>
                      <td className="py-2.5 px-3 text-text-deep">{log.entityType || '—'}</td>
                      <td className="py-2.5 px-3 text-text-muted truncate max-w-xs">{log.entityId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
