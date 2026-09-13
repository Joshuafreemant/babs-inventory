"use client";

import { Product } from "../types";
import { ProductArt } from "./ProductArt";
import { naira, stockStripe } from "../lib/money";

interface Props {
  product: Product;
  qty?: number;
  onDec?: () => void;
  onInc?: () => void;
  onSet?: (n: number) => void;
  onAdd?: () => void;
  /** Display-only (used for the "Add product" storefront preview). */
  preview?: boolean;
}

export function ProductCard({ product: p, qty = 0, onDec, onInc, onSet, onAdd, preview }: Props) {
  const s = stockStripe(p);

  return (
    <div className="card flex flex-col">
      <div className="art-panel" style={{ height: 180, padding: p.imageUrl ? 0 : "20px 0", overflow: "hidden" }}>
        {p.imageUrl ? (
          // plain <img> avoids next/image remote-domain config
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <ProductArt kind={p.category} />
        )}
      </div>
      <div style={{ padding: "15px 16px", borderTop: "1px solid var(--line)" }}>
        <p className="serif" style={{ fontWeight: 600, fontSize: 19, margin: 0, lineHeight: 1.3 }}>
          {p.name || "Untitled product"}
        </p>
        <p style={{ fontSize: 15.5, color: "var(--ink-soft)", margin: "4px 0 9px" }}>
          Sold per box &middot; packed {p.boxesPerCarton} to a carton
        </p>
        <div
          className="flex items-baseline justify-between flex-wrap"
          style={{ marginBottom: 10, gap: "2px 10px" }}
        >
          <p
            className="serif"
            style={{ fontWeight: 700, fontSize: 18.5, color: "var(--navy)", margin: 0, whiteSpace: "nowrap" }}
          >
            {naira(p.price || 0)}{" "}
            <span style={{ fontSize: 14.5, fontWeight: 500, color: "var(--ink-soft)" }}>/ box</span>
          </p>
          <p style={{ fontSize: 14.5, color: s.color, fontWeight: 600, margin: 0, textAlign: "right" }}>
            {s.label}
            {p.showStock && p.stock > 0 ? ` · ${p.stock} left` : ""}
          </p>
        </div>

        {!preview && (
          <div className="flex items-center gap-2" style={{ flexWrap: "nowrap" }}>
            <div className="stepper" style={{ fontSize: 16.5, flexShrink: 0 }}>
              <button onClick={onDec} aria-label="decrease" style={{ fontSize: 18.5 }}>
                &minus;
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={qty === 0 ? "" : qty}
                placeholder="0"
                aria-label="quantity in boxes"
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  onSet?.(Number.isFinite(n) ? n : 0);
                }}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button onClick={onInc} aria-label="increase" style={{ fontSize: 18.5 }}>
                +
              </button>
            </div>
            <button
              className={`btn ${qty === 0 ? "btn-disabled" : "btn-primary"}`}
              onClick={onAdd}
              style={{ fontSize: 16.5, flex: 1, whiteSpace: "nowrap", padding: "10px 12px" }}
            >
              Add to order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
