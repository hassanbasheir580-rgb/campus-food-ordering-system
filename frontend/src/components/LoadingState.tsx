export const LoadingState = ({ label = 'Loading campus data...' }: { label?: string }) => (
  <div className="loading-state" role="status" aria-live="polite">
    <span className="spinner" />
    {label}
  </div>
);
