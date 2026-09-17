"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "../../components/SiteHeader";
import { RepAuth } from "../../components/console/RepAuth";
import { ConsoleShell } from "../../components/console/ConsoleShell";
import { useInfiniteList } from "../../components/console/useInfiniteList";
import { InfiniteFooter } from "../../components/console/InfiniteFooter";
import { StaffSession } from "../../types";
import { apiGet, apiPost } from "../../lib/api";

interface AuditEntry {
  id: string;
  staffName: string;
  staffId: string;
  action: string;
  target: string;
  detail: string;
  createdAt: string;
}

const ACTION_LABEL: Record<string, string> = {
  "stock.adjust": "adjusted stock for",
  "stock.set": "set the stock for",
  "stock.restock": "restocked",
  "product.add": "added the product",
  "product.edit": "edited",
  "product.flags": "changed a setting for",
  "product.delete": "removed",
  "product.archive": "archived",
  "product.image": "updated the photo for",
  "product.import": "bulk-imported products",
  "staff.add": "added the staff account",
  "staff.edit": "edited the staff account",
  "order.status": "updated order",
  "alert.recipient.add": "added alert recipient",
  "alert.recipient.edit": "edited alert recipient",
  "alert.recipient.remove": "removed alert recipient",
  "alert.test": "sent a test alert",
  "alert.failed": "order alert failed for",
  "settings.update": "updated contact/payment settings",
  "settings.hero": "updated the storefront hero",
};

function describe(e: AuditEntry) {
  const verb = ACTION_LABEL[e.action] || e.action;
  return { verb, hasTarget: Boolean(e.target) };
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function ActivityPage() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

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

  const isAdmin = session?.role === "admin";

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (searchDebounced) params.set("q", searchDebounced);
    const qs = params.toString();
    return `/api/admin/audit${qs ? `?${qs}` : ""}`;
  }, [searchDebounced]);

  const list = useInfiniteList<AuditEntry>({
    endpoint,
    key: "entries",
    limit: 30,
    enabled: !!isAdmin,
  });

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
  if (!isAdmin) {
    return (
      <div>
        <SiteHeader onStaffSignout={signOut} />
        <ConsoleShell title="Activity" session={session}>
          <div style={{ padding: "60px var(--gutter)", textAlign: "center" }}>
            <p className="serif" style={{ fontWeight: 700, fontSize: 21.5, margin: "0 0 8px" }}>
              Admins only
            </p>
            <p style={{ fontSize: 15, color: "var(--ink-soft)" }}>
              The activity log — who restocked, edited, or removed what, staff changes, order
              updates — is only visible to admins.
            </p>
          </div>
        </ConsoleShell>
      </div>
    );
  }

  return (
    <div>
      <SiteHeader onStaffSignout={signOut} />
      <ConsoleShell title="Activity" session={session}>
        <div style={{ padding: "32px var(--gutter)" }}>
          <p className="serif" style={{ fontWeight: 700, fontSize: 23.5, margin: "0 0 4px" }}>
            Activity
          </p>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 22px" }}>
            Who restocked, edited, removed, or added a product; staff and order changes — newest
            first.
          </p>

          <div className="card">
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by staff name or product/order…"
                style={{
                  width: "100%",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-pill)",
                  padding: "8px 14px",
                  fontSize: 14,
                  background: "#fff",
                }}
              />
            </div>

            {list.error && (
              <p style={{ padding: "16px 18px", fontSize: 14, color: "var(--rose)", margin: 0 }}>
                {list.error}
              </p>
            )}

            {list.items.map((e) => {
              const { verb } = describe(e);
              return (
                <div key={e.id} style={{ padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <p style={{ fontSize: 14.5, margin: 0 }}>
                      <strong>{e.staffName}</strong> {verb}
                      {e.target ? <strong> {e.target}</strong> : ""}
                    </p>
                    <span style={{ fontSize: 12.5, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>
                      {formatWhen(e.createdAt)}
                    </span>
                  </div>
                  {e.detail && (
                    <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "3px 0 0" }}>{e.detail}</p>
                  )}
                </div>
              );
            })}

            {list.ready && list.items.length === 0 && (
              <p style={{ padding: "16px 18px", fontSize: 14.5, color: "var(--ink-soft)", margin: 0 }}>
                {searchDebounced ? "No activity matches that search." : "No activity recorded yet."}
              </p>
            )}

            <InfiniteFooter list={list} noun="entries" count={list.items.length} />
          </div>
        </div>
      </ConsoleShell>
    </div>
  );
}
