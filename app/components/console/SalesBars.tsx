"use client";

import { useState } from "react";
import { naira } from "../../lib/money";

interface Point {
  date: string;
  revenue: number;
  orders: number;
}

/** Single-series sales-over-time bars. Navy marks, gold on hover, recessive axis. */
export function SalesBars({ series, bucket }: { series: Point[]; bucket: "day" | "week" }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...series.map((p) => p.revenue));
  const hasData = series.some((p) => p.revenue > 0);

  const fmtDate = (d: string) => {
    const dt = new Date(d + "T00:00:00");
    const day = dt.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
    return bucket === "week" ? `Week of ${day}` : day;
  };

  if (!hasData) {
    return (
      <div
        className="card"
        style={{ padding: "20px 18px", fontSize: 13, color: "var(--ink-soft)" }}
      >
        No sales in this range yet.
      </div>
    );
  }

  const active = hover !== null ? series[hover] : null;

  return (
    <div className="card" style={{ padding: "16px 18px" }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
        <p className="serif" style={{ fontWeight: 700, fontSize: 14.5, margin: 0 }}>
          Sales over time
        </p>
        <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
          {active
            ? `${fmtDate(active.date)} · ${naira(active.revenue)} · ${active.orders} order${
                active.orders === 1 ? "" : "s"
              }`
            : `peak ${naira(max)}`}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 2,
          height: 150,
          borderBottom: "1px solid var(--line)",
          paddingTop: 6,
        }}
      >
        {series.map((p, i) => {
          const h = (p.revenue / max) * 100;
          return (
            <div
              key={p.date}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              title={`${fmtDate(p.date)} — ${naira(p.revenue)} (${p.orders} orders)`}
              style={{
                flex: 1,
                minWidth: 3,
                height: "100%",
                display: "flex",
                alignItems: "flex-end",
                cursor: "default",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: `${Math.max(h, p.revenue > 0 ? 2 : 0)}%`,
                  background: hover === i ? "var(--gold)" : "var(--navy)",
                  borderRadius: "3px 3px 0 0",
                  transition: "background 0.1s",
                }}
              />
            </div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between"
        style={{ marginTop: 6, fontSize: 10.5, color: "var(--ink-soft)" }}
      >
        <span>{fmtDate(series[0].date)}</span>
        <span>{fmtDate(series[series.length - 1].date)}</span>
      </div>
    </div>
  );
}
