interface UpgradeToastProps {
  consecutiveMonths: number;
  onViewOptions: () => void;
  onDismiss: () => void;
}

export function UpgradeToast({
  consecutiveMonths,
  onViewOptions,
  onDismiss,
}: UpgradeToastProps) {
  return (
    <div
      className="toast-enter fixed bottom-6 right-6 z-40 max-w-sm rounded-lg p-4 shadow-xl"
      style={{
        background: "var(--triad-black)",
        border: "1px solid var(--steel-blue)",
      }}
    >
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2"
        style={{
          background: "none",
          border: "none",
          color: "var(--cream)",
          opacity: 0.5,
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        x
      </button>
      <p
        className="mb-3 pr-4"
        style={{
          fontFamily: "var(--font-builder)",
          fontSize: "13px",
          color: "var(--cream)",
          lineHeight: 1.5,
        }}
      >
        You've added compute {consecutiveMonths} months in a row. Your next plan
        includes this compute at a lower cost.
      </p>
      <button
        onClick={onViewOptions}
        className="rounded px-3 py-1.5 text-xs font-semibold transition-colors"
        style={{
          fontFamily: "var(--font-builder)",
          background: "var(--steel-blue)",
          color: "var(--cream)",
          border: "none",
          cursor: "pointer",
        }}
      >
        See upgrade options
      </button>
    </div>
  );
}
