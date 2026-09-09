"use client";

import { useEffect, useState } from "react";
import { TrackedOrder } from "../../types";
import { apiGet } from "../../lib/api";
import { naira } from "../../lib/money";
import { StatusPill } from "../StatusPill";

export function TrackPanel({ initialPhone = "" }: { initialPhone?: string }) {
  const [phone, setPhone] = useState(initialPhone);
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(Boolean(initialPhone));

  useEffect(() => {
    setPhone(initialPhone);
    if (initialPhone) setTouched(true);
  }, [initialPhone]);

  useEffect(() => {
    const q = phone.trim();
    if (!q) {
      setOrders([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      apiGet<TrackedOrder[]>(`/api/orders/track?phone=${encodeURIComponent(q)}`)
        .then((res) => setOrders(res))
        .catch(() => setOrders([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [phone]);

  return (
    <div className="card" style={{ padding: "18px 20px", marginBottom: 24 }}>
      <p className="serif" style={{ fontWeight: 700, fontSize: 18, margin: "0 0 10px" }}>
        Track my orders
      </p>
      <div className="flex items-center gap-2" style={{ marginBottom: 12, maxWidth: 340 }}>
        <div className="field" style={{ flex: 1 }}>
          <span className="icon">&#9742;</span>
          <input
            placeholder="Phone number used on your order"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setTouched(true);
            }}
          />
        </div>
      </div>

      {!touched || phone.trim() === "" ? (
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: 0 }}>
          Enter the phone number you ordered with.
        </p>
      ) : loading ? (
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: 0 }}>Looking…</p>
      ) : orders.length === 0 ? (
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: 0 }}>
          No orders found for that number.
        </p>
      ) : (
        orders.map((o) => (
          <div
            key={o.code}
            className="flex items-center justify-between"
            style={{ padding: "9px 0", borderTop: "1px solid var(--line)" }}
          >
            <div>
              <p style={{ fontSize: 15.5, margin: 0 }}>{o.items}</p>
              <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "2px 0 0" }}>
                {o.code} &middot; {naira(o.total)}
              </p>
            </div>
            <StatusPill status={o.status} label={o.statusLabel} />
          </div>
        ))
      )}
    </div>
  );
}
