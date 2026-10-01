import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { courseApi, type CourseListItem } from '../../services/course.service';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  const [courseToDelete, setCourseToDelete] = useState<CourseListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await courseApi.getCourses({
        pageSize: 100,
      });
      setCourses(res.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  async function handleTogglePublish(course: CourseListItem) {
    try {
      if (course.status === 'published') {
        await courseApi.unpublishCourse(course.id);
      } else {
        await courseApi.publishCourse(course.id);
      }
      await fetchCourses();
    } catch (err: any) {
      alert(err?.message || 'Failed to update publish state');
    }
  }

  async function confirmDelete() {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      await courseApi.deleteCourse(courseToDelete.id);
      setCourseToDelete(null);
      await fetchCourses();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete course');
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredCourses = courses.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesLevel = levelFilter === 'all' || c.level === levelFilter;
    const matchesSearch =
      !search.trim() ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.instructor.displayName.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesLevel && matchesSearch;
  });

  const totalCourses = courses.length;
  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const draftCount = courses.filter((c) => c.status === 'draft').length;
  const totalEnrolled = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text-deep">
            Course Administration
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Global catalog moderation, compliance, and course status governance.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 bg-surface border-l-4 border-l-primary">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Total Catalog Courses
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">{totalCourses}</div>
          </div>
          <div className="card p-5 bg-surface border-l-4 border-l-success">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Published
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">{publishedCount}</div>
          </div>
          <div className="card p-5 bg-surface border-l-4 border-l-warning">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Drafts Under Review
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">{draftCount}</div>
          </div>
          <div className="card p-5 bg-surface border-l-4 border-l-sky-500">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Total Enrolled Students
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">{totalEnrolled}</div>
          </div>
        </div>

        {/* Filter and Table Card */}
        <div className="card bg-surface overflow-hidden border border-border shadow-xs">
          {/* Filters Bar */}
          <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="text"
                placeholder="Search title or instructor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input py-1.5 px-3 text-xs w-60"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input py-1.5 px-3 text-xs w-36 capitalize"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="input py-1.5 px-3 text-xs w-36 capitalize"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <button
              onClick={fetchCourses}
              className="btn-sm btn-secondary text-xs self-start md:self-auto"
              type="button"
            >
              Refresh
            </button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="p-12 text-center text-text-muted animate-pulse">
              Loading platform catalog...
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-error font-medium">{error}</p>
              <button
                onClick={fetchCourses}
                className="btn-sm btn-secondary mt-3"
                type="button"
              >
                Retry
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-12 text-center text-text-muted text-sm">
              No courses match your active criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-soft/50 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Instructor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4 text-center">Lessons</th>
                    <th className="py-3 px-4 text-center">Enrolled</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-soft/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-text-deep">
                        <Link
                          to={`/instructor/courses/${course.id}/edit`}
                          className="hover:text-primary transition-colors line-clamp-1"
                        >
                          {course.title}
                        </Link>
                      </td>

                      <td className="py-3 px-4 text-xs text-text-deep">
                        {course.instructor.displayName}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`badge text-xs capitalize ${
                            course.status === 'published'
                              ? 'badge-success'
                              : course.status === 'draft'
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }`}
                        >
                          {course.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-xs text-text-muted capitalize">
                        {course.level}
                      </td>

                      <td className="py-3 px-4 text-center text-xs font-medium">
                        {course.lessonCount || 0}
                      </td>

                      <td className="py-3 px-4 text-center text-xs font-medium">
                        {course.enrollmentCount || 0}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-right space-x-1">
                        <Link
                          to={`/instructor/courses/${course.id}/edit`}
                          className="btn-sm btn-secondary text-xs"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => handleTogglePublish(course)}
                          className={`btn-sm text-xs ${
                            course.status === 'published'
                              ? 'btn-secondary text-warning'
                              : 'btn-primary'
                          }`}
                          type="button"
                        >
                          {course.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>

                        <button
                          onClick={() => setCourseToDelete(course)}
                          className="btn-sm btn-ghost text-xs text-error hover:bg-error-soft"
                          type="button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* DELETE CONFIRMATION MODAL */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 animate-fade-in">
            <h3 className="text-lg font-bold text-text-deep">Administrative Delete</h3>
            <p className="text-sm text-text-muted">
              Confirm deleting course{' '}
              <strong className="text-text-deep">"{courseToDelete.title}"</strong>. This will
              remove all modules, quiz records, and student completions.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                onClick={() => setCourseToDelete(null)}
                className="btn-md btn-secondary"
                type="button"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="btn-md btn-danger"
                type="button"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
