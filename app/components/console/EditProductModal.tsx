"use client";

import { useEffect, useRef, useState } from "react";
import { Category, CATEGORIES, CARTON_PRESETS, Product } from "../../types";
import { apiPatch } from "../../lib/api";
import {
  uploadProductPhoto,
  removeProductPhoto,
  IMAGE_ACCEPT,
  MAX_IMAGE_BYTES,
} from "./uploadProductPhoto";

export function EditProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product;
  onClose: () => void;
  onSaved: (p: Product) => void;
}) {
  const [name, setName] = useState(product.name);
  const [category, setCategory] = useState<Category>(product.category);
  const [price, setPrice] = useState(String(product.price));
  const [bpc, setBpc] = useState(String(product.boxesPerCarton));
  const [threshold, setThreshold] = useState(String(product.lowStockThreshold));
  const [backorder, setBackorder] = useState(product.backorder);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // photo
  const [current, setCurrent] = useState(product.imageUrl || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const u = URL.createObjectURL(file);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const pickFile = (f: File | null) => {
    if (f && f.size > MAX_IMAGE_BYTES) {
      setError("Image is larger than 6 MB.");
      return;
    }
    setError("");
    setFile(f);
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      let updated: Product = await apiPatch<Product>(`/api/admin/products/${product.id}`, {
        op: "edit",
        name,
        category,
        price: parseInt(price, 10),
        boxesPerCarton: parseInt(bpc, 10),
        lowStockThreshold: threshold === "" ? undefined : parseInt(threshold, 10),
        backorder,
      }).catch((e) => {
        // "Nothing to change" is fine if only the photo changed
        if (String(e.message).includes("Nothing to change") && (file || current !== product.imageUrl)) {
          return product;
        }
        throw e;
      });

      if (file) {
        updated = await uploadProductPhoto(product.id, file);
      }
      onSaved(updated);
      onClose();
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    setBusy(true);
    try {
      const updated = await removeProductPhoto(product.id);
      setCurrent("");
      setFile(null);
      onSaved(updated);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const shownImg = preview || current;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card"
        style={{ width: "100%", maxWidth: 440, maxHeight: "90%", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", background: "var(--navy)", color: "#fff" }}
        >
          <p className="serif" style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>
            Edit product
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 17, color: "#fff" }}>
            &times;
          </button>
        </div>

        <div style={{ padding: 20 }} className="flex flex-col gap-2">
          <div className="field">
            <span className="icon">&#128137;</span>
            <input placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <span className="icon">&#128193;</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <span className="icon">&#8358;</span>
              <input type="number" min={0} placeholder="Price / box" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="field">
              <span className="icon">&#128230;</span>
              <input type="number" min={1} placeholder="Boxes / carton" value={bpc} onChange={(e) => setBpc(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {CARTON_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className={`chip ${parseInt(bpc, 10) === n ? "active" : ""}`}
                onClick={() => setBpc(String(n))}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="field" style={{ marginTop: 4 }}>
            <span className="icon">&#9888;</span>
            <input
              type="number"
              min={0}
              placeholder="Low-stock threshold (boxes)"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>

          <label className="check" style={{ marginTop: 2 }}>
            <input type="checkbox" checked={backorder} onChange={(e) => setBackorder(e.target.checked)} />
            Allow orders once stock hits zero (ships from regional store)
          </label>

          <p style={{ fontSize: 11.5, color: "var(--ink-soft)", margin: "6px 0 0" }}>
            Stock is changed with the +/&minus; stepper and Restock, not here.
          </p>

          {/* photo */}
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", margin: "10px 0 4px" }}>
            Photo
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div
              onClick={() => inputRef.current?.click()}
              style={{
                width: 56,
                height: 56,
                border: "1px solid var(--line)",
                background: "var(--cream-soft)",
                display: "grid",
                placeItems: "center",
                overflow: "hidden",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {shownImg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={shownImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 18, color: "var(--ink-soft)" }}>+</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()}>
                {shownImg ? "Change" : "Add photo"}
              </button>
              {current && !file && (
                <button
                  className="btn btn-sm"
                  style={{ background: "none", border: "none", color: "var(--rose)" }}
                  onClick={removePhoto}
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={IMAGE_ACCEPT}
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                e.target.value = "";
                pickFile(f);
              }}
            />
          </div>

          {error && <p style={{ fontSize: 12, color: "var(--rose)", margin: "8px 0 0" }}>{error}</p>}
          <button className="btn btn-primary" style={{ padding: "11px 0", marginTop: 10 }} disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
