"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "../../components/SiteHeader";
import { RepAuth } from "../../components/console/RepAuth";
import { ConsoleTabs } from "../../components/console/ConsoleTabs";
import { StaffSession } from "../../types";
import { apiGet, apiPost, apiPatch, apiDelete } from "../../lib/api";
import { Hero, DEFAULT_HERO } from "../../lib/heroDefaults";
import { displayPhone } from "../../lib/phone";
import { BankPicker } from "../../components/console/BankPicker";

const HERO_LIMITS = { eyebrow: 80, headline: 240, subtext: 400 };

interface ContactForm {
  phone: string;
  email: string;
}
interface PaymentForm {
  bankName: string;
  accountNumber: string;
  accountName: string;
}
interface Staff {
  id: string;
  name: string;
  staffId: string;
  role: "rep" | "admin";
  active: boolean;
  createdAt: string;
}

const EMPTY_CONTACT: ContactForm = { phone: "", email: "" };
const EMPTY_PAYMENT: PaymentForm = { bankName: "", accountNumber: "", accountName: "" };

export default function SettingsPage() {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // hero
  const [hero, setHero] = useState<Hero>(DEFAULT_HERO);
  const [heroSaved, setHeroSaved] = useState<Hero>(DEFAULT_HERO);
  const [heroBusy, setHeroBusy] = useState(false);
  const [heroError, setHeroError] = useState("");
  const [heroNote, setHeroNote] = useState("");

  // contact
  const [contact, setContact] = useState<ContactForm>(EMPTY_CONTACT);
  const [contactSaved, setContactSaved] = useState<ContactForm>(EMPTY_CONTACT);
  const [contactBusy, setContactBusy] = useState(false);
  const [contactError, setContactError] = useState("");
  const [contactNote, setContactNote] = useState("");

  // payment
  const [payment, setPayment] = useState<PaymentForm>(EMPTY_PAYMENT);
  const [paymentSaved, setPaymentSaved] = useState<PaymentForm>(EMPTY_PAYMENT);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const [loading, setLoading] = useState(true);

  // staff
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [staffError, setStaffError] = useState("");
  const [addForm, setAddForm] = useState({ name: "", staffId: "", passcode: "", role: "rep" as "rep" | "admin" });
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState("");
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  useEffect(() => {
    apiGet<StaffSession>("/api/staff/me")
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setAuthChecked(true));
  }, []);

  const isAdmin = session?.role === "admin";

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    apiGet<{ hero: Hero; contact: { phone: string; email: string }; payment: PaymentForm }>("/api/settings")
      .then((d) => {
        setHero(d.hero);
        setHeroSaved(d.hero);
        const c = { phone: d.contact.phone ? displayPhone(d.contact.phone) : "", email: d.contact.email };
        setContact(c);
        setContactSaved(c);
        setPayment(d.payment);
        setPaymentSaved(d.payment);
      })
      .catch((e) => setHeroError(e.message))
      .finally(() => setLoading(false));
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const loadStaff = () =>
    apiGet<{ staff: Staff[] }>("/api/admin/staff")
      .then((d) => setStaff(d.staff))
      .catch((e) => setStaffError(e.message));

  const signOut = async () => {
    await apiPost("/api/staff/logout").catch(() => {});
    setSession(null);
  };

  // ---- hero ----
  const heroDirty =
    hero.eyebrow !== heroSaved.eyebrow ||
    hero.headline !== heroSaved.headline ||
    hero.subtext !== heroSaved.subtext;

  const setHeroField = (k: keyof Hero) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setHero((h) => ({ ...h, [k]: e.target.value.slice(0, HERO_LIMITS[k]) }));
    setHeroNote("");
  };

  const saveHero = async () => {
    setHeroBusy(true);
    setHeroError("");
    setHeroNote("");
    try {
      const d = await apiPatch<{ hero: Hero }>("/api/admin/settings", hero);
      setHero(d.hero);
      setHeroSaved(d.hero);
      setHeroNote("Saved — the storefront now shows this.");
    } catch (e: any) {
      setHeroError(e.message);
    } finally {
      setHeroBusy(false);
    }
  };

  const resetHero = async () => {
    setHeroBusy(true);
    setHeroError("");
    setHeroNote("");
    try {
      const d = await apiDelete<{ hero: Hero }>("/api/admin/settings");
      setHero(d.hero);
      setHeroSaved(d.hero);
      setHeroNote("Reset to the default conference copy.");
    } catch (e: any) {
      setHeroError(e.message);
    } finally {
      setHeroBusy(false);
    }
  };

  // ---- contact ----
  const contactDirty = contact.phone !== contactSaved.phone || contact.email !== contactSaved.email;

  const saveContact = async () => {
    setContactBusy(true);
    setContactError("");
    setContactNote("");
    try {
      const d = await apiPatch<{ contact: { phone: string; email: string } }>("/api/admin/settings", contact);
      const c = { phone: d.contact.phone ? displayPhone(d.contact.phone) : "", email: d.contact.email };
      setContact(c);
      setContactSaved(c);
      setContactNote("Saved — customers will see this.");
    } catch (e: any) {
      setContactError(e.message);
    } finally {
      setContactBusy(false);
    }
  };

  // ---- payment ----
  const paymentDirty =
    payment.bankName !== paymentSaved.bankName ||
    payment.accountNumber !== paymentSaved.accountNumber ||
    payment.accountName !== paymentSaved.accountName;

  const savePayment = async () => {
    setPaymentBusy(true);
    setPaymentError("");
    setPaymentNote("");
    try {
      const d = await apiPatch<{ payment: PaymentForm }>("/api/admin/settings", payment);
      setPayment(d.payment);
      setPaymentSaved(d.payment);
      setPaymentNote("Saved — shown at checkout for bank transfer.");
    } catch (e: any) {
      setPaymentError(e.message);
    } finally {
      setPaymentBusy(false);
    }
  };

  // ---- staff ----
  const addStaff = async () => {
    setAddBusy(true);
    setAddError("");
    try {
      await apiPost("/api/admin/staff", addForm);
      setAddForm({ name: "", staffId: "", passcode: "", role: "rep" });
      loadStaff();
    } catch (e: any) {
      setAddError(e.message);
    } finally {
      setAddBusy(false);
    }
  };

  const toggleActive = async (s: Staff) => {
    setRowBusy(s.id);
    setStaffError("");
    try {
      await apiPatch(`/api/admin/staff/${s.id}`, { active: !s.active });
      loadStaff();
    } catch (e: any) {
      setStaffError(e.message);
    } finally {
      setRowBusy(null);
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
  if (!isAdmin) {
    return (
      <div>
        <SiteHeader onStaffSignout={signOut} />
        <ConsoleTabs active="settings" role={session.role} />
        <div style={{ padding: "60px var(--gutter)", textAlign: "center" }}>
          <p className="serif" style={{ fontWeight: 700, fontSize: 21.5, margin: "0 0 8px" }}>
            Admins only
          </p>
          <p style={{ fontSize: 15, color: "var(--ink-soft)" }}>
            Settings — hero copy, contact info, payment details, and staff accounts — can only be
            changed by an admin. Ask an admin on your team if something needs updating.
          </p>
        </div>
      </div>
    );
  }

  const heroField = (label: string, k: keyof Hero, multiline: boolean, help: string) => (
    <div style={{ marginBottom: 18 }}>
      <div className="flex items-baseline justify-between">
        <label className="small-caps" style={{ color: "var(--ink-soft)" }}>
          {label}
        </label>
        <span style={{ fontSize: 12.5, color: "var(--ink-soft)", fontVariantNumeric: "tabular-nums" }}>
          {hero[k].length}/{HERO_LIMITS[k]}
        </span>
      </div>
      {multiline ? (
        <textarea
          className="field"
          rows={3}
          value={hero[k]}
          onChange={setHeroField(k)}
          style={{ width: "100%", marginTop: 5, resize: "vertical", lineHeight: 1.5 }}
        />
      ) : (
        <input
          className="field"
          value={hero[k]}
          onChange={setHeroField(k)}
          style={{ width: "100%", marginTop: 5 }}
        />
      )}
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "5px 0 0" }}>{help}</p>
    </div>
  );

  return (
    <div>
      <SiteHeader onStaffSignout={signOut} />
      <ConsoleTabs active="settings" role={session.role} />

      <div style={{ padding: "32px var(--gutter) 60px", maxWidth: 760, display: "flex", flexDirection: "column", gap: 36 }}>
        {/* ───────── hero ───────── */}
        <section>
          <p className="serif" style={{ fontWeight: 700, fontSize: 23.5, margin: "0 0 4px" }}>
            Storefront hero
          </p>
          <p style={{ fontSize: 15, color: "var(--ink-soft)", margin: "0 0 22px", lineHeight: 1.5 }}>
            The navy banner customers see first on the catalogue page. Edit it for the current
            conference, then save — changes go live immediately.
          </p>

          {heroError && (
            <div className="card" style={{ padding: "12px 16px", marginBottom: 16, color: "var(--rose)" }}>
              {heroError}
            </div>
          )}
          {heroNote && (
            <div
              className="card"
              style={{ padding: "12px 16px", marginBottom: 16, color: "var(--sage)", borderLeft: "2px solid var(--sage)" }}
            >
              {heroNote}
            </div>
          )}

          {loading ? (
            <p style={{ color: "var(--ink-soft)" }}>Loading…</p>
          ) : (
            <>
              <p className="small-caps" style={{ color: "var(--ink-soft)", margin: "0 0 8px" }}>
                Preview
              </p>
              <div style={{ background: "var(--navy)", color: "#fff", padding: "30px 26px 34px", marginBottom: 24 }}>
                <p className="small-caps" style={{ color: "var(--gold-light)", margin: "0 0 12px", fontSize: 14.5 }}>
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
                <p style={{ fontSize: 18, color: "rgba(255,255,255,0.78)", maxWidth: 560, margin: 0, lineHeight: 1.5 }}>
                  {hero.subtext || "—"}
                </p>
              </div>

              {heroField("Eyebrow", "eyebrow", false, "Small gold line above the headline — the conference tag.")}
              {heroField("Headline", "headline", true, "The big serif line. Keep it short enough to read at a glance.")}
              {heroField("Sub-text", "subtext", true, "One or two sentences — the venue, and how ordering works.")}

              <div className="flex items-center gap-2 flex-wrap">
                <button className="btn btn-primary" onClick={saveHero} disabled={heroBusy || !heroDirty}>
                  {heroBusy ? "Saving…" : "Save"}
                </button>
                <button className="btn btn-outline" onClick={resetHero} disabled={heroBusy}>
                  Reset to default
                </button>
                {heroDirty && !heroBusy && <span style={{ fontSize: 13.5, color: "var(--gold)" }}>Unsaved changes</span>}
              </div>
            </>
          )}
        </section>

        {/* ───────── contact ───────── */}
        <section className="card" style={{ padding: "22px 24px" }}>
          <p className="serif" style={{ fontWeight: 700, fontSize: 19.5, margin: "0 0 4px" }}>
            Contact information
          </p>
          <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "0 0 18px", lineHeight: 1.5 }}>
            Shown to customers on the storefront so they can reach you directly.
          </p>

          {contactError && <p style={{ fontSize: 14, color: "var(--rose)", margin: "0 0 12px" }}>{contactError}</p>}
          {contactNote && <p style={{ fontSize: 14, color: "var(--sage)", margin: "0 0 12px" }}>{contactNote}</p>}

          <div className="flex flex-col gap-2" style={{ marginBottom: 14 }}>
            <div className="field">
              <span className="icon">&#9742;</span>
              <input
                placeholder="Contact phone (e.g. 0803 221 9087)"
                value={contact.phone}
                onChange={(e) => {
                  setContact((c) => ({ ...c, phone: e.target.value }));
                  setContactNote("");
                }}
              />
            </div>
            <div className="field">
              <span className="icon">&#9993;</span>
              <input
                placeholder="Contact email"
                value={contact.email}
                onChange={(e) => {
                  setContact((c) => ({ ...c, email: e.target.value }));
                  setContactNote("");
                }}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={saveContact} disabled={contactBusy || !contactDirty}>
            {contactBusy ? "Saving…" : "Save contact info"}
          </button>
        </section>

        {/* ───────── payment ───────── */}
        <section className="card" style={{ padding: "22px 24px" }}>
          <p className="serif" style={{ fontWeight: 700, fontSize: 19.5, margin: "0 0 4px" }}>
            Payment details
          </p>
          <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: "0 0 18px", lineHeight: 1.5 }}>
            Shown to customers who choose &quot;Bank transfer&quot; at checkout.
          </p>

          {paymentError && <p style={{ fontSize: 14, color: "var(--rose)", margin: "0 0 12px" }}>{paymentError}</p>}
          {paymentNote && <p style={{ fontSize: 14, color: "var(--sage)", margin: "0 0 12px" }}>{paymentNote}</p>}

          <div className="flex flex-col gap-2" style={{ marginBottom: 14 }}>
            <BankPicker
              value={payment.bankName}
              onChange={(name) => {
                setPayment((p) => ({ ...p, bankName: name }));
                setPaymentNote("");
              }}
            />
            <div className="field">
              <span className="icon">&#128179;</span>
              <input
                placeholder="Account number"
                value={payment.accountNumber}
                onChange={(e) => {
                  setPayment((p) => ({ ...p, accountNumber: e.target.value.replace(/[^0-9]/g, "") }));
                  setPaymentNote("");
                }}
              />
            </div>
            <div className="field">
              <span className="icon">&#128100;</span>
              <input
                placeholder="Account name"
                value={payment.accountName}
                onChange={(e) => {
                  setPayment((p) => ({ ...p, accountName: e.target.value }));
                  setPaymentNote("");
                }}
              />
            </div>
          </div>
          <button className="btn btn-primary" onClick={savePayment} disabled={paymentBusy || !paymentDirty}>
            {paymentBusy ? "Saving…" : "Save payment details"}
          </button>
        </section>

        {/* ───────── staff ───────── */}
        <section className="card">
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--line)" }}>
            <p className="serif" style={{ fontWeight: 700, fontSize: 19.5, margin: "0 0 4px" }}>
              Staff accounts
            </p>
            <p style={{ fontSize: 14.5, color: "var(--ink-soft)", margin: 0, lineHeight: 1.5 }}>
              Add the reps who sign in to this console. Deactivate an account to lock someone out
              without deleting their history.
            </p>
          </div>

          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--line)" }}>
            {staffError && <p style={{ fontSize: 14, color: "var(--rose)", margin: "0 0 10px" }}>{staffError}</p>}
            {!staff ? (
              <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>Loading…</p>
            ) : (
              staff.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between flex-wrap gap-2"
                  style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}
                >
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</span>{" "}
                    <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                      @{s.staffId} · {s.role}
                      {s.id === session.id ? " · you" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`pill ${s.active ? "" : ""}`} style={{ background: s.active ? "var(--sage-bg)" : "var(--rose-bg)", color: s.active ? "var(--sage)" : "var(--rose)" }}>
                      {s.active ? "Active" : "Deactivated"}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={rowBusy === s.id || s.id === session.id}
                      onClick={() => toggleActive(s)}
                    >
                      {rowBusy === s.id ? "…" : s.active ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: "18px 24px" }}>
            <p className="small-caps" style={{ color: "var(--ink-soft)", margin: "0 0 10px" }}>
              Add a staff account
            </p>
            {addError && <p style={{ fontSize: 14, color: "var(--rose)", margin: "0 0 10px" }}>{addError}</p>}
            <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 10 }}>
              <div className="field">
                <input
                  placeholder="Full name"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="field">
                <input
                  placeholder="Staff ID (used to sign in)"
                  value={addForm.staffId}
                  onChange={(e) => setAddForm((f) => ({ ...f, staffId: e.target.value.toLowerCase() }))}
                />
              </div>
              <div className="field">
                <input
                  type="password"
                  placeholder="Passcode"
                  value={addForm.passcode}
                  onChange={(e) => setAddForm((f) => ({ ...f, passcode: e.target.value }))}
                />
              </div>
              <div className="field">
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as "rep" | "admin" }))}
                >
                  <option value="rep">Rep</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button
              className="btn btn-primary"
              disabled={addBusy || !addForm.name || !addForm.staffId || !addForm.passcode}
              onClick={addStaff}
            >
              {addBusy ? "Adding…" : "+ Add staff account"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
