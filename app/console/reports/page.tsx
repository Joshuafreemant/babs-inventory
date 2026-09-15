"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "../../components/SiteHeader";
import { RepAuth } from "../../components/console/RepAuth";
import { ConsoleShell } from "../../components/console/ConsoleShell";
import { SalesBars } from "../../components/console/SalesBars";
import { useInfiniteList } from "../../components/console/useInfiniteList";
import { InfiniteFooter } from "../../components/console/InfiniteFooter";
import { StaffSession } from "../../types";
import { apiGet, apiPost } from "../../lib/api";
import { naira } from "../../lib/money";

interface PerProductRow {
  productId: string;
  name: string;
  boxes: number;
  revenue: number;
  orders: number;
  sharePct: number;
}

interface ReportMeta {
  range: { from: string; to: string; label: string; bucket: "day" | "week"; basis: "paid" | "all" };
  totals: {
    revenue: number;
    orders: number;
    boxes: number;
    avgOrderValue: number;
    collectedRevenue: number;
    outstandingRevenue: number;
  };
  pipeline: { orders: number; revenue: number };
  bySource: {
    source: string;
    name: string;
    orders: number;
    boxes: number;
    revenue: number;
    sharePct: number;
  }[];
  byMethod: Record<string, { orders: number; revenue: number }>;
  perProductTotal: number;
  series: { date: string; revenue: number; orders: number }[];
}

const RANGES = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "mtd", label: "This month" },
  { id: "all", label: "All time" },
];

export default function ReportsPage() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [range, setRange] = useState("30d");
  const [basis, setBasis] = useState<"paid" | "all">("paid");
  const [meta, setMeta] = useState<ReportMeta | null>(null);
  const [csvBusy, setCsvBusy] = useState(false);

  useEffect(() => {
    apiGet<StaffSession>("/api/staff/me")
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setAuthChecked(true));
  }, []);

  // "Sales by product" is cursor-paginated; every other field in the
  // response (totals, series, pipeline, …) always covers the whole range,
  // so we just grab it off the first page each time range/basis changes.
  const productsList = useInfiniteList<PerProductRow>({
    endpoint: `/api/admin/reports?range=${range}&basis=${basis}`,
    key: "perProduct",
    limit: 10,
    enabled: !!session,
    onPage: (res) => {
      setMeta({
        range: res.range,
        totals: res.totals,
        pipeline: res.pipeline,
        bySource: res.bySource,
        byMethod: res.byMethod,
        perProductTotal: res.perProductTotal,
        series: res.series,
      });
    },
  });
  const products = productsList.items;
  const loading = productsList.loading && !meta;

  const signOut = async () => {
    await apiPost("/api/staff/logout").catch(() => {});
    setSession(null);
  };

  const downloadCsv = async () => {
    if (!meta) return;
    setCsvBusy(true);
    try {
      // pagination is for the on-screen list only — CSV always exports the full range
      const full = await apiGet<{ perProduct: PerProductRow[] }>(
        `/api/admin/reports?range=${range}&basis=${basis}&limit=2000`
      );
      const rows = [
        [
          `Embassy sales — ${meta.range.label} (${meta.range.from} to ${meta.range.to})`,
          basis === "paid" ? "paid orders only" : "all non-cancelled orders",
        ],
        [],
        ["Product", "Boxes sold", "Orders", "Revenue (NGN)", "Share %"],
        ...full.perProduct.map((p) => [
          p.name,
          String(p.boxes),
          String(p.orders),
          String(p.revenue),
          String(p.sharePct),
        ]),
        [],
        ["Total sales", "", String(meta.totals.orders), String(meta.totals.revenue), "100"],
      ];
      const csv = rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `embassy-sales-${basis}-${meta.range.from}-to-${meta.range.to}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setCsvBusy(false);
    }
  };

  if (!authChecked) {
    return (
      <div>
        <SiteHeader />
        <p style={{ padding: "32px var(--gutter)", color: "var(--ink-soft)" }}>Loading…</p>
      </div>
    );
  }
  if (!session) {
    return (
      <div>
        <SiteHeader />
        <RepAuth onSignedIn={setSession} />
      </div>
    );
  }

  const t = meta?.totals;
  const collectedPct = t && t.revenue > 0 ? (t.collectedRevenue / t.revenue) * 100 : 0;

  const tiles = [
    { label: "Total sales", value: t ? naira(t.revenue) : "—" },
    { label: "Orders", value: t ? t.orders.toLocaleString("en-NG") : "—" },
    { label: "Boxes sold", value: t ? t.boxes.toLocaleString("en-NG") : "—" },
    { label: "Avg order value", value: t ? naira(t.avgOrderValue) : "—" },
  ];

  const maxProductRevenue = Math.max(1, ...products.map((p) => p.revenue));

  return (
    <div>
      <SiteHeader onStaffSignout={signOut} />
      <ConsoleShell title="Reports" session={session}>
      <div style={{ padding: "32px var(--gutter)" }}>
        <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: 8 }}>
          <p className="serif" style={{ fontWeight: 700, fontSize: 23.5, margin: 0 }}>
            Sales report
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {RANGES.map((r) => (
              <button
                key={r.id}
                className={`chip ${range === r.id ? "active" : ""}`}
                onClick={() => setRange(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 8 }}>
          <span className="small-caps" style={{ color: "var(--ink-soft)" }}>
            Count
          </span>
          <div className="flex" style={{ background: "var(--cream-soft)", borderRadius: "var(--r-pill)", padding: 3, gap: 2 }}>
            <button
              className="btn btn-sm"
              style={{
                background: basis === "paid" ? "var(--navy)" : "transparent",
                color: basis === "paid" ? "var(--gold-light)" : "var(--ink-soft)",
              }}
              onClick={() => setBasis("paid")}
            >
              Paid only
            </button>
            <button
              className="btn btn-sm"
              style={{
                background: basis === "all" ? "var(--navy)" : "transparent",
                color: basis === "all" ? "var(--gold-light)" : "var(--ink-soft)",
              }}
              onClick={() => setBasis("all")}
            >
              All orders
            </button>
          </div>
        </div>

        <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 22px" }}>
          {meta ? meta.range.label : "…"}
          {meta ? ` · ${meta.range.from} to ${meta.range.to}` : ""}.{" "}
          {basis === "paid"
            ? "Only orders marked paid, dispatched or collected count as a sale."
            : "Every non-cancelled order counts, reservations included."}
        </p>

        {productsList.error && (
          <div className="card" style={{ padding: "14px 18px", marginBottom: 20, color: "var(--rose)" }}>
            {productsList.error}
          </div>
        )}

        {/* headline tiles */}
        <div className="grid-tiles" style={{ marginBottom: 16 }}>
          {tiles.map((tile) => (
            <div key={tile.label} className="card" style={{ padding: "16px 18px" }}>
              <p className="small-caps" style={{ color: "var(--ink-soft)", margin: "0 0 6px" }}>
                {tile.label}
              </p>
              <p
                className="serif"
                style={{ fontWeight: 700, fontSize: 22.5, margin: 0, fontVariantNumeric: "tabular-nums" }}
              >
                {loading ? "…" : tile.value}
              </p>
            </div>
          ))}
        </div>

        {/* money split / pipeline */}
        {t && meta && basis === "all" && (
          <div className="card" style={{ padding: "16px 18px", marginBottom: 16 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <p className="serif" style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>
                Money in vs. still owed
              </p>
              <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                {collectedPct.toFixed(0)}% collected
              </span>
            </div>
            <div style={{ display: "flex", height: 12, background: "var(--cream-soft)", overflow: "hidden" }}>
              <div style={{ width: `${collectedPct}%`, background: "var(--sage)" }} />
              <div style={{ width: `${100 - collectedPct}%`, background: "var(--gold)" }} />
            </div>
            <div className="flex items-center gap-3" style={{ marginTop: 8, fontSize: 13.5 }}>
              <span style={{ color: "var(--sage)", fontWeight: 600 }}>
                ● Paid {naira(t.collectedRevenue)}
              </span>
              <span style={{ color: "var(--gold)", fontWeight: 600 }}>
                ● Not yet paid {naira(t.outstandingRevenue)}
              </span>
            </div>
          </div>
        )}
        {meta && basis === "paid" && meta.pipeline.orders > 0 && (
          <div
            className="card"
            style={{ padding: "14px 18px", marginBottom: 16, borderLeft: "2px solid var(--gold)" }}
          >
            <p style={{ fontSize: 14.5, margin: 0, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              <strong style={{ color: "var(--ink)" }}>{naira(meta.pipeline.revenue)}</strong> in{" "}
              {meta.pipeline.orders} reserved / unpaid order
              {meta.pipeline.orders === 1 ? "" : "s"} in this period &mdash; not counted above. Mark
              them paid on the Order desk once the money is in.
            </p>
          </div>
        )}

        {/* time series */}
        <div style={{ marginBottom: 16 }}>
          {meta && <SalesBars series={meta.series} bucket={meta.range.bucket} />}
        </div>

        {/* per-product */}
        <div className="card">
          <div
            className="flex items-center justify-between"
            style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}
          >
            <div>
              <p className="serif" style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>
                Sales by product
              </p>
              {meta && meta.perProductTotal > 0 && (
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "2px 0 0" }}>
                  {products.length} of {meta.perProductTotal}
                </p>
              )}
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={downloadCsv}
              disabled={!meta || meta.perProductTotal === 0 || csvBusy}
            >
              {csvBusy ? "Preparing…" : "Download CSV"}
            </button>
          </div>

          {productsList.ready && products.length === 0 && (
            <p style={{ padding: "16px 18px", fontSize: 14.5, color: "var(--ink-soft)", margin: 0 }}>
              No sales in this range.
            </p>
          )}

          {products.map((p) => (
            <div
              key={p.productId}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--line)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{p.name}</p>
                <span style={{ fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                  {naira(p.revenue)}
                </span>
              </div>
              <div style={{ height: 6, background: "var(--cream-soft)", width: "100%" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(p.revenue / maxProductRevenue) * 100}%`,
                    background: "var(--navy)",
                    borderRadius: "0 3px 3px 0",
                  }}
                />
              </div>
              <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "5px 0 0" }}>
                {p.sharePct}% of sales &middot; {p.boxes.toLocaleString("en-NG")} box
                {p.boxes === 1 ? "" : "es"} &middot; {p.orders} order{p.orders === 1 ? "" : "s"}
              </p>
            </div>
          ))}
          <InfiniteFooter list={productsList} noun="products" count={meta?.perProductTotal ?? products.length} />
        </div>

        {/* sales by referral source */}
        {meta && meta.bySource.length > 0 && (
          <div className="card" style={{ marginTop: 16 }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
              <p className="serif" style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>
                Sales by referral source
              </p>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "3px 0 0" }}>
                Which rep&apos;s shared link the buyer came through.
              </p>
            </div>
            {meta.bySource.map((s) => (
              <div
                key={s.source}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--line)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>{s.name}</p>
                  <span style={{ fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                    {naira(s.revenue)}
                  </span>
                </div>
                <div style={{ height: 6, background: "var(--cream-soft)", width: "100%" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${s.sharePct}%`,
                      background: s.source === "direct" ? "var(--ink-soft)" : "var(--sage)",
                      borderRadius: "0 3px 3px 0",
                    }}
                  />
                </div>
                <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "5px 0 0" }}>
                  {s.sharePct}% of sales &middot; {s.orders} order{s.orders === 1 ? "" : "s"} &middot;{" "}
                  {s.boxes.toLocaleString("en-NG")} box{s.boxes === 1 ? "" : "es"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* payment method split */}
        {meta && (
          <div className="grid-tiles" style={{ marginTop: 16 }}>
            {[
              { key: "stand", label: "Reserved — pay at stand" },
              { key: "transfer", label: "Bank transfer" },
            ].map((m) => {
              const d = meta.byMethod[m.key] || { orders: 0, revenue: 0 };
              return (
                <div key={m.key} className="card" style={{ padding: "14px 18px" }}>
                  <p className="small-caps" style={{ color: "var(--ink-soft)", margin: "0 0 6px" }}>
                    {m.label}
                  </p>
                  <p className="serif" style={{ fontWeight: 700, fontSize: 18.5, margin: 0 }}>
                    {naira(d.revenue)}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "2px 0 0" }}>
                    {d.orders} order{d.orders === 1 ? "" : "s"}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </ConsoleShell>
    </div>
  );
}
