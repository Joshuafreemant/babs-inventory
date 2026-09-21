import type { CSSProperties } from "react";
import { TrackedOrder } from "../types";
import { StatusPill } from "./StatusPill";
import { naira, cartonBreakdown, packetBreakdown, unitLabel } from "../lib/money";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

/** e.g. " (1 box + 4 loose)" — omitted when there's nothing to break down. */
function breakdownSuffix(it: TrackedOrder["items"][number]): string {
  if (it.sellUnit === "packet") {
    const bd = packetBreakdown(it.qty, it.boxesPerCarton, it.packetsPerBox || 1);
    const parts = [
      bd.cartons ? `${bd.cartons} carton${bd.cartons === 1 ? "" : "s"}` : "",
      bd.boxes ? `${bd.boxes} box${bd.boxes === 1 ? "" : "es"}` : "",
      bd.loosePackets ? `${bd.loosePackets} loose` : "",
    ].filter(Boolean);
    return parts.length > 1 ? ` (${parts.join(" + ")})` : "";
  }
  const bd = cartonBreakdown(it.qty, it.boxesPerCarton);
  const parts = [
    bd.cartons ? `${bd.cartons} carton${bd.cartons === 1 ? "" : "s"}` : "",
    bd.loose ? `${bd.loose} loose` : "",
  ].filter(Boolean);
  return parts.length > 1 ? ` (${parts.join(" + ")})` : "";
}

const chip: CSSProperties = {
  fontSize: 14,
  padding: "4px 10px",
  borderRadius: 999,
  background: "rgba(15,42,61,0.06)",
};

function DownloadIcon({ spinning }: { spinning?: boolean }) {
  return spinning ? (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 00-9-9" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />
    </svg>
  );
}

export function OrderRow({
  order: o,
  busy,
  onDownload,
}: {
  order: TrackedOrder;
  busy: boolean;
  onDownload: () => void;
}) {
  const paid = o.status === "paid";
  const date = fmtDate(o.createdAt);
  const items = o.items;
  const shown = items.slice(0, 3);
  const extra = items.length - shown.length;

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderLeft: `4px solid ${paid ? "#2e7d32" : "#c98a12"}`,
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      {/* code + date, status */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.02em", margin: 0 }}>
            {o.code}
          </p>
          {date && <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "2px 0 0" }}>{date}</p>}
        </div>
        <StatusPill status={o.status} label={o.statusLabel} />
      </div>

      {/* items */}
      <div className="flex flex-wrap gap-2" style={{ margin: "12px 0" }}>
        {shown.map((it, i) => (
          <span key={i} style={chip}>
            {it.name}
            <b style={{ fontWeight: 600, color: "var(--ink-soft)" }}>
              {" "}
              ×{it.qty} {unitLabel(it.sellUnit, it.qty)}
              {breakdownSuffix(it)}
            </b>
          </span>
        ))}
        {extra > 0 && <span style={{ ...chip, color: "var(--ink-soft)" }}>+{extra} more</span>}
      </div>

      {/* total + download */}
      <div
        className="flex items-center justify-between gap-3"
        style={{ borderTop: "1px dashed var(--line)", paddingTop: 12 }}
      >
        <div>
          <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: 0 }}>{paid ? "Total paid" : "Total"}</p>
          <p className="serif" style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>
            {naira(o.total)}
          </p>
        </div>

        <button
          type="button"
          onClick={onDownload}
          disabled={busy}
          aria-label={paid ? `Download receipt for ${o.code}` : `Download invoice for ${o.code}`}
          className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-60 ${
            paid
              ? "bg-[#0f2a3d] text-white hover:bg-[#16384f]"
              : "border border-[#0f2a3d] text-[#0f2a3d] hover:bg-[#0f2a3d]/5"
          }`}
        >
          <DownloadIcon spinning={busy} />
          {busy ? "Preparing…" : paid ? "Receipt" : "Invoice"}
        </button>
      </div>
    </div>
  );
}