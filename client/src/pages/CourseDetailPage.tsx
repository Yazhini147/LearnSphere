import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PublicNavbar } from '../components/ui/PublicNavbar';
import { courseApi, type CourseDetail } from '../services/course.service';
import { useAuth } from '../features/auth/AuthContext';
import { apiClient } from '../services/api-client';

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    courseApi
      .getCourse(courseId)
      .then((data) => setCourse(data))
      .catch((err) => {
        setError(err.message || 'Course not found or an error occurred.');
      })
      .finally(() => setIsLoading(false));
  }, [courseId]);

  async function handleEnroll() {
    if (!isAuthenticated) {
      navigate(`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    if (!course) return;

    setIsEnrolling(true);
    setEnrollError(null);
    try {
      await apiClient.post(`/api/v1/courses/${course.id}/enroll`);
      // Refresh course data to reflect enrollment
      const updated = await courseApi.getCourse(course.id);
      setCourse(updated);
      navigate(`/learner/courses/${course.id}/learn`);
    } catch (err: any) {
      setEnrollError(err.message || 'Failed to enroll. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-text-muted">Loading course details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <PublicNavbar />
        <div className="flex-1 page-container py-16 text-center max-w-lg mx-auto">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-text-deep mb-2">Course Not Found</h1>
          <p className="text-text-muted text-sm mb-6">
            {error || "The course you are looking for doesn't exist or is currently unpublished."}
          </p>
          <Link to="/explore" className="btn-md btn-primary">
            Back to Course Catalog
          </Link>
        </div>
      </div>
    );
  }

  const hours = Math.floor(course.estimatedMinutes / 60);
  const minutes = course.estimatedMinutes % 60;
  const durationText = hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`;

  const lessonTypeIcons: Record<string, string> = {
    video: '📹',
    document: '📄',
    image: '🖼',
    quiz: '⚡',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />

      {/* Hero Header */}
      <header className="bg-surface border-b border-border py-10">
        <div className="page-container">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-4 text-xs text-text-muted flex items-center gap-1.5">
            <Link to="/" className="hover:text-text-deep">Home</Link>
            <span>/</span>
            <Link to="/explore" className="hover:text-text-deep">Courses</Link>
            <span>/</span>
            <span className="text-text-deep font-medium truncate max-w-xs">{course.title}</span>
          </nav>

          <div className="max-w-4xl">
            {/* Tags & Level */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-soft text-primary capitalize border border-primary/20">
                {course.level}
              </span>
              {course.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-soft text-text-muted"
                >
                  {tag.name}
                </span>
              ))}
            </div>

            {/* Course Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold text-text-deep tracking-tight mb-4 leading-tight">
              {course.title}
            </h1>

            {/* Short description */}
            {course.shortDescription && (
              <p className="text-lg text-text-muted leading-relaxed mb-6">
                {course.shortDescription}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-text-muted pt-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center text-xs">
                  {course.instructor.displayName.charAt(0)}
                </div>
                <div>
                  <span className="text-xs text-text-muted block">Created by</span>
                  <span className="font-semibold text-text-deep">{course.instructor.displayName}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 border-l border-border pl-6">
                <div>
                  <span className="text-xs text-text-muted block">Duration</span>
                  <span className="font-semibold text-text-deep">⏱ {durationText}</span>
                </div>
                <div>
                  <span className="text-xs text-text-muted block">Curriculum</span>
                  <span className="font-semibold text-text-deep">📚 {course.lessonCount} lessons</span>
                </div>
                <div>
                  <span className="text-xs text-text-muted block">Students</span>
                  <span className="font-semibold text-text-deep">👥 {course.enrollmentCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="page-container py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left 2 Columns: Description + Syllabus + Instructor */}
          <div className="lg:col-span-2 space-y-10">
            {/* About Course */}
            <section className="bg-surface rounded-xl border border-border p-6 sm:p-8">
              <h2 className="text-xl font-bold text-text-deep mb-4">About this course</h2>
              <div className="prose text-text-muted leading-relaxed space-y-4">
                {course.description ? (
                  course.description.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))
                ) : (
                  <p>{course.shortDescription}</p>
                )}
              </div>
            </section>

            {/* Course Syllabus / Lessons Outline */}
            <section className="bg-surface rounded-xl border border-border p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text-deep">Course Syllabus</h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {course.lessons.length} structured learning modules
                  </p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-soft rounded text-text-muted">
                  Total: {durationText}
                </span>
              </div>

              <div className="space-y-3">
                {course.lessons.map((lesson, idx) => {
                  const m = Math.floor(lesson.durationSeconds / 60);
                  const s = lesson.durationSeconds % 60;
                  const durStr = m > 0 ? `${m}m ${s > 0 ? `${s}s` : ''}` : `${s}s`;
                  const icon = lessonTypeIcons[lesson.type] || '📄';

                  return (
                    <div
                      key={lesson.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border/70 hover:border-border hover:bg-soft/40 transition-colors"
                    >
                      {/* Position & Type */}
                      <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm" title={lesson.type}>
                            {icon}
                          </span>
                          <h3 className="text-sm font-semibold text-text-deep truncate">
                            {lesson.title}
                          </h3>
                        </div>
                        {lesson.description && (
                          <p className="text-xs text-text-muted line-clamp-2 mb-1">
                            {lesson.description}
                          </p>
                        )}
                      </div>

                      {/* Duration & Status */}
                      <div className="text-right shrink-0">
                        <span className="text-xs text-text-muted font-medium">
                          {durStr}
                        </span>
                        {lesson.isRequired && (
                          <span className="block text-[10px] text-primary/80 font-medium mt-0.5">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Instructor Card */}
            <section className="bg-surface rounded-xl border border-border p-6 sm:p-8">
              <h2 className="text-xl font-bold text-text-deep mb-4">Your Instructor</h2>
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 rounded-full bg-primary-soft text-primary text-2xl font-bold flex items-center justify-center shrink-0 border border-primary/20">
                  {course.instructor.displayName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-deep">
                    {course.instructor.displayName}
                  </h3>
                  <p className="text-xs text-primary font-medium mb-3">Course Author & Verified Educator</p>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {course.instructor.bio ||
                      'Passionate instructor dedicated to creating rigorous, practical curriculum for software engineers.'}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Action Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
              {/* Card visual banner */}
              <div className="h-40 bg-gradient-to-br from-slate-900 via-indigo-950 to-primary flex items-center justify-center p-6 text-white text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-inner">
                  🎓
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex justify-between text-xs text-white/80">
                  <span>Full Course Access</span>
                  <span>Free Enrollment</span>
                </div>
              </div>

              {/* Action Box */}
              <div className="p-6">
                {enrollError && (
                  <div className="mb-4 p-3 bg-error-soft text-error text-xs rounded-lg border border-error/20">
                    {enrollError}
                  </div>
                )}

                {course.isEnrolled ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-primary-soft/60 rounded-xl border border-primary/20">
                      <div className="flex items-center justify-between text-xs font-semibold text-primary mb-2">
                        <span>Enrolled Status</span>
                        <span>{course.progressPercent ?? 0}% Completed</span>
                      </div>
                      <div className="w-full bg-white h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${course.progressPercent ?? 0}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      to={`/learner/courses/${course.id}/learn`}
                      className="btn-lg btn-primary w-full text-center block"
                    >
                      Continue Learning →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={handleEnroll}
                      disabled={isEnrolling}
                      className="btn-lg btn-primary w-full"
                    >
                      {isEnrolling ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        'Enroll in Course — Free'
                      )}
                    </button>
                    {!isAuthenticated && (
                      <p className="text-center text-xs text-text-muted">
                        Already have an account?{' '}
                        <Link
                          to={`/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`}
                          className="text-primary hover:underline font-medium"
                        >
                          Sign in
                        </Link>
                      </p>
                    )}
                  </div>
                )}

                {/* Benefits List */}
                <div className="mt-6 pt-6 border-t border-border space-y-3">
                  <h4 className="text-xs font-bold text-text-deep uppercase tracking-wider">
                    This course includes:
                  </h4>
                  <ul className="text-xs text-text-muted space-y-2.5">
                    <li className="flex items-center gap-2.5">
                      <span className="text-primary">✓</span>
                      <span>{course.lessonCount} video, text & interactive lessons</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-primary">✓</span>
                      <span>Integrated quizzes with instant grading</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-primary">✓</span>
                      <span>Gamification XP points and achievement rewards</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-primary">✓</span>
                      <span>Persistent progress tracking across devices</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="text-primary">✓</span>
                      <span>Full lifetime access with zero subscription fees</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 text-center text-xs text-text-muted">
        <p>© 2026 LearnSphere Platform. Built for real learning with verifiable depth.</p>
      </footer>
    </div>
  );
}
