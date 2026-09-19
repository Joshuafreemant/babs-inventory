"use client";

import { useEffect, useState } from "react";
import { TrackedOrder } from "../../types";
import { apiGet } from "../../lib/api";
import { naira } from "../../lib/money";
import { StatusPill } from "../StatusPill";
import type { DocKind, OrderDocData } from "../OrderDoc";
import { OrderRow } from "../Ordernow";

/** Anything containing a letter is treated as an order code (EMB-0035); otherwise a phone number. */
const isOrderCode = (s: string) => /[a-z]/i.test(s);

export function TrackPanel({ initialPhone = "" }: { initialPhone?: string }) {
  const [query, setQuery] = useState(initialPhone);
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(Boolean(initialPhone));
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    setQuery(initialPhone);
    if (initialPhone) setTouched(true);
  }, [initialPhone]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setOrders([]);
      return;
    }
    let active = true;
    setLoading(true);
    const t = setTimeout(() => {
      const param = isOrderCode(q) ? "code" : "phone";
      apiGet<TrackedOrder[]>(`/api/orders/track?${param}=${encodeURIComponent(q)}`)
        .then((res) => active && setOrders(res))
        .catch(() => active && setOrders([]))
        .finally(() => active && setLoading(false));
    }, 350);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  async function handleDownload(o: TrackedOrder) {
    const kind: DocKind = o.status === "paid" ? "receipt" : "invoice";
    const q = query.trim();
    // Only send the phone when the customer actually searched by phone;
    // searching by code alone gets a document with masked contact details.
    const phoneParam = isOrderCode(q) ? "" : `&phone=${encodeURIComponent(q)}`;

    setBusyCode(o.code);
    setDownloadError("");
    try {
      const data = await apiGet<OrderDocData>(
        `/api/orders/document?code=${encodeURIComponent(o.code)}${phoneParam}`
      );
      // loaded on click so html2canvas / jsPDF stay out of the main bundle
      const { downloadOrderDocument } = await import("../../components/Downloadorderdocument");
      await downloadOrderDocument(kind, data);
    } catch (err) {
      console.error(err);
      setDownloadError("Couldn't create the document. Please try again.");
    } finally {
      setBusyCode(null);
    }
  }

  return (
    <div className="card" style={{ padding: "18px 20px", marginBottom: 24 }}>
      <p className="serif" style={{ fontWeight: 700, fontSize: 19.5, margin: "0 0 10px" }}>
        Track my orders
      </p>
      <div className="flex items-center gap-2" style={{ marginBottom: 12, maxWidth: 340 }}>
        <div className="field" style={{ flex: 1 }}>
          <span className="icon">&#9742;</span>
          <input
            placeholder="Order code or phone number"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setTouched(true);
            }}
          />
        </div>
      </div>

      {!touched || query.trim() === "" ? (
        <p style={{ fontSize: 16, color: "var(--ink-soft)", margin: 0 }}>
          Enter your order code (e.g. EMB-0035) to see one order, or your phone number to see all your orders.
        </p>
      ) : loading ? (
        <p style={{ fontSize: 16, color: "var(--ink-soft)", margin: 0 }}>Looking…</p>
      ) : orders.length === 0 ? (
        <p style={{ fontSize: 16, color: "var(--ink-soft)", margin: 0 }}>
          No orders found. Check the order code or phone number and try again.
        </p>
      ) : (
       <div className="flex flex-col gap-3">
  {orders.length > 1 && (
    <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>{orders.length} orders found</p>
  )}
  {orders.map((o) => (
    <OrderRow
      key={o.code}
      order={o}
      busy={busyCode === o.code}
      onDownload={() => handleDownload(o)}
    />
  ))}
</div>
      )}

      {downloadError && (
        <p style={{ fontSize: 15, color: "#b3261e", margin: "10px 0 0" }}>{downloadError}</p>
      )}
    </div>
  );
}