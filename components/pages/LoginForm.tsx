"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState<"email" | "phone">("email");
  const [form, setForm] = useState({
    email: "",
    phone_number: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload =
      identifier === "email"
        ? { email: form.email, password: form.password }
        : { phone_number: form.phone_number, password: form.password };

    try {
      const res = await fetch("/api/authentication/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        // Cookie — readable by middleware on the server
        document.cookie = `pharmt_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Strict`;
        router.push("/");
      }
      if (!res.ok) {
        setError(data.error || data.message || "Login failed.");
        return;
      }

      // // Store token (adjust to cookie or context as needed)
      // localStorage.setItem("pharmt_token", data.token);
      // router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-mark">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="#0F6E56" />
              <path
                d="M11 18h14M18 11v14"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="auth-title">PharmTracker</h1>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {/* Identifier toggle */}
        <div className="toggle-group" role="group" aria-label="Login method">
          <button
            type="button"
            className={`toggle-btn ${identifier === "email" ? "active" : ""}`}
            onClick={() => setIdentifier("email")}
          >
            Email
          </button>
          <button
            type="button"
            className={`toggle-btn ${identifier === "phone" ? "active" : ""}`}
            onClick={() => setIdentifier("phone")}
          >
            Phone
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {identifier === "email" ? (
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          ) : (
            <div className="field">
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+234 800 000 0000"
                value={form.phone_number}
                onChange={(e) =>
                  setForm({ ...form, phone_number: e.target.value })
                }
                required
              />
            </div>
          )}

          <div className="field">
            <div className="field-row">
              <label htmlFor="password">Password</label>
              <Link href="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>
            <div className="input-reveal">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="reveal-btn"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? <span className="spinner" aria-hidden="true" /> : null}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{" "}
          <Link href="/register" className="auth-link">
            Create one
          </Link>
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
          font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
        }
        .auth-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8e5;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 2px 16px rgba(15, 110, 86, 0.06);
        }
        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .brand-mark {
          display: inline-flex;
          margin-bottom: 0.75rem;
        }
        .auth-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #0d1f18;
          margin: 0 0 0.25rem;
          letter-spacing: -0.02em;
        }
        .auth-subtitle {
          font-size: 0.9rem;
          color: #6b7e76;
          margin: 0;
        }
        .toggle-group {
          display: flex;
          background: #f0f4f2;
          border-radius: 10px;
          padding: 4px;
          margin-bottom: 1.5rem;
        }
        .toggle-btn {
          flex: 1;
          padding: 0.5rem;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7e76;
          cursor: pointer;
          transition: all 0.15s;
        }
        .toggle-btn.active {
          background: #fff;
          color: #0f6e56;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }
        .field {
          margin-bottom: 1.25rem;
        }
        .field label {
          display: block;
          font-size: 0.85rem;
          font-weight: 500;
          color: #3d5047;
          margin-bottom: 0.4rem;
        }
        .field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.4rem;
        }
        .field-row label {
          margin-bottom: 0;
        }
        .forgot-link {
          font-size: 0.8rem;
          color: #0f6e56;
          text-decoration: none;
          font-weight: 500;
        }
        .forgot-link:hover {
          text-decoration: underline;
        }
        input[type="email"],
        input[type="tel"],
        input[type="text"],
        input[type="password"] {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #d4ddd9;
          border-radius: 10px;
          font-size: 0.9rem;
          color: #0d1f18;
          background: #fff;
          outline: none;
          box-sizing: border-box;
          transition:
            border-color 0.15s,
            box-shadow 0.15s;
        }
        input:focus {
          border-color: #0f6e56;
          box-shadow: 0 0 0 3px rgba(15, 110, 86, 0.12);
        }
        input::placeholder {
          color: #a5b5ae;
        }
        .input-reveal {
          position: relative;
        }
        .input-reveal input {
          padding-right: 2.75rem;
        }
        .reveal-btn {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #8aa09a;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }
        .reveal-btn:hover {
          color: #0f6e56;
        }
        .form-error {
          font-size: 0.85rem;
          color: #c0392b;
          background: #fdf2f2;
          border: 1px solid #f5c6c6;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          margin-bottom: 1rem;
        }
        .submit-btn {
          width: 100%;
          padding: 0.75rem;
          background: #0f6e56;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition:
            background 0.15s,
            transform 0.1s;
          margin-top: 0.25rem;
        }
        .submit-btn:hover:not(:disabled) {
          background: #0d5e49;
        }
        .submit-btn:active:not(:disabled) {
          transform: scale(0.99);
        }
        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .auth-footer {
          text-align: center;
          margin: 1.5rem 0 0;
          font-size: 0.875rem;
          color: #6b7e76;
        }
        .auth-link {
          color: #0f6e56;
          font-weight: 600;
          text-decoration: none;
        }
        .auth-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
