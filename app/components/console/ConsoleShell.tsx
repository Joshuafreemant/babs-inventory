"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { StaffSession } from "../../types";

type Tab = "desk" | "reports" | "activity" | "settings";

const NAV: { tab: Tab; href: string; label: string }[] = [
  { tab: "desk", href: "/console", label: "Order desk" },
  { tab: "reports", href: "/console/reports", label: "Reports" },
  { tab: "activity", href: "/console/activity", label: "Activity" },
  { tab: "settings", href: "/console/settings", label: "Settings" },
];

function Icon({ tab }: { tab: Tab }) {
  const common = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8 };
  if (tab === "desk")
    return (
      <svg {...common}>
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7" />
        <path d="M12 11v10" />
      </svg>
    );
  if (tab === "reports")
    return (
      <svg {...common}>
        <path d="M4 20V10M12 20V4M20 20v-7" />
      </svg>
    );
  if (tab === "activity")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.56V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.56 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.56-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.56-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.56V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.56 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.56 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.56 1z" />
    </svg>
  );
}

function NavItems({ role, onNavigate }: { role: "rep" | "admin"; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="console-rail-nav">
      {NAV.filter((n) => (n.tab !== "settings" && n.tab !== "activity") || role === "admin").map((n) => {
        const active = pathname === n.href;
        return (
          <Link
            key={n.tab}
            href={n.href}
            className={`console-rail-item${active ? " active" : ""}`}
            onClick={onNavigate}
          >
            <Icon tab={n.tab} />
            {n.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Left-hand nav for the console — a persistent rail from ~900px up, a
 * slide-out drawer below it. Sign-out stays in SiteHeader; this only owns
 * the Order desk / Reports / Settings switch. */
export function ConsoleShell({
  title,
  session,
  children,
}: {
  title: string;
  session: StaffSession;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="console-mobile-bar">
        <button
          type="button"
          className="console-hamburger"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <span className="serif" style={{ fontWeight: 700, fontSize: 16.5 }}>
          {title}
        </span>
      </div>

      <div className="console-shell">
        <nav className="console-rail">
          <NavItems role={session.role} />
          <div className="console-rail-who">
            <div className="console-rail-avatar">{session.name.slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{session.name}</strong>
              <span>{session.role === "admin" ? "Admin" : "Rep"}</span>
            </div>
          </div>
        </nav>
        <div className="console-main">{children}</div>
      </div>

      {drawerOpen && (
        <div className="console-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
          <nav className="console-drawer" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="console-drawer-close"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
            >
              &times;
            </button>
            <NavItems role={session.role} onNavigate={() => setDrawerOpen(false)} />
            <div className="console-rail-who">
              <div className="console-rail-avatar">{session.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <strong>{session.name}</strong>
                <span>{session.role === "admin" ? "Admin" : "Rep"}</span>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
