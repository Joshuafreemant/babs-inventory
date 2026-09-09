"use client";

import { useState } from "react";
import { Product } from "../../types";

export function DeleteProductModal({
  product,
  onClose,
  onDeleted,
}: {
  product: Product;
  onClose: () => void;
  onDeleted: (id: string, hard: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);
      onDeleted(product.id, Boolean(data.hard));
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card" style={{ width: "100%", maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", background: "var(--navy)", color: "#fff" }}
        >
          <p className="serif" style={{ fontWeight: 700, fontSize: 15.5, margin: 0 }}>
            Remove {product.name}?
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 17, color: "#fff" }}>
            &times;
          </button>
        </div>
        <div style={{ padding: "18px 20px" }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 14px", lineHeight: 1.55 }}>
            It disappears from the catalogue and this ledger straight away. If it has
            past orders, those and your sales reports keep their record.
          </p>
          {error && <p style={{ fontSize: 12, color: "var(--rose)", margin: "0 0 10px" }}>{error}</p>}
          <div className="flex items-center gap-2">
            <button
              className="btn"
              style={{ background: "var(--rose)", color: "#fff", flex: 1, padding: "10px 0" }}
              disabled={busy}
              onClick={confirm}
            >
              {busy ? "Removing…" : "Remove product"}
            </button>
            <button className="btn btn-outline" style={{ padding: "10px 16px" }} onClick={onClose} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
