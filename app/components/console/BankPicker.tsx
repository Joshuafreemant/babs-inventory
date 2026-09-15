"use client";

import { useEffect, useRef, useState } from "react";
import { NIGERIAN_BANKS } from "../../lib/nigerianBanks";

/** Searchable Nigerian bank picker — a text field that filters a dropdown of
 * real bank names as you type. Still a free-text field under the hood, so an
 * unlisted bank can simply be typed and kept. */
export function BankPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const q = value.trim().toLowerCase();
  const matches = q
    ? NIGERIAN_BANKS.filter((b) => b.toLowerCase().includes(q)).slice(0, 8)
    : NIGERIAN_BANKS.slice(0, 8);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div className="field">
        <span className="icon">&#127974;</span>
        <input
          placeholder="Search or type a bank name"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
        />
      </div>
      {open && matches.length > 0 && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 20,
            maxHeight: 220,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          {matches.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => {
                onChange(b);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "9px 14px",
                background: "none",
                border: "none",
                fontSize: 14.5,
                cursor: "pointer",
                color: "var(--ink)",
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {b}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
