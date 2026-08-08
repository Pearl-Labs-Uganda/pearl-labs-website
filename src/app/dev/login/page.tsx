"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DevLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/dev/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      setError("Incorrect password");
      setLoading(false);
      return;
    }

    router.push("/dev/registrations");
    router.refresh();
  };

  return (
    <div
      style={{
        maxWidth: 360,
        margin: "120px auto",
        padding: "0 24px",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: "#002D5B" }}>
        Dev Dashboard Login
      </h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          style={{
            width: "100%",
            padding: 12,
            fontSize: 14,
            border: "1px solid rgba(0,45,91,0.2)",
            borderRadius: 6,
            boxSizing: "border-box",
          }}
        />
        {error && <p style={{ color: "#C0392B", fontSize: 13, marginTop: 8 }}>{error}</p>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 12,
            background: "#002D5B",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Checking…" : "Log In"}
        </button>
      </form>
    </div>
  );
}
