"use client";

import { useEffect, useRef, useState } from "react";
import { Product } from "../../types";
import {
  uploadProductPhoto,
  removeProductPhoto,
  IMAGE_ACCEPT,
  MAX_IMAGE_BYTES,
} from "./uploadProductPhoto";

/** Thumbnail + add/replace/remove control for one product's single photo. */
export function ProductPhotoCell({
  product,
  onChange,
  onError,
}: {
  product: Product;
  onChange: (p: Product) => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localPreview, setLocalPreview] = useState("");

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const choose = () => inputRef.current?.click();

  const upload = async (file: File) => {
    if (file.size > MAX_IMAGE_BYTES) {
      onError("Image is larger than 6 MB.");
      return;
    }
    setBusy(true);
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    try {
      const updated = await uploadProductPhoto(product.id, file);
      onChange(updated);
    } catch (e: any) {
      onError(e.message);
    } finally {
      setBusy(false);
      URL.revokeObjectURL(preview);
      setLocalPreview("");
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const updated = await removeProductPhoto(product.id);
      onChange(updated);
    } catch (e: any) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const src = localPreview || product.imageUrl;

  return (
    <div className="flex items-center gap-2" style={{ flexShrink: 0 }}>
      <div
        onClick={choose}
        title={src ? "Replace photo" : "Add photo"}
        style={{
          width: 40,
          height: 40,
          border: "1px solid var(--line)",
          background: "var(--cream-soft)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          overflow: "hidden",
          opacity: busy ? 0.5 : 1,
          flexShrink: 0,
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: 16.5, color: "var(--ink-soft)" }}>+</span>
        )}
      </div>
      {product.imageUrl && !busy && (
        <button
          type="button"
          onClick={remove}
          style={{ background: "none", border: "none", color: "var(--ink-soft)", fontSize: 12.5 }}
        >
          Remove
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) upload(file);
        }}
      />
    </div>
  );
}
