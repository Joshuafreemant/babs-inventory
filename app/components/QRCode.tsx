"use client";

import { useEffect, useState } from "react";
import QR from "qrcode";

/** Renders `value` as a scannable QR. `onData` hands back the PNG data URL. */
export function QRCode({
  value,
  size = 160,
  onData,
}: {
  value: string;
  size?: number;
  onData?: (dataUrl: string) => void;
}) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let alive = true;
    QR.toDataURL(value, {
      width: size * 2, // render at 2x for crisp scaling / printing
      margin: 1,
      color: { dark: "#0f2a3d", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!alive) return;
        setSrc(url);
        onData?.(url);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [value, size, onData]);

  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#fff",
        border: "1px solid var(--line)",
        display: "grid",
        placeItems: "center",
        margin: "0 auto",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="QR code" width={size - 12} height={size - 12} />
      ) : (
        <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>…</span>
      )}
    </div>
  );
}
