"use client";

import { useEffect, useState } from "react";
import { Category, CATEGORIES, CARTON_PRESETS, Product } from "../../types";
import { apiPost } from "../../lib/api";
import { toBoxes, suggestThreshold } from "../../lib/money";
import { ProductCard } from "../ProductCard";
import { uploadProductPhoto, IMAGE_ACCEPT, MAX_IMAGE_BYTES } from "./uploadProductPhoto";
import { CurrencyInput } from "./CurrencyInput";

interface Form {
  name: string;
  category: Category;
  boxesPerCarton: string;
  price: string;
  cartons: string;
  loose: string;
  threshold: string;
  thresholdManual: boolean;
  backorder: boolean;
}

const EMPTY: Form = {
  name: "",
  category: "bottle",
  boxesPerCarton: "24",
  price: "",
  cartons: "",
  loose: "",
  threshold: "",
  thresholdManual: false,
  backorder: false,
};

export function AddProductModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (p: Product, stock: number) => void;
}) {
  const [f, setF] = useState<Form>(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const pickPhoto = (file: File | null) => {
    if (file && file.size > MAX_IMAGE_BYTES) {
      setError("Image is larger than 6 MB — pick a smaller one.");
      return;
    }
    setError("");
    setPhoto(file);
  };

  const bpc = parseInt(f.boxesPerCarton, 10) || 0;
  const cartons = parseInt(f.cartons, 10) || 0;
  const loose = parseInt(f.loose, 10) || 0;
  const price = parseInt(f.price, 10) || 0;
  const totalBoxes = toBoxes(cartons, loose, bpc);

  const patch = (p: Partial<Form>) =>
    setF((prev) => {
      const next = { ...prev, ...p };
      if (!next.thresholdManual && ("cartons" in p || "loose" in p || "boxesPerCarton" in p)) {
        const b = toBoxes(
          parseInt(next.cartons, 10) || 0,
          parseInt(next.loose, 10) || 0,
          parseInt(next.boxesPerCarton, 10) || 0
        );
        next.threshold = b > 0 ? String(suggestThreshold(b)) : "";
      }
      return next;
    });

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      let product = await apiPost<Product>("/api/admin/products", {
        name: f.name,
        category: f.category,
        boxesPerCarton: bpc,
        price,
        cartons,
        loose,
        threshold: f.threshold === "" ? undefined : parseInt(f.threshold, 10),
        backorder: f.backorder,
      });
      if (photo) {
        try {
          product = await uploadProductPhoto(product.id, photo);
        } catch (e: any) {
          // product is saved; just tell them the photo didn't attach
          onAdded(product, totalBoxes);
          setError(`Product added, but the photo failed: ${e.message}. Add it from the ledger.`);
          setBusy(false);
          return;
        }
      }
      onAdded(product, totalBoxes);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const previewProduct: Product = {
    id: "__preview",
    name: f.name || "Untitled product",
    category: f.category,
    boxesPerCarton: bpc || 1,
    price,
    stock: totalBoxes,
    lowStockThreshold: parseInt(f.threshold, 10) || 0,
    forceLowStock: false,
    showStock: false,
    backorder: f.backorder,
    imageUrl: photoPreview || undefined,
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card"
        style={{ width: "100%", maxWidth: 640, maxHeight: "90%", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", background: "var(--navy)", color: "#fff" }}
        >
          <p className="serif" style={{ fontWeight: 700, fontSize: 17.5, margin: 0 }}>
            Add a product to inventory
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18.5, color: "#fff" }}>
            &times;
          </button>
        </div>

        <div className="modal-2col">
          <div className="flex flex-col gap-2">
            <div className="field">
              <span className="icon">&#128137;</span>
              <input placeholder="Product name" value={f.name} onChange={(e) => patch({ name: e.target.value })} />
            </div>
            <div className="field">
              <span className="icon">&#128193;</span>
              <select value={f.category} onChange={(e) => patch({ category: e.target.value as Category })}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", margin: "8px 0 2px" }}>
              Boxes per carton (how it&apos;s packed for delivery)
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {CARTON_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`chip ${bpc === n ? "active" : ""}`}
                  onClick={() => patch({ boxesPerCarton: String(n) })}
                >
                  {n}
                </button>
              ))}
              <div className="field" style={{ width: 110 }}>
                <input
                  type="number"
                  min={1}
                  placeholder="Custom"
                  value={f.boxesPerCarton}
                  onChange={(e) => patch({ boxesPerCarton: e.target.value })}
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: 8 }}>
              <span className="icon">&#8358;</span>
              <CurrencyInput value={f.price} onChange={(v) => patch({ price: v })} placeholder="Price per box" />
            </div>

            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", margin: "8px 0 2px" }}>
              Opening stock received
            </p>
            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="field">
                <span className="icon">&#128230;</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Full cartons"
                  value={f.cartons}
                  onChange={(e) => patch({ cartons: e.target.value })}
                />
              </div>
              <div className="field">
                <span className="icon">&#128722;</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Loose boxes"
                  value={f.loose}
                  onChange={(e) => patch({ loose: e.target.value })}
                />
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "2px 0 0" }}>
              {cartons} carton{cartons === 1 ? "" : "s"} &times; {bpc || 0} + {loose} loose ={" "}
              <strong>{totalBoxes.toLocaleString("en-NG")} boxes in stock</strong>
            </p>

            <div className="field" style={{ marginTop: 6 }}>
              <span className="icon">&#9888;</span>
              <input
                type="number"
                min={0}
                placeholder="Low-stock threshold (boxes)"
                value={f.threshold}
                onChange={(e) => patch({ threshold: e.target.value, thresholdManual: true })}
              />
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
              Auto-suggested from opening stock &mdash; edit for a different cut-off. Below this, the product
              automatically shows as &quot;Selling fast&quot;.
            </p>

            <label className="check" style={{ marginTop: 6 }}>
              <input
                type="checkbox"
                checked={f.backorder}
                onChange={(e) => patch({ backorder: e.target.checked })}
              />
              Allow orders once stock hits zero (ships from regional store)
            </label>

            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", margin: "10px 0 2px" }}>
              Product photo <span style={{ fontWeight: 400 }}>(optional &middot; JPG, PNG or WebP)</span>
            </p>
            <div className="flex items-center gap-2">
              <label
                className="btn btn-outline btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {photo ? "Change photo" : "Choose photo"}
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  style={{ display: "none" }}
                  onChange={(e) => pickPhoto(e.target.files?.[0] || null)}
                />
              </label>
              {photo && (
                <>
                  <span style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>{photo.name}</span>
                  <button
                    type="button"
                    onClick={() => pickPhoto(null)}
                    style={{ background: "none", border: "none", color: "var(--rose)", fontSize: 16.5 }}
                    aria-label="Remove photo"
                  >
                    &times;
                  </button>
                </>
              )}
            </div>

            {error && <p style={{ fontSize: 13.5, color: "var(--rose)", margin: "6px 0 0" }}>{error}</p>}
            <button className="btn btn-primary" style={{ padding: "11px 0", marginTop: 10 }} disabled={busy} onClick={submit}>
              {busy ? "Adding…" : "Add to inventory"}
            </button>
          </div>

          <div>
            <p className="small-caps" style={{ color: "var(--ink-soft)", margin: "0 0 10px" }}>
              Storefront preview
            </p>
            <ProductCard product={previewProduct} preview />
          </div>
        </div>
      </div>
    </div>
  );
}
