"use client";

import { useState } from "react";
import { QRCode } from "../QRCode";
import { catalogueUrl, whatsappShareUrl, SHARE_MESSAGE } from "../../lib/share";
import { StaffSession } from "../../types";

/** A rep's own catalogue link — orders placed through it are credited to them. */
export function ShareLinkCard({ session }: { session: StaffSession }) {
  const link = catalogueUrl(session.staffId);
  const [copyLabel, setCopyLabel] = useState("Copy link");
  const [qrData, setQrData] = useState("");

  const copy = () => {
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).catch(() => {});
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy link"), 1600);
  };

  return (
    <div className="card" style={{ marginTop: 24, padding: "16px 18px" }}>
      <p className="serif" style={{ fontWeight: 700, fontSize: 17, margin: "0 0 4px" }}>
        Your share link
      </p>
      <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 14px", lineHeight: 1.5 }}>
        Hand this to buyers who aren&apos;t at the stand. Every order placed through it is
        credited to <strong>{session.name}</strong> in the sales report.
      </p>

      <div className="grid gap-3" style={{ gridTemplateColumns: "auto 1fr", alignItems: "start" }}>
        <QRCode value={link} size={132} onData={setQrData} />
        <div className="flex flex-col gap-2" style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontFamily: "ui-monospace, Menlo, monospace",
              background: "var(--cream-soft)",
              border: "1px solid var(--line)",
              padding: "8px 10px",
              wordBreak: "break-all",
              margin: 0,
            }}
          >
            {link.replace(/^https?:\/\//, "")}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn btn-outline btn-sm" onClick={copy}>
              {copyLabel}
            </button>
            <a
              className="btn btn-sm"
              href={whatsappShareUrl(SHARE_MESSAGE(link))}
              target="_blank"
              rel="noreferrer"
              style={{ background: "#25D366", color: "#fff" }}
            >
              WhatsApp
            </a>
            {qrData && (
              <a
                className="btn btn-outline btn-sm"
                href={qrData}
                download={`embassy-catalogue-${session.staffId}.png`}
              >
                Download QR
              </a>
            )}
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
            Print the QR on your stand banner &mdash; buyers scan it to open the catalogue.
          </p>
        </div>
      </div>
    </div>
  );
}
