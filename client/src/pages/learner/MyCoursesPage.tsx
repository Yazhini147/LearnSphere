import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { learningApi, type EnrolledCourseItem } from '../../services/learning.service';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState<EnrolledCourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [search, setSearch] = useState('');

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await learningApi.getMyEnrollments();
      setCourses(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load enrolled courses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filtered = courses.filter((c) => {
    const isComp = c.status === 'completed' || c.progressPercent >= 100;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'completed' && isComp) ||
      (statusFilter === 'in_progress' && !isComp);

    const matchesSearch =
      !search.trim() ||
      c.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      (c.shortDescription && c.shortDescription.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-deep">My Courses</h1>
            <p className="text-sm text-text-muted mt-1">
              All courses you are actively enrolled in or have successfully completed.
            </p>
          </div>

          <Link to="/explore" className="btn-md btn-primary text-xs self-start sm:self-auto">
            + Discover More Courses
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-border">
          <input
            type="text"
            placeholder="Search enrolled courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input text-xs py-2 w-full sm:w-72"
          />

          <div className="flex items-center rounded-md bg-soft p-0.5 border border-border text-xs self-start sm:self-auto">
            {(['all', 'in_progress', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 font-medium capitalize rounded transition-colors ${
                  statusFilter === st
                    ? 'bg-surface text-text-deep shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text-deep'
                }`}
                type="button"
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="card p-12 text-center text-text-muted animate-pulse">
            Loading your courses...
          </div>
        ) : error ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-error">{error}</p>
            <button onClick={fetchCourses} className="btn-sm btn-secondary mt-3" type="button">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center bg-surface space-y-3">
            <div className="text-4xl">📚</div>
            <h3 className="text-base font-semibold text-text-deep">No courses found</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto">
              {courses.length === 0
                ? "You haven't enrolled in any courses yet."
                : 'No courses match your active search and status filter.'}
            </p>
            {courses.length === 0 && (
              <Link to="/explore" className="btn-sm btn-primary mt-2 inline-flex">
                Browse Courses
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="card bg-surface overflow-hidden border border-border flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="h-40 bg-soft relative overflow-hidden flex items-center justify-center">
                    {item.thumbnailPath ? (
                      <img
                        src={item.thumbnailPath}
                        alt={item.courseTitle}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-3xl">💻</div>
                    )}
                    <span className="absolute top-2.5 right-2.5 badge badge-neutral text-[10px] capitalize">
                      {item.level}
                    </span>
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-text-deep text-base line-clamp-1">
                      {item.courseTitle}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2">
                      {item.shortDescription || 'Hands-on curriculum with real world modules.'}
                    </p>
                    <p className="text-xs text-primary font-medium">
                      Instructor: {item.instructor.displayName}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  <div className="space-y-1 border-t border-border pt-3">
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Course Progress</span>
                      <span className="font-semibold text-text-deep">{item.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-soft h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-text-muted">
                      {item.completedLessonsCount}/{item.totalLessonsCount} lessons
                    </span>
                    <Link
                      to={`/learner/courses/${item.courseId}/learn`}
                      className="btn-sm btn-primary text-xs"
                    >
                      {item.progressPercent >= 100 ? 'Review Course' : 'Resume Course →'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
