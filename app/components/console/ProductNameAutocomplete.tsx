"use client";

import { useEffect, useRef, useState } from "react";
import { apiGet } from "../../lib/api";

interface Suggestion {
  id: string;
  name: string;
  stock: number;
}

/** Product-name field with live suggestions from the existing catalogue —
 * makes it obvious when you're about to type a near-duplicate of something
 * already in the ledger. Picking a suggestion just fills the field with the
 * exact existing name; it doesn't change any other field. */
export function ProductNameAutocomplete({
  value,
  onChange,
  placeholder = "Product name",
}: {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<Suggestion[]>([]);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requestId = useRef(0);

  useEffect(() => {
    const q = value.trim();
    if (!q) {
      setMatches([]);
      return;
    }
    clearTimeout(debounceRef.current);
    const id = ++requestId.current;
    debounceRef.current = setTimeout(() => {
      apiGet<{ products: Suggestion[] }>(`/api/admin/products?q=${encodeURIComponent(q)}&limit=6`)
        .then((d) => {
          if (id === requestId.current) setMatches(d.products || []);
        })
        .catch(() => {
          if (id === requestId.current) setMatches([]);
        });
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const show = open && value.trim().length > 0 && matches.length > 0;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <div className="field">
        <span className="icon">&#128137;</span>
        <input
          placeholder={placeholder}
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          role="combobox"
          aria-expanded={show}
          aria-autocomplete="list"
        />
      </div>
      {show && (
        <div
          className="card"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 20,
            maxHeight: 230,
            overflowY: "auto",
            padding: "4px 0",
          }}
        >
          <div
            style={{
              padding: "6px 14px",
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--ink-soft)",
            }}
          >
            Already in your inventory
          </div>
          {matches.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p.name);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
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
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.name}
              </span>
              <span style={{ color: "var(--ink-soft)", fontSize: 13, flexShrink: 0 }}>
                {p.stock.toLocaleString("en-NG")} boxes
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
