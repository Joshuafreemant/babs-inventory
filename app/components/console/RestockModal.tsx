"use client";

import { useState } from "react";
import { Product } from "../../types";
import { apiPatch } from "../../lib/api";
import { toBoxes, toPackets, unitLabel } from "../../lib/money";

export function RestockModal({
  product,
  onClose,
  onRestocked,
}: {
  product: Product;
  onClose: () => void;
  onRestocked: (p: Product, added: number) => void;
}) {
  const [cartons, setCartons] = useState("");
  const [boxes, setBoxes] = useState("");
  const [loose, setLoose] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isPacket = product.sellUnit === "packet";
  const c = parseInt(cartons, 10) || 0;
  const b = parseInt(boxes, 10) || 0;
  const l = parseInt(loose, 10) || 0;
  const adding = isPacket
    ? toPackets(c, b, l, product.boxesPerCarton, product.packetsPerBox || 0)
    : toBoxes(c, l, product.boxesPerCarton);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const updated = await apiPatch<Product>(`/api/admin/products/${product.id}`, {
        op: "restock",
        cartons: c,
        boxes: isPacket ? b : undefined,
        loose: l,
      });
      onRestocked(updated, adding);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
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
          <p className="serif" style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>
            Restock &mdash; {product.name}
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18.5, color: "#fff" }}>
            &times;
          </button>
        </div>
        <div style={{ padding: "18px 20px" }}>
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 12px" }}>
            Currently {product.stock.toLocaleString("en-NG")} {unitLabel(product.sellUnit, product.stock)} in
            stock. Count what arrived and enter it below.
          </p>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: isPacket ? "1fr 1fr 1fr" : "1fr 1fr", marginBottom: 8 }}
          >
            <div className="field">
              <span className="icon">&#128230;</span>
              <input type="number" min={0} placeholder="Full cartons" value={cartons} onChange={(e) => setCartons(e.target.value)} />
            </div>
            {isPacket && (
              <div className="field">
                <span className="icon">&#128721;</span>
                <input type="number" min={0} placeholder="Full boxes" value={boxes} onChange={(e) => setBoxes(e.target.value)} />
              </div>
            )}
            <div className="field">
              <span className="icon">&#128722;</span>
              <input
                type="number"
                min={0}
                placeholder={isPacket ? "Loose packets" : "Loose boxes"}
                value={loose}
                onChange={(e) => setLoose(e.target.value)}
              />
            </div>
          </div>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
            Adding <strong>{adding.toLocaleString("en-NG")} {unitLabel(product.sellUnit, adding)}</strong> &middot; new
            total will be{" "}
            <strong>
              {(product.stock + adding).toLocaleString("en-NG")} {unitLabel(product.sellUnit, product.stock + adding)}
            </strong>
          </p>
          {error && <p style={{ fontSize: 13.5, color: "var(--rose)", margin: "0 0 8px" }}>{error}</p>}
          <button className="btn btn-primary" style={{ width: "100%", padding: "10px 0" }} disabled={busy} onClick={submit}>
            {busy ? "Adding…" : "Add to stock"}
          </button>
        </div>
      </div>
    </div>
  );
}
