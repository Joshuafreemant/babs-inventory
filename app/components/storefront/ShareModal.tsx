"use client";

import { useState } from "react";
import { QRCode } from "../QRCode";
import { catalogueUrl, whatsappShareUrl, SHARE_MESSAGE } from "../../lib/share";

export function ShareModal({ repRef, onClose }: { repRef?: string; onClose: () => void }) {
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const link = catalogueUrl(repRef);

  const copy = () => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).catch(() => {});
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy link"), 1600);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card"
        style={{ width: "100%", maxWidth: 340, padding: 22, textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <p className="serif" style={{ fontWeight: 700, fontSize: 17.5, margin: 0 }}>
            Share catalogue link
          </p>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 19 }}>
            &times;
          </button>
        </div>

        <QRCode value={link} size={148} />

        <p
          style={{
            fontSize: 12,
            color: "var(--ink-soft)",
            margin: "12px 0 4px",
            wordBreak: "break-all",
          }}
        >
          {link.replace(/^https?:\/\//, "")}
        </p>
        <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 14px" }}>
          Anyone with this link can browse and order, wherever they are.
        </p>

        <div className="flex flex-col gap-2">
          <a
            className="btn"
            href={whatsappShareUrl(SHARE_MESSAGE(link))}
            target="_blank"
            rel="noreferrer"
            style={{ background: "#25D366", color: "#fff", padding: "10px 0", textAlign: "center" }}
          >
            Share on WhatsApp
          </a>
          <button className="btn btn-outline" style={{ padding: "10px 0" }} onClick={copy}>
            {copyLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
