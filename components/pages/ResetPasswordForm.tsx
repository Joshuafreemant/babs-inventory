//app/components/pages/ResetPasswordForm.tsx
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token") ?? "";

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very strong"][strength];
  const strengthColor = ["", "#e74c3c", "#e67e22", "#f1c40f", "#27ae60", "#0f6e56"][strength];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!resetToken) {
      setError("Reset token is missing. Please use the link from your email.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/authentication/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: form.password, resetToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Reset failed. The link may have expired.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="success-icon">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
              <circle cx="28" cy="28" r="28" fill="#e8f5f0" />
              <path d="M16 28l9 9 18-18" stroke="#0f6e56" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="auth-title">Password reset!</h2>
          <p className="auth-subtitle" style={{ marginTop: "0.5rem" }}>
            Your password has been updated successfully.<br />Redirecting you to sign in…
          </p>
          <div className="redirect-bar">
            <div className="redirect-fill" />
          </div>
          <Link href="/login" className="submit-btn" style={{ display: "inline-flex", marginTop: "1.5rem", textDecoration: "none" }}>
            Go to sign in
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
              <rect x="10" y="17" width="16" height="11" rx="2" stroke="#fff" strokeWidth="2" />
              <path d="M14 17v-3a4 4 0 0 1 8 0v3" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 className="auth-title">Set new password</h1>
          <p className="auth-subtitle">Choose a strong password for your account.</p>
        </div>

        {!resetToken && (
          <div className="form-error" role="alert" style={{ marginBottom: "1.25rem" }}>
            No reset token found. Please use the link from your email.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="password">New password</label>
            <div className="input-reveal">
              <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <button type="button" className="reveal-btn" aria-label="Toggle password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            {form.password && (
              <div className="strength-row">
                <div className="strength-bar">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className="strength-seg" style={{ background: i <= strength ? strengthColor : "#e2e8e5" }} />
                  ))}
                </div>
                <span className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</span>
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="confirm">Confirm new password</label>
            <div className="input-reveal">
              <input id="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
              {form.confirmPassword && (
                <span className="match-icon">
                  {form.password === form.confirmPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f6e56" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="requirements">
            {[
              { label: "At least 6 characters", met: form.password.length >= 6 },
              { label: "Contains a number", met: /[0-9]/.test(form.password) },
              { label: "Contains uppercase letter", met: /[A-Z]/.test(form.password) },
            ].map(({ label, met }) => (
              <div key={label} className={`req-item ${met ? "met" : ""}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  {met ? <polyline points="20 6 9 17 4 12" /> : <circle cx="12" cy="12" r="8" />}
                </svg>
                {label}
              </div>
            ))}
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading || !resetToken}>
            {loading ? <span className="spinner" aria-hidden="true" /> : null}
            {loading ? "Updating…" : "Update password"}
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
  .auth-title { font-size: 1.5rem; font-weight: 700; color: #0d1f18; margin: 0 0 0.25rem; letter-spacing: -0.02em; }
  .auth-subtitle { font-size: 0.9rem; color: #6b7e76; margin: 0; }
  .success-icon { display: flex; justify-content: center; margin-bottom: 1.25rem; }
  .field { margin-bottom: 1.125rem; }
  .field label { display: block; font-size: 0.85rem; font-weight: 500; color: #3d5047; margin-bottom: 0.4rem; }
  input[type="text"], input[type="password"] { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #d4ddd9; border-radius: 10px; font-size: 0.9rem; color: #0d1f18; background: #fff; outline: none; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s; font-family: inherit; }
  input:focus { border-color: #0f6e56; box-shadow: 0 0 0 3px rgba(15, 110, 86, 0.12); }
  input::placeholder { color: #a5b5ae; }
  .input-reveal { position: relative; }
  .input-reveal input { padding-right: 2.75rem; }
  .reveal-btn { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #8aa09a; cursor: pointer; display: flex; align-items: center; padding: 0; }
  .reveal-btn:hover { color: #0f6e56; }
  .match-icon { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); display: flex; align-items: center; pointer-events: none; }
  .strength-row { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.4rem; }
  .strength-bar { display: flex; gap: 3px; flex: 1; }
  .strength-seg { height: 4px; flex: 1; border-radius: 2px; transition: background 0.2s; }
  .strength-label { font-size: 0.75rem; font-weight: 500; min-width: 60px; text-align: right; }
  .requirements { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.25rem; padding: 0.75rem; background: #f5f7f6; border-radius: 10px; }
  .req-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: #8aa09a; transition: color 0.15s; }
  .req-item.met { color: #0f6e56; }
  .form-error { font-size: 0.85rem; color: #c0392b; background: #fdf2f2; border: 1px solid #f5c6c6; border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 1rem; }
  .submit-btn { width: 100%; padding: 0.75rem; background: #0f6e56; color: #fff; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.15s, transform 0.1s; }
  .submit-btn:hover:not(:disabled) { background: #0d5e49; }
  .submit-btn:active:not(:disabled) { transform: scale(0.99); }
  .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .redirect-bar { height: 3px; background: #e2e8e5; border-radius: 2px; margin-top: 1.5rem; overflow: hidden; }
  .redirect-fill { height: 100%; background: #0f6e56; border-radius: 2px; animation: fill 3s linear forwards; }
  @keyframes fill { from { width: 0% } to { width: 100% } }
  .back-link { display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-top: 1.5rem; font-size: 0.875rem; color: #6b7e76; text-decoration: none; font-weight: 500; }
  .back-link:hover { color: #0f6e56; }
`;