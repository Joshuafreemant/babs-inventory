"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "../components/SiteHeader";
import { TrackPanel } from "../components/storefront/TrackPanel";

export default function TrackOrderPage() {
  const [initialPhone, setInitialPhone] = useState("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = (params.get("phone") || params.get("code") || "").trim();
      if (fromUrl) setInitialPhone(fromUrl);
    } catch {}
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      <SiteHeader />
      <div style={{ padding: "28px var(--gutter) 90px", maxWidth: 640, margin: "0 auto" }}>
        <Link
          href="/"
          style={{ fontSize: 14.5, color: "var(--ink-soft)", display: "inline-block", marginBottom: 18 }}
        >
          &larr; Back to catalogue
        </Link>
        <TrackPanel initialPhone={initialPhone} />
      </div>
    </div>
  );
}
