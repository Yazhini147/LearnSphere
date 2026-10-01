import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { courseApi, type CourseDetail } from '../../services/course.service';
import {
  learningApi,
  type CourseProgressDetail,
  type LessonProgressOutline,
  type QuizAttemptResult,
} from '../../services/learning.service';
import { LoadingState } from '../../components/feedback/LoadingState';
import { ErrorState } from '../../components/feedback/ErrorState';

export default function LearningPlayerPage() {
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<CourseProgressDetail | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeLessonDetail, setActiveLessonDetail] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lesson Action State
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionBanner, setCompletionBanner] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Video Simulation State
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(0);

  // Quiz Runner State
  const [quizData, setQuizData] = useState<any | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizAttemptResult | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  // 1. Initial Load: Course and Progress Outline
  const loadCourseAndProgress = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [c, p] = await Promise.all([
        courseApi.getCourse(courseId),
        learningApi.getCourseProgress(courseId),
      ]);
      setCourse(c);
      setProgress(p);

      // Select active lesson: first uncompleted lesson, or first lesson
      if (p.lessons.length > 0) {
        const firstUnfinished = p.lessons.find((l) => l.status !== 'completed');
        setActiveLessonId(firstUnfinished ? firstUnfinished.lessonId : p.lessons[0].lessonId);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load course player.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseAndProgress();
  }, [loadCourseAndProgress]);

  // 2. Load Active Lesson Details whenever activeLessonId changes
  const loadActiveLesson = useCallback(async (lessonId: string) => {
    setIsLoadingLesson(true);
    setQuizResult(null);
    setQuizAnswers({});
    setQuizError(null);
    setActionError(null);
    setIsPlaying(false);
    setVideoSeconds(0);

    try {
      const detail = await courseApi.getLesson(lessonId);
      setActiveLessonDetail(detail);

      // If quiz type, fetch full quiz definition
      if (detail.type === 'quiz' && detail.quiz?.id) {
        const fullQuiz = await courseApi.getQuiz(detail.quiz.id);
        setQuizData(fullQuiz);
      } else {
        setQuizData(null);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to load lesson content.');
    } finally {
      setIsLoadingLesson(false);
    }
  }, []);

  useEffect(() => {
    if (activeLessonId) {
      loadActiveLesson(activeLessonId);
    }
  }, [activeLessonId, loadActiveLesson]);

  // Handle Video Simulation Play/Pause
  useEffect(() => {
    let timer: any;
    if (isPlaying && activeLessonDetail?.type === 'video') {
      const duration = activeLessonDetail.durationSeconds || 600;
      timer = setInterval(() => {
        setVideoSeconds((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeLessonDetail]);

  // Active Lesson Object from Progress list
  const activeLessonProgress: LessonProgressOutline | undefined = progress?.lessons.find(
    (l) => l.lessonId === activeLessonId,
  );

  const activeIndex = progress?.lessons.findIndex((l) => l.lessonId === activeLessonId) ?? -1;
  const hasPrev = activeIndex > 0;
  const hasNext = progress?.lessons && activeIndex >= 0 && activeIndex < progress.lessons.length - 1;

  // Mark Current Lesson as Completed
  async function handleCompleteLesson() {
    if (!activeLessonId || !courseId) return;
    setIsCompleting(true);
    setActionError(null);
    try {
      const res = await learningApi.completeLesson(activeLessonId);

      // Refresh progress from server
      const updatedProgress = await learningApi.getCourseProgress(courseId);
      setProgress(updatedProgress);

      if (res.isCourseCompleted) {
        setCompletionBanner('🎉 Congratulations! You have completed all requirements for this course!');
      } else {
        setCompletionBanner('✓ Lesson marked complete! +10 Points earned.');
        setTimeout(() => setCompletionBanner(null), 3500);
      }

      // Auto-advance to next lesson if available
      if (hasNext && progress?.lessons) {
        setActiveLessonId(progress.lessons[activeIndex + 1].lessonId);
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to mark lesson complete.');
    } finally {
      setIsCompleting(false);
    }
  }

  // Handle Quiz Submission
  async function handleSubmitQuiz(e: React.FormEvent) {
    e.preventDefault();
    if (!quizData?.id || !courseId) return;

    const answersPayload = Object.entries(quizAnswers).map(([qId, optId]) => ({
      questionId: qId,
      selectedOptionId: optId,
    }));

    if (answersPayload.length < (quizData.questions?.length || 0)) {
      setQuizError('Please select an answer for each question before submitting.');
      return;
    }

    setIsSubmittingQuiz(true);
    setQuizError(null);

    try {
      const result = await learningApi.submitQuizAttempt(quizData.id, answersPayload);
      setQuizResult(result);

      // Refresh progress
      const updatedProgress = await learningApi.getCourseProgress(courseId);
      setProgress(updatedProgress);

      if (result.passed) {
        setCompletionBanner('🏆 Quiz passed! +25 Points earned. Module completed.');
      }
    } catch (err: any) {
      setQuizError(err?.message || 'Failed to submit quiz attempt.');
    } finally {
      setIsSubmittingQuiz(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-16 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between" />
        <main className="flex-1 max-w-7xl w-full mx-auto p-12">
          <LoadingState message="Loading course curriculum and lesson player..." />
        </main>
      </div>
    );
  }

  if (error || !course || !progress) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="h-16 bg-surface border-b border-border px-4 sm:px-6 flex items-center">
          <Link to="/learner/my-courses" className="btn-sm btn-secondary text-xs">
            ← Exit
          </Link>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto p-12">
          <ErrorState
            title="Course player unavailable"
            message={error || 'Course not found or enrollment required.'}
            onRetry={loadCourseAndProgress}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-deep flex flex-col">
      {/* Top Header Bar — Clean Light Surface */}
      <header className="h-16 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/learner/my-courses"
            className="p-1.5 rounded-lg border border-border bg-surface hover:bg-soft text-text-deep transition-colors text-xs font-semibold shrink-0"
            title="Return to My Courses"
          >
            ← Exit Player
          </Link>

          <div className="leading-tight min-w-0">
            <Link
              to={`/courses/${course.id}`}
              className="font-bold text-sm sm:text-base text-text-deep hover:text-primary transition-colors truncate block"
            >
              {course.title}
            </Link>
            <div className="text-[11px] text-text-muted">
              Lesson {activeIndex + 1} of {progress.totalLessonsCount}
            </div>
          </div>
        </div>

        {/* Course Progress Summary */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="hidden sm:flex flex-col items-end text-xs">
            <span className="font-semibold text-text-deep">
              {progress.courseProgressPercent}% Completed
            </span>
            <span className="text-[11px] text-text-muted">
              {progress.completedLessonsCount} / {progress.totalLessonsCount} Finished
            </span>
          </div>

          <div className="w-20 sm:w-32 bg-soft h-2 rounded-full overflow-hidden border border-border/50">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${progress.courseProgressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Completion Banner */}
      {completionBanner && (
        <div className="bg-emerald-600 text-white py-2.5 px-4 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-xs">
          <span>{completionBanner}</span>
          <button
            onClick={() => setCompletionBanner(null)}
            className="text-white/80 hover:text-white text-xs ml-2"
            type="button"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Error Alert */}
      {actionError && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 py-2.5 px-4 text-xs font-medium flex items-center justify-between">
          <span>⚠️ {actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-600 hover:text-rose-800 text-xs ml-2"
            type="button"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Learning Studio Split Grid */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: Lesson Stage Viewer (Light Application Shell) */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-background p-4 sm:p-6 lg:p-8 space-y-6">
          {isLoadingLesson ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <LoadingState message="Loading module content..." />
            </div>
          ) : !activeLessonDetail ? (
            <div className="card p-12 text-center bg-surface border border-border">
              <p className="text-sm text-text-muted">Select a lesson from the curriculum outline on the right.</p>
            </div>
          ) : (
            <>
              {/* Lesson Stage Header */}
              <div className="card p-5 bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="badge badge-primary text-[10px] capitalize font-medium">
                      {activeLessonDetail.type} module
                    </span>
                    {activeLessonProgress?.status === 'completed' ? (
                      <span className="badge badge-success text-[10px] font-semibold">✓ Completed</span>
                    ) : (
                      <span className="badge badge-warning text-[10px] font-medium">In Progress</span>
                    )}
                    {activeLessonDetail.isRequired && (
                      <span className="badge badge-neutral text-[10px]">Required</span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-text-deep tracking-tight">
                    {activeLessonDetail.title}
                  </h2>
                </div>

                {/* Mark Completed Button */}
                <button
                  onClick={handleCompleteLesson}
                  disabled={isCompleting || activeLessonProgress?.status === 'completed'}
                  className={`btn-md text-xs font-semibold self-start sm:self-auto shrink-0 ${
                    activeLessonProgress?.status === 'completed'
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 cursor-default'
                      : 'btn-primary'
                  }`}
                  type="button"
                >
                  {isCompleting
                    ? 'Marking Complete...'
                    : activeLessonProgress?.status === 'completed'
                    ? '✓ Completed'
                    : 'Mark as Completed'}
                </button>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* STAGE TYPE 1: VIDEO LESSON (Player can be dark, shell is light) */}
              {/* ------------------------------------------------------------- */}
              {activeLessonDetail.type === 'video' && (
                <div className="space-y-5">
                  <div className="w-full aspect-video bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative flex flex-col justify-between p-6 shadow-sm text-white">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Interactive HD Video Stream
                      </span>
                      <span className="font-mono">
                        {Math.floor(videoSeconds / 60)}:
                        {String(videoSeconds % 60).padStart(2, '0')} /{' '}
                        {Math.floor((activeLessonDetail.durationSeconds || 600) / 60)}:00
                      </span>
                    </div>

                    {/* Center Play/Pause button */}
                    <div className="self-center my-auto flex flex-col items-center gap-3">
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center text-2xl sm:text-3xl shadow-lg transition-transform hover:scale-105"
                        type="button"
                        aria-label={isPlaying ? 'Pause video' : 'Play video'}
                      >
                        {isPlaying ? '⏸' : '▶'}
                      </button>
                      <p className="text-xs text-slate-300">
                        {isPlaying ? 'Video playing (tracking progress)' : 'Click to stream lecture'}
                      </p>
                    </div>

                    {/* Scrubber controls bar */}
                    <div className="space-y-2">
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all"
                          style={{
                            width: `${(videoSeconds / (activeLessonDetail.durationSeconds || 600)) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="hover:text-white font-medium transition-colors"
                          type="button"
                        >
                          {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <span>1080p 60fps</span>
                      </div>
                    </div>
                  </div>

                  {activeLessonDetail.textContent && (
                    <div className="card p-6 bg-surface border border-border space-y-2">
                      <h3 className="text-sm font-bold text-text-deep">Lecture Notes & Transcript</h3>
                      <div className="text-xs sm:text-sm text-text-muted whitespace-pre-line leading-relaxed">
                        {activeLessonDetail.textContent}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STAGE TYPE 2: DOCUMENT / ARTICLE (Light Notion/Odoo theme)      */}
              {/* ------------------------------------------------------------- */}
              {activeLessonDetail.type === 'document' && (
                <div className="card bg-surface border border-border p-6 sm:p-8 space-y-6">
                  {activeLessonDetail.description && (
                    <div className="p-4 bg-primary-soft/30 border border-primary/20 rounded-lg text-xs sm:text-sm text-primary font-medium">
                      {activeLessonDetail.description}
                    </div>
                  )}

                  <div className="text-text-deep text-sm leading-relaxed whitespace-pre-line prose max-w-none">
                    {activeLessonDetail.textContent || (
                      <p className="text-text-muted italic">
                        No supplementary document content provided for this lesson.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STAGE TYPE 3: IMAGE / DIAGRAM                                 */}
              {/* ------------------------------------------------------------- */}
              {activeLessonDetail.type === 'image' && (
                <div className="card bg-surface border border-border p-6 text-center space-y-4">
                  <div className="p-12 bg-soft/50 rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
                    <span className="text-5xl mb-3" aria-hidden="true">📐</span>
                    <h3 className="font-bold text-text-deep text-base">System Architecture Diagram</h3>
                    <p className="text-xs text-text-muted max-w-md mt-1 leading-relaxed">
                      {activeLessonDetail.description || 'Full schematic layout of core architectural components.'}
                    </p>
                  </div>
                  {activeLessonDetail.textContent && (
                    <div className="text-left p-4 bg-soft rounded-lg text-xs text-text-muted leading-relaxed">
                      {activeLessonDetail.textContent}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* STAGE TYPE 4: INTERACTIVE QUIZ (Clean light styling)          */}
              {/* ------------------------------------------------------------- */}
              {activeLessonDetail.type === 'quiz' && (
                <div className="space-y-6">
                  {!quizData ? (
                    <div className="card p-8 bg-surface border border-border text-center text-text-muted">
                      Quiz details are not available.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Quiz Banner */}
                      <div className="card bg-surface border border-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-text-deep">{quizData.title}</h3>
                          <p className="text-xs text-text-muted mt-1">
                            {quizData.instructions || 'Answer all questions below and submit your attempt for grading.'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="badge badge-primary text-xs font-semibold">
                            Passing Score: {quizData.passingScore}%
                          </span>
                          <span className="badge badge-neutral text-xs">
                            {quizData.questions?.length || 0} Questions
                          </span>
                        </div>
                      </div>

                      {/* Quiz Result Banner */}
                      {quizResult && (
                        <div
                          className={`card p-6 border text-sm space-y-3 ${
                            quizResult.passed
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-base flex items-center gap-2">
                              {quizResult.passed ? '🎉 Assessment Passed!' : '❌ Assessment Failed'}
                            </span>
                            <span className="font-extrabold text-xl">{quizResult.percentage}%</span>
                          </div>
                          <p className="text-xs opacity-90">
                            Score: {quizResult.score} / {quizResult.maxScore} points. (Passing score required: {quizResult.passingScore}%)
                          </p>
                          {quizResult.passed ? (
                            <p className="text-xs text-emerald-800 font-semibold">
                              ✓ Module marked as completed! You can now proceed to the next module.
                            </p>
                          ) : (
                            <div>
                              <button
                                onClick={() => {
                                  setQuizResult(null);
                                  setQuizAnswers({});
                                }}
                                className="btn-sm btn-secondary text-xs mt-1"
                                type="button"
                              >
                                Retake Quiz ↺
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Quiz Form */}
                      {!quizResult && (
                        <form onSubmit={handleSubmitQuiz} className="space-y-5">
                          {quizError && (
                            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg font-medium">
                              ⚠️ {quizError}
                            </div>
                          )}

                          {quizData.questions?.map((q: any, qIdx: number) => (
                            <div
                              key={q.id}
                              className="card p-6 bg-surface border border-border space-y-4"
                            >
                              <div className="flex items-start gap-3">
                                <span className="w-7 h-7 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {qIdx + 1}
                                </span>
                                <div>
                                  <h4 className="font-semibold text-text-deep text-sm sm:text-base">
                                    {q.questionText}
                                  </h4>
                                  <span className="text-[11px] text-text-muted">
                                    {q.points || 1} points
                                  </span>
                                </div>
                              </div>

                              {/* Options */}
                              <div className="pl-10 space-y-2.5">
                                {q.options?.map((opt: any) => {
                                  const isSelected = quizAnswers[q.id] === opt.id;
                                  return (
                                    <label
                                      key={opt.id}
                                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all text-xs sm:text-sm ${
                                        isSelected
                                          ? 'bg-primary-soft/40 border-primary text-text-deep font-semibold shadow-xs'
                                          : 'bg-surface border-border text-text-deep hover:bg-soft'
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`question_${q.id}`}
                                        value={opt.id}
                                        checked={isSelected}
                                        onChange={() =>
                                          setQuizAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
                                        }
                                        className="text-primary focus:ring-0"
                                      />
                                      <span>{opt.optionText}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          ))}

                          <div className="flex justify-end pt-2">
                            <button
                              type="submit"
                              disabled={isSubmittingQuiz}
                              className="btn-lg btn-primary text-sm shadow-xs"
                            >
                              {isSubmittingQuiz ? 'Grading Answers...' : 'Submit Quiz Answers'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Navigation Toolbar */}
              <div className="flex items-center justify-between pt-6 border-t border-border">
                <button
                  onClick={() => {
                    if (hasPrev && progress?.lessons) {
                      setActiveLessonId(progress.lessons[activeIndex - 1].lessonId);
                    }
                  }}
                  disabled={!hasPrev}
                  className="btn-sm btn-secondary text-xs disabled:opacity-40"
                  type="button"
                >
                  ← Previous Lesson
                </button>

                <button
                  onClick={() => {
                    if (hasNext && progress?.lessons) {
                      setActiveLessonId(progress.lessons[activeIndex + 1].lessonId);
                    }
                  }}
                  disabled={!hasNext}
                  className="btn-sm btn-primary text-xs disabled:opacity-40"
                  type="button"
                >
                  Next Lesson →
                </button>
              </div>
            </>
          )}
        </main>

        {/* RIGHT COLUMN: Curriculum Sidebar Drawer (Clean Light Shell) */}
        <aside className="w-full lg:w-80 lg:min-w-[320px] bg-surface border-t lg:border-t-0 lg:border-l border-border flex flex-col h-auto lg:h-full shrink-0">
          <div className="p-4 border-b border-border bg-surface">
            <h3 className="font-bold text-sm text-text-deep">Course Syllabus</h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              {progress.completedLessonsCount} of {progress.totalLessonsCount} completed
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60 p-2 space-y-1">
            {progress.lessons.map((lesson, idx) => {
              const isActive = lesson.lessonId === activeLessonId;
              const isDone = lesson.status === 'completed';

              return (
                <button
                  key={lesson.lessonId}
                  onClick={() => setActiveLessonId(lesson.lessonId)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 ${
                    isActive
                      ? 'bg-primary-soft/50 border border-primary/40 text-text-deep'
                      : 'hover:bg-soft text-text-muted hover:text-text-deep'
                  }`}
                  type="button"
                >
                  {/* Status Indicator Icon */}
                  <div className="shrink-0 mt-0.5">
                    {isDone ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-300">
                        ✓
                      </span>
                    ) : isActive ? (
                      <span className="w-5 h-5 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center">
                        •
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-soft text-text-muted font-bold text-xs flex items-center justify-center border border-border">
                        {idx + 1}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-xs font-semibold leading-tight line-clamp-1 ${
                        isActive ? 'text-primary font-bold' : 'text-text-deep'
                      }`}
                    >
                      {lesson.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-text-muted mt-1 capitalize">
                      <span>{lesson.type}</span>
                      <span>•</span>
                      <span>{Math.round((lesson.durationSeconds || 600) / 60)} min</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
