/** Colour-coded order status pill, matching the prototype's palette. */
export function StatusPill({ status, label }: { status: string; label: string }) {
  const warm = { bg: "#F3E9D6", fg: "#8A5A16" };
  const map: Record<string, { bg: string; fg: string }> = {
    reserved: warm,
    awaiting_transfer: { bg: "var(--rose-bg)", fg: "var(--rose)" },
    paid: { bg: "var(--sage-bg)", fg: "var(--sage)" },
    dispatched: { bg: "var(--sage-bg)", fg: "var(--sage)" },
    collected: { bg: "var(--sage-bg)", fg: "var(--sage)" },
    cancelled: { bg: "#ECECEC", fg: "#6B6B6B" },
  };
  const c = map[status] || warm;
  return (
    <span className="pill" style={{ background: c.bg, color: c.fg }}>
      {label}
    </span>
  );
}
