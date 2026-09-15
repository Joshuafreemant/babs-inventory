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
          padding: p.imageUrl ? 0 : "20px 0",
          overflow: "hidden",
          position: "relative",
          cursor: p.imageUrl ? "zoom-in" : "default",
        }}
        onClick={() => p.imageUrl && setZoomed(true)}
      >
        <span
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            zIndex: 1,
            fontSize: 7,
            fontWeight: 700,
            color: "#fff",
            background: s.color,
            padding: "2px 6px",
            borderRadius: "var(--r-pill)",
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {s.label}
          {p.showStock && p.stock > 0 ? ` · ${p.stock} left` : ""}
        </span>
        {p.imageUrl ? (
          <>
            {/* cover — fills the tile edge to edge; tap to zoom shows the
                full, uncropped photo (below) so nothing is ever hidden */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.imageUrl}
              alt={p.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "4px 0 7px" }}>
          Sold per box &middot; {p.boxesPerCarton} boxes/carton
        </p>
        <p
          className="serif"
          style={{ fontWeight: 700, fontSize: 16.5, color: "var(--navy)", margin: "0 0 10px", whiteSpace: "nowrap" }}
        >
          {naira(p.price || 0)}{" "}
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-soft)" }}>/ box</span>
        </p>

        {!preview && (
          <div className="flex items-center gap-2" style={{ flexWrap: "wrap" }}>
            <div className="stepper" style={{ fontSize: 13.5, flexShrink: 0 }}>
              <button onClick={onDec} aria-label="decrease" style={{ fontSize: 14 }}>
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
              <button onClick={onInc} aria-label="increase" style={{ fontSize: 14 }}>
                +
              </button>
            </div>
            <button
              className={`btn add-to-order-btn ${qty === 0 ? "btn-disabled" : "btn-primary"}`}
              onClick={onAdd}
              style={{ fontSize: 13, flex: "1 1 100px", whiteSpace: "nowrap", padding: "9px 12px" }}
            >
              Add to order
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
