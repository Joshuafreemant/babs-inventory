"use client";

import { useEffect, useState } from "react";

/** The ledger's per-product stock control — nudge with +/-, or type an exact
 * count directly and it commits when you tab/click away or press Enter. */
export function StockStepper({
  stock,
  onAdjust,
  onSetExact,
}: {
  stock: number;
  onAdjust: (delta: number) => void;
  onSetExact: (value: number) => void;
}) {
  const [draft, setDraft] = useState(String(stock));

  // stay in sync when the server value changes from elsewhere (±buttons,
  // restock, another tab) and there's no unsaved edit in progress
  useEffect(() => {
    setDraft(String(stock));
  }, [stock]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n >= 0 && n !== stock) {
      onSetExact(n);
    } else {
      setDraft(String(stock));
    }
  };

  return (
    <div className="stepper">
      <button onClick={() => onAdjust(-1)} aria-label="decrease">
        &minus;
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={draft}
        aria-label="stock in boxes"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button onClick={() => onAdjust(1)} aria-label="increase">
        +
      </button>
    </div>
  );
}
