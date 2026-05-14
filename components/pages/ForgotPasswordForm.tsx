"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordForm() {
  const [identifier, setIdentifier] = useState<"email" | "phone">("email");
  const [form, setForm] = useState({ email: "", phone_number: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ maskedEmail: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload =
      identifier === "email"
        ? { email: form.email.trim().toLowerCase() }
        : { phone_number: form.phone_number.trim() };

    try {
      const res = await fetch("/api/authentication/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setResult({ maskedEmail: data.email });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="success-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#e8f5f0" />
              <path d="M8 24l10 10 22-22" stroke="#0f6e56" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="auth-title">Check your email</h2>
          <p className="auth-subtitle" style={{ marginBottom: "0.5rem" }}>
            We sent a reset link to
          </p>
          <p className="masked-email">{result.maskedEmail}</p>
          <p className="hint-text">
            The link expires in 1 hour. If you don't see it, check your spam folder.
          </p>
          <Link href="/login" className="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
            Back to sign in
          </Link>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="#0F6E56" />
              <path d="M11 18h14M18 11v14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="auth-title">Forgot password?</h1>
          <p className="auth-subtitle">Enter your account identifier and we'll send a reset link.</p>
        </div>

        <div className="toggle-group" role="group" aria-label="Lookup method">
          <button type="button" className={`toggle-btn ${identifier === "email" ? "active" : ""}`} onClick={() => setIdentifier("email")}>Email</button>
          <button type="button" className={`toggle-btn ${identifier === "phone" ? "active" : ""}`} onClick={() => setIdentifier("phone")}>Phone</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {identifier === "email" ? (
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="phone">Phone number</label>
              <input id="phone" type="tel" autoComplete="tel" placeholder="+234 800 000 0000" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} required />
            </div>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <span className="spinner" aria-hidden="true" /> : null}
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>

        <Link href="/login" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
          Back to sign in
        </Link>
      </div>
      <style jsx>{styles}</style>
    </div>
  );
}

const styles = `
  .auth-wrapper { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f7f6; padding: 2rem 1rem; font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif; }
  .auth-card { background: #fff; border-radius: 16px; border: 1px solid #e2e8e5; padding: 2.5rem 2rem; width: 100%; max-width: 420px; box-shadow: 0 2px 16px rgba(15, 110, 86, 0.06); }
  .auth-header { text-align: center; margin-bottom: 2rem; }
  .brand-mark { display: inline-flex; margin-bottom: 0.75rem; }
  .auth-title { font-size: 1.5rem; font-weight: 700; color: #0d1f18; margin: 0 0 0.25rem; letter-spacing: -0.02em; text-align: center; }
  .auth-subtitle { font-size: 0.9rem; color: #6b7e76; margin: 0; text-align: center; }
  .success-icon { display: flex; justify-content: center; margin-bottom: 1.25rem; }
  .masked-email { font-size: 1rem; font-weight: 600; color: #0f6e56; text-align: center; margin: 0 0 1rem; }
  .hint-text { font-size: 0.85rem; color: #8aa09a; text-align: center; line-height: 1.5; margin-bottom: 1.75rem; }
  .toggle-group { display: flex; background: #f0f4f2; border-radius: 10px; padding: 4px; margin-bottom: 1.5rem; }
  .toggle-btn { flex: 1; padding: 0.5rem; border: none; border-radius: 8px; background: transparent; font-size: 0.875rem; font-weight: 500; color: #6b7e76; cursor: pointer; transition: all 0.15s; }
  .toggle-btn.active { background: #fff; color: #0f6e56; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
  .field { margin-bottom: 1.25rem; }
  .field label { display: block; font-size: 0.85rem; font-weight: 500; color: #3d5047; margin-bottom: 0.4rem; }
  input[type="email"], input[type="tel"] { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #d4ddd9; border-radius: 10px; font-size: 0.9rem; color: #0d1f18; background: #fff; outline: none; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s; font-family: inherit; }
  input:focus { border-color: #0f6e56; box-shadow: 0 0 0 3px rgba(15, 110, 86, 0.12); }
  input::placeholder { color: #a5b5ae; }
  .form-error { font-size: 0.85rem; color: #c0392b; background: #fdf2f2; border: 1px solid #f5c6c6; border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 1rem; }
  .submit-btn { width: 100%; padding: 0.75rem; background: #0f6e56; color: #fff; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.15s, transform 0.1s; }
  .submit-btn:hover:not(:disabled) { background: #0d5e49; }
  .submit-btn:active:not(:disabled) { transform: scale(0.99); }
  .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .back-link { display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-top: 1.5rem; font-size: 0.875rem; color: #6b7e76; text-decoration: none; font-weight: 500; }
  .back-link:hover { color: #0f6e56; }
`;