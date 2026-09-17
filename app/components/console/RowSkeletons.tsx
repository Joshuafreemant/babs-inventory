/** Placeholder rows shown in the console panels while the first page loads. */
export function LedgerRowSkeleton() {
  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }} aria-hidden="true">
      <div className="flex items-start justify-between gap-2">
        <div style={{ minWidth: 0, flex: "1 1 180px" }}>
          <div className="skeleton" style={{ height: 15, width: "62%", marginBottom: 7 }} />
          <div className="skeleton" style={{ height: 13, width: "80%" }} />
        </div>
        <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
          <div className="skeleton" style={{ height: 30, width: 92, borderRadius: "var(--r-pill)" }} />
          <div className="skeleton" style={{ height: 30, width: 72, borderRadius: "var(--r-pill)" }} />
        </div>
      </div>
      <div className="flex items-center gap-3" style={{ marginTop: 10 }}>
        <div className="skeleton" style={{ height: 34, width: 34, borderRadius: "var(--r-sm)" }} />
        <div className="skeleton" style={{ height: 12, width: 130, borderRadius: "var(--r-pill)" }} />
        <div className="skeleton" style={{ height: 12, width: 100, borderRadius: "var(--r-pill)" }} />
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div style={{ padding: "11px 18px", borderBottom: "1px solid var(--line)" }} aria-hidden="true">
      <div className="flex items-center justify-between">
        <div className="skeleton" style={{ height: 15, width: "45%" }} />
        <div className="skeleton" style={{ height: 20, width: 74, borderRadius: "var(--r-pill)" }} />
      </div>
      <div className="skeleton" style={{ height: 13, width: "70%", marginTop: 8 }} />
      <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
        <div className="skeleton" style={{ height: 12, width: 120 }} />
        <div className="skeleton" style={{ height: 14, width: 56 }} />
      </div>
      <div className="skeleton" style={{ height: 34, width: "100%", marginTop: 8, borderRadius: "var(--r-sm)" }} />
    </div>
  );
}
