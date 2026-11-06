"use client";

import { useEffect, useState } from "react";
import { ConsoleOrder, Product } from "../../types";
import { apiGet, apiPatch } from "../../lib/api";
import { naira, unitLabel } from "../../lib/money";

interface Line {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  sellUnit: Product["sellUnit"];
}

export function EditOrderModal({
  order,
  onClose,
  onSaved,
}: {
  order: ConsoleOrder;
  onClose: () => void;
  onSaved: (o: ConsoleOrder) => void;
}) {
  const [lines, setLines] = useState<Line[]>(
    order.items.map((i) => ({
      productId: i.product,
      name: i.name,
      qty: i.qty,
      unitPrice: i.unitPrice,
      sellUnit: i.sellUnit || "box",
    }))
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // live search against the full catalogue — the console's ledger list only
  // holds whatever page has scrolled into view, so it can't be used here
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const term = search.trim();
    if (!term) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      apiGet<{ products: Product[] }>(`/api/admin/products?q=${encodeURIComponent(term)}&limit=8`)
        .then((d) => setResults(d.products || []))
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const setQty = (productId: string, qty: number) => {
    setLines((list) => list.map((l) => (l.productId === productId ? { ...l, qty: Math.max(1, qty) } : l)));
  };

  const removeLine = (productId: string) => {
    setLines((list) => list.filter((l) => l.productId !== productId));
  };

  const addable = results.filter((p) => !lines.some((l) => l.productId === p.id));

  const addLine = (p: Product) => {
    setLines((list) => [...list, { productId: p.id, name: p.name, qty: 1, unitPrice: p.price, sellUnit: p.sellUnit }]);
    setSearch("");
    setResults([]);
  };

  const save = async () => {
    if (lines.length === 0) {
      setError("An order needs at least one item.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await apiPatch<ConsoleOrder>(`/api/admin/orders/${order.id}`, {
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
      });
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card flex flex-col"
        style={{ width: "100%", maxWidth: 440, maxHeight: "90%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", background: "var(--navy)", color: "#fff", flexShrink: 0 }}
        >
          <p className="serif" style={{ fontWeight: 700, fontSize: 17.5, margin: 0 }}>
            Edit order &middot; {order.code}
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18.5, color: "#fff" }}>
            &times;
          </button>
        </div>

        <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>
          {lines.length === 0 ? (
            <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "0 0 12px" }}>No items left on this order.</p>
          ) : (
            lines.map((l) => (
              <div key={l.productId} className="flex items-center justify-between gap-2" style={{ marginBottom: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14.5, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.name}
                  </p>
                  <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "2px 0 0" }}>
                    {naira(l.unitPrice)} / {unitLabel(l.sellUnit, 1)}
                  </p>
                </div>
                <div className="stepper" style={{ flexShrink: 0 }}>
                  <button onClick={() => setQty(l.productId, l.qty - 1)} aria-label={`decrease ${l.name}`}>
                    &minus;
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={l.qty}
                    aria-label={`quantity for ${l.name}`}
                    onChange={(e) => setQty(l.productId, parseInt(e.target.value, 10) || 1)}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button onClick={() => setQty(l.productId, l.qty + 1)} aria-label={`increase ${l.name}`}>
                    +
                  </button>
                </div>
                <span style={{ fontSize: 14.5, fontWeight: 600, flexShrink: 0, minWidth: 76, textAlign: "right" }}>
                  {naira(l.unitPrice * l.qty)}
                </span>
                <button
                  onClick={() => removeLine(l.productId)}
                  aria-label={`remove ${l.name}`}
                  style={{ background: "none", border: "none", color: "var(--rose)", fontSize: 17.5, flexShrink: 0, lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>
            ))
          )}

          <div style={{ marginTop: 6, marginBottom: 12 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products to add…"
              style={{ width: "100%", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", padding: "8px 10px", fontSize: 13.5, background: "#fff" }}
            />
            {search.trim() !== "" && (
              <div style={{ border: "1px solid var(--line)", borderTop: "none", borderRadius: "0 0 var(--r-sm) var(--r-sm)", maxHeight: 180, overflowY: "auto" }}>
                {searching ? (
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0, padding: "8px 10px" }}>Searching…</p>
                ) : addable.length === 0 ? (
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0, padding: "8px 10px" }}>No matches.</p>
                ) : (
                  addable.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addLine(p)}
                      className="flex items-center justify-between"
                      style={{ width: "100%", background: "#fff", border: "none", borderTop: "1px solid var(--line)", padding: "8px 10px", fontSize: 13.5, textAlign: "left", cursor: "pointer" }}
                    >
                      <span>{p.name}</span>
                      <span style={{ color: "var(--ink-soft)" }}>
                        {naira(p.price)}/{unitLabel(p.sellUnit, 1)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div
            className="flex items-center justify-between"
            style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 6 }}
          >
            <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
            <span className="serif" style={{ fontSize: 19, fontWeight: 700, color: "var(--navy)" }}>
              {naira(total)}
            </span>
          </div>
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--line)", background: "#fff", flexShrink: 0 }}>
          {error && <p style={{ fontSize: 14, color: "var(--rose)", margin: "0 0 8px" }}>{error}</p>}
          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px 0", fontSize: 16 }}
            disabled={busy || lines.length === 0}
            onClick={save}
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
