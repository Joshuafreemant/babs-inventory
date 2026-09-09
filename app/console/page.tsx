"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { useToast } from "../components/Toast";
import { StatusPill } from "../components/StatusPill";
import { RepAuth } from "../components/console/RepAuth";
import { AddProductModal } from "../components/console/AddProductModal";
import { RestockModal } from "../components/console/RestockModal";
import { AlertRecipients } from "../components/console/AlertRecipients";
import { ShareLinkCard } from "../components/console/ShareLinkCard";
import { ProductPhotoCell } from "../components/console/ProductPhotoCell";
import { ConsoleTabs } from "../components/console/ConsoleTabs";
import { DeleteProductModal } from "../components/console/DeleteProductModal";
import { EditProductModal } from "../components/console/EditProductModal";
import { ImportProductsModal } from "../components/console/ImportProductsModal";
import { useInfiniteList } from "../components/console/useInfiniteList";
import { InfiniteFooter } from "../components/console/InfiniteFooter";
import { Product, ConsoleOrder, ConsoleStats, StaffSession } from "../types";
import { apiGet, apiPatch, apiPost } from "../lib/api";
import { naira, cartonBreakdown, isLowStock, STATUS_LABEL } from "../lib/money";

const STATUS_OPTIONS = ["reserved", "awaiting_transfer", "paid", "dispatched", "collected", "cancelled"];

export default function ConsolePage() {
  const [toastNode, showToast] = useToast();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [stats, setStats] = useState<ConsoleStats | null>(null);
  const [productTotal, setProductTotal] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [restockFor, setRestockFor] = useState<Product | null>(null);
  const [deleteFor, setDeleteFor] = useState<Product | null>(null);
  const [editFor, setEditFor] = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    apiGet<StaffSession>("/api/staff/me")
      .then((s) => setSession(s))
      .catch(() => setSession(null))
      .finally(() => setAuthChecked(true));
  }, []);

  const productsList = useInfiniteList<Product>({
    endpoint: "/api/admin/products",
    key: "products",
    limit: 20,
    enabled: !!session,
    onPage: (res, first) => {
      if (first && typeof res.total === "number") setProductTotal(res.total);
    },
  });
  const ordersList = useInfiniteList<ConsoleOrder>({
    endpoint: "/api/admin/orders",
    key: "orders",
    limit: 20,
    enabled: !!session,
    onPage: (res, first) => {
      if (first && res.stats) setStats(res.stats);
    },
  });

  const products = productsList.items;
  const orders = ordersList.items;
  const setProducts = productsList.setItems;
  const setOrders = ordersList.setItems;

  const refreshStats = () =>
    apiGet<{ stats: ConsoleStats }>("/api/admin/orders?limit=1")
      .then((d) => d.stats && setStats(d.stats))
      .catch(() => {});

  const replaceProduct = (p: Product) =>
    setProducts((list) => list.map((x) => (x.id === p.id ? p : x)));

  const adjustStock = async (p: Product, delta: number) => {
    try {
      const updated = await apiPatch<Product>(`/api/admin/products/${p.id}`, { op: "adjust", delta });
      replaceProduct(updated);
    } catch (e: any) {
      showToast(e.message);
    }
  };

  const setFlag = async (p: Product, flag: "forceLowStock" | "backorder", value: boolean) => {
    try {
      const updated = await apiPatch<Product>(`/api/admin/products/${p.id}`, { op: "flags", [flag]: value });
      replaceProduct(updated);
    } catch (e: any) {
      showToast(e.message);
    }
  };

  const setOrderStatus = async (o: ConsoleOrder, status: string) => {
    try {
      const updated = await apiPatch<ConsoleOrder>(`/api/admin/orders/${o.id}`, { status });
      setOrders((list) => list.map((x) => (x.id === o.id ? updated : x)));
      refreshStats();
      showToast(`${o.code} → ${STATUS_LABEL[status]}`);
    } catch (e: any) {
      showToast(e.message);
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
        <RepAuth onSignedIn={(s) => setSession(s)} />
      </div>
    );
  }

  const statCards = [
    { label: "Orders total", value: stats?.ordersTotal ?? 0 },
    { label: "Reserved at stand", value: stats?.reservedAtStand ?? 0 },
    { label: "Outstanding value", value: naira(stats?.outstandingAmount ?? 0) },
  ];

  return (
    <div>
      {toastNode}
      <SiteHeader onStaffSignout={signOut} />
      <ConsoleTabs active="desk" />

      <div style={{ padding: "32px var(--gutter)" }}>
        <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: 4 }}>
          <p className="serif" style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>
            Rep console
          </p>
          <div className="flex items-center gap-2">
            <button className="btn btn-outline btn-sm" onClick={() => setShowImport(true)}>
              Import
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
              + Add product
            </button>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 22px" }}>
          Signed in as {session.name}. Stock is tracked in boxes &mdash; the unit customers actually order.
        </p>

        <div className="grid-tiles" style={{ marginBottom: 24 }}>
          {statCards.map((s) => (
            <div key={s.label} className="card" style={{ padding: "16px 18px" }}>
              <p className="small-caps" style={{ color: "var(--ink-soft)", margin: "0 0 6px" }}>
                {s.label}
              </p>
              <p className="serif" style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid-split" style={{ alignItems: "start" }}>
          {/* inventory ledger */}
          <div className="card" style={{ display: "flex", flexDirection: "column", maxHeight: "68vh" }}>
            <div
              className="flex items-center justify-between"
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--line)",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <p className="serif" style={{ fontWeight: 700, fontSize: 15.5, margin: 0 }}>
                Inventory ledger
              </p>
              {productTotal != null && (
                <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                  {products.length} of {productTotal}
                </span>
              )}
            </div>
            <div style={{ overflowY: "auto", overscrollBehavior: "contain", flex: 1 }}>
            {products.map((p) => {
              const bd = cartonBreakdown(p.stock, p.boxesPerCarton);
              const auto = !p.forceLowStock && isLowStock(p);
              return (
                <div key={p.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                  <div
                    className="flex items-start justify-between flex-wrap gap-2"
                  >
                    <div style={{ minWidth: 0, flex: "1 1 180px" }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>{p.name}</p>
                      <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: 0 }}>
                        <strong>{p.stock.toLocaleString("en-NG")} boxes</strong> ({bd.cartons} carton
                        {bd.cartons === 1 ? "" : "s"}
                        {bd.loose ? ` + ${bd.loose} loose box${bd.loose === 1 ? "" : "es"}` : ""},{" "}
                        {p.boxesPerCarton}/carton)
                        {auto && (
                          <span style={{ color: "var(--gold)" }}>
                            {" "}
                            &middot; auto-flagged, at or below {p.lowStockThreshold}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                      <div className="stepper">
                        <button onClick={() => adjustStock(p, -1)}>&minus;</button>
                        <span>{p.stock}</span>
                        <button onClick={() => adjustStock(p, 1)}>+</button>
                      </div>
                      <button className="btn btn-outline btn-sm" onClick={() => setRestockFor(p)}>
                        Restock
                      </button>
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-3 flex-wrap"
                    style={{ marginTop: 8 }}
                  >
                    <ProductPhotoCell
                      product={p}
                      onChange={replaceProduct}
                      onError={showToast}
                    />
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={p.forceLowStock}
                        onChange={(e) => setFlag(p, "forceLowStock", e.target.checked)}
                      />{" "}
                      Flag as selling fast
                    </label>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={p.backorder}
                        onChange={(e) => setFlag(p, "backorder", e.target.checked)}
                      />{" "}
                      Ships when out
                    </label>
                    <div className="flex items-center gap-3" style={{ marginLeft: "auto" }}>
                      <button
                        onClick={() => setEditFor(p)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--navy)",
                          fontSize: 11.5,
                          fontWeight: 600,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteFor(p)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--rose)",
                          fontSize: 11.5,
                          fontWeight: 600,
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            {productsList.ready && products.length === 0 && (
              <p style={{ padding: "16px 18px", fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                No products yet. Use &quot;+ Add product&quot; to start the catalogue.
              </p>
            )}
            <InfiniteFooter list={productsList} noun="products" count={productTotal ?? products.length} />
            </div>
          </div>

          {/* recent orders */}
          <div className="card" style={{ display: "flex", flexDirection: "column", maxHeight: "68vh" }}>
            <div
              className="flex items-center justify-between"
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--line)",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <p className="serif" style={{ fontWeight: 700, fontSize: 15.5, margin: 0 }}>
                Recent orders
              </p>
              {stats && (
                <span style={{ fontSize: 11.5, color: "var(--ink-soft)" }}>
                  {orders.length} of {stats.ordersTotal}
                </span>
              )}
            </div>
            <div style={{ overflowY: "auto", overscrollBehavior: "contain", flex: 1 }}>
            {orders.map((o) => (
              <div key={o.id} style={{ padding: "11px 18px", borderBottom: "1px solid var(--line)" }}>
                <div className="flex items-center justify-between">
                  <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0 }}>{o.customerName}</p>
                  <StatusPill status={o.status} label={STATUS_LABEL[o.status] || o.status} />
                </div>
                <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "4px 0 0" }}>{o.itemsSummary}</p>
                <div className="flex items-center justify-between" style={{ marginTop: 5 }}>
                  <span style={{ fontSize: 11, color: "var(--ink-soft)" }}>
                    {o.code} &middot; {o.phone}
                    {o.email ? " · " + o.email : ""}
                    {o.refSource ? ` · via ${o.refSource}` : ""}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{naira(o.total)}</span>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => setOrderStatus(o, e.target.value)}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    border: "1px solid var(--line)",
                    padding: "6px 8px",
                    fontSize: 12,
                    background: "#fff",
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {ordersList.ready && orders.length === 0 && (
              <p style={{ padding: "16px 18px", fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                No orders yet.
              </p>
            )}
            <InfiniteFooter
              list={ordersList}
              noun="orders"
              count={stats?.ordersTotal ?? orders.length}
            />
            </div>
          </div>
        </div>

        <ShareLinkCard session={session} />
        <AlertRecipients onToast={showToast} />
      </div>

      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onAdded={(p, stock) => {
            setProducts((list) => [...list, p]);
            setProductTotal((n) => (n ?? 0) + 1);
            showToast(`${p.name} added — ${stock.toLocaleString("en-NG")} boxes`);
          }}
        />
      )}
      {restockFor && (
        <RestockModal
          product={restockFor}
          onClose={() => setRestockFor(null)}
          onRestocked={(p, added) => {
            replaceProduct(p);
            showToast(`${p.name}: +${added.toLocaleString("en-NG")} boxes`);
          }}
        />
      )}
      {deleteFor && (
        <DeleteProductModal
          product={deleteFor}
          onClose={() => setDeleteFor(null)}
          onDeleted={(id, hard) => {
            const name = deleteFor.name;
            setProducts((list) => list.filter((x) => x.id !== id));
            setProductTotal((n) => (n == null ? n : Math.max(0, n - 1)));
            setDeleteFor(null);
            showToast(hard ? `${name} removed` : `${name} hidden — kept for sales history`);
          }}
        />
      )}
      {editFor && (
        <EditProductModal
          product={editFor}
          onClose={() => setEditFor(null)}
          onSaved={(p) => {
            replaceProduct(p);
            showToast(`${p.name} updated`);
          }}
        />
      )}
      {showImport && (
        <ImportProductsModal
          onClose={() => setShowImport(false)}
          onImported={(created) => {
            setProducts((list) => [...list, ...created]);
            setProductTotal((n) => (n ?? 0) + created.length);
            showToast(`${created.length} product${created.length === 1 ? "" : "s"} imported`);
          }}
        />
      )}
    </div>
  );
}
