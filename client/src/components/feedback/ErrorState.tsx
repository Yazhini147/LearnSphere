interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 gap-4 text-center ${className}`}>
      <div className="w-12 h-12 bg-error-soft rounded-full flex items-center justify-center">
        <span className="text-error text-xl" aria-hidden="true">!</span>
      </div>
      <div>
        <h3 className="text-base font-semibold text-text-deep mb-1">{title}</h3>
        <p className="text-sm text-text-muted max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-md btn-secondary"
          type="button"
        >
          Try again
        </button>
      )}
    </div>
  );
}
