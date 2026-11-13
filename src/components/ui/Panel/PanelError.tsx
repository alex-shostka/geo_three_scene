interface PanelErrorProps {
  error: Error;
  onRetry: () => void;
}

export function PanelError({ error, onRetry }: PanelErrorProps) {
  return (
    <div className="panel-error" role="alert">
      <p className="panel-error-text">This panel failed: {error.message}</p>
      <button type="button" className="panel-error-retry" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
