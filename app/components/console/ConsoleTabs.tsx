"use client";

import Link from "next/link";

/** Secondary nav inside the rep console. Settings is admin-only. */
export function ConsoleTabs({
  active,
  role,
}: {
  active: "desk" | "reports" | "settings";
  role?: "rep" | "admin";
}) {
  const item = (isActive: boolean) => ({
    padding: "8px 2px",
    marginRight: 22,
    fontSize: 14.5,
    fontWeight: 600,
    color: isActive ? "var(--navy)" : "var(--ink-soft)",
    borderBottom: isActive ? "2px solid var(--gold)" : "2px solid transparent",
    textDecoration: "none",
    display: "inline-block",
  });

  return (
    <div
      style={{
        borderBottom: "1px solid var(--line)",
        padding: "0 var(--gutter)",
        background: "#fff",
      }}
    >
      <Link href="/console" style={item(active === "desk")}>
        Order desk
      </Link>
      <Link href="/console/reports" style={item(active === "reports")}>
        Reports
      </Link>
      {role === "admin" && (
        <Link href="/console/settings" style={item(active === "settings")}>
          Settings
        </Link>
      )}
    </div>
  );
}
