"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HackathonLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/pl-ac/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Incorrect password");
        setLoading(false);
        return;
      }
      router.push("/pl-ac/hackathon");
      router.refresh();
    } catch {
      setError("No connection — try again.");
      setLoading(false);
    }
  };

  return (
    <div className="hkl">
      <style>{css}</style>
      <div className="hkl-panel">
        <div className="hkl-brand">
          <span className="hkl-dot" /> Pearl AI Labs
        </div>
        <h1 className="hkl-title">Hackathon desk</h1>
        <p className="hkl-sub">Registrations, payments and sign-ups for the STEM Innovation Hackathon.</p>
        <form onSubmit={submit}>
          <label className="hkl-label" htmlFor="hkl-pw">
            Password
          </label>
          <input
            id="hkl-pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            autoComplete="current-password"
            className="hkl-input"
          />
          {error && <p className="hkl-error">{error}</p>}
          <button type="submit" disabled={loading || !password} className="hkl-btn">
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

const css = `
.hkl { min-height: 100vh; display: grid; place-items: center; padding: 24px 16px;
  background: radial-gradient(1200px 600px at 10% -10%, rgba(239,134,51,.18), transparent 60%),
              radial-gradient(900px 500px at 110% 110%, rgba(0,45,91,.22), transparent 60%), #F4FAFF;
  font-family: var(--font-body), system-ui, sans-serif; color: #111D23; }
.hkl-panel { width: 100%; max-width: 380px; background: #fff; border: 1px solid rgba(0,45,91,.1);
  border-radius: 20px; padding: 32px 28px; box-shadow: 0 24px 60px -24px rgba(0,45,91,.35); }
.hkl-brand { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700;
  letter-spacing: .14em; text-transform: uppercase; color: #4C616C; }
.hkl-dot { width: 8px; height: 8px; border-radius: 50%; background: #EF8633; }
.hkl-title { font-family: var(--font-heading), sans-serif; font-size: 30px; font-weight: 700;
  letter-spacing: -.02em; color: #002D5B; margin: 18px 0 6px; }
.hkl-sub { font-size: 14px; line-height: 1.6; color: #4C616C; margin: 0 0 24px; }
.hkl-label { display: block; font-size: 13px; font-weight: 600; color: #002D5B; margin-bottom: 6px; }
.hkl-input { width: 100%; box-sizing: border-box; font: inherit; font-size: 15px; padding: 12px 16px;
  border-radius: 999px; border: 1.5px solid rgba(0,45,91,.15); background: #F4FAFF; outline: none; }
.hkl-input:focus { border-color: #002D5B; }
.hkl-error { color: #c0392b; font-size: 13px; margin: 8px 0 0; }
.hkl-btn { width: 100%; margin-top: 16px; padding: 13px; border: none; border-radius: 999px;
  background: #002D5B; color: #fff; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; }
.hkl-btn:disabled { opacity: .55; cursor: default; }
`;
