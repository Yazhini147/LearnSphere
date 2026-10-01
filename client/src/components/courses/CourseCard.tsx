import { Link } from 'react-router-dom';
import type { CourseListItem } from '../../services/course.service';

interface CourseCardProps {
  course: CourseListItem;
  showProgress?: boolean;
  progressPercent?: number;
  actionHref?: string;
  actionLabel?: string;
}

export function CourseCard({
  course,
  showProgress = false,
  progressPercent = 0,
  actionHref,
  actionLabel,
}: CourseCardProps) {
  const levelStyles: Record<string, string> = {
    beginner: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    intermediate: 'bg-blue-50 text-blue-800 border-blue-200',
    advanced: 'bg-purple-50 text-purple-800 border-purple-200',
  };

  const hours = Math.floor(course.estimatedMinutes / 60);
  const minutes = course.estimatedMinutes % 60;
  const durationLabel = hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : `${minutes}m`;

  const isCompleted = showProgress && progressPercent >= 100;
  const targetLink = actionHref || `/courses/${course.id}`;

  return (
    <div className="group flex flex-col bg-surface rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-all duration-200 hover:shadow-xs w-full min-w-0">
      {/* Thumbnail / Header Area */}
      <Link to={targetLink} className="relative h-44 bg-soft/80 flex items-center justify-center overflow-hidden border-b border-border/80 block">
        {course.thumbnailPath ? (
          <img
            src={course.thumbnailPath}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-soft to-border/30 text-text-muted">
            <span className="text-4xl mb-1 group-hover:scale-110 transition-transform duration-200" aria-hidden="true">
              📚
            </span>
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              {course.level} Track
            </span>
          </div>
        )}

        {/* Level badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-md border capitalize shadow-2xs ${
              levelStyles[course.level] || 'bg-surface text-text-deep border-border'
            }`}
          >
            {course.level}
          </span>
        </div>

        {/* Duration badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-md bg-surface/95 text-text-deep border border-border shadow-2xs">
            ⏱ {durationLabel}
          </span>
        </div>
      </Link>

      {/* Card Body */}
      <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
        <div>
          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {course.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 text-[11px] font-medium bg-soft text-text-muted rounded border border-border/60"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="font-bold text-base text-text-deep group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-1.5">
            <Link to={targetLink}>{course.title}</Link>
          </h3>

          {/* Short description */}
          {course.shortDescription && (
            <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
              {course.shortDescription}
            </p>
          )}
        </div>

        {/* Bottom Section: Progress + Actions + Metadata */}
        <div className="space-y-3 pt-2">
          {/* Progress Bar (if enrolled) */}
          {showProgress && (
            <div className="space-y-1.5 bg-soft/50 p-2.5 rounded-lg border border-border/60">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-muted font-medium">
                  {isCompleted ? 'Completed' : 'Course Progress'}
                </span>
                <span className={`font-bold ${isCompleted ? 'text-success' : 'text-primary'}`}>
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted ? 'bg-success' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>
            </div>
          )}

          {/* Action button if customized action is requested */}
          {showProgress && (
            <Link
              to={actionHref || `/learner/courses/${course.id}/learn`}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg text-center transition-colors block ${
                isCompleted
                  ? 'bg-soft text-text-deep border border-border hover:bg-border/40'
                  : 'btn-primary shadow-2xs'
              }`}
            >
              {actionLabel || (isCompleted ? 'Review Course Lessons ↺' : 'Continue Learning →')}
            </Link>
          )}

          {/* Footer Metadata */}
          <div className="pt-2.5 border-t border-border flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center text-[10px] shrink-0">
                {course.instructor?.displayName ? course.instructor.displayName.charAt(0) : 'I'}
              </div>
              <span className="font-medium text-text-deep truncate max-w-[110px]">
                {course.instructor?.displayName || 'Instructor'}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-[11px] text-text-muted shrink-0">
              <span title={`${course.lessonCount} lessons`}>
                📚 {course.lessonCount || 0}
              </span>
              <span title={`${course.enrollmentCount} enrolled`}>
                👥 {course.enrollmentCount || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
