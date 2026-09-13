"use client";

import { Product } from "../../types";
import { naira } from "../../lib/money";

export interface CheckoutForm {
  name: string;
  phone: string;
  email: string;
}

interface Props {
  items: (Product & { qty: number })[];
  subtotal: number;
  method: "stand" | "transfer";
  setMethod: (m: "stand" | "transfer") => void;
  form: CheckoutForm;
  setForm: (f: CheckoutForm) => void;
  error: string;
  placing: boolean;
  onClose: () => void;
  onPlace: () => void;
}

const METHODS = [
  {
    id: "stand" as const,
    title: "Reserve, pay at the stand",
    desc: "We'll hold your order until you collect it at the conference.",
  },
  {
    id: "transfer" as const,
    title: "Bank transfer",
    desc: "Pay directly to our account and bring proof when you collect.",
  },
];

export function CheckoutModal({
  items,
  subtotal,
  method,
  setMethod,
  form,
  setForm,
  error,
  placing,
  onClose,
  onPlace,
}: Props) {
  const hasBackorder = items.some((i) => i.stock === 0 && i.backorder);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card"
        style={{ width: "100%", maxWidth: 440, maxHeight: "88%", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", background: "var(--navy)", color: "#fff" }}
        >
          <p className="serif" style={{ fontWeight: 700, fontSize: 19.5, margin: 0 }}>
            Review your order
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20.5, color: "#fff" }}>
            &times;
          </button>
        </div>

        <div style={{ padding: "18px 20px" }}>
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between" style={{ marginBottom: 9 }}>
              <span style={{ fontSize: 17 }}>
                {i.name} &times;{i.qty} box{i.qty > 1 ? "es" : ""}
              </span>
              <span style={{ fontSize: 17, fontWeight: 600 }}>{naira(i.price * i.qty)}</span>
            </div>
          ))}
          <div
            className="flex items-center justify-between"
            style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 6 }}
          >
            <span style={{ fontSize: 17.5, fontWeight: 700 }}>Total</span>
            <span className="serif" style={{ fontSize: 20.5, fontWeight: 700, color: "var(--navy)" }}>
              {naira(subtotal)}
            </span>
          </div>

          {hasBackorder && (
            <div className="flex items-start gap-2" style={{ background: "#F3E9D6", padding: "10px 12px", marginTop: 14 }}>
              <span>&#9888;</span>
              <p style={{ fontSize: 15.5, color: "#7A5210", margin: 0 }}>
                Some items are out of current stock &mdash; we&apos;ll dispatch those from our regional store.
              </p>
            </div>
          )}

          <p style={{ fontSize: 17, fontWeight: 700, margin: "18px 0 8px" }}>Your details</p>
          <p style={{ fontSize: 15.5, color: "var(--ink-soft)", margin: "0 0 10px" }}>
            We only need this to confirm your order and reach you about delivery.
          </p>
          <div className="flex flex-col gap-2" style={{ marginBottom: 6 }}>
            <div className="field">
              <span className="icon">&#127970;</span>
              <input
                placeholder="Pharmacy or hospital name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <span className="icon">&#9742;</span>
              <input
                placeholder="Phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="field">
              <span className="icon">&#9993;</span>
              <input
                placeholder="Email (optional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
          {error && <p style={{ fontSize: 15.5, color: "var(--rose)", margin: "0 0 6px" }}>{error}</p>}

          <p style={{ fontSize: 17, fontWeight: 700, margin: "18px 0 10px" }}>How would you like to pay?</p>
          {METHODS.map((m) => (
            <label
              key={m.id}
              className="flex items-start gap-2"
              style={{
                border: `1px solid ${method === m.id ? "var(--navy)" : "var(--line)"}`,
                padding: "10px 12px",
                marginBottom: 9,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="method"
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
                style={{ marginTop: 2 }}
              />
              <span>
                <p style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>{m.title}</p>
                <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "2px 0 0" }}>{m.desc}</p>
              </span>
            </label>
          ))}
          {method === "transfer" && (
            <div style={{ background: "var(--cream-soft)", border: "1px solid var(--line)", padding: "11px 13px", marginBottom: 6 }}>
              <p style={{ fontSize: 16, margin: 0 }}>Embassy Pharmaceutical &amp; Chemicals Ltd</p>
              <p style={{ fontSize: 16, margin: "2px 0 0" }}>Account 0123456789 &middot; Zenith Bank</p>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px 0", fontSize: 17.5, marginTop: 10 }}
            disabled={placing}
            onClick={onPlace}
          >
            {placing ? "Placing order…" : "Place order"}
          </button>
        </div>
      </div>
    </div>
  );
}
