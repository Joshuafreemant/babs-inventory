"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "admin" | "pharmacist" | "staff";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
    role: "staff" as Role,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validate = (): string => {
    if (!form.firstname.trim()) return "First name is required.";
    if (!form.lastname.trim()) return "Last name is required.";
    if (!form.email.trim()) return "Email address is required.";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email address.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/authentication/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: form.firstname.trim(),
          lastname: form.lastname.trim(),
          email: form.email.trim().toLowerCase(),
          phone_number: form.phone_number.trim(),
          password: form.password,
          role: form.role,
          status: "pending",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      setSuccess("Account created! Redirecting to login…");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Join PharmTracker today</p>
        </div>

        {success && (
          <div className="form-success" role="status">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-row-2">
            <div className="field">
              <label htmlFor="firstname">First name</label>
              <input id="firstname" type="text" placeholder="Ada" value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="lastname">Last name</label>
              <input id="lastname" type="text" placeholder="Okafor" value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" type="email" autoComplete="email" placeholder="you@hospital.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div className="field">
            <label htmlFor="phone">
              Phone number <span className="optional">(optional)</span>
            </label>
            <input id="phone" type="tel" autoComplete="tel" placeholder="+234 800 000 0000" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
          </div>

          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="staff">Staff</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-reveal">
              <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              <button type="button" className="reveal-btn" aria-label="Toggle password visibility" onClick={() => setShowPassword(!showPassword)}>
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
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="input-reveal">
              <input id="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Re-enter password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
              {form.confirmPassword && (
                <span className="match-icon" aria-label={form.password === form.confirmPassword ? "Passwords match" : "Passwords do not match"}>
                  {form.password === form.confirmPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0f6e56" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  )}
                </span>
              )}
            </div>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <button type="submit" className="submit-btn" disabled={loading || !!success}>
            {loading ? <span className="spinner" aria-hidden="true" /> : null}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <Link href="/login" className="auth-link">Sign in</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-wrapper {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f7f6;
          padding: 2rem 1rem;
          font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif;
        }
        .auth-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8e5;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 2px 16px rgba(15, 110, 86, 0.06);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .brand-mark { display: inline-flex; margin-bottom: 0.75rem; }
        .auth-title { font-size: 1.5rem; font-weight: 700; color: #0d1f18; margin: 0 0 0.25rem; letter-spacing: -0.02em; }
        .auth-subtitle { font-size: 0.9rem; color: #6b7e76; margin: 0; }
        .field-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .field { margin-bottom: 1.125rem; }
        .field label { display: block; font-size: 0.85rem; font-weight: 500; color: #3d5047; margin-bottom: 0.4rem; }
        .optional { font-weight: 400; color: #8aa09a; font-size: 0.8rem; }
        input[type="email"], input[type="tel"], input[type="text"], input[type="password"], select {
          width: 100%; padding: 0.625rem 0.875rem; border: 1px solid #d4ddd9;
          border-radius: 10px; font-size: 0.9rem; color: #0d1f18; background: #fff;
          outline: none; box-sizing: border-box; transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit; appearance: none;
        }
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238aa09a' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.875rem center; padding-right: 2.25rem; cursor: pointer; }
        input:focus, select:focus { border-color: #0f6e56; box-shadow: 0 0 0 3px rgba(15, 110, 86, 0.12); }
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
        .form-error { font-size: 0.85rem; color: #c0392b; background: #fdf2f2; border: 1px solid #f5c6c6; border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 1rem; }
        .form-success { font-size: 0.875rem; color: #0f6e56; background: #e8f5f0; border: 1px solid #9fe1cb; border-radius: 8px; padding: 0.5rem 0.75rem; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
        .submit-btn { width: 100%; padding: 0.75rem; background: #0f6e56; color: #fff; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.15s, transform 0.1s; margin-top: 0.25rem; }
        .submit-btn:hover:not(:disabled) { background: #0d5e49; }
        .submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .auth-footer { text-align: center; margin: 1.5rem 0 0; font-size: 0.875rem; color: #6b7e76; }
        .auth-link { color: #0f6e56; font-weight: 600; text-decoration: none; }
        .auth-link:hover { text-decoration: underline; }
        @media (max-width: 480px) { .field-row-2 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}