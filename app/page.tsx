"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { SiteHeader } from "./components/SiteHeader";
import { ProductCard } from "./components/ProductCard";
import { TrackPanel } from "./components/storefront/TrackPanel";
import { CheckoutModal, CheckoutForm } from "./components/storefront/CheckoutModal";
import { ShareModal } from "./components/storefront/ShareModal";
import { Product, PlacedOrder } from "./types";
import { apiGet, apiPost } from "./lib/api";
import { naira } from "./lib/money";
import { Hero, DEFAULT_HERO } from "./lib/heroDefaults";
import { displayPhone } from "./lib/phone";

interface Contact {
  phone: string;
  email: string;
}
interface Payment {
  bankName: string;
  accountNumber: string;
  accountName: string;
}
const EMPTY_CONTACT: Contact = { phone: "", email: "" };
const EMPTY_PAYMENT: Payment = { bankName: "", accountNumber: "", accountName: "" };

const CART_KEY = "embassy_cart";
const REF_KEY = "embassy_ref";

export default function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState("");

  const [cart, setCart] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<Record<string, number>>({});

  const [showTrack, setShowTrack] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [method, setMethod] = useState<"stand" | "transfer">("stand");
  const [form, setForm] = useState<CheckoutForm>({ name: "", phone: "" });
  const [checkoutError, setCheckoutError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [confirmed, setConfirmed] = useState<PlacedOrder | null>(null);
  const [trackPhone, setTrackPhone] = useState("");
  const [ref, setRef] = useState<string>("");
  const [hero, setHero] = useState<Hero>(DEFAULT_HERO);
  const [contact, setContact] = useState<Contact>(EMPTY_CONTACT);
  const [payment, setPayment] = useState<Payment>(EMPTY_PAYMENT);

  const [query, setQuery] = useState("");
  const PAGE = 50;
  const [visible, setVisible] = useState(PAGE);

  const trackRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!showTrack) return;
    // `body` has overflow-y:auto (side-effect of overflow-x:hidden), which
    // confuses scrollIntoView — scroll the window explicitly instead.
    const scrollToPanel = (smooth: boolean) => {
      const el = trackRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY - 14;
      window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
    };
    // one settle tick for the panel to mount, a hard jump, then a smooth
    // pass so it lands cleanly even if scroll-anchoring nudged it
    const t1 = setTimeout(() => scrollToPanel(false), 50);
    const t2 = setTimeout(() => scrollToPanel(true), 120);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [showTrack]);

  const loadProducts = () =>
    apiGet<Product[]>("/api/products")
      .then((res) => {
        setProducts(res);
        setLoadError("");
      })
      .catch((e) => setLoadError(e.message));

  useEffect(() => {
    loadProducts();
    apiGet<{ hero: Hero; contact: Contact; payment: Payment }>("/api/settings")
      .then((d) => {
        if (d.hero) setHero(d.hero);
        if (d.contact) setContact(d.contact);
        if (d.payment) setPayment(d.payment);
      })
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, query]);
  const shown = filtered.slice(0, visible);

  useEffect(() => {
    setVisible(PAGE);
  }, [query]);

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

  const setDraftQty = (p: Product, n: number) =>
    setDraft((d) => ({
      ...d,
      [p.id]: Math.max(0, Math.min(cap(p), Math.floor(n) || 0)),
    }));

  const addToCart = (p: Product) => {
    const q = draft[p.id] || 0;
    if (q === 0) {
      toast.error("Select a quantity before adding to order.");
      return;
    }
    setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + q }));
    setDraft((d) => ({ ...d, [p.id]: 0 }));
    toast.success("Added to your order");
  };

  /** Edit or remove a line item from inside the "Review order" modal. */
  const setCartQty = (id: string, n: number) => {
    const p = byId.get(id);
    const capped = Math.max(0, Math.min(p ? cap(p) : 9999, Math.floor(n) || 0));
    setCart((c) => {
      if (capped === 0) {
        const { [id]: _drop, ...rest } = c;
        return rest;
      }
      return { ...c, [id]: capped };
    });
  };
  const removeFromCart = (id: string) =>
    setCart((c) => {
      const { [id]: _drop, ...rest } = c;
      return rest;
    });

  // if the last line item is removed inside the review modal, fall back to the catalogue
  useEffect(() => {
    if (showCheckout && cartItems.length === 0) setShowCheckout(false);
  }, [showCheckout, cartItems.length]);

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
      <SiteHeader />

      {/* hero */}
      <div className="hero-panel" style={{ background: "var(--navy)", color: "#fff", padding: "38px var(--gutter) 46px" }}>
        <p className="small-caps" style={{ color: "var(--gold-light)", margin: "0 0 12px", fontSize: 14.5 }}>
          {hero.eyebrow}
        </p>
        <p
          className="serif"
          style={{
            fontSize: "clamp(26.5px, 6.2vw, 33.5px)",
            fontWeight: 600,
            margin: "0 0 10px",
            maxWidth: 620,
            textWrap: "balance",
            lineHeight: 1.2,
          }}
        >
          {hero.headline}
        </p>
        <p style={{ fontSize: 19, color: "rgba(255,255,255,0.78)", maxWidth: 560, margin: "0 0 18px", lineHeight: 1.5 }}>
          {hero.subtext}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-ghost-navy" style={{ fontSize: 16.5 }} onClick={() => setShowTrack((v) => !v)}>
            Track my orders
          </button>
          <button className="btn btn-ghost-navy" style={{ fontSize: 16.5 }} onClick={() => setShowShare(true)}>
            Share catalogue link
          </button>
        </div>
      </div>

      {/* floats over the hero's rounded bottom edge on phones only; the
          desktop search field lives inline next to the section label below */}
      <div className="search-float">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
        />
      </div>

      <div className="storefront-body" style={{ padding: "32px var(--gutter) 100px", marginTop: -20 }}>
        {showTrack && (
          <div ref={trackRef} style={{ scrollMarginTop: 14 }}>
            <TrackPanel initialPhone={trackPhone} />
          </div>
        )}

        {loadError && (
          <div className="card" style={{ padding: "14px 18px", marginBottom: 20, color: "var(--rose)" }}>
            {loadError}{" "}
            <button className="btn btn-sm btn-outline" onClick={loadProducts} style={{ marginLeft: 8 }}>
              Retry
            </button>
          </div>
        )}

        <div
          className="search-inline flex items-center justify-between flex-wrap gap-2"
          style={{ margin: "0 0 14px" }}
        >
          <p className="small-caps" style={{ color: "var(--ink-soft)", margin: 0, fontSize: 14.5 }}>
            Product Catalogue
          </p>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="catalogue-search"
            style={{
              border: "1px solid var(--line)",
              background: "#fff",
              padding: "9px 12px",
              fontSize: 16.5,
            }}
          />
        </div>

        {/* phones show the section label on its own line — the search box
            already floated up over the hero above */}
        <p className="small-caps catalogue-label-mobile" style={{ color: "var(--ink-soft)", margin: "0 0 14px", fontSize: 14.5, display: "none" }}>
          Product Catalogue
        </p>

        {query.trim() && (
          <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "0 0 12px" }}>
            {filtered.length} result{filtered.length === 1 ? "" : "s"} for &ldquo;{query.trim()}&rdquo;
          </p>
        )}

        <div className="catalogue-grid">
          {shown.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              qty={draft[p.id] || 0}
              onDec={() => bumpDraft(p, -1)}
              onInc={() => bumpDraft(p, 1)}
              onSet={(n) => setDraftQty(p, n)}
              onAdd={() => addToCart(p)}
            />
          ))}
        </div>

        {!loadError && filtered.length === 0 && products.length > 0 && (
          <p style={{ fontSize: 15.5, color: "var(--ink-soft)", margin: "20px 0 0" }}>
            No products match your search.
          </p>
        )}

        {filtered.length > visible && (
          <div className="flex justify-center" style={{ marginTop: 24 }}>
            <button
              className="btn btn-outline"
              onClick={() => setVisible((v) => v + PAGE)}
              style={{ fontSize: 16.5 }}
            >
              Show more ({filtered.length - visible} more)
            </button>
          </div>
        )}

        {totalQty > 0 && (
          <div
            className="cart-bar flex items-center justify-between flex-wrap gap-2"
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
            <span style={{ fontSize: 17 }}>
              {totalQty} box{totalQty > 1 ? "es" : ""} in your order &middot; {naira(subtotal)}
            </span>
            <button
              className="btn btn-gold"
              style={{ flexShrink: 0, fontSize: 16.5 }}
              onClick={() => setShowCheckout(true)}
            >
              Review order &rsaquo;
            </button>
          </div>
        )}
      </div>

      {(contact.phone || contact.email) && (
        <div
          style={{
            borderTop: "1px solid var(--line)",
            padding: "20px var(--gutter) 28px",
            textAlign: "center",
          }}
        >
          <p className="small-caps" style={{ color: "var(--ink-soft)", margin: "0 0 8px", fontSize: 12.5 }}>
            Questions about your order?
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {contact.phone && (
              <a href={`tel:+${contact.phone}`} style={{ fontSize: 16, color: "var(--navy)", fontWeight: 600 }}>
                &#9742; {displayPhone(contact.phone)}
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} style={{ fontSize: 16, color: "var(--navy)", fontWeight: 600 }}>
                &#9993; {contact.email}
              </a>
            )}
          </div>
        </div>
      )}

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
          payment={payment}
          onQtyChange={setCartQty}
          onRemove={removeFromCart}
          onClose={() => setShowCheckout(false)}
          onPlace={placeOrder}
        />
      )}

      {confirmed && (
        <div className="modal-backdrop" style={{ zIndex: 45 }}>
          <div className="card" style={{ width: "100%", maxWidth: 340, padding: 28, textAlign: "center" }}>
            <p style={{ fontSize: 31.5, margin: "0 0 8px", color: "var(--sage)" }}>&#10003;</p>
            <p className="serif" style={{ fontWeight: 700, fontSize: 20.5, margin: "0 0 5px" }}>
              Order placed
            </p>
            <p style={{ fontSize: 16.5, color: "var(--ink-soft)", margin: "0 0 16px" }}>
              {confirmed.code} &middot; {naira(confirmed.total)} &middot; {confirmed.methodLabel}
            </p>
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-primary"
                style={{ padding: "10px 0", fontSize: 16.5 }}
                onClick={() => {
                  setConfirmed(null);
                  setShowTrack(true);
                }}
              >
                Track my orders
              </button>
              <button
                className="btn btn-outline"
                style={{ padding: "10px 0", fontSize: 16.5 }}
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
