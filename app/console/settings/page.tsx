"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "../../components/SiteHeader";
import { RepAuth } from "../../components/console/RepAuth";
import { ConsoleTabs } from "../../components/console/ConsoleTabs";
import { StaffSession } from "../../types";
import { apiGet, apiPost, apiPatch, apiDelete } from "../../lib/api";
import { Hero, DEFAULT_HERO } from "../../lib/heroDefaults";

const LIMITS = { eyebrow: 80, headline: 240, subtext: 400 };

export default function SettingsPage() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [hero, setHero] = useState<Hero>(DEFAULT_HERO);
  const [saved, setSaved] = useState<Hero>(DEFAULT_HERO);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    apiGet<StaffSession>("/api/staff/me")
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    apiGet<{ hero: Hero }>("/api/settings")
      .then((d) => {
        setHero(d.hero);
        setSaved(d.hero);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  const signOut = async () => {
    await apiPost("/api/staff/logout").catch(() => {});
    setSession(null);
  };

  const dirty =
    hero.eyebrow !== saved.eyebrow ||
    hero.headline !== saved.headline ||
    hero.subtext !== saved.subtext;

  const set = (k: keyof Hero) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setHero((h) => ({ ...h, [k]: e.target.value.slice(0, LIMITS[k]) }));
    setNote("");
  };

  const save = async () => {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const d = await apiPatch<{ hero: Hero }>("/api/admin/settings", hero);
      setHero(d.hero);
      setSaved(d.hero);
      setNote("Saved — the storefront now shows this.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    setError("");
    setNote("");
    try {
      const d = await apiDelete<{ hero: Hero }>("/api/admin/settings");
      setHero(d.hero);
      setSaved(d.hero);
      setNote("Reset to the default conference copy.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!authChecked) {
    return (
      <div>
        <SiteHeader />
        <p style={{ padding: "32px var(--gutter)", color: "var(--ink-soft)" }}>Loading…</p>
      </div>
    );
  }
  if (!session) {
    return (
      <div>
        <SiteHeader />
        <RepAuth onSignedIn={setSession} />
      </div>
    );
  }

  const field = (
    label: string,
    k: keyof Hero,
    multiline: boolean,
    help: string
  ) => (
    <div style={{ marginBottom: 18 }}>
      <div className="flex items-baseline justify-between">
        <label className="small-caps" style={{ color: "var(--ink-soft)" }}>
          {label}
        </label>
        <span style={{ fontSize: 12.5, color: "var(--ink-soft)", fontVariantNumeric: "tabular-nums" }}>
          {hero[k].length}/{LIMITS[k]}
        </span>
      </div>
      {multiline ? (
        <textarea
          className="field"
          rows={3}
          value={hero[k]}
          onChange={set(k)}
          style={{ width: "100%", marginTop: 5, resize: "vertical", lineHeight: 1.5 }}
        />
      ) : (
        <input
          className="field"
          value={hero[k]}
          onChange={set(k)}
          style={{ width: "100%", marginTop: 5 }}
        />
      )}
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "5px 0 0" }}>{help}</p>
    </div>
  );

  return (
    <div>
      <SiteHeader onStaffSignout={signOut} />
      <ConsoleTabs active="settings" />

      <div style={{ padding: "32px var(--gutter)", maxWidth: 760 }}>
        <p className="serif" style={{ fontWeight: 700, fontSize: 23.5, margin: "0 0 4px" }}>
          Storefront hero
        </p>
        <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 22px", lineHeight: 1.5 }}>
          The navy banner customers see first on the catalogue page. Edit it for the current
          conference, then save — changes go live immediately.
        </p>

        {error && (
          <div className="card" style={{ padding: "12px 16px", marginBottom: 16, color: "var(--rose)" }}>
            {error}
          </div>
        )}
        {note && (
          <div
            className="card"
            style={{ padding: "12px 16px", marginBottom: 16, color: "var(--sage)", borderLeft: "2px solid var(--sage)" }}
          >
            {note}
          </div>
        )}

        {loading ? (
          <p style={{ color: "var(--ink-soft)" }}>Loading…</p>
        ) : (
          <>
            {/* live preview */}
            <p className="small-caps" style={{ color: "var(--ink-soft)", margin: "0 0 8px" }}>
              Preview
            </p>
            <div
              style={{
                background: "var(--navy)",
                color: "#fff",
                padding: "30px 26px 34px",
                marginBottom: 24,
              }}
            >
              <p
                className="small-caps"
                style={{ color: "var(--gold-light)", margin: "0 0 12px", fontSize: 14.5 }}
              >
                {hero.eyebrow || "—"}
              </p>
              <p
                className="serif"
                style={{
                  fontSize: "clamp(25.5px, 5vw, 31.5px)",
                  fontWeight: 600,
                  margin: "0 0 10px",
                  maxWidth: 620,
                  textWrap: "balance",
                  lineHeight: 1.2,
                }}
              >
                {hero.headline || "—"}
              </p>
              <p
                style={{
                  fontSize: 18,
                  color: "rgba(255,255,255,0.78)",
                  maxWidth: 560,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {hero.subtext || "—"}
              </p>
            </div>

            {field("Eyebrow", "eyebrow", false, "Small gold line above the headline — the conference tag.")}
            {field("Headline", "headline", true, "The big serif line. Keep it short enough to read at a glance.")}
            {field("Sub-text", "subtext", true, "One or two sentences — the venue, and how ordering works.")}

            <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 4 }}>
              <button className="btn btn-primary" onClick={save} disabled={busy || !dirty}>
                {busy ? "Saving…" : "Save"}
              </button>
              <button className="btn btn-outline" onClick={reset} disabled={busy}>
                Reset to default
              </button>
              {dirty && !busy && (
                <span style={{ fontSize: 13.5, color: "var(--gold)" }}>Unsaved changes</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
