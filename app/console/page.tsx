"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SiteHeader } from "../components/SiteHeader";
import { StatusPill } from "../components/StatusPill";
import { RepAuth } from "../components/console/RepAuth";
import { AddProductModal } from "../components/console/AddProductModal";
import { RestockModal } from "../components/console/RestockModal";
import { AlertRecipients } from "../components/console/AlertRecipients";
import { ShareLinkCard } from "../components/console/ShareLinkCard";
import { ProductPhotoCell } from "../components/console/ProductPhotoCell";
import { ConsoleShell } from "../components/console/ConsoleShell";
import { DeleteProductModal } from "../components/console/DeleteProductModal";
import { EditProductModal } from "../components/console/EditProductModal";
import { ImportProductsModal } from "../components/console/ImportProductsModal";
import { PushToggle } from "../components/console/PushToggle";
import { StockStepper } from "../components/console/StockStepper";
import { useInfiniteList } from "../components/console/useInfiniteList";
import { InfiniteFooter } from "../components/console/InfiniteFooter";
import { LedgerRowSkeleton, OrderRowSkeleton } from "../components/console/RowSkeletons";
import { Product, ConsoleOrder, ConsoleStats, StaffSession } from "../types";
import { apiGet, apiPatch, apiPost } from "../lib/api";
import { naira, cartonBreakdown, packetBreakdown, unitLabel, isLowStock, STATUS_LABEL } from "../lib/money";
import type { DocKind, OrderDocData } from "../components/OrderDoc";

const STATUS_OPTIONS = ["reserved", "awaiting_transfer", "paid", "dispatched", "collected", "cancelled"];
// realised sales — matches the definition used on the Reports page
const PAID_STATUSES = ["paid", "dispatched", "collected"];

export default function ConsolePage() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [stats, setStats] = useState<ConsoleStats | null>(null);
  const [productTotal, setProductTotal] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [restockFor, setRestockFor] = useState<Product | null>(null);
  const [deleteFor, setDeleteFor] = useState<Product | null>(null);
  const [editFor, setEditFor] = useState<Product | null>(null);
  const [showImport, setShowImport] = useState(false);

  const [ledgerOpen, setLedgerOpen] = useState(true);
  const [ordersOpen, setOrdersOpen] = useState(true);

  useEffect(() => {
    apiGet<StaffSession>("/api/staff/me")
      .then((s) => setSession(s))
      .catch(() => setSession(null))
      .finally(() => setAuthChecked(true));
    try {
      const s = localStorage.getItem("embassy_console_panels");
      if (s) {
        const v = JSON.parse(s);
        if (typeof v.ledger === "boolean") setLedgerOpen(v.ledger);
        if (typeof v.orders === "boolean") setOrdersOpen(v.orders);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "embassy_console_panels",
        JSON.stringify({ ledger: ledgerOpen, orders: ordersOpen })
      );
    } catch {}
  }, [ledgerOpen, ordersOpen]);

  // ledger search — free-text product name
  const [productSearch, setProductSearch] = useState("");
  const [productSearchDebounced, setProductSearchDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setProductSearchDebounced(productSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [productSearch]);
  const productsFiltered = !!productSearchDebounced;
  const productsEndpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (productSearchDebounced) params.set("q", productSearchDebounced);
    const qs = params.toString();
    return `/api/admin/products${qs ? `?${qs}` : ""}`;
  }, [productSearchDebounced]);

  const productsList = useInfiniteList<Product>({
    endpoint: productsEndpoint,
    key: "products",
    limit: 20,
    enabled: !!session,
    onPage: (res, first) => {
      if (first && typeof res.total === "number") setProductTotal(res.total);
    },
  });

  // order feed filters — status dropdown + free-text search (order code or phone)
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderSearchDebounced, setOrderSearchDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setOrderSearchDebounced(orderSearch.trim()), 350);
    return () => clearTimeout(t);
  }, [orderSearch]);
  const ordersFiltered = !!(orderStatusFilter || orderSearchDebounced);
  const ordersEndpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (orderStatusFilter) params.set("status", orderStatusFilter);
    if (orderSearchDebounced) params.set("q", orderSearchDebounced);
    const qs = params.toString();
    return `/api/admin/orders${qs ? `?${qs}` : ""}`;
  }, [orderStatusFilter, orderSearchDebounced]);

  const ordersList = useInfiniteList<ConsoleOrder>({
    endpoint: ordersEndpoint,
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

  // auto-refresh the order feed while the tab is actually visible — the
  // manual refresh button next to it still covers "check right now"
  const ORDERS_POLL_MS = 60_000;
  useEffect(() => {
    if (!session) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") ordersList.reload();
    }, ORDERS_POLL_MS);
    return () => clearInterval(id);
    // re-arm whenever `reload` changes identity (i.e. the filter/search
    // changed the endpoint) so the poll always refreshes the *current* view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, ordersList.reload]);

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
      toast.error(e.message);
    }
  };

  const setStockExact = async (p: Product, stock: number) => {
    try {
      const updated = await apiPatch<Product>(`/api/admin/products/${p.id}`, { op: "set", stock });
      replaceProduct(updated);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const setFlag = async (
    p: Product,
    flag: "forceLowStock" | "showStock" | "backorder",
    value: boolean
  ) => {
    try {
      const updated = await apiPatch<Product>(`/api/admin/products/${p.id}`, { op: "flags", [flag]: value });
      replaceProduct(updated);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const [printBusy, setPrintBusy] = useState<string | null>(null);

  const printOrder = async (o: ConsoleOrder, kind: DocKind) => {
    const busyKey = `${o.id}:${kind}`;
    setPrintBusy(busyKey);
    try {
      const data: OrderDocData = {
        code: o.code,
        customerName: o.customerName,
        phone: o.phone,
        email: o.email,
        items: o.items,
        total: o.total,
        method: o.method,
        status: o.status,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      };
      // loaded on click so html2canvas / jsPDF stay out of the main bundle
      const { downloadOrderDocument } = await import("../components/Downloadorderdocument");
      await downloadOrderDocument(kind, data);
    } catch (e: any) {
      toast.error(e?.message || "Couldn't create the document.");
    } finally {
      setPrintBusy(null);
    }
  };

  const setOrderStatus = async (o: ConsoleOrder, status: string) => {
    try {
      const updated = await apiPatch<ConsoleOrder>(`/api/admin/orders/${o.id}`, { status });
      setOrders((list) => list.map((x) => (x.id === o.id ? updated : x)));
      refreshStats();
      toast.success(`${o.code} → ${STATUS_LABEL[status]}`);
    } catch (e: any) {
      toast.error(e.message);
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
        <div
          className="flex flex-col items-center justify-center"
          style={{ padding: "80px var(--gutter)", gap: 14 }}
        >
          <span className="spinner" aria-hidden="true" />
          <p style={{ color: "var(--ink-soft)", fontSize: 14.5, margin: 0 }}>Loading console…</p>
        </div>
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
      <SiteHeader onStaffSignout={signOut} />
      <ConsoleShell title="Order desk" session={session}>
      <div style={{ padding: "32px var(--gutter)" }}>
        <div className="flex items-center justify-between flex-wrap gap-2" style={{ marginBottom: 4 }}>
          <p className="serif" style={{ fontWeight: 700, fontSize: 23.5, margin: 0 }}>
            Rep console
          </p>
          <div className="flex items-center gap-2">
            {/* Import — temporarily hidden
            <button className="btn btn-outline btn-sm" onClick={() => setShowImport(true)}>
              Import
            </button>
            */}
            <PushToggle />
            <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
              + Add product
            </button>
          </div>
        </div>
        <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 22px" }}>
          Signed in as {session.name}. Stock is tracked in boxes &mdash; the unit customers actually order.
        </p>

        <div className="grid-tiles" style={{ marginBottom: 24 }}>
          {statCards.map((s) => (
            <div key={s.label} className="card" style={{ padding: "16px 18px" }}>
              <p className="small-caps" style={{ color: "var(--ink-soft)", margin: "0 0 6px" }}>
                {s.label}
              </p>
              {stats == null ? (
                <div className="skeleton" style={{ height: 24, width: "60%" }} />
              ) : (
                <p className="serif" style={{ fontWeight: 700, fontSize: 23.5, margin: 0 }}>
                  {s.value}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="grid-split" style={{ alignItems: "start" }}>
          {/* inventory ledger */}
          <div
            className="card ledger-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: ledgerOpen ? "68vh" : undefined,
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                padding: "10px 12px 10px 18px",
                borderBottom: ledgerOpen ? "1px solid var(--line)" : "none",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => setLedgerOpen((v) => !v)}
                className="flex items-center gap-2"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", textAlign: "left" }}
                aria-expanded={ledgerOpen}
                aria-label={ledgerOpen ? "Collapse inventory ledger" : "Expand inventory ledger"}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: "1px solid var(--line)",
                    background: "var(--cream-soft)",
                    color: "var(--navy)",
                    fontSize: 15,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {ledgerOpen ? "▾" : "▸"}
                </span>
                <span className="serif" style={{ fontWeight: 700, fontSize: 17 }}>
                  Inventory ledger
                </span>
              </button>
              {productTotal != null && (
                <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                  {!ledgerOpen
                    ? `${productTotal} products`
                    : productsFiltered
                    ? `${products.length}${productsList.hasMore ? "+" : ""} match${products.length === 1 ? "" : "es"}`
                    : `${products.length} of ${productTotal}`}
                </span>
              )}
            </div>
            {ledgerOpen && (
            <>
            <div
              className="flex items-center gap-2"
              style={{ padding: "10px 18px", borderBottom: "1px solid var(--line)", background: "var(--cream-soft)" }}
            >
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products…"
                style={{ flex: 1, border: "1px solid var(--line)", borderRadius: "var(--r-pill)", padding: "7px 14px", fontSize: 13, background: "#fff" }}
              />
              {productsFiltered && (
                <button className="btn btn-outline btn-sm" onClick={() => setProductSearch("")}>
                  Clear
                </button>
              )}
            </div>
            <div style={{ overflowY: "auto", overscrollBehavior: "contain", flex: 1 }}>
            {!productsList.ready ? (
              Array.from({ length: 6 }).map((_, i) => <LedgerRowSkeleton key={i} />)
            ) : (
            <>
            {products.map((p) => {
              const isPacket = p.sellUnit === "packet";
              const pbd = isPacket ? packetBreakdown(p.stock, p.boxesPerCarton, p.packetsPerBox || 1) : null;
              const bd = !isPacket ? cartonBreakdown(p.stock, p.boxesPerCarton) : null;
              const auto = !p.forceLowStock && isLowStock(p);
              return (
                <div key={p.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)" }}>
                  <div
                    className="flex items-start justify-between flex-wrap gap-2"
                  >
                    <div style={{ minWidth: 0, flex: "1 1 180px" }}>
                      <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{p.name}</p>
                      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                        <strong>
                          {p.stock.toLocaleString("en-NG")} {unitLabel(p.sellUnit, p.stock)}
                        </strong>{" "}
                        {pbd ? (
                          <>
                            ({pbd.cartons} carton{pbd.cartons === 1 ? "" : "s"}
                            {pbd.boxes ? ` + ${pbd.boxes} box${pbd.boxes === 1 ? "" : "es"}` : ""}
                            {pbd.loosePackets ? ` + ${pbd.loosePackets} loose packet${pbd.loosePackets === 1 ? "" : "s"}` : ""},{" "}
                            {p.packetsPerBox}/box, {p.boxesPerCarton} boxes/carton)
                          </>
                        ) : (
                          <>
                            ({bd!.cartons} carton{bd!.cartons === 1 ? "" : "s"}
                            {bd!.loose ? ` + ${bd!.loose} loose box${bd!.loose === 1 ? "" : "es"}` : ""},{" "}
                            {p.boxesPerCarton}/carton)
                          </>
                        )}
                        {auto && (
                          <span style={{ color: "var(--gold)" }}>
                            {" "}
                            &middot; auto-flagged, at or below {p.lowStockThreshold}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                      <StockStepper
                        stock={p.stock}
                        sellUnit={p.sellUnit}
                        onAdjust={(delta) => adjustStock(p, delta)}
                        onSetExact={(value) => setStockExact(p, value)}
                      />
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
                      onError={(msg: string) => toast.error(msg)}
                    />
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={p.showStock}
                        onChange={(e) => setFlag(p, "showStock", e.target.checked)}
                      />{" "}
                      Show quantity left to customers
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
                          fontSize: 13,
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
                          fontSize: 13,
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
            {products.length === 0 && (
              <p style={{ padding: "16px 18px", fontSize: 14.5, color: "var(--ink-soft)", margin: 0 }}>
                {productsFiltered
                  ? "No products match that search."
                  : 'No products yet. Use "+ Add product" to start the catalogue.'}
              </p>
            )}
            <InfiniteFooter
              list={productsList}
              noun="products"
              count={productsFiltered ? products.length : productTotal ?? products.length}
            />
            </>
            )}
            </div>
            </>
            )}
          </div>

          {/* recent orders */}
          <div
            className="card orders-panel"
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: ordersOpen ? "68vh" : undefined,
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{
                padding: "10px 12px 10px 18px",
                borderBottom: ordersOpen ? "1px solid var(--line)" : "none",
                background: "#fff",
                flexShrink: 0,
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setOrdersOpen((v) => !v)}
                className="flex items-center gap-2"
                style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 0", textAlign: "left", minWidth: 0 }}
                aria-expanded={ordersOpen}
                aria-label={ordersOpen ? "Collapse recent orders" : "Expand recent orders"}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: "1px solid var(--line)",
                    background: "var(--cream-soft)",
                    color: "var(--navy)",
                    fontSize: 15,
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {ordersOpen ? "▾" : "▸"}
                </span>
                <span className="serif" style={{ fontWeight: 700, fontSize: 17, whiteSpace: "nowrap" }}>
                  Recent orders
                </span>
              </button>
              <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
                {stats && (
                  <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                    {!ordersOpen
                      ? `${stats.ordersTotal} orders`
                      : ordersFiltered
                      ? `${orders.length}${ordersList.hasMore ? "+" : ""} match${orders.length === 1 ? "" : "es"}`
                      : `${orders.length} of ${stats.ordersTotal}`}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => ordersList.reload()}
                  disabled={ordersList.loading}
                  aria-label="Refresh recent orders"
                  title="Refresh"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    border: "1px solid var(--line)",
                    background: "#fff",
                    color: "var(--navy)",
                    fontSize: 14,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: ordersList.loading ? "default" : "pointer",
                    opacity: ordersList.loading ? 0.5 : 1,
                  }}
                >
                  &#8635;
                </button>
              </div>
            </div>
            {ordersOpen && (
            <>
            <div
              className="flex items-center gap-2 flex-wrap"
              style={{ padding: "10px 18px", borderBottom: "1px solid var(--line)", background: "var(--cream-soft)" }}
            >
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                style={{ border: "1px solid var(--line)", borderRadius: "var(--r-pill)", padding: "7px 12px", fontSize: 13, background: "#fff" }}
              >
                <option value="">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search order ID or phone…"
                style={{ flex: "1 1 180px", border: "1px solid var(--line)", borderRadius: "var(--r-pill)", padding: "7px 14px", fontSize: 13, background: "#fff" }}
              />
              {ordersFiltered && (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setOrderStatusFilter("");
                    setOrderSearch("");
                    setOrderSearchDebounced("");
                  }}
                >
                  Clear
                </button>
              )}
            </div>
            <div style={{ overflowY: "auto", overscrollBehavior: "contain", flex: 1 }}>
            {!ordersList.ready ? (
              Array.from({ length: 5 }).map((_, i) => <OrderRowSkeleton key={i} />)
            ) : (
            <>
            {orders.map((o) => (
              <div key={o.id} style={{ padding: "11px 18px", borderBottom: "1px solid var(--line)" }}>
                <div className="flex items-center justify-between">
                  <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{o.customerName}</p>
                  <StatusPill status={o.status} label={STATUS_LABEL[o.status] || o.status} />
                </div>
                <div style={{ margin: "4px 0 0" }}>
                  {o.items.map((it, idx) => {
                    const itemIsPacket = it.sellUnit === "packet";
                    const bpc = it.boxesPerCarton || 1;
                    const ppb = it.packetsPerBox || 1;
                    const pbd = itemIsPacket ? packetBreakdown(it.qty, bpc, ppb) : null;
                    const bd = !itemIsPacket && bpc > 1 ? cartonBreakdown(it.qty, bpc) : null;
                    return (
                      <p
                        key={idx}
                        style={{ fontSize: 13, color: "var(--ink-soft)", margin: idx === 0 ? 0 : "2px 0 0" }}
                      >
                        {it.name}{" "}
                        <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                          x{it.qty} {unitLabel(it.sellUnit, it.qty)}
                        </span>
                        {bd && bd.cartons > 0 && (
                          <span>
                            {" "}
                            &middot; {bd.cartons} carton{bd.cartons === 1 ? "" : "s"}
                            {bd.loose ? ` + ${bd.loose} box${bd.loose === 1 ? "" : "es"}` : ""}
                          </span>
                        )}
                        {pbd && (pbd.cartons > 0 || pbd.boxes > 0) && (
                          <span>
                            {" "}
                            &middot;{" "}
                            {[
                              pbd.cartons > 0 ? `${pbd.cartons} carton${pbd.cartons === 1 ? "" : "s"}` : "",
                              pbd.boxes > 0 ? `${pbd.boxes} box${pbd.boxes === 1 ? "" : "es"}` : "",
                              pbd.loosePackets > 0 ? `${pbd.loosePackets} loose packet${pbd.loosePackets === 1 ? "" : "s"}` : "",
                            ]
                              .filter(Boolean)
                              .join(" + ")}
                          </span>
                        )}
                        {it.backordered && <span style={{ color: "var(--gold)" }}> &middot; backorder</span>}
                      </p>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between" style={{ marginTop: 5 }}>
                  <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                    {o.code} &middot; {o.phone}
                    {o.email ? " · " + o.email : ""}
                    {o.refSource ? ` · via ${o.refSource}` : ""}
                  </span>
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>{naira(o.total)}</span>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => setOrderStatus(o, e.target.value)}
                  style={{
                    marginTop: 8,
                    width: "100%",
                    border: "1px solid var(--line)",
                    borderRadius: "var(--r-sm)",
                    padding: "8px 10px",
                    fontSize: 13.5,
                    background: "#fff",
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    disabled={printBusy === `${o.id}:invoice`}
                    onClick={() => printOrder(o, "invoice")}
                  >
                    {printBusy === `${o.id}:invoice` ? "Preparing…" : "Print invoice"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1 }}
                    disabled={printBusy === `${o.id}:receipt` || !PAID_STATUSES.includes(o.status)}
                    title={
                      PAID_STATUSES.includes(o.status)
                        ? undefined
                        : "Only available once the order is marked paid, dispatched or collected"
                    }
                    onClick={() => printOrder(o, "receipt")}
                  >
                    {printBusy === `${o.id}:receipt` ? "Preparing…" : "Print receipt"}
                  </button>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p style={{ padding: "16px 18px", fontSize: 14.5, color: "var(--ink-soft)", margin: 0 }}>
                {ordersFiltered ? "No orders match that filter." : "No orders yet."}
              </p>
            )}
            <InfiniteFooter
              list={ordersList}
              noun="orders"
              count={ordersFiltered ? orders.length : stats?.ordersTotal ?? orders.length}
            />
            </>
            )}
            </div>
            </>
            )}
          </div>
        </div>

        <ShareLinkCard session={session} />
        <AlertRecipients onToast={(msg: string) => toast(msg)} />
      </div>
      </ConsoleShell>

      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onAdded={(p, stock) => {
            setProducts((list) => [...list, p]);
            setProductTotal((n) => (n ?? 0) + 1);
            toast.success(`${p.name} added — ${stock.toLocaleString("en-NG")} ${unitLabel(p.sellUnit, stock)}`);
          }}
        />
      )}
      {restockFor && (
        <RestockModal
          product={restockFor}
          onClose={() => setRestockFor(null)}
          onRestocked={(p, added) => {
            replaceProduct(p);
            toast.success(`${p.name}: +${added.toLocaleString("en-NG")} ${unitLabel(p.sellUnit, added)}`);
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
            toast.success(hard ? `${name} removed` : `${name} hidden — kept for sales history`);
          }}
        />
      )}
      {editFor && (
        <EditProductModal
          product={editFor}
          onClose={() => setEditFor(null)}
          onSaved={(p) => {
            replaceProduct(p);
            toast.success(`${p.name} updated`);
          }}
        />
      )}
      {showImport && (
        <ImportProductsModal
          onClose={() => setShowImport(false)}
          onImported={(created) => {
            setProducts((list) => [...list, ...created]);
            setProductTotal((n) => (n ?? 0) + created.length);
            toast.success(`${created.length} product${created.length === 1 ? "" : "s"} imported`);
          }}
        />
      )}
    </div>
  );
}
