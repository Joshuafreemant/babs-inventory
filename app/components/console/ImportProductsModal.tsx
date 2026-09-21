"use client";

import { useState } from "react";
import { Product } from "../../types";
import { apiPost } from "../../lib/api";

const EXAMPLE = JSON.stringify(
  [
    {
      name: "Paracetamol 500mg Tablets",
      category: "bottle",
      price: 1200,
      boxesPerCarton: 24,
      stock: 480,
      lowStockThreshold: 80,
      backorder: false,
    },
    {
      name: "Amoxicillin Dry Syrup",
      category: "syrup",
      price: 2600,
      boxesPerCarton: 36,
      cartons: 10,
      loose: 6,
    },
    {
      name: "Zinc Oxide Cream",
      category: "tube",
      price: 1550,
      boxesPerCarton: 40,
    },
  ],
  null,
  2
);

interface ImportResult {
  created: Product[];
  skipped: { name: string; reason: string }[];
  summary: { total: number; created: number; skipped: number };
}

export function ImportProductsModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (created: Product[]) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const run = async () => {
    setError("");
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("That isn't valid JSON. Paste an array like the example below.");
      return;
    }
    const products = Array.isArray(parsed) ? parsed : parsed?.products;
    if (!Array.isArray(products)) {
      setError("Expected a JSON array of products (or { \"products\": [ ... ] }).");
      return;
    }
    setBusy(true);
    try {
      const res = await apiPost<ImportResult>("/api/admin/products/bulk", { products });
      setResult(res);
      if (res.created.length) onImported(res.created);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card"
        style={{ width: "100%", maxWidth: 560, maxHeight: "90%", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", background: "var(--navy)", color: "#fff" }}
        >
          <p className="serif" style={{ fontWeight: 700, fontSize: 17.5, margin: 0 }}>
            Import products
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18.5, color: "#fff" }}>
            &times;
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {result ? (
            <div>
              <p style={{ fontSize: 15.5, fontWeight: 700, margin: "0 0 8px" }}>
                {result.summary.created} added, {result.summary.skipped} skipped of {result.summary.total}
              </p>
              {result.created.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p className="small-caps" style={{ color: "var(--sage)", margin: "0 0 4px" }}>
                    Added
                  </p>
                  <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>
                    {result.created.map((p) => p.name).join(", ")}
                  </p>
                </div>
              )}
              {result.skipped.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p className="small-caps" style={{ color: "var(--rose)", margin: "0 0 4px" }}>
                    Skipped
                  </p>
                  {result.skipped.map((s, i) => (
                    <p key={i} style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "2px 0" }}>
                      {s.name} &mdash; {s.reason}
                    </p>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "10px 0 12px" }}>
                Products came in without photos &mdash; add them from the ledger row thumbnails.
              </p>
              <button className="btn btn-primary" style={{ padding: "10px 16px" }} onClick={onClose}>
                Done
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "0 0 10px", lineHeight: 1.55 }}>
                Paste a JSON array. Each product needs a <strong>name</strong>,{" "}
                <strong>price</strong> (per box, or per packet if <code>sellUnit</code> is{" "}
                <code>&quot;packet&quot;</code>) and <strong>boxesPerCarton</strong>. Optional:{" "}
                <code>category</code>, <code>stock</code> or <code>cartons</code>+<code>loose</code>,{" "}
                <code>lowStockThreshold</code>, <code>backorder</code>, <code>imageUrl</code>,{" "}
                <code>sellUnit</code> (<code>&quot;box&quot;</code> default or{" "}
                <code>&quot;packet&quot;</code>) + <code>packetsPerBox</code> (required for packet rows,
                which must also give an explicit <code>stock</code>). Names that already exist are
                skipped.
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="[ { &quot;name&quot;: &quot;...&quot;, &quot;price&quot;: 1200, &quot;boxesPerCarton&quot;: 24 } ]"
                spellCheck={false}
                style={{
                  width: "100%",
                  minHeight: 200,
                  border: "1px solid var(--line)",
                  padding: "10px 12px",
                  fontFamily: "ui-monospace, Menlo, monospace",
                  fontSize: 14,
                  lineHeight: 1.5,
                  resize: "vertical",
                  background: "#fff",
                  color: "var(--ink)",
                }}
              />
              <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginTop: 10 }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setText(EXAMPLE)}
                  type="button"
                >
                  Load example
                </button>
                <button className="btn btn-primary" style={{ padding: "10px 18px" }} disabled={busy} onClick={run}>
                  {busy ? "Importing…" : "Import"}
                </button>
              </div>
              {error && <p style={{ fontSize: 13.5, color: "var(--rose)", margin: "10px 0 0" }}>{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
