interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon = '📭',
  title,
  message,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 gap-4 text-center ${className}`}>
      <span className="text-4xl" aria-hidden="true">{icon}</span>
      <div>
        <h3 className="text-base font-semibold text-text-deep mb-1">{title}</h3>
        {message && <p className="text-sm text-text-muted max-w-sm">{message}</p>}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-md btn-primary"
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
