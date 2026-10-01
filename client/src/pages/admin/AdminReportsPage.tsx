import { useState, useEffect, useCallback } from 'react';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { reportsApi, type AdminReportSummary } from '../../services/reports.service';

export default function AdminReportsPage() {
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
      setError(err?.message || 'Failed to load platform reports');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-deep">
            Platform System Reports
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Global ecosystem metrics, user role distribution, and compliance audit trail.
          </p>
        </div>

        {isLoading ? (
          <div className="card p-12 text-center text-text-muted animate-pulse">
            Compiling platform metrics...
          </div>
        ) : error || !data ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-error">{error || 'Failed to load report'}</p>
            <button onClick={loadData} className="btn-sm btn-secondary mt-3" type="button">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-5 bg-surface border-l-4 border-l-primary">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Total Users
                </div>
                <div className="text-3xl font-extrabold text-text-deep mt-2">
                  {data.userCounts.total}
                </div>
                <div className="text-xs text-text-muted mt-1 flex gap-2">
                  <span>{data.userCounts.learners} learners</span>
                  <span>•</span>
                  <span>{data.userCounts.instructors} instructors</span>
                </div>
              </div>

              <div className="card p-5 bg-surface border-l-4 border-l-success">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Total Courses
                </div>
                <div className="text-3xl font-extrabold text-text-deep mt-2">
                  {data.courseCounts.total}
                </div>
                <div className="text-xs text-text-muted mt-1 flex gap-2">
                  <span className="text-success">{data.courseCounts.published} published</span>
                  <span>•</span>
                  <span className="text-warning">{data.courseCounts.draft} drafts</span>
                </div>
              </div>

              <div className="card p-5 bg-surface border-l-4 border-l-sky-500">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Total Enrollments
                </div>
                <div className="text-3xl font-extrabold text-text-deep mt-2">
                  {data.learningStats.totalEnrollments}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {data.learningStats.totalCompletions} course completions
                </div>
              </div>

              <div className="card p-5 bg-surface border-l-4 border-l-amber-500">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Completed Lessons
                </div>
                <div className="text-3xl font-extrabold text-text-deep mt-2">
                  {data.learningStats.totalLessonsCompleted}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {data.learningStats.totalQuizzesPassed} quizzes passed
                </div>
              </div>
            </div>

            {/* Audit Logs Trail */}
            <div className="card bg-surface overflow-hidden border border-border">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-bold text-text-deep">Recent Security & Audit Trail</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Append-only immutable record of administrative, auth, and enrollment actions
                </p>
              </div>

              {data.recentAuditLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted">No audit logs recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-soft/50 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Entity Type</th>
                        <th className="py-3 px-4">Entity ID</th>
                        <th className="py-3 px-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {data.recentAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-soft/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-text-deep">
                            {log.action}
                          </td>
                          <td className="py-3 px-4 capitalize text-text-muted">
                            {log.entityType || '—'}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-text-muted">
                            {log.entityId || '—'}
                          </td>
                          <td className="py-3 px-4 text-right text-text-muted whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
