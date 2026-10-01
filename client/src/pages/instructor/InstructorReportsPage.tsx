import { useState, useEffect, useCallback } from 'react';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { reportsApi, type InstructorReportSummary } from '../../services/reports.service';

export default function InstructorReportsPage() {
  const [data, setData] = useState<InstructorReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await reportsApi.getInstructorReports();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load instructor analytics');
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
            Instructor Performance Analytics
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Real-time telemetry on student completion, catalog impressions, and quiz outcomes.
          </p>
        </div>

        {isLoading ? (
          <div className="card p-12 text-center text-text-muted animate-pulse">
            Calculating cohort metrics and curriculum analytics...
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
            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-5 bg-surface border-l-4 border-l-primary">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Total Enrolled Students
                </div>
                <div className="text-3xl font-extrabold text-text-deep mt-2">
                  {data.totalEnrollments}
                </div>
                <div className="text-xs text-text-muted mt-1">Learners across all courses</div>
              </div>

              <div className="card p-5 bg-surface border-l-4 border-l-success">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Course Completions
                </div>
                <div className="text-3xl font-extrabold text-text-deep mt-2">
                  {data.totalCompletions}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  Overall completion rate: {data.overallCompletionRate}%
                </div>
              </div>

              <div className="card p-5 bg-surface border-l-4 border-l-amber-500">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Average Quiz Score
                </div>
                <div className="text-3xl font-extrabold text-text-deep mt-2">
                  {data.averageQuizScore}%
                </div>
                <div className="text-xs text-text-muted mt-1">Across all assessment submissions</div>
              </div>

              <div className="card p-5 bg-surface border-l-4 border-l-sky-500">
                <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Catalog Views
                </div>
                <div className="text-3xl font-extrabold text-text-deep mt-2">
                  {data.totalViews}
                </div>
                <div className="text-xs text-text-muted mt-1">Public course page visits</div>
              </div>
            </div>

            {/* Course Breakdown Table */}
            <div className="card bg-surface overflow-hidden border border-border">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-bold text-text-deep">Course Breakdown</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Detailed enrollment, retention, and lesson density by course
                </p>
              </div>

              {data.courseBreakdown.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-muted">
                  No courses created yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-soft/50 text-xs font-semibold text-text-muted uppercase tracking-wider">
                        <th className="py-3 px-4">Course Title</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Lessons</th>
                        <th className="py-3 px-4 text-center">Enrolled</th>
                        <th className="py-3 px-4 text-center">Completed</th>
                        <th className="py-3 px-4 text-center">Completion Rate</th>
                        <th className="py-3 px-4 text-right">Views</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {data.courseBreakdown.map((c) => (
                        <tr key={c.courseId} className="hover:bg-soft/30 transition-colors">
                          <td className="py-3 px-4 font-semibold text-text-deep">{c.courseTitle}</td>
                          <td className="py-3 px-4 capitalize">
                            <span
                              className={`badge text-[10px] ${
                                c.status === 'published' ? 'badge-success' : 'badge-neutral'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">{c.lessonCount}</td>
                          <td className="py-3 px-4 text-center font-semibold">{c.enrolledCount}</td>
                          <td className="py-3 px-4 text-center text-success font-semibold">
                            {c.completedCount}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-semibold">{c.completionRate}%</span>
                              <div className="w-12 bg-soft h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-primary h-full rounded-full"
                                  style={{ width: `${c.completionRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-text-muted">{c.viewCount}</td>
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
