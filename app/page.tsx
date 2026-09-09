"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "./components/SiteHeader";
import { ProductCard } from "./components/ProductCard";
import { useToast } from "./components/Toast";
import { TrackPanel } from "./components/storefront/TrackPanel";
import { CheckoutModal, CheckoutForm } from "./components/storefront/CheckoutModal";
import { ShareModal } from "./components/storefront/ShareModal";
import { Product, PlacedOrder } from "./types";
import { apiGet, apiPost } from "./lib/api";
import { naira } from "./lib/money";
import { Hero, DEFAULT_HERO } from "./lib/heroDefaults";

const CART_KEY = "embassy_cart";
const REF_KEY = "embassy_ref";

export default function Storefront() {
  const [toastNode, showToast] = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState("");

  const [cart, setCart] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<Record<string, number>>({});

  const [showTrack, setShowTrack] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [method, setMethod] = useState<"stand" | "transfer">("stand");
  const [form, setForm] = useState<CheckoutForm>({ name: "", phone: "", email: "" });
  const [checkoutError, setCheckoutError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [confirmed, setConfirmed] = useState<PlacedOrder | null>(null);
  const [trackPhone, setTrackPhone] = useState("");
  const [ref, setRef] = useState<string>("");
  const [hero, setHero] = useState<Hero>(DEFAULT_HERO);

  const loadProducts = () =>
    apiGet<Product[]>("/api/products")
      .then((res) => {
        setProducts(res);
        setLoadError("");
      })
      .catch((e) => setLoadError(e.message));

  useEffect(() => {
    loadProducts();
    apiGet<{ hero: Hero }>("/api/settings")
      .then((d) => d.hero && setHero(d.hero))
      .catch(() => {});
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCart(JSON.parse(saved));
    } catch {}

    // capture a rep's referral tag from the URL and remember it for this device
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("ref");
      const stored = localStorage.getItem(REF_KEY);
      const r = (fromUrl || stored || "").toLowerCase().trim().slice(0, 40);
      if (r) {
        setRef(r);
        localStorage.setItem(REF_KEY, r);
      }
      if (fromUrl) {
        // tidy the address bar without a reload
        const clean = window.location.pathname + window.location.hash;
        window.history.replaceState(null, "", clean);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, q]) => q > 0)
        .map(([id, q]) => {
          const p = byId.get(id);
          return p ? { ...p, qty: q } : null;
        })
        .filter(Boolean) as (Product & { qty: number })[],
    [cart, byId]
  );
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);

  const cap = (p: Product) => (p.backorder ? 9999 : p.stock);

  const bumpDraft = (p: Product, dir: 1 | -1) =>
    setDraft((d) => {
      const next = Math.max(0, Math.min(cap(p), (d[p.id] || 0) + dir));
      return { ...d, [p.id]: next };
    });

  const addToCart = (p: Product) => {
    const q = draft[p.id] || 0;
    if (q === 0) return;
    setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + q }));
    setDraft((d) => ({ ...d, [p.id]: 0 }));
    showToast("Added to your order");
  };

  const placeOrder = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      setCheckoutError("Enter your pharmacy or hospital name and phone number to place the order.");
      return;
    }
    setPlacing(true);
    setCheckoutError("");
    try {
      const order = await apiPost<PlacedOrder>("/api/orders", {
        customerName: form.name,
        phone: form.phone,
        email: form.email,
        method,
        ref,
        items: cartItems.map((i) => ({ productId: i.id, qty: i.qty })),
      });
      setCart({});
      setDraft({});
      setShowCheckout(false);
      setConfirmed(order);
      setTrackPhone(form.phone.trim());
      loadProducts();
    } catch (e: any) {
      setCheckoutError(e.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      {toastNode}
      <SiteHeader />

      {/* hero */}
      <div style={{ background: "var(--navy)", color: "#fff", padding: "38px var(--gutter) 46px" }}>
        <p className="small-caps" style={{ color: "var(--gold-light)", margin: "0 0 12px", fontSize: 13 }}>
          {hero.eyebrow}
        </p>
        <p
          className="serif"
          style={{
            fontSize: "clamp(25px, 6.2vw, 32px)",
            fontWeight: 600,
            margin: "0 0 10px",
            maxWidth: 620,
            textWrap: "balance",
            lineHeight: 1.2,
          }}
        >
          {hero.headline}
        </p>
        <p style={{ fontSize: 17.5, color: "rgba(255,255,255,0.78)", maxWidth: 560, margin: "0 0 18px", lineHeight: 1.5 }}>
          {hero.subtext}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-ghost-navy" style={{ fontSize: 15 }} onClick={() => setShowTrack((v) => !v)}>
            Track my orders
          </button>
          <button className="btn btn-ghost-navy" style={{ fontSize: 15 }} onClick={() => setShowShare(true)}>
            Share catalogue link
          </button>
        </div>
      </div>

      <div style={{ padding: "32px var(--gutter) 100px", marginTop: -20 }}>
        {showTrack && <TrackPanel initialPhone={trackPhone} />}

        {loadError && (
          <div className="card" style={{ padding: "14px 18px", marginBottom: 20, color: "var(--rose)" }}>
            {loadError}{" "}
            <button className="btn btn-sm btn-outline" onClick={loadProducts} style={{ marginLeft: 8 }}>
              Retry
            </button>
          </div>
        )}

        <p className="small-caps" style={{ color: "var(--ink-soft)", margin: "0 0 14px", fontSize: 13 }}>
          Product Catalogue
        </p>
        <div className="catalogue-grid">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              qty={draft[p.id] || 0}
              onDec={() => bumpDraft(p, -1)}
              onInc={() => bumpDraft(p, 1)}
              onAdd={() => addToCart(p)}
            />
          ))}
        </div>

        {totalQty > 0 && (
          <div
            className="flex items-center justify-between flex-wrap gap-2"
            style={{
              position: "sticky",
              bottom: 12,
              marginTop: 28,
              background: "var(--navy)",
              color: "#fff",
              padding: "13px 18px",
              boxShadow: "0 10px 30px rgba(10,31,46,0.25)",
            }}
          >
            <span style={{ fontSize: 15.5 }}>
              {totalQty} box{totalQty > 1 ? "es" : ""} in your order &middot; {naira(subtotal)}
            </span>
            <button
              className="btn btn-gold"
              style={{ flexShrink: 0, fontSize: 15 }}
              onClick={() => setShowCheckout(true)}
            >
              Review order &rsaquo;
            </button>
          </div>
        )}
      </div>

      {showCheckout && (
        <CheckoutModal
          items={cartItems}
          subtotal={subtotal}
          method={method}
          setMethod={setMethod}
          form={form}
          setForm={setForm}
          error={checkoutError}
          placing={placing}
          onClose={() => setShowCheckout(false)}
          onPlace={placeOrder}
        />
      )}

      {confirmed && (
        <div className="modal-backdrop" style={{ zIndex: 45 }}>
          <div className="card" style={{ width: "100%", maxWidth: 340, padding: 28, textAlign: "center" }}>
            <p style={{ fontSize: 30, margin: "0 0 8px", color: "var(--sage)" }}>&#10003;</p>
            <p className="serif" style={{ fontWeight: 700, fontSize: 19, margin: "0 0 5px" }}>
              Order placed
            </p>
            <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 16px" }}>
              {confirmed.code} &middot; {naira(confirmed.total)} &middot; {confirmed.methodLabel}
            </p>
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-primary"
                style={{ padding: "10px 0", fontSize: 15 }}
                onClick={() => {
                  setConfirmed(null);
                  setShowTrack(true);
                }}
              >
                Track my orders
              </button>
              <button
                className="btn btn-outline"
                style={{ padding: "10px 0", fontSize: 15 }}
                onClick={() => setConfirmed(null)}
              >
                Continue shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {showShare && <ShareModal repRef={ref} onClose={() => setShowShare(false)} />}
    </div>
  );
}
