interface ComputeDepletedModalProps {
  onPurchase: (block: "small" | "medium" | "large") => void;
  onSaveAndWait: () => void;
  resetDate: string;
}

const BLOCKS = [
  {
    size: "small" as const,
    sessions: 10,
    price: "$9",
    label: "Small Block",
  },
  {
    size: "medium" as const,
    sessions: 25,
    price: "$19",
    label: "Medium Block",
  },
  {
    size: "large" as const,
    sessions: 60,
    price: "$39",
    label: "Large Block",
  },
];

export function ComputeDepletedModal({
  onPurchase,
  onSaveAndWait,
  resetDate,
}: ComputeDepletedModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(9, 8, 14, 0.85)" }}
    >
      <div
        className="w-full max-w-lg rounded-lg p-8"
        style={{ background: "var(--cream)" }}
      >
        <h2
          className="mb-2 text-xl font-bold"
          style={{
            fontFamily: "var(--font-architect)",
            color: "var(--triad-black)",
          }}
        >
          You've used your monthly compute
        </h2>
        <p
          className="mb-6"
          style={{
            fontFamily: "var(--font-builder)",
            fontSize: "14px",
            color: "var(--triad-black)",
            opacity: 0.7,
          }}
        >
          Add a compute block to keep building. Blocks never expire.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {BLOCKS.map((block) => (
            <button
              key={block.size}
              onClick={() => onPurchase(block.size)}
              className="flex flex-col items-center rounded-lg p-4 transition-all hover:scale-105"
              style={{
                background: "var(--triad-black)",
                border: "1px solid var(--steel-blue)",
              }}
            >
              <span
                className="text-lg font-bold"
                style={{
                  fontFamily: "var(--font-builder)",
                  color: "var(--cream)",
                }}
              >
                {block.price}
              </span>
              <span
                className="mt-1"
                style={{
                  fontFamily: "var(--font-runway)",
                  fontSize: "13px",
                  color: "var(--cream)",
                }}
              >
                {block.sessions} sessions
              </span>
              <span
                className="mt-2"
                style={{
                  fontFamily: "var(--font-builder)",
                  fontSize: "11px",
                  color: "#008060",
                  fontWeight: 600,
                }}
              >
                Never expires
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onSaveAndWait}
          className="w-full rounded py-2 text-center transition-colors"
          style={{
            fontFamily: "var(--font-builder)",
            fontSize: "13px",
            color: "var(--steel-blue)",
            background: "transparent",
            border: "1px solid var(--steel-blue)",
          }}
        >
          Save my work and continue when compute resets ({resetDate})
        </button>
      </div>
    </div>
  );
}
