"use client";

import { useEffect, useState } from "react";
import { DrugCategory, DRUG_CATEGORIES, CARTON_PRESETS, PACKET_PRESETS, SellUnit, Product } from "../../types";
import { apiPost } from "../../lib/api";
import { toBoxes, toPackets, cartonBreakdown, packetBreakdown, suggestThreshold } from "../../lib/money";
import { ProductCard } from "../ProductCard";
import { uploadProductPhoto, IMAGE_ACCEPT, MAX_IMAGE_BYTES } from "./uploadProductPhoto";
import { CurrencyInput } from "./CurrencyInput";
import { ProductNameAutocomplete } from "./ProductNameAutocomplete";
import { SearchableSelect } from "../SearchableSelect";

interface Form {
  name: string;
  drugCategory: DrugCategory;
  boxesPerCarton: string;
  sellUnit: SellUnit;
  packetsPerBox: string;
  price: string;
  cartons: string;
  boxes: string;
  loose: string;
  threshold: string;
  thresholdManual: boolean;
  backorder: boolean;
}


const ACTIVE_DRUG_CATEGORIES = DRUG_CATEGORIES.filter((c) => c.active);
const CATEGORY_OPTIONS = ACTIVE_DRUG_CATEGORIES.map((c) => ({ value: c.id, label: c.label }));
const EMPTY: Form = {
  name: "",
  drugCategory: "cardiovascular",
  boxesPerCarton: "24",
  sellUnit: "box",
  packetsPerBox: "",
  price: "",
  cartons: "",
  boxes: "",
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
  const isPacket = f.sellUnit === "packet";
  const ppb = parseInt(f.packetsPerBox, 10) || 0;
  const cartons = parseInt(f.cartons, 10) || 0;
  const boxes = parseInt(f.boxes, 10) || 0;
  const loose = parseInt(f.loose, 10) || 0;
  const price = parseInt(f.price, 10) || 0;
  const totalStock = isPacket ? toPackets(cartons, boxes, loose, bpc, ppb) : toBoxes(cartons, loose, bpc);

  const patch = (p: Partial<Form>) =>
    setF((prev) => {
      const next = { ...prev, ...p };
      const stockFieldTouched =
        "cartons" in p || "boxes" in p || "loose" in p || "boxesPerCarton" in p ||
        "sellUnit" in p || "packetsPerBox" in p;
      if (!next.thresholdManual && stockFieldTouched) {
        const nbpc = parseInt(next.boxesPerCarton, 10) || 0;
        const b =
          next.sellUnit === "packet"
            ? toPackets(
                parseInt(next.cartons, 10) || 0,
                parseInt(next.boxes, 10) || 0,
                parseInt(next.loose, 10) || 0,
                nbpc,
                parseInt(next.packetsPerBox, 10) || 0
              )
            : toBoxes(parseInt(next.cartons, 10) || 0, parseInt(next.loose, 10) || 0, nbpc);
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
        drugCategory: f.drugCategory,
        boxesPerCarton: bpc,
        sellUnit: f.sellUnit,
        packetsPerBox: isPacket ? ppb : undefined,
        price,
        cartons,
        boxes,
        loose,
        threshold: f.threshold === "" ? undefined : parseInt(f.threshold, 10),
        backorder: f.backorder,
      });
      if (photo) {
        try {
          product = await uploadProductPhoto(product.id, photo);
        } catch (e: any) {
          // product is saved; just tell them the photo didn't attach
          onAdded(product, totalStock);
          setError(`Product added, but the photo failed: ${e.message}. Add it from the ledger.`);
          setBusy(false);
          return;
        }
      }
      onAdded(product, totalStock);
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
    category: "bottle",
    drugCategory: f.drugCategory,
    boxesPerCarton: bpc || 1,
    sellUnit: f.sellUnit,
    packetsPerBox: isPacket ? ppb || 1 : undefined,
    price,
    stock: totalStock,
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
            <ProductNameAutocomplete value={f.name} onChange={(name) => patch({ name })} />
            <SearchableSelect
  icon="💊"
  value={f.drugCategory}
  onChange={(v) => patch({ drugCategory: v as DrugCategory })}
  options={CATEGORY_OPTIONS}
  placeholder="Drug category"
/>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", margin: "-4px 0 0" }}>
              Only Cardiovascular is enabled while we test classification &mdash; the rest unlock after.
            </p>

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
                onClick={() => patch({ sellUnit: "box" })}
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
                onClick={() => patch({ sellUnit: "packet" })}
              >
                Packet
              </button>
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

            {isPacket && (
              <>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", margin: "8px 0 2px" }}>
                  Packets per box
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {PACKET_PRESETS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={`chip ${ppb === n ? "active" : ""}`}
                      onClick={() => patch({ packetsPerBox: String(n) })}
                    >
                      {n}
                    </button>
                  ))}
                  <div className="field" style={{ width: 110 }}>
                    <input
                      type="number"
                      min={1}
                      placeholder="Custom"
                      value={f.packetsPerBox}
                      onChange={(e) => patch({ packetsPerBox: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="field" style={{ marginTop: 8 }}>
              <span className="icon">&#8358;</span>
              <CurrencyInput
                value={f.price}
                onChange={(v) => patch({ price: v })}
                placeholder={isPacket ? "Price per packet" : "Price per box"}
              />
            </div>

            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-soft)", margin: "8px 0 2px" }}>
              Opening stock received
            </p>
            <div className="grid gap-2" style={{ gridTemplateColumns: isPacket ? "1fr 1fr 1fr" : "1fr 1fr" }}>
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
              {isPacket && (
                <div className="field">
                  <span className="icon">&#128721;</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Full boxes"
                    value={f.boxes}
                    onChange={(e) => patch({ boxes: e.target.value })}
                  />
                </div>
              )}
              <div className="field">
                <span className="icon">&#128722;</span>
                <input
                  type="number"
                  min={0}
                  placeholder={isPacket ? "Loose packets" : "Loose boxes"}
                  value={f.loose}
                  onChange={(e) => patch({ loose: e.target.value })}
                />
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "2px 0 0" }}>
              {isPacket ? (
                (() => {
                  const nbd = packetBreakdown(totalStock, bpc, ppb);
                  return (
                    <>
                      <strong>{totalStock.toLocaleString("en-NG")} packets in stock</strong> ({nbd.cartons} carton
                      {nbd.cartons === 1 ? "" : "s"}
                      {nbd.boxes ? ` + ${nbd.boxes} box${nbd.boxes === 1 ? "" : "es"}` : ""}
                      {nbd.loosePackets ? ` + ${nbd.loosePackets} loose packet${nbd.loosePackets === 1 ? "" : "s"}` : ""},{" "}
                      {ppb || 0}/box, {bpc || 0} boxes/carton)
                    </>
                  );
                })()
              ) : (
                (() => {
                  const nbd = cartonBreakdown(totalStock, bpc);
                  return (
                    <>
                      <strong>{totalStock.toLocaleString("en-NG")} boxes in stock</strong> ({nbd.cartons} carton
                      {nbd.cartons === 1 ? "" : "s"}
                      {nbd.loose ? ` + ${nbd.loose} loose box${nbd.loose === 1 ? "" : "es"}` : ""}, {bpc || 0}/carton)
                    </>
                  );
                })()
              )}
            </p>

            <div className="field" style={{ marginTop: 6 }}>
              <span className="icon">&#9888;</span>
              <input
                type="number"
                min={0}
                placeholder={`Low-stock threshold (${isPacket ? "packets" : "boxes"})`}
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
