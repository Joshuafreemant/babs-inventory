import type { CSSProperties } from "react";
import { naira, unitLabel } from "../lib/money";
import { nairaInWords } from "../lib/numbertowords";

export type DocKind = "invoice" | "receipt";

export interface OrderDocData {
  code: string;
  customerName: string;
  phone: string;
  email?: string;
  items: {
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    sellUnit?: "box" | "packet";
  }[];
  total: number;
  method?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

/* ── Edit these to change the letterhead / fixed text ─────────────── */
const COMPANY = {
  name: "EMBASSY",
  legal: "Pharmaceutical and Chem. Ltd.",
  tagline: "PHARMACEUTICALS · CHEMICALS · COSMETICS",
  address: "No: 41 Ademola Street, S/W Ikoyi, Lagos.",
  contact: "Tel: 01-4630021 · orders@embassypharma.ng",
  preparedBy: "Embassy Pharmaceutical & Chemicals LTD",
  event: "Ijele 2026, ICC Awka",
  signOff: "FOR: EMBASSY PHARMS. LTD.",
  logo: "/logo.png", // put the logo in /public
};

const METHOD_LABEL: Record<string, string> = {
  stand: "Reserved, pay at stand",
};

/* ── Tokens ───────────────────────────────────────────────────────── */
const INK = "#1a1a1a";
const PAPER = "#fbfaf6";
const SOFT = "#5b5346";
const RULE = "#cfcabd";
const SANS = `Inter, "Helvetica Neue", Arial, sans-serif`;
const MONO = `"JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace`;
const COLS = "55px 1fr 112px";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
/** EMB-0035 -> 000035 (swap for a real invoice counter if you add one) */
const docNo = (code: string) => (code.replace(/\D/g, "") || "0").padStart(6, "0");

const caps: CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};
const cell: CSSProperties = {
  padding: "9px 10px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  fontSize: 14,
};

function SumRow({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        height: 30,
        padding: "0 11px 0 14px",
        fontSize: 12,
        fontWeight: 700,
        background: dark ? INK : "transparent",
        color: dark ? "#fff" : INK,
        borderBottom: dark ? "none" : `1px solid ${RULE}`,
      }}
    >
      <span style={{ fontSize: 11, letterSpacing: "0.1em" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function OrderDocument({ kind, data }: { kind: DocKind; data: OrderDocData }) {
  const isReceipt = kind === "receipt";
  const date = fmtDate(isReceipt ? data.updatedAt || data.createdAt : data.createdAt);
  const advance = isReceipt ? data.total : 0;
  const balance = data.total - advance;
  const title = isReceipt ? "CASH / DEBIT SALES RECEIPT" : "CASH / DEBIT SALES INVOICE";
  const methodText = (data.method && METHOD_LABEL[data.method]) || data.method || "";
  const lastIdx = data.items.length - 1;

  return (
    <div
      style={{
        position: "relative",
        width: 760,
        boxSizing: "border-box",
        background: PAPER,
        color: INK,
        fontFamily: SANS,
        border: `2px solid ${INK}`,
        overflow: "hidden",
      }}
    >
      {/* watermark */}
      <img
        src={COMPANY.logo}
        alt=""
        style={{
          position: "absolute",
          left: "47%",
          top: "56%",
          width: 330,
          transform: "translate(-50%, -50%)",
          opacity: 0.07,
          pointerEvents: "none",
        }}
      />

      {/* letterhead */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          padding: "22px 24px 16px",
          borderBottom: `3px solid ${INK}`,
        }}
      >
        <div>
          <div style={{ fontSize: 35, fontWeight: 900, letterSpacing: "0.01em", lineHeight: 1 }}>
            {COMPANY.name}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>{COMPANY.legal}</div>
          <div style={{ ...caps, fontSize: 10, letterSpacing: "0.2em", color: SOFT, marginTop: 10 }}>
            {COMPANY.tagline}
          </div>
        </div>
        <img src={COMPANY.logo} alt="" style={{ width: 54, height: "auto", marginTop: 4 }} />
      </div>

      {/* address + date */}
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
        }}
      >
        <div style={{ fontSize: 12.5, lineHeight: 1.45 }}>
          <div>{COMPANY.address}</div>
          <div>{COMPANY.contact}</div>
        </div>
        <div style={{ border: `2px solid ${INK}`, padding: "9px 32px", textAlign: "center" }}>
          <div style={{ ...caps, fontSize: 11, letterSpacing: "0.1em" }}>
            {isReceipt ? "RECEIPT DATE" : "INVOICE DATE"}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 13, marginTop: 5 }}>{date}</div>
        </div>
      </div>

      {/* title bar */}
      <div
        style={{
          position: "relative",
          background: INK,
          color: "#fff",
          height: 34,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: "0.06em",
        }}
      >
        <span>{title} · NO.</span>
        <span style={{ fontFamily: MONO, marginLeft: 7 }}>{docNo(data.code)}</span>
      </div>

      {/* customer / prepared by */}
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: `2px solid ${INK}`,
        }}
      >
        <div style={{ padding: "14px 24px 12px", borderRight: `1px solid ${INK}` }}>
          <div style={{ ...caps, color: SOFT }}>Messers</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 5 }}>{data.customerName}</div>
          <div style={{ fontSize: 11.5, color: SOFT, marginTop: 3 }}>
            {[data.email, data.phone].filter(Boolean).join(" · ")}
          </div>
        </div>
        <div style={{ padding: "14px 24px 12px" }}>
          <div style={{ ...caps, color: SOFT }}>Prepared by</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 5 }}>
            {COMPANY.preparedBy} · Order {data.code}
          </div>
          <div style={{ fontSize: 11.5, color: SOFT, marginTop: 3 }}>
            {[COMPANY.event, methodText].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      {/* items */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            height: 30,
            borderBottom: `2px solid ${INK}`,
            ...caps,
            fontSize: 11,
            letterSpacing: "0.12em",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRight: `2px solid ${INK}` }}>
            Qty.
          </div>
          <div style={{ display: "flex", alignItems: "center", padding: "0 10px" }}>
            Description of goods
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 11px", borderLeft: `2px solid ${INK}` }}>
            Amount
          </div>
        </div>

        {data.items.map((it, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: COLS,
              minHeight: 48,
              borderBottom: i === lastIdx ? `2px solid ${INK}` : `1px solid ${RULE}`,
            }}
          >
            <div style={{ ...cell, alignItems: "center", borderRight: `2px solid ${INK}` }}>{it.qty}</div>
            <div style={cell}>
              <div>{it.name}</div>
              <div style={{ fontSize: 10.5, color: SOFT, marginTop: 3 }}>
                {naira(it.unitPrice)} / {unitLabel(it.sellUnit, 1)}
              </div>
            </div>
            <div style={{ ...cell, alignItems: "flex-end", borderLeft: `2px solid ${INK}` }}>
              {naira(it.lineTotal)}
            </div>
          </div>
        ))}
      </div>

      {/* words + totals */}
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr 191px",
          borderBottom: `2px solid ${INK}`,
        }}
      >
        <div style={{ padding: "14px 24px" }}>
          <div style={{ ...caps, color: SOFT }}>Amount in words</div>
          <div style={{ fontSize: 14, fontStyle: "italic", marginTop: 6 }}>{nairaInWords(data.total)}</div>
        </div>
        <div style={{ borderLeft: `2px solid ${INK}` }}>
          <SumRow label="ADVANCE" value={naira(advance)} />
          <SumRow label="BALANCE" value={naira(balance)} />
          <SumRow label={isReceipt ? "TOTAL PAID" : "TOTAL DUE"} value={naira(isReceipt ? data.total : balance)} dark />
        </div>
      </div>

      {/* signatures */}
      <div style={{ position: "relative", display: "flex", gap: 86, padding: "54px 24px 22px" }}>
        <div style={{ flex: 1, borderTop: `1.5px solid ${INK}`, paddingTop: 10, ...caps, fontSize: 11, letterSpacing: "0.08em" }}>
          {COMPANY.signOff}
        </div>
        <div style={{ flex: 1, borderTop: `1.5px solid ${INK}`, paddingTop: 10, ...caps, fontSize: 11, letterSpacing: "0.08em" }}>
          Customer&apos;s signature
        </div>
      </div>
    </div>
  );
}