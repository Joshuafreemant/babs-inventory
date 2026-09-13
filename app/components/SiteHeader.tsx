"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Shared top bar. `onStaffSignout` shows the Sign out button when on the console. */
export function SiteHeader({ onStaffSignout }: { onStaffSignout?: () => void }) {
  const pathname = usePathname();
  const onConsole = pathname?.startsWith("/console");

  const tab = (active: boolean) => ({
    background: active ? "var(--gold)" : "transparent",
    color: active ? "var(--navy-deep)" : "var(--gold-light)",
  });

  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "18px var(--gutter)",
        background: "var(--navy-deep)",
        color: "#fff",
        flexWrap: "wrap",
        gap: 12,
        borderBottom: "2px solid var(--gold)",
      }}
    >
      <div className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="Embassy Pharmaceutical & Chemicals — home"
          style={{
            width: 48,
            height: 42,
            background: "#fff",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "5px 6px 7px",
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Embassy Pharmaceutical & Chemicals"
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        </Link>
        <div>
          <p
            className="serif site-brand"
            style={{ fontWeight: 700, fontSize: 19.5, margin: 0, letterSpacing: "0.02em" }}
          >
            Embassy Pharm. &amp; Chem. LTD
          </p>
          <p className="small-caps" style={{ margin: "2px 0 0", color: "var(--gold-light)", opacity: 0.85 }}>
            Your Visa to Healthy Living
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex" style={{ border: "1px solid rgba(233,217,184,0.35)" }}>
          <Link href="/" className="btn" style={tab(!onConsole)}>
            Storefront
          </Link>
          <Link href="/console" className="btn" style={tab(!!onConsole)}>
            Rep console
          </Link>
        </div>
        {onConsole && onStaffSignout && (
          <button
            className="btn btn-outline"
            style={{ borderColor: "var(--gold-light)", color: "var(--gold-light)" }}
            onClick={onStaffSignout}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
