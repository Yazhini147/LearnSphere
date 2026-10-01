import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardNav } from '../../components/ui/DashboardNav';
import { courseApi, type CourseDetail, type CourseLessonItem } from '../../services/course.service';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

type TabKey = 'details' | 'curriculum' | 'quizzes';

export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();

  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [lessons, setLessons] = useState<CourseLessonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Tab 1: Course Info Form State
  const [title, setTitle] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [estimatedMinutes, setEstimatedMinutes] = useState(60);
  const [thumbnailPath, setThumbnailPath] = useState('');
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  // Tab 2: Lesson Modal State (Add or Edit)
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonType, setLessonType] = useState<'video' | 'document' | 'image' | 'quiz'>('video');
  const [lessonDesc, setLessonDesc] = useState('');
  const [lessonMinutes, setLessonMinutes] = useState('10');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonIsRequired, setLessonIsRequired] = useState(true);
  const [isSavingLesson, setIsSavingLesson] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);

  // Tab 3: Quiz Builder State
  const [selectedQuizLessonId, setSelectedQuizLessonId] = useState<string | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Question & Option Modal / State
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionPoints, setNewQuestionPoints] = useState('10');
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newOptionText, setNewOptionText] = useState<Record<string, string>>({});
  const [newOptionIsCorrect, setNewOptionIsCorrect] = useState<Record<string, boolean>>({});

  // Confirmation Dialog States
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);

  const [showSaveCourseConfirm, setShowSaveCourseConfirm] = useState(false);

  const [lessonToDelete, setLessonToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeletingLesson, setIsDeletingLesson] = useState(false);

  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);

  const [optionToDelete, setOptionToDelete] = useState<{ questionId: string; optionId: string } | null>(null);
  const [isDeletingOption, setIsDeletingOption] = useState(false);

  // Fetch course and lesson data
  const loadData = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [courseData, lessonsData] = await Promise.all([
        courseApi.getCourse(courseId),
        courseApi.getCourseLessons(courseId),
      ]);
      setCourse(courseData);
      setLessons(lessonsData);

      // Populate form state
      setTitle(courseData.title);
      setShortDesc(courseData.shortDescription || '');
      setDescription(courseData.description || '');
      setLevel(courseData.level as any);
      setEstimatedMinutes(courseData.estimatedMinutes || 60);
      setThumbnailPath(courseData.thumbnailPath || '');

      // Set default quiz lesson if none selected
      const quizLesson = lessonsData.find((l) => l.type === 'quiz');
      if (quizLesson && !selectedQuizLessonId) {
        setSelectedQuizLessonId(quizLesson.id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load course details');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, selectedQuizLessonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load quiz data when selectedQuizLessonId changes
  const loadQuiz = useCallback(async (lessonId: string) => {
    setIsLoadingQuiz(true);
    setQuizError(null);
    try {
      const lessonDetail = await courseApi.getLesson(lessonId);
      if (lessonDetail.quiz?.id) {
        const fullQuiz = await courseApi.getQuiz(lessonDetail.quiz.id);
        setActiveQuiz(fullQuiz);
      } else {
        setActiveQuiz(null);
      }
    } catch (err: any) {
      setQuizError(err?.message || 'Failed to load quiz');
    } finally {
      setIsLoadingQuiz(false);
    }
  }, []);

  useEffect(() => {
    if (selectedQuizLessonId && activeTab === 'quizzes') {
      loadQuiz(selectedQuizLessonId);
    }
  }, [selectedQuizLessonId, activeTab, loadQuiz]);

  // Flash success message
  function notifySuccess(msg: string) {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3500);
  }

  // Save Course Info trigger
  function handleSaveCourseSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowSaveCourseConfirm(true);
  }

  // Execute Save Course Info
  async function executeSaveCourse() {
    if (!courseId) return;
    setIsSavingCourse(true);
    try {
      const updated = await courseApi.updateCourse(courseId, {
        title: title.trim(),
        shortDescription: shortDesc.trim() || undefined,
        description: description.trim() || undefined,
        level,
        estimatedMinutes: Number(estimatedMinutes),
        thumbnailPath: thumbnailPath.trim() || undefined,
      });
      setCourse(updated);
      setShowSaveCourseConfirm(false);
      notifySuccess('Course details saved successfully!');
    } catch (err: any) {
      alert(err?.message || 'Failed to update course');
    } finally {
      setIsSavingCourse(false);
    }
  }

  // Toggle publish / unpublish trigger
  function handleTogglePublishClick() {
    setShowPublishConfirm(true);
  }

  // Execute Toggle publish / unpublish
  async function executeTogglePublish() {
    if (!courseId || !course) return;
    setIsTogglingPublish(true);
    try {
      let updated: CourseDetail;
      if (course.status === 'published') {
        updated = await courseApi.unpublishCourse(courseId);
        notifySuccess('Course unpublished (moved to draft)');
      } else {
        updated = await courseApi.publishCourse(courseId);
        notifySuccess('Course published successfully! Learners can now discover and enroll.');
      }
      setCourse(updated);
      setShowPublishConfirm(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to change publish status');
    } finally {
      setIsTogglingPublish(false);
    }
  }

  // Reorder Lessons (Move Up / Move Down)
  async function handleMoveLesson(index: number, direction: 'up' | 'down') {
    if (!courseId) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const newLessons = [...lessons];
    const temp = newLessons[index];
    newLessons[index] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;

    // Optimistically update
    setLessons(newLessons);

    try {
      const lessonIds = newLessons.map((l) => l.id);
      const reordered = await courseApi.reorderLessons(courseId, lessonIds);
      setLessons(reordered);
      notifySuccess('Curriculum order updated');
    } catch (err: any) {
      alert(err?.message || 'Failed to reorder lessons');
      // Revert on failure
      loadData();
    }
  }

  // Open Lesson Modal (Add or Edit)
  function handleOpenLessonModal(lesson?: CourseLessonItem) {
    setLessonError(null);
    if (lesson) {
      setEditingLessonId(lesson.id);
      setLessonTitle(lesson.title);
      setLessonType(lesson.type);
      setLessonDesc(lesson.description || '');
      setLessonMinutes(String(Math.round((lesson.durationSeconds || 600) / 60)));
      setLessonIsRequired(lesson.isRequired ?? true);
      setLessonContent('');
      // Fetch textContent if editing
      courseApi.getLesson(lesson.id).then((det) => {
        if (det.textContent) setLessonContent(det.textContent);
      }).catch(() => {});
    } else {
      setEditingLessonId(null);
      setLessonTitle('');
      setLessonType('video');
      setLessonDesc('');
      setLessonMinutes('10');
      setLessonContent('');
      setLessonIsRequired(true);
    }
    setLessonModalOpen(true);
  }

  // Submit Lesson (Add or Edit)
  async function handleSaveLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !lessonTitle.trim()) {
      setLessonError('Lesson title is required');
      return;
    }

    setIsSavingLesson(true);
    setLessonError(null);

    const durSec = (parseInt(lessonMinutes, 10) || 10) * 60;

    try {
      if (editingLessonId) {
        await courseApi.updateLesson(editingLessonId, {
          title: lessonTitle.trim(),
          type: lessonType,
          description: lessonDesc.trim() || undefined,
          durationSeconds: durSec,
          isRequired: lessonIsRequired,
          textContent: lessonContent || undefined,
        });
        notifySuccess('Lesson updated successfully');
      } else {
        await courseApi.createLesson(courseId, {
          title: lessonTitle.trim(),
          type: lessonType,
          description: lessonDesc.trim() || undefined,
          durationSeconds: durSec,
          isRequired: lessonIsRequired,
          textContent: lessonContent || undefined,
        });
        notifySuccess('New lesson added to curriculum');
      }

      setLessonModalOpen(false);
      const updatedLessons = await courseApi.getCourseLessons(courseId);
      setLessons(updatedLessons);
    } catch (err: any) {
      setLessonError(err?.message || 'Failed to save lesson');
    } finally {
      setIsSavingLesson(false);
    }
  }

  // Delete Lesson trigger
  function confirmDeleteLesson(lessonId: string, lessonTitle: string) {
    setLessonToDelete({ id: lessonId, title: lessonTitle });
  }

  // Execute Delete Lesson
  async function executeDeleteLesson() {
    if (!lessonToDelete) return;
    setIsDeletingLesson(true);
    try {
      await courseApi.deleteLesson(lessonToDelete.id);
      notifySuccess('Lesson deleted');
      setLessonToDelete(null);
      if (courseId) {
        const updatedLessons = await courseApi.getCourseLessons(courseId);
        setLessons(updatedLessons);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to delete lesson');
    } finally {
      setIsDeletingLesson(false);
    }
  }

  // Create Quiz for a lesson that doesn't have one
  async function handleCreateQuizForLesson() {
    if (!selectedQuizLessonId) return;
    try {
      const created = await courseApi.createQuiz(selectedQuizLessonId, {
        title: 'Quiz Assessment',
        instructions: 'Test your understanding of the concepts covered in this module.',
        passingScore: 70,
        maxAttempts: 3,
      });
      setActiveQuiz(created);
      notifySuccess('Quiz created! Now add your questions.');
    } catch (err: any) {
      alert(err?.message || 'Failed to create quiz');
    }
  }

  // Add Question
  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!activeQuiz?.id || !newQuestionText.trim()) return;
    setIsAddingQuestion(true);
    try {
      await courseApi.addQuizQuestion(activeQuiz.id, {
        questionText: newQuestionText.trim(),
        points: parseInt(newQuestionPoints, 10) || 10,
      });
      setNewQuestionText('');
      setNewQuestionPoints('10');
      notifySuccess('Question added');
      if (selectedQuizLessonId) await loadQuiz(selectedQuizLessonId);
    } catch (err: any) {
      alert(err?.message || 'Failed to add question');
    } finally {
      setIsAddingQuestion(false);
    }
  }

  // Delete Question trigger
  function confirmDeleteQuestion(questionId: string) {
    setQuestionToDelete(questionId);
  }

  // Execute Delete Question
  async function executeDeleteQuestion() {
    if (!activeQuiz?.id || !questionToDelete) return;
    setIsDeletingQuestion(true);
    try {
      await courseApi.deleteQuizQuestion(activeQuiz.id, questionToDelete);
      notifySuccess('Question deleted');
      setQuestionToDelete(null);
      if (selectedQuizLessonId) await loadQuiz(selectedQuizLessonId);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete question');
    } finally {
      setIsDeletingQuestion(false);
    }
  }

  // Add Option to a question
  async function handleAddOption(questionId: string) {
    if (!activeQuiz?.id) return;
    const text = newOptionText[questionId];
    if (!text || !text.trim()) return;
    const isCorrect = !!newOptionIsCorrect[questionId];

    try {
      await courseApi.addQuizOption(activeQuiz.id, questionId, {
        optionText: text.trim(),
        isCorrect,
      });
      setNewOptionText((prev) => ({ ...prev, [questionId]: '' }));
      setNewOptionIsCorrect((prev) => ({ ...prev, [questionId]: false }));
      notifySuccess('Answer option added');
      if (selectedQuizLessonId) await loadQuiz(selectedQuizLessonId);
    } catch (err: any) {
      alert(err?.message || 'Failed to add option');
    }
  }

  // Delete Option trigger
  function confirmDeleteOption(questionId: string, optionId: string) {
    setOptionToDelete({ questionId, optionId });
  }

  // Execute Delete Option
  async function executeDeleteOption() {
    if (!activeQuiz?.id || !optionToDelete) return;
    setIsDeletingOption(true);
    try {
      await courseApi.deleteQuizOption(activeQuiz.id, optionToDelete.questionId, optionToDelete.optionId);
      notifySuccess('Option deleted');
      setOptionToDelete(null);
      if (selectedQuizLessonId) await loadQuiz(selectedQuizLessonId);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete option');
    } finally {
      setIsDeletingOption(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardNav />
        <div className="flex-1 flex items-center justify-center p-12 text-text-muted">
          Loading course studio and curriculum editor...
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <DashboardNav />
        <div className="flex-1 max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-text-deep">Failed to Load Course</h2>
          <p className="text-sm text-text-muted">{error || 'Course could not be found'}</p>
          <Link to="/instructor" className="btn-md btn-primary inline-flex">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const quizLessons = lessons.filter((l) => l.type === 'quiz');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav />

      {/* Course Studio Header Bar */}
      <div className="bg-surface border-b border-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/instructor"
              className="p-1.5 rounded-md hover:bg-soft text-text-muted hover:text-text-deep transition-colors"
              title="Return to instructor dashboard"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-text-deep line-clamp-1">
                  {course.title}
                </h1>
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
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {lessons.length} lessons • {course.estimatedMinutes || 60} mins • {course.level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Live Learner Preview */}
            <Link
              to={`/courses/${course.id}`}
              target="_blank"
              rel="noreferrer"
              className="btn-sm btn-secondary text-xs flex items-center gap-1.5"
            >
              <span>Preview</span>
              <span className="text-text-muted">↗</span>
            </Link>

            {/* Publish / Unpublish Toggle */}
            <button
              onClick={handleTogglePublishClick}
              className={`btn-sm text-xs font-semibold ${
                course.status === 'published'
                  ? 'btn-secondary text-warning'
                  : 'btn-primary'
              }`}
              type="button"
            >
              {course.status === 'published' ? 'Unpublish Course' : 'Publish Course'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccess && (
        <div className="bg-success-soft border-b border-success/30 text-success text-xs font-medium py-2.5 px-4 text-center animate-fade-in">
          ✓ {saveSuccess}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-surface/50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3.5 border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-text-muted hover:text-text-deep'
              }`}
              type="button"
            >
              Course Information
            </button>

            <button
              onClick={() => setActiveTab('curriculum')}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'curriculum'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-text-muted hover:text-text-deep'
              }`}
              type="button"
            >
              <span>Curriculum & Lessons</span>
              <span className="text-xs bg-soft text-text-muted px-2 py-0.5 rounded-full font-bold">
                {lessons.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('quizzes');
                if (!selectedQuizLessonId && quizLessons.length > 0) {
                  setSelectedQuizLessonId(quizLessons[0].id);
                }
              }}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'quizzes'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-text-muted hover:text-text-deep'
              }`}
              type="button"
            >
              <span>Quiz Builder</span>
              <span className="text-xs bg-soft text-text-muted px-2 py-0.5 rounded-full font-bold">
                {quizLessons.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Tab View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* =================================================================== */}
        {/* TAB 1: BASIC COURSE INFORMATION                                    */}
        {/* =================================================================== */}
        {activeTab === 'details' && (
          <div className="card p-6 bg-surface max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-text-deep">Course Information</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Update course metadata, public description, thumbnail, and difficulty.
              </p>
            </div>

            <form onSubmit={handleSaveCourseSubmit} className="space-y-5">
              <div>
                <label className="label">Course Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input font-medium"
                />
              </div>

              <div>
                <label className="label">Short Subtitle / Hook</label>
                <input
                  type="text"
                  placeholder="One sentence that summarizes the core outcome"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Detailed Syllabus & Course Overview</label>
                <textarea
                  rows={6}
                  placeholder="Full markdown-compatible course description, learning objectives, and prerequisites..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input resize-y"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Skill Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="input capitalize"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="label">Estimated Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="10000"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Thumbnail Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... or media path"
                  value={thumbnailPath}
                  onChange={(e) => setThumbnailPath(e.target.value)}
                  className="input"
                />
                <p className="helper-text">
                  Recommended size: 1280x720 (16:9 ratio). High quality visual banner.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={isSavingCourse}
                  className="btn-md btn-primary"
                >
                  {isSavingCourse ? 'Saving Changes...' : 'Save Course Details'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: CURRICULUM & LESSONS                                        */}
        {/* =================================================================== */}
        {activeTab === 'curriculum' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text-deep">Curriculum Outline</h2>
                <p className="text-xs text-text-muted mt-1">
                  Organize lessons in sequential order. Reordering is instantly saved to PostgreSQL.
                </p>
              </div>

              <button
                onClick={() => handleOpenLessonModal()}
                className="btn-md btn-primary flex items-center gap-2 self-start sm:self-auto"
                type="button"
              >
                <span className="text-lg leading-none">+</span>
                <span>Add Lesson</span>
              </button>
            </div>

            {lessons.length === 0 ? (
              <div className="card p-12 text-center bg-surface space-y-3">
                <div className="text-4xl">📝</div>
                <h3 className="text-base font-semibold text-text-deep">No lessons in curriculum</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Courses require at least one lesson before they can be published. Add video, document, or quiz modules.
                </p>
                <button
                  onClick={() => handleOpenLessonModal()}
                  className="btn-sm btn-primary mt-2"
                  type="button"
                >
                  Add Your First Lesson
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="card p-4 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-1 text-text-muted">
                        <button
                          onClick={() => handleMoveLesson(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-soft disabled:opacity-20 hover:text-text-deep text-xs"
                          title="Move Lesson Up"
                          type="button"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveLesson(idx, 'down')}
                          disabled={idx === lessons.length - 1}
                          className="p-1 rounded hover:bg-soft disabled:opacity-20 hover:text-text-deep text-xs"
                          title="Move Lesson Down"
                          type="button"
                        >
                          ▼
                        </button>
                      </div>

                      {/* Position Badge */}
                      <div className="w-8 h-8 rounded-full bg-soft text-text-deep font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </div>

                      {/* Lesson Details */}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-text-deep text-sm">
                            {lesson.title}
                          </h4>
                          <span className="badge badge-neutral text-[10px] capitalize">
                            {lesson.type}
                          </span>
                          {lesson.isRequired && (
                            <span className="badge badge-primary text-[10px]">
                              Required
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted line-clamp-1 mt-0.5">
                          {lesson.description || 'No description added.'}
                        </p>
                      </div>
                    </div>

                    {/* Right action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-xs text-text-muted mr-2">
                        {Math.round((lesson.durationSeconds || 600) / 60)} mins
                      </span>

                      {lesson.type === 'quiz' && (
                        <button
                          onClick={() => {
                            setSelectedQuizLessonId(lesson.id);
                            setActiveTab('quizzes');
                          }}
                          className="btn-sm btn-secondary text-xs text-primary font-semibold"
                          type="button"
                        >
                          Manage Quiz ↗
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenLessonModal(lesson)}
                        className="btn-sm btn-secondary text-xs"
                        type="button"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => confirmDeleteLesson(lesson.id, lesson.title)}
                        className="btn-sm btn-ghost text-xs text-error hover:bg-error-soft"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: QUIZ BUILDER                                                */}
        {/* =================================================================== */}
        {activeTab === 'quizzes' && (
          <div className="space-y-6">
            {/* Header & Lesson Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-text-deep">Quiz & Question Authoring</h2>
                <p className="text-xs text-text-muted mt-1">
                  Design assessments, specify passing criteria, and configure multiple-choice questions.
                </p>
              </div>

              {quizLessons.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-text-muted whitespace-nowrap">
                    Quiz Lesson:
                  </label>
                  <select
                    value={selectedQuizLessonId || ''}
                    onChange={(e) => setSelectedQuizLessonId(e.target.value)}
                    className="input text-xs py-1.5 w-56"
                  >
                    {quizLessons.map((ql) => (
                      <option key={ql.id} value={ql.id}>
                        {ql.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {quizLessons.length === 0 ? (
              <div className="card p-12 text-center bg-surface space-y-3">
                <div className="text-4xl">❓</div>
                <h3 className="text-base font-semibold text-text-deep">No Quiz Lessons Found</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  To build a quiz, first add a lesson with the type set to "quiz" in the Curriculum tab.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('curriculum');
                    handleOpenLessonModal();
                  }}
                  className="btn-sm btn-primary mt-2"
                  type="button"
                >
                  Create a Quiz Lesson
                </button>
              </div>
            ) : isLoadingQuiz ? (
              <div className="card p-12 text-center bg-surface text-text-muted animate-pulse">
                Loading quiz structure and questions...
              </div>
            ) : quizError ? (
              <div className="card p-8 text-center bg-surface">
                <p className="text-sm text-error font-medium">{quizError}</p>
                <button
                  onClick={() => selectedQuizLessonId && loadQuiz(selectedQuizLessonId)}
                  className="btn-sm btn-secondary mt-3"
                  type="button"
                >
                  Retry
                </button>
              </div>
            ) : !activeQuiz ? (
              <div className="card p-12 text-center bg-surface space-y-4">
                <div className="text-4xl">💡</div>
                <h3 className="text-base font-semibold text-text-deep">Initialize Quiz Assessment</h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  This lesson has been marked as a Quiz, but no quiz record has been created yet.
                </p>
                <button
                  onClick={handleCreateQuizForLesson}
                  className="btn-md btn-primary"
                  type="button"
                >
                  Create Quiz Definition
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Quiz Properties Banner */}
                <div className="card p-6 bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-text-deep">{activeQuiz.title}</h3>
                    <p className="text-xs text-text-muted mt-1">
                      {activeQuiz.instructions || 'No instructions specified.'}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-text-deep">
                      <span className="badge badge-primary">
                        Passing Score: {activeQuiz.passingScore}%
                      </span>
                      <span className="badge badge-neutral">
                        Max Attempts: {activeQuiz.maxAttempts}
                      </span>
                      <span className="badge badge-neutral">
                        {activeQuiz.questions?.length || 0} Questions
                      </span>
                    </div>
                  </div>
                </div>

                {/* Question List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-text-deep">Questions & Options</h3>
                  </div>

                  {activeQuiz.questions && activeQuiz.questions.length > 0 ? (
                    activeQuiz.questions.map((q: any, qIdx: number) => (
                      <div key={q.id} className="card p-5 bg-surface space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {qIdx + 1}
                            </span>
                            <div>
                              <h4 className="font-semibold text-text-deep text-sm">
                                {q.questionText}
                              </h4>
                              <span className="text-[11px] text-text-muted mt-0.5 block">
                                Worth {q.points || 10} points
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => confirmDeleteQuestion(q.id)}
                            className="btn-sm btn-ghost text-xs text-error hover:bg-error-soft"
                            type="button"
                          >
                            Delete Question
                          </button>
                        </div>

                        {/* Options List */}
                        <div className="pl-9 space-y-2 border-l-2 border-border/60 ml-3">
                          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                            Answer Choices
                          </div>

                          {q.options && q.options.length > 0 ? (
                            q.options.map((opt: any) => (
                              <div
                                key={opt.id}
                                className={`flex items-center justify-between p-2.5 rounded-md border text-xs ${
                                  opt.isCorrect
                                    ? 'bg-success-soft/50 border-success/40 text-text-deep font-medium'
                                    : 'bg-soft/40 border-border text-text-deep'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={opt.isCorrect ? 'text-success font-bold' : 'text-text-muted'}>
                                    {opt.isCorrect ? '✓' : '○'}
                                  </span>
                                  <span>{opt.optionText}</span>
                                  {opt.isCorrect && (
                                    <span className="badge badge-success text-[10px]">
                                      Correct Answer
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={() => confirmDeleteOption(q.id, opt.id)}
                                  className="text-text-muted hover:text-error text-xs p-1"
                                  title="Delete option"
                                  type="button"
                                >
                                  ✕
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-text-muted italic">
                              No options added yet. Add at least 2 options and mark the correct one.
                            </p>
                          )}

                          {/* Add Option Form */}
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="text"
                              placeholder="New option answer text..."
                              value={newOptionText[q.id] || ''}
                              onChange={(e) =>
                                setNewOptionText((prev) => ({ ...prev, [q.id]: e.target.value }))
                              }
                              className="input text-xs py-1.5 flex-1"
                            />
                            <label className="flex items-center gap-1.5 text-xs text-text-deep cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={!!newOptionIsCorrect[q.id]}
                                onChange={(e) =>
                                  setNewOptionIsCorrect((prev) => ({
                                    ...prev,
                                    [q.id]: e.target.checked,
                                  }))
                                }
                                className="rounded text-primary"
                              />
                              <span>Is Correct</span>
                            </label>
                            <button
                              onClick={() => handleAddOption(q.id)}
                              className="btn-sm btn-secondary text-xs"
                              type="button"
                            >
                              + Add Option
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="card p-8 text-center bg-surface text-xs text-text-muted">
                      No questions have been added to this quiz yet. Use the form below to add questions.
                    </div>
                  )}

                  {/* Add New Question Form */}
                  <div className="card p-5 bg-surface border-2 border-dashed border-border space-y-3">
                    <h4 className="text-xs font-bold text-text-deep uppercase tracking-wider">
                      Add New Question
                    </h4>
                    <form onSubmit={handleAddQuestion} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="e.g. What is the difference between synchronous and asynchronous code?"
                          value={newQuestionText}
                          onChange={(e) => setNewQuestionText(e.target.value)}
                          className="input text-sm"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-text-muted font-medium">Points:</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={newQuestionPoints}
                            onChange={(e) => setNewQuestionPoints(e.target.value)}
                            className="input text-xs py-1 w-20"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isAddingQuestion}
                          className="btn-sm btn-primary"
                        >
                          {isAddingQuestion ? 'Adding Question...' : '+ Add Question'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* ADD / EDIT LESSON MODAL                                             */}
      {/* =================================================================== */}
      {lessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-text-deep">
                {editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}
              </h3>
              <button
                onClick={() => setLessonModalOpen(false)}
                className="text-text-muted hover:text-text-deep p-1 rounded"
                type="button"
              >
                ✕
              </button>
            </div>

            {lessonError && (
              <div className="p-3 bg-error-soft text-error border border-error/20 rounded text-xs">
                {lessonError}
              </div>
            )}

            <form onSubmit={handleSaveLesson} className="space-y-4">
              <div>
                <label className="label">Lesson Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Async Architecture"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Lesson Type</label>
                  <select
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value as any)}
                    className="input capitalize"
                  >
                    <option value="video">Video</option>
                    <option value="document">Document / Article</option>
                    <option value="image">Diagram / Image</option>
                    <option value="quiz">Interactive Quiz</option>
                  </select>
                </div>

                <div>
                  <label className="label">Est. Duration (Mins)</label>
                  <input
                    type="number"
                    min="1"
                    max="600"
                    value={lessonMinutes}
                    onChange={(e) => setLessonMinutes(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Summary / Description</label>
                <input
                  type="text"
                  placeholder="Brief synopsis of what learners will gain"
                  value={lessonDesc}
                  onChange={(e) => setLessonDesc(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Lesson Text & Notes (Markdown)</label>
                <textarea
                  rows={5}
                  placeholder="Rich notes, explanation text, code snippets, or video transcript..."
                  value={lessonContent}
                  onChange={(e) => setLessonContent(e.target.value)}
                  className="input resize-y"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequiredCheckbox"
                  checked={lessonIsRequired}
                  onChange={(e) => setLessonIsRequired(e.target.checked)}
                  className="rounded text-primary"
                />
                <label htmlFor="isRequiredCheckbox" className="text-xs text-text-deep cursor-pointer">
                  Required module for course completion
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  onClick={() => setLessonModalOpen(false)}
                  className="btn-md btn-secondary"
                  type="button"
                  disabled={isSavingLesson}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-md btn-primary"
                  disabled={isSavingLesson}
                >
                  {isSavingLesson ? 'Saving Lesson...' : editingLessonId ? 'Update Lesson' : 'Add to Curriculum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISH / UNPUBLISH CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={showPublishConfirm}
        title={course?.status === 'published' ? 'Unpublish course?' : 'Publish course?'}
        description={
          course?.status === 'published'
            ? 'This course will be removed from the public learner catalog. Existing learner access will follow the platform\'s access rules.'
            : 'This course will become visible to learners in the published catalog.'
        }
        confirmLabel={course?.status === 'published' ? 'Unpublish Course' : 'Publish Course'}
        cancelLabel="Cancel"
        variant={course?.status === 'published' ? 'warning' : 'default'}
        loading={isTogglingPublish}
        onConfirm={executeTogglePublish}
        onCancel={() => {
          if (!isTogglingPublish) setShowPublishConfirm(false);
        }}
      />

      {/* SAVE COURSE DETAILS CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={showSaveCourseConfirm}
        title="Save course changes?"
        description="Your changes will update the course currently stored in LearnSphere."
        confirmLabel="Save Changes"
        cancelLabel="Cancel"
        variant="default"
        loading={isSavingCourse}
        onConfirm={executeSaveCourse}
        onCancel={() => {
          if (!isSavingCourse) setShowSaveCourseConfirm(false);
        }}
      />

      {/* DELETE LESSON CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={lessonToDelete !== null}
        title="Delete lesson?"
        description={
          lessonToDelete ? (
            <div className="space-y-1">
              <p>Are you sure you want to delete <strong className="text-text-deep">"{lessonToDelete.title}"</strong>?</p>
              <p>This lesson and its associated content will be removed.</p>
            </div>
          ) : ''
        }
        confirmLabel="Delete Lesson"
        cancelLabel="Cancel"
        variant="destructive"
        loading={isDeletingLesson}
        onConfirm={executeDeleteLesson}
        onCancel={() => {
          if (!isDeletingLesson) setLessonToDelete(null);
        }}
      />

      {/* DELETE QUESTION CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={questionToDelete !== null}
        title="Delete question?"
        description="This question and all its choices will be removed."
        confirmLabel="Delete Question"
        cancelLabel="Cancel"
        variant="destructive"
        loading={isDeletingQuestion}
        onConfirm={executeDeleteQuestion}
        onCancel={() => {
          if (!isDeletingQuestion) setQuestionToDelete(null);
        }}
      />

      {/* DELETE OPTION CONFIRMATION DIALOG */}
      <ConfirmDialog
        open={optionToDelete !== null}
        title="Delete option?"
        description="This answer option will be removed from the question."
        confirmLabel="Delete Option"
        cancelLabel="Cancel"
        variant="destructive"
        loading={isDeletingOption}
        onConfirm={executeDeleteOption}
        onCancel={() => {
          if (!isDeletingOption) setOptionToDelete(null);
        }}
      />
    </div>
  );
}
