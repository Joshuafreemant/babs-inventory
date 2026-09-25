"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SiteHeader } from "../../components/SiteHeader";
import { RepAuth } from "../../components/console/RepAuth";
import { ConsoleShell } from "../../components/console/ConsoleShell";
import { useInfiniteList } from "../../components/console/useInfiniteList";
import { InfiniteFooter } from "../../components/console/InfiniteFooter";
import { Product, StaffSession, drugCategoryLabel } from "../../types";
import { apiGet, apiPatch, apiPost } from "../../lib/api";
import { naira, unitLabel } from "../../lib/money";

type View = "active" | "archived";

export default function ArchivePage() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [view, setView] = useState<View>("active");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    apiGet<StaffSession>("/api/staff/me")
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    params.set("archived", view === "archived" ? "true" : "false");
    if (searchDebounced) params.set("q", searchDebounced);
    return `/api/admin/products?${params.toString()}`;
  }, [view, searchDebounced]);

  const list = useInfiniteList<Product>({
    endpoint,
    key: "products",
    limit: 30,
    enabled: !!session,
  });

  const toggleArchived = async (p: Product) => {
    const archiving = view === "active";
    setBusyId(p.id);
    try {
      await apiPatch(`/api/admin/products/${p.id}`, { op: "archive", archived: archiving });
      list.setItems((items) => items.filter((x) => x.id !== p.id));
      toast.success(archiving ? `${p.name} archived.` : `${p.name} restored.`);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't update the product.");
    } finally {
      setBusyId(null);
    }
  };

  const signOut = async () => {
    await apiPost("/api/staff/logout").catch(() => {});
    setSession(null);
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

  return (
    <div>
      <SiteHeader onStaffSignout={signOut} />
      <ConsoleShell title="Archive" session={session}>
        <div style={{ padding: "32px var(--gutter)" }}>
          <p className="serif" style={{ fontWeight: 700, fontSize: 23.5, margin: "0 0 4px" }}>
            Archive
          </p>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 22px" }}>
            Hide a product from the catalogue and ledger without losing its sales history, or bring
            one back.
          </p>

          <div className="card">
            <div
              className="flex items-center gap-2 flex-wrap"
              style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}
            >
              <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                <button
                  className={`btn btn-sm ${view === "active" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setView("active")}
                >
                  Active
                </button>
                <button
                  className={`btn btn-sm ${view === "archived" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setView("archived")}
                >
                  Archived
                </button>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                style={{
                  flex: 1,
                  minWidth: 180,
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-pill)",
                  padding: "7px 14px",
                  fontSize: 13,
                  background: "#fff",
                }}
              />
              {search && (
                <button className="btn btn-outline btn-sm" onClick={() => setSearch("")}>
                  Clear
                </button>
              )}
            </div>

            {list.error && (
              <p style={{ padding: "16px 18px", fontSize: 14, color: "var(--rose)", margin: 0 }}>
                {list.error}
              </p>
            )}

            {list.items.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between flex-wrap gap-2"
                style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{p.name}</p>
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                    {drugCategoryLabel(p.drugCategory)} &middot; {naira(p.price)}/
                    {unitLabel(p.sellUnit, 1)} &middot; {p.stock.toLocaleString("en-NG")}{" "}
                    {unitLabel(p.sellUnit, p.stock)} in stock
                  </p>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  disabled={busyId === p.id}
                  onClick={() => toggleArchived(p)}
                  style={{ flexShrink: 0 }}
                >
                  {busyId === p.id ? "…" : view === "active" ? "Archive" : "Restore"}
                </button>
              </div>
            ))}

            {list.ready && list.items.length === 0 && (
              <p style={{ padding: "16px 18px", fontSize: 14.5, color: "var(--ink-soft)", margin: 0 }}>
                {searchDebounced
                  ? "No products match that search."
                  : view === "active"
                    ? "Every product is active — nothing to archive."
                    : "No archived products."}
              </p>
            )}

            <InfiniteFooter list={list} noun="products" count={list.items.length} />
          </div>
        </div>
      </ConsoleShell>
    </div>
  );
}
