/** Placeholder tile shown in the catalogue grid while products are loading. */
export function ProductCardSkeleton() {
  return (
    <div className="card flex flex-col" aria-hidden="true">
      <div className="art-panel skeleton" style={{ borderRadius: 0, padding: 0 }} />
      <div style={{ padding: "15px 16px", borderTop: "1px solid var(--line)" }}>
        <div className="skeleton" style={{ height: 19, width: "78%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 13, width: "58%", marginBottom: 11 }} />
        <div className="skeleton" style={{ height: 16, width: "42%", marginBottom: 14 }} />
        <div className="flex items-center gap-2">
          <div className="skeleton" style={{ height: 34, width: 96, borderRadius: "var(--r-pill)", flexShrink: 0 }} />
          <div className="skeleton" style={{ height: 34, flex: 1, borderRadius: "var(--r-pill)" }} />
        </div>
      </div>
    </div>
  );
}
