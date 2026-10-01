import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { learningApi, type EnrolledCourseItem } from '../../services/learning.service';
import { courseApi, type CourseListItem } from '../../services/course.service';

export default function LearnerDashboard() {
  const { user } = useAuth();

  const [enrollments, setEnrollments] = useState<EnrolledCourseItem[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<CourseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [enrolledData, catalogData] = await Promise.all([
        learningApi.getMyEnrollments(),
        courseApi.getCourses({ pageSize: 4, sortBy: 'popular' }),
      ]);
      setEnrollments(enrolledData);
      setFeaturedCourses(catalogData.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load learning dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Metrics
  const totalEnrolled = enrollments.length;
  const inProgress = enrollments.filter((e) => e.status === 'in_progress' || (e.status === 'enrolled' && e.progressPercent < 100));
  const completed = enrollments.filter((e) => e.status === 'completed' || e.progressPercent >= 100);
  const totalLessonsDone = enrollments.reduce((sum, e) => sum + (e.completedLessonsCount || 0), 0);

  // Active Hero course: in progress with lowest completion, or first enrolled
  const activeCourse = inProgress.length > 0 ? inProgress[0] : enrollments.length > 0 ? enrollments[0] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-deep">
              Welcome back, {user?.displayName || 'Learner'}! 👋
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Track your learning momentum, finish modules, and earn master certificates.
            </p>
          </div>

          <Link to="/explore" className="btn-md btn-secondary text-xs self-start sm:self-auto">
            Browse All Courses →
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 bg-surface border-l-4 border-l-primary">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Enrolled Courses
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">{totalEnrolled}</div>
            <div className="text-xs text-text-muted mt-1">Active curriculum access</div>
          </div>

          <div className="card p-5 bg-surface border-l-4 border-l-amber-500">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              In Progress
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">{inProgress.length}</div>
            <div className="text-xs text-text-muted mt-1">Ongoing coursework</div>
          </div>

          <div className="card p-5 bg-surface border-l-4 border-l-success">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Completed
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">{completed.length}</div>
            <div className="text-xs text-text-muted mt-1">Courses mastered</div>
          </div>

          <div className="card p-5 bg-surface border-l-4 border-l-sky-500">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Completed Lessons
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">{totalLessonsDone}</div>
            <div className="text-xs text-text-muted mt-1">Modules finished</div>
          </div>
        </div>

        {/* Continue Learning Spotlight Hero */}
        {activeCourse && (
          <div className="card bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-2xl shadow-md border-0 relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white backdrop-blur-md border border-white/20">
                Continue Learning
              </span>

              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {activeCourse.courseTitle}
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 line-clamp-2">
                {activeCourse.shortDescription || 'Pick up right where you left off in this course.'}
              </p>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>
                    {activeCourse.completedLessonsCount} of {activeCourse.totalLessonsCount} lessons finished
                  </span>
                  <span className="font-semibold text-white">{activeCourse.progressPercent}%</span>
                </div>
                <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{ width: `${activeCourse.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to={`/learner/courses/${activeCourse.courseId}/learn`}
                  className="btn-md btn-primary text-sm font-semibold inline-flex items-center gap-2 shadow-lg"
                >
                  <span>Resume Course</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Active Enrolled Courses */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-deep">My Enrolled Courses</h2>
            {enrollments.length > 0 && (
              <Link to="/learner/my-courses" className="text-xs font-semibold text-primary hover:underline">
                View All ({enrollments.length}) →
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="card p-12 text-center text-text-muted animate-pulse">
              Loading enrolled courses...
            </div>
          ) : error ? (
            <div className="card p-8 text-center">
              <p className="text-sm text-error">{error}</p>
              <button onClick={loadData} className="btn-sm btn-secondary mt-3" type="button">
                Retry
              </button>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="card p-12 text-center bg-surface space-y-4 border border-dashed border-border">
              <div className="text-5xl">🎯</div>
              <h3 className="text-lg font-bold text-text-deep">Start Your First Course</h3>
              <p className="text-xs text-text-muted max-w-md mx-auto">
                Explore our catalog of production-ready software engineering, full-stack development, and architecture courses.
              </p>
              <Link to="/explore" className="btn-md btn-primary inline-flex">
                Explore Course Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {enrollments.map((item) => (
                <div
                  key={item.id}
                  className="card bg-surface overflow-hidden border border-border flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="h-36 bg-soft relative overflow-hidden flex items-center justify-center">
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

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-bold text-text-deep text-base line-clamp-1">
                        {item.courseTitle}
                      </h3>
                      <p className="text-xs text-text-muted line-clamp-2 mt-1">
                        {item.shortDescription || 'Comprehensive hands-on course curriculum.'}
                      </p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-border">
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-text-muted">
                          <span>Progress</span>
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
                          {item.progressPercent >= 100 ? 'Review' : 'Continue →'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended from Catalog */}
        {featuredCourses.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-deep">Recommended For You</h2>
              <Link to="/explore" className="text-xs font-semibold text-primary hover:underline">
                Explore More →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredCourses.map((c) => (
                <Link
                  key={c.id}
                  to={`/courses/${c.id}`}
                  className="card p-4 bg-surface border border-border hover:border-primary/50 transition-colors group"
                >
                  <div className="h-28 rounded bg-soft flex items-center justify-center text-2xl mb-3 overflow-hidden">
                    {c.thumbnailPath ? (
                      <img src={c.thumbnailPath} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      '🚀'
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-text-deep group-hover:text-primary transition-colors line-clamp-1">
                    {c.title}
                  </h4>
                  <p className="text-xs text-text-muted line-clamp-1 mt-1">
                    {c.shortDescription || 'Learn in-depth techniques.'}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-text-muted mt-3 pt-2 border-t border-border">
                    <span className="capitalize">{c.level}</span>
                    <span className="font-semibold text-primary">Free</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
