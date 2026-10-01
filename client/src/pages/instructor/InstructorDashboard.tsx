import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { courseApi, type CourseListItem } from '../../services/course.service';
import { reportsApi, type InstructorReportSummary } from '../../services/reports.service';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [reports, setReports] = useState<InstructorReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Create course modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newShortDesc, setNewShortDesc] = useState('');
  const [newLevel, setNewLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [newMinutes, setNewMinutes] = useState('60');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete modal
  const [courseToDelete, setCourseToDelete] = useState<CourseListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Publish / Unpublish confirmation
  const [courseToTogglePublish, setCourseToTogglePublish] = useState<CourseListItem | null>(null);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  // Create course confirmation
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const [coursesRes, reportsRes] = await Promise.all([
        courseApi.getCourses({
          instructorId: user.id,
          pageSize: 50,
        }),
        reportsApi.getInstructorReports().catch(() => null),
      ]);
      setCourses(coursesRes.data);
      setReports(reportsRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Status toggle handler
  function handleTogglePublish(course: CourseListItem) {
    setCourseToTogglePublish(course);
  }

  async function executeTogglePublish() {
    if (!courseToTogglePublish) return;
    setIsTogglingPublish(true);
    setActionError(null);
    try {
      if (courseToTogglePublish.status === 'published') {
        await courseApi.unpublishCourse(courseToTogglePublish.id);
      } else {
        await courseApi.publishCourse(courseToTogglePublish.id);
      }
      setCourseToTogglePublish(null);
      await fetchCourses();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to change course status');
    } finally {
      setIsTogglingPublish(false);
    }
  }

  // Create course trigger
  function handleCreateCourseFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError('Course title is required');
      return;
    }
    setCreateError(null);
    setShowCreateConfirm(true);
  }

  // Final confirmed creation
  async function executeCreateCourse() {
    setIsCreating(true);
    setCreateError(null);

    try {
      const created = await courseApi.createCourse({
        title: newTitle.trim(),
        shortDescription: newShortDesc.trim() || undefined,
        level: newLevel,
        estimatedMinutes: parseInt(newMinutes, 10) || 60,
      });
      setShowCreateConfirm(false);
      setShowCreateModal(false);
      navigate(`/instructor/courses/${created.id}/edit`);
    } catch (err: any) {
      setCreateError(err?.message || 'Failed to create course');
      setShowCreateConfirm(false);
    } finally {
      setIsCreating(false);
    }
  }

  // Delete course confirm
  async function confirmDelete() {
    if (!courseToDelete) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await courseApi.deleteCourse(courseToDelete.id);
      setCourseToDelete(null);
      await fetchCourses();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to delete course');
    } finally {
      setIsDeleting(false);
    }
  }

  // Computed metrics
  const totalCourses = courses.length;
  const publishedCount = courses.filter((c) => c.status === 'published').length;
  const draftCount = courses.filter((c) => c.status === 'draft').length;
  const totalEnrolled = courses.reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
  const totalViews = courses.reduce((sum, c) => sum + (c.viewCount || 0), 0);

  // Filtered course list
  const filteredCourses = courses.filter((c) => {
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesSearch =
      !searchFilter.trim() ||
      c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (c.shortDescription && c.shortDescription.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Top Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-deep">
              Instructor Studio
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Create, design, and manage your courses, curriculum, and quizzes.
            </p>
          </div>

          <button
            onClick={() => {
              setNewTitle('');
              setNewShortDesc('');
              setNewLevel('beginner');
              setNewMinutes('60');
              setCreateError(null);
              setShowCreateModal(true);
            }}
            className="btn-md btn-primary flex items-center gap-2 self-start sm:self-auto shadow-sm"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Course</span>
          </button>
        </div>

        {/* Action Error Alert */}
        {actionError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 py-3 px-4 rounded-xl text-xs font-medium flex items-center justify-between">
            <span>⚠️ {actionError}</span>
            <button
              onClick={() => setActionError(null)}
              className="text-rose-600 hover:text-rose-800 text-xs font-semibold ml-2"
              type="button"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Analytics & Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 border-l-4 border-l-primary bg-surface shadow-xs">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Total Courses
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">
              {totalCourses}
            </div>
            <div className="text-xs text-text-muted mt-1 flex items-center gap-2">
              <span className="text-success font-medium">{publishedCount} published</span>
              <span>•</span>
              <span className="text-warning font-medium">{draftCount} drafts</span>
            </div>
          </div>

          <div className="card p-5 border-l-4 border-l-emerald-500 bg-surface shadow-xs">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Total Learners
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">
              {totalEnrolled}
            </div>
            <div className="text-xs text-text-muted mt-1">
              Active student enrollments
            </div>
          </div>

          <div className="card p-5 border-l-4 border-l-sky-500 bg-surface shadow-xs">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Total Views
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">
              {totalViews}
            </div>
            <div className="text-xs text-text-muted mt-1">
              Catalog impressions & visits
            </div>
          </div>

          <div className="card p-5 border-l-4 border-l-amber-500 bg-surface shadow-xs">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Completion Rate
            </div>
            <div className="text-3xl font-extrabold text-text-deep mt-2">
              {reports?.overallCompletionRate ?? 0}%
            </div>
            <div className="text-xs text-text-muted mt-1">
              {reports?.totalCompletions ?? 0} learner completions
            </div>
          </div>
        </div>

        {/* Course Catalog Management Table / List */}
        <div className="card bg-surface overflow-hidden shadow-xs border border-border">
          {/* Card Header & Filters */}
          <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-text-deep">Courses Portfolio</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Manage curriculum, lessons, quizzes, and publishing status
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter courses..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="input py-1.5 px-3 text-xs w-48 sm:w-64"
                />
              </div>

              {/* Status tabs */}
              <div className="flex items-center rounded-md bg-soft p-0.5 border border-border text-xs">
                {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 font-medium capitalize rounded transition-colors ${
                      statusFilter === st
                        ? 'bg-surface text-text-deep shadow-xs font-semibold'
                        : 'text-text-muted hover:text-text-deep'
                    }`}
                    type="button"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="p-12 text-center text-text-muted animate-pulse">
              Loading courses and curriculum data...
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
            <div className="p-12 text-center space-y-3">
              <div className="text-4xl">📚</div>
              <h3 className="text-base font-semibold text-text-deep">No courses found</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                {courses.length === 0
                  ? "You haven't created any courses yet. Launch your first course to begin teaching!"
                  : 'No courses match your active search or status filter.'}
              </p>
              {courses.length === 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-sm btn-primary mt-2"
                  type="button"
                >
                  Create Your First Course
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-soft/50 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4 text-center">Lessons</th>
                    <th className="py-3 px-4 text-center">Students</th>
                    <th className="py-3 px-4 text-center">Views</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="hover:bg-soft/40 transition-colors">
                      {/* Course Title & Metadata */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-gradient-to-br from-primary/10 to-primary/20 flex-shrink-0 flex items-center justify-center text-primary font-bold text-lg border border-border">
                            {course.thumbnailPath ? (
                              <img
                                src={course.thumbnailPath}
                                alt={course.title}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              '📖'
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/instructor/courses/${course.id}/edit`}
                              className="font-semibold text-text-deep hover:text-primary transition-colors block"
                            >
                              {course.title}
                            </Link>
                            <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                              {course.shortDescription || 'No short summary provided.'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`badge ${
                            course.status === 'published'
                              ? 'badge-success'
                              : course.status === 'draft'
                              ? 'badge-warning'
                              : 'badge-neutral'
                          } capitalize`}
                        >
                          {course.status}
                        </span>
                      </td>

                      {/* Level */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-text-muted capitalize">
                        {course.level}
                      </td>

                      {/* Lesson Count */}
                      <td className="py-4 px-4 whitespace-nowrap text-center text-xs font-semibold text-text-deep">
                        {course.lessonCount || 0}
                      </td>

                      {/* Students */}
                      <td className="py-4 px-4 whitespace-nowrap text-center text-xs font-semibold text-text-deep">
                        {course.enrollmentCount || 0}
                      </td>

                      {/* Views */}
                      <td className="py-4 px-4 whitespace-nowrap text-center text-xs text-text-muted">
                        {course.viewCount || 0}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 whitespace-nowrap text-right space-x-1">
                        {/* Edit Button */}
                        <Link
                          to={`/instructor/courses/${course.id}/edit`}
                          className="btn-sm btn-secondary text-xs"
                          title="Edit Course & Curriculum"
                        >
                          Edit
                        </Link>

                        {/* Publish/Unpublish Toggle */}
                        <button
                          onClick={() => handleTogglePublish(course)}
                          className={`btn-sm text-xs ${
                            course.status === 'published'
                              ? 'btn-secondary text-warning'
                              : 'btn-primary'
                          }`}
                          type="button"
                          title={course.status === 'published' ? 'Unpublish Course' : 'Publish Course'}
                        >
                          {course.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>

                        {/* View Public Preview */}
                        <Link
                          to={`/courses/${course.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-sm btn-ghost text-xs"
                          title="Open public page"
                        >
                          View ↗
                        </Link>

                        {/* Delete Button */}
                        <button
                          onClick={() => setCourseToDelete(course)}
                          className="btn-sm btn-ghost text-xs text-error hover:bg-error-soft"
                          type="button"
                          title="Delete course"
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

        {/* Draft Courses Needing Attention */}
        {courses.filter((c) => c.status === 'draft').length > 0 && (
          <div className="card p-6 bg-surface border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-text-deep flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Draft Courses Needing Attention
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  These courses are currently unpublished and hidden from the student catalog.
                </p>
              </div>
              <span className="badge badge-warning text-xs">
                {courses.filter((c) => c.status === 'draft').length} Drafts
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {courses
                .filter((c) => c.status === 'draft')
                .map((draft) => (
                  <div
                    key={draft.id}
                    className="p-4 rounded-xl border border-border bg-soft/40 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm text-text-deep truncate">{draft.title}</h4>
                      <div className="text-xs text-text-muted mt-0.5">
                        {draft.lessonCount || 0} lessons • {draft.level}
                      </div>
                    </div>
                    <Link
                      to={`/instructor/courses/${draft.id}/edit`}
                      className="btn-sm btn-primary text-xs shrink-0"
                    >
                      Continue Editing →
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Enrollments Activity */}
        <div className="card p-6 bg-surface border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-text-deep">Recent Student Enrollments</h3>
              <p className="text-xs text-text-muted">Real-time student signups across your published courses.</p>
            </div>
            <Link to="/instructor/reports" className="text-xs text-primary font-semibold hover:underline">
              View Full Analytics Report →
            </Link>
          </div>

          {!reports?.recentEnrollments || reports.recentEnrollments.length === 0 ? (
            <p className="text-xs text-text-muted italic py-4">No student enrollments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-soft/60 text-text-muted font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Learner</th>
                    <th className="py-2.5 px-3">Course</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {reports.recentEnrollments.map((enr) => (
                    <tr key={enr.id} className="hover:bg-soft/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-text-deep">{enr.learnerName || 'Learner'}</div>
                        <div className="text-[10px] text-text-muted">{enr.learnerEmail}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-text-deep">{enr.courseTitle}</td>
                      <td className="py-3 px-3 text-text-muted">
                        {new Date(enr.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className="badge badge-success text-[10px] capitalize">
                          {enr.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* CREATE COURSE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-text-deep">Create New Course</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-text-muted hover:text-text-deep p-1 rounded"
                type="button"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-error-soft text-error border border-error/20 rounded text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCourseFormSubmit} className="space-y-4">
              <div>
                <label className="label">Course Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Full-Stack Development with TypeScript"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Short Subtitle / Description</label>
                <input
                  type="text"
                  placeholder="Brief one-line summary displayed on cards and search"
                  value={newShortDesc}
                  onChange={(e) => setNewShortDesc(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Skill Level</label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value as any)}
                    className="input capitalize"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="label">Est. Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="10000"
                    value={newMinutes}
                    onChange={(e) => setNewMinutes(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-md btn-secondary"
                  type="button"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-md btn-primary"
                  disabled={isCreating}
                >
                  Create & Open Editor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={courseToDelete !== null}
        title="Delete course?"
        description={
          courseToDelete ? (
            <div className="space-y-2">
              <p>
                Are you sure you want to delete{' '}
                <strong className="text-text-deep">"{courseToDelete.title}"</strong>?
              </p>
              <p>
                This action permanently deletes the course and its associated content. This cannot be undone.
              </p>
            </div>
          ) : ''
        }
        confirmLabel="Delete Course"
        cancelLabel="Cancel"
        variant="destructive"
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!isDeleting) setCourseToDelete(null);
        }}
      />

      {/* PUBLISH / UNPUBLISH CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={courseToTogglePublish !== null}
        title={
          courseToTogglePublish?.status === 'published'
            ? 'Unpublish course?'
            : 'Publish course?'
        }
        description={
          courseToTogglePublish?.status === 'published'
            ? 'This course will be removed from the public learner catalog. Existing learner access will follow the platform\'s access rules.'
            : 'This course will become visible to learners in the published catalog.'
        }
        confirmLabel={
          courseToTogglePublish?.status === 'published'
            ? 'Unpublish Course'
            : 'Publish Course'
        }
        cancelLabel="Cancel"
        variant={courseToTogglePublish?.status === 'published' ? 'warning' : 'default'}
        loading={isTogglingPublish}
        onConfirm={executeTogglePublish}
        onCancel={() => {
          if (!isTogglingPublish) setCourseToTogglePublish(null);
        }}
      />

      {/* CREATE COURSE CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={showCreateConfirm}
        title="Create course?"
        description="Create this course as a draft?"
        confirmLabel="Create Course"
        cancelLabel="Cancel"
        variant="default"
        loading={isCreating}
        onConfirm={executeCreateCourse}
        onCancel={() => {
          if (!isCreating) setShowCreateConfirm(false);
        }}
      />
    </div>
  );
}
