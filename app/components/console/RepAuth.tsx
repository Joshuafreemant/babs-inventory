"use client";

import { useState } from "react";
import { apiPost } from "../../lib/api";
import { StaffSession } from "../../types";

export function RepAuth({ onSignedIn }: { onSignedIn: (s: StaffSession) => void }) {
  const [staffId, setStaffId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const s = await apiPost<StaffSession>("/api/staff/login", { staffId, passcode });
      onSignedIn(s);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center"
      style={{ padding: "80px 20px", minHeight: "calc(100vh - 78px)" }}
    >
      <div className="card" style={{ padding: 28, width: "100%", maxWidth: 360 }}>
        <p className="serif" style={{ fontWeight: 700, fontSize: 20.5, margin: "0 0 4px" }}>
          Rep console sign-in
        </p>
        <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "0 0 18px" }}>Staff access only.</p>
        <div className="flex flex-col gap-2">
          <div className="field">
            <span className="icon">&#128100;</span>
            <input
              placeholder="Staff ID"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
            />
          </div>
          <div className="field">
            <span className="icon">&#128274;</span>
            <input
              type="password"
              placeholder="Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          {error && <p style={{ fontSize: 13.5, color: "var(--rose)", margin: 0 }}>{error}</p>}
          <button className="btn btn-primary" style={{ padding: "11px 0" }} disabled={busy} onClick={submit}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
