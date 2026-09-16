"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../../lib/api";

interface Recipient {
  id: string;
  name: string;
  phone: string;
  display: string;
  active: boolean;
}
interface Payload {
  recipients: Recipient[];
  sms: { configured: boolean; provider: string; senderId: string };
}

export function AlertRecipients({ onToast }: { onToast: (m: string) => void }) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [sms, setSms] = useState({ configured: false, provider: "SMS", senderId: "" });
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  const load = () =>
    apiGet<Payload>("/api/admin/alert-recipients")
      .then((d) => {
        setRecipients(d.recipients);
        setSms(d.sms);
      })
      .catch(() => {});

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await apiPost<Recipient>("/api/admin/alert-recipients", { name, phone });
      setRecipients((list) => [...list, r]);
      setName("");
      setPhone("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (r: Recipient) => {
    try {
      const updated = await apiPatch<Recipient>(`/api/admin/alert-recipients/${r.id}`, {
        active: !r.active,
      });
      setRecipients((list) => list.map((x) => (x.id === r.id ? updated : x)));
    } catch (e: any) {
      onToast(e.message);
    }
  };

  const remove = async (r: Recipient) => {
    try {
      await fetch(`/api/admin/alert-recipients/${r.id}`, { method: "DELETE" });
      setRecipients((list) => list.filter((x) => x.id !== r.id));
    } catch {
      onToast("Could not remove recipient");
    }
  };

  const sendTest = async () => {
    setTesting(true);
    setTestMsg("");
    try {
      const res = await apiPost<{ message: string }>("/api/admin/alert-recipients/test");
      setTestMsg(res.message);
      onToast("Test alert sent");
    } catch (e: any) {
      setTestMsg(e.message);
    } finally {
      setTesting(false);
    }
  };

  const activeCount = recipients.filter((r) => r.active).length;

  const statusChip = (ok: boolean, label: string) => (
    <span
      style={{
        fontSize: 13,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 20,
        background: ok ? "var(--sage-bg)" : "#F3E9D6",
        color: ok ? "var(--sage)" : "#7A5210",
      }}
    >
      {ok ? "●" : "○"} {label}
    </span>
  );

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div
        className="flex items-center justify-between flex-wrap gap-2"
        style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)" }}
      >
        <p className="serif" style={{ fontWeight: 700, fontSize: 17, margin: 0 }}>
          Order alert recipients
        </p>
        <button
          className="btn btn-outline btn-sm"
          onClick={sendTest}
          disabled={testing || !sms.configured || activeCount === 0}
        >
          {testing ? "Sending…" : "Send test alert"}
        </button>
      </div>

      <div style={{ padding: "16px 18px" }}>
        <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 8px" }}>
          Everyone here gets an SMS the moment a new order comes in. Staff who sign into the
          console can also turn on push notifications for themselves, on the Order desk.
        </p>
        <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 14 }}>
          {statusChip(sms.configured, sms.configured ? `SMS via ${sms.provider}` : "SMS not set up")}
        </div>
        {!sms.configured && (
          <p style={{ fontSize: 13, color: "#7A5210", margin: "0 0 12px" }}>
            Add a provider key (Termii or Africa&apos;s Talking) to <code>.env</code> and restart.
            You can still build the list now.
          </p>
        )}

        {/* list */}
        {recipients.length === 0 ? (
          <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: "0 0 14px" }}>
            No recipients yet. Add the people who should be alerted on every order.
          </p>
        ) : (
          <div style={{ marginBottom: 14 }}>
            {recipients.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between"
                style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14.5, fontWeight: 600, margin: 0, opacity: r.active ? 1 : 0.5 }}>
                    {r.name}
                  </p>
                  <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
                    {r.display || "No phone on file"}
                  </p>
                </div>
                <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                  <label className="check">
                    <input type="checkbox" checked={r.active} onChange={() => toggle(r)} /> Active
                  </label>
                  <button
                    onClick={() => remove(r)}
                    style={{ background: "none", border: "none", color: "var(--rose)", fontSize: 17.5 }}
                    aria-label={`Remove ${r.name}`}
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* add form */}
        <div className="grid gap-2" style={{ gridTemplateColumns: "1fr", maxWidth: 380 }}>
          <div className="field">
            <span className="icon">&#128100;</span>
            <input placeholder="Name / role" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <span className="icon">&#9742;</span>
            <input
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
            />
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ justifySelf: "start" }}
            onClick={add}
            disabled={busy}
          >
            {busy ? "Adding…" : "Add recipient"}
          </button>
        </div>
        {error && <p style={{ fontSize: 13.5, color: "var(--rose)", margin: "6px 0 0" }}>{error}</p>}
        {testMsg && <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "6px 0 0" }}>{testMsg}</p>}
      </div>
    </div>
  );
}
