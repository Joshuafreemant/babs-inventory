"use client";

import { useState } from "react";
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
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="card flex flex-col">
      <div
        className="art-panel"
        style={{
          height: 180,
          padding: p.imageUrl ? 14 : "20px 0",
          overflow: "hidden",
          position: "relative",
          cursor: p.imageUrl ? "zoom-in" : "default",
        }}
        onClick={() => p.imageUrl && setZoomed(true)}
      >
        {p.imageUrl ? (
          <>
            {/* contain, not cover — the whole photo shows, nothing gets cropped off */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.imageUrl}
              alt={p.name}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "rgba(15,42,61,0.72)",
                color: "#fff",
                fontSize: 13,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              &#128269;
            </span>
          </>
        ) : (
          <ProductArt kind={p.category} />
        )}
      </div>

      {zoomed && p.imageUrl && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 300 }}
          onClick={() => setZoomed(false)}
        >
          <div style={{ position: "relative", maxWidth: "92vw", maxHeight: "92vh" }} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.imageUrl}
              alt={p.name}
              style={{
                maxWidth: "92vw",
                maxHeight: "92vh",
                objectFit: "contain",
                display: "block",
                borderRadius: "var(--r-md)",
              }}
            />
            <button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="Close"
              style={{
                position: "absolute",
                top: -14,
                right: -14,
                width: 34,
                height: 34,
                borderRadius: "50%",
                border: "none",
                background: "#fff",
                color: "var(--navy)",
                fontSize: 20,
                cursor: "pointer",
                boxShadow: "var(--shadow-md)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
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
