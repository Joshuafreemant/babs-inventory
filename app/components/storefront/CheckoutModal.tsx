"use client";

import { useEffect, useRef } from "react";
import { Product } from "../../types";
import { naira, unitLabel } from "../../lib/money";

export interface CheckoutForm {
  name: string;
  phone: string;
}

export interface CheckoutPayment {
  bankName: string;
  accountNumber: string;
  accountName: string;
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
  payment?: CheckoutPayment;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
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
  payment,
  onQtyChange,
  onRemove,
  onClose,
  onPlace,
}: Props) {
  const hasBackorder = items.some((i) => i.stock === 0 && i.backorder);
  const hasPaymentDetails = !!(payment?.bankName || payment?.accountNumber || payment?.accountName);

  const detailsRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // if the details are missing, bring them into view instead of leaving the
  // error sitting next to a "Place order" button the fields have scrolled past
  useEffect(() => {
    if (!error) return;
    const missingName = !form.name.trim();
    const missingPhone = !form.phone.trim();
    if (!missingName && !missingPhone) return;
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    (missingName ? nameInputRef : phoneInputRef).current?.focus();
    // only re-run when a fresh error comes in, not on every keystroke
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card flex flex-col"
        style={{ width: "100%", maxWidth: 440, maxHeight: "94%" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", background: "var(--navy)", color: "#fff", flexShrink: 0 }}
        >
          <p className="serif" style={{ fontWeight: 700, fontSize: 18, margin: 0 }}>
            Review your order
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 19, color: "#fff" }}>
            &times;
          </button>
        </div>

        <div style={{ padding: "18px 20px", overflowY: "auto", flex: 1 }}>
          {items.length === 0 ? (
            <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "0 0 12px" }}>Your order is empty.</p>
          ) : (
            items.map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-2" style={{ marginBottom: 10 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 14.5, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {i.name}
                  </p>
                  <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "2px 0 0" }}>
                    {naira(i.price)} / {unitLabel(i.sellUnit, 1)}
                  </p>
                </div>
                <div className="stepper" style={{ flexShrink: 0 }}>
                  <button onClick={() => onQtyChange(i.id, i.qty - 1)} aria-label={`decrease ${i.name}`}>
                    &minus;
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={i.qty}
                    aria-label={`quantity for ${i.name}`}
                    onChange={(e) => onQtyChange(i.id, parseInt(e.target.value, 10) || 0)}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <button onClick={() => onQtyChange(i.id, i.qty + 1)} aria-label={`increase ${i.name}`}>
                    +
                  </button>
                </div>
                <span style={{ fontSize: 14.5, fontWeight: 600, flexShrink: 0, minWidth: 76, textAlign: "right" }}>
                  {naira(i.price * i.qty)}
                </span>
                <button
                  onClick={() => onRemove(i.id)}
                  aria-label={`remove ${i.name}`}
                  style={{ background: "none", border: "none", color: "var(--rose)", fontSize: 17.5, flexShrink: 0, lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>
            ))
          )}
          <div
            className="flex items-center justify-between"
            style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginTop: 6 }}
          >
            <span style={{ fontSize: 16, fontWeight: 700 }}>Total</span>
            <span className="serif" style={{ fontSize: 19, fontWeight: 700, color: "var(--navy)" }}>
              {naira(subtotal)}
            </span>
          </div>

          {hasBackorder && (
            <div className="flex items-start gap-2" style={{ background: "#F3E9D6", borderRadius: "var(--r-sm)", padding: "10px 12px", marginTop: 14 }}>
              <span>&#9888;</span>
              <p style={{ fontSize: 14, color: "#7A5210", margin: 0 }}>
                Some items are out of current stock &mdash; we&apos;ll dispatch those from our regional store.
              </p>
            </div>
          )}

          <div ref={detailsRef}>
            <p style={{ fontSize: 15.5, fontWeight: 700, margin: "18px 0 8px" }}>Your details</p>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 10px" }}>
              We only need this to confirm your order and reach you about delivery.
            </p>
            <div className="flex flex-col gap-2" style={{ marginBottom: 6 }}>
              <div className="field">
                <span className="icon">&#127970;</span>
                <input
                  ref={nameInputRef}
                  placeholder="Pharmacy or hospital name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <span className="icon">&#9742;</span>
                <input
                  ref={phoneInputRef}
                  placeholder="Phone number"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <p style={{ fontSize: 15.5, fontWeight: 700, margin: "18px 0 10px" }}>How would you like to pay?</p>
          {METHODS.map((m) => (
            <label
              key={m.id}
              className="flex items-start gap-2"
              style={{
                border: `1.5px solid ${method === m.id ? "var(--navy)" : "var(--line)"}`,
                borderRadius: "var(--r-sm)",
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
                <p style={{ fontSize: 15.5, fontWeight: 600, margin: 0 }}>{m.title}</p>
                <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "2px 0 0" }}>{m.desc}</p>
              </span>
            </label>
          ))}
          {method === "transfer" && (
            <div style={{ background: "var(--cream-soft)", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", padding: "11px 13px", marginBottom: 6 }}>
              {hasPaymentDetails ? (
                <>
                  {payment?.accountName && <p style={{ fontSize: 14.5, margin: 0 }}>{payment.accountName}</p>}
                  <p style={{ fontSize: 14.5, margin: "2px 0 0" }}>
                    {payment?.accountNumber && <>Account {payment.accountNumber}</>}
                    {payment?.accountNumber && payment?.bankName && " · "}
                    {payment?.bankName}
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: 0 }}>
                  We&apos;ll share our bank details with you once your order is placed.
                </p>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--line)", background: "#fff", flexShrink: 0 }}>
          {error && <p style={{ fontSize: 14, color: "var(--rose)", margin: "0 0 8px" }}>{error}</p>}
          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px 0", fontSize: 16 }}
            disabled={placing || items.length === 0}
            onClick={onPlace}
          >
            {placing ? "Placing order…" : "Place order"}
          </button>
        </div>
      </div>
    </div>
  );
}
