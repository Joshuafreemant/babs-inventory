"use client";

import { useEffect, useRef, useState } from "react";
import { DrugCategory, DRUG_CATEGORIES, CARTON_PRESETS, PACKET_PRESETS, SellUnit, Product } from "../../types";

const ACTIVE_DRUG_CATEGORIES = DRUG_CATEGORIES.filter((c) => c.active);
import { apiPatch } from "../../lib/api";
import {
  uploadProductPhoto,
  removeProductPhoto,
  IMAGE_ACCEPT,
  MAX_IMAGE_BYTES,
} from "./uploadProductPhoto";
import { CurrencyInput } from "./CurrencyInput";

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
  const [drugCategory, setDrugCategory] = useState<DrugCategory>(product.drugCategory);
  const [price, setPrice] = useState(String(product.price));
  const [bpc, setBpc] = useState(String(product.boxesPerCarton));
  const [threshold, setThreshold] = useState(String(product.lowStockThreshold));
  const [backorder, setBackorder] = useState(product.backorder);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const initialSellUnit = product.sellUnit || "box";
  const [sellUnit, setSellUnit] = useState<SellUnit>(initialSellUnit);
  const [packetsPerBox, setPacketsPerBox] = useState(String(product.packetsPerBox || ""));
  const [resetStock, setResetStock] = useState("");
  const switching = sellUnit !== initialSellUnit;
  const isPacket = sellUnit === "packet";

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
    if (switching && resetStock.trim() === "") {
      setError(`Enter the current stock in ${isPacket ? "packets" : "boxes"} to switch sell unit.`);
      return;
    }
    if (isPacket && (!packetsPerBox || parseInt(packetsPerBox, 10) <= 0)) {
      setError("Set how many packets come in one box.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      let updated: Product = await apiPatch<Product>(`/api/admin/products/${product.id}`, {
        op: "edit",
        name,
        drugCategory,
        price: parseInt(price, 10),
        boxesPerCarton: parseInt(bpc, 10),
        sellUnit,
        packetsPerBox: isPacket ? parseInt(packetsPerBox, 10) : undefined,
        resetStock: switching ? parseInt(resetStock, 10) : undefined,
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

  // keep the product's current classification selectable even if it's since
  // been hidden, so saving doesn't silently swap it to whatever's active
  const drugCategoryOptions = ACTIVE_DRUG_CATEGORIES.some((c) => c.id === product.drugCategory)
    ? ACTIVE_DRUG_CATEGORIES
    : [DRUG_CATEGORIES.find((c) => c.id === product.drugCategory), ...ACTIVE_DRUG_CATEGORIES].filter(
        (c): c is (typeof DRUG_CATEGORIES)[number] => !!c
      );

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
          <p className="serif" style={{ fontWeight: 700, fontSize: 17.5, margin: 0 }}>
            Edit product
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18.5, color: "#fff" }}>
            &times;
          </button>
        </div>

        <div style={{ padding: 20 }} className="flex flex-col gap-2">
          <div className="field">
            <span className="icon">&#128137;</span>
            <input placeholder="Product name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <span className="icon">&#128138;</span>
            <select value={drugCategory} onChange={(e) => setDrugCategory(e.target.value as DrugCategory)}>
              {drugCategoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <span className="icon">&#8358;</span>
              <CurrencyInput value={price} onChange={setPrice} placeholder={isPacket ? "Price / packet" : "Price / box"} />
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

          <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", margin: "8px 0 2px" }}>
            Sell unit
          </p>
          <div className="flex" style={{ background: "var(--cream-soft)", borderRadius: "var(--r-pill)", padding: 3, gap: 2, width: "fit-content" }}>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: !isPacket ? "var(--navy)" : "transparent",
                color: !isPacket ? "var(--gold-light)" : "var(--ink-soft)",
              }}
              onClick={() => setSellUnit("box")}
            >
              Box
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: isPacket ? "var(--navy)" : "transparent",
                color: isPacket ? "var(--gold-light)" : "var(--ink-soft)",
              }}
              onClick={() => setSellUnit("packet")}
            >
              Packet
            </button>
          </div>

          {isPacket && (
            <div className="flex items-center gap-2 flex-wrap">
              {PACKET_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`chip ${parseInt(packetsPerBox, 10) === n ? "active" : ""}`}
                  onClick={() => setPacketsPerBox(String(n))}
                >
                  {n}
                </button>
              ))}
              <div className="field" style={{ width: 110 }}>
                <input
                  type="number"
                  min={1}
                  placeholder="Packets/box"
                  value={packetsPerBox}
                  onChange={(e) => setPacketsPerBox(e.target.value)}
                />
              </div>
            </div>
          )}

          {switching && (
            <div className="card" style={{ padding: "10px 12px", background: "var(--cream-soft)", border: "1px solid var(--gold)" }}>
              <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "0 0 6px" }}>
                Switching to {isPacket ? "packet" : "box"} selling means the current stock count no
                longer applies. Enter the current stock in {isPacket ? "packets" : "boxes"} to continue.
              </p>
              <div className="field">
                <span className="icon">&#128230;</span>
                <input
                  type="number"
                  min={0}
                  placeholder={`Current stock (${isPacket ? "packets" : "boxes"})`}
                  value={resetStock}
                  onChange={(e) => setResetStock(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="field" style={{ marginTop: 4 }}>
            <span className="icon">&#9888;</span>
            <input
              type="number"
              min={0}
              placeholder={`Low-stock threshold (${isPacket ? "packets" : "boxes"})`}
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>

          <label className="check" style={{ marginTop: 2 }}>
            <input type="checkbox" checked={backorder} onChange={(e) => setBackorder(e.target.checked)} />
            Allow orders once stock hits zero (ships from regional store)
          </label>

          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "6px 0 0" }}>
            Stock is changed with the +/&minus; stepper and Restock, not here.
          </p>

          {/* photo */}
          <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", margin: "10px 0 4px" }}>
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
                <span style={{ fontSize: 19.5, color: "var(--ink-soft)" }}>+</span>
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

          {error && <p style={{ fontSize: 13.5, color: "var(--rose)", margin: "8px 0 0" }}>{error}</p>}
          <button className="btn btn-primary" style={{ padding: "11px 0", marginTop: 10 }} disabled={busy} onClick={save}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
