"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { FEE_UGX, MERCHANT_CODE, formatUgx, isMomoTransactionId } from "@/lib/hackathon";

// Where a family adds their MoMo transaction ID after registering: on the "registered" screen
// and on their pay link (/hackathon/pay/<token>).
export default function HackathonMomoId({ token, learnerName }: { token: string; learnerName: string }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMomoTransactionId(value)) {
      setError("That doesn't look like a MoMo transaction ID — it's in the confirmation SMS from MTN.");
      return;
    }
    setError("");
    setState("saving");
    try {
      const res = await fetch("/api/hackathon-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, transactionId: value }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) setState("saved");
      else {
        setError(body.error ?? "We couldn't save it — please try again.");
        setState("idle");
      }
    } catch {
      setError("No connection — please try again.");
      setState("idle");
    }
  };

  if (state === "saved") {
    return (
      <div className="hm hm-saved">
        <style>{css}</style>
        <span className="hm-tick">
          <Check size={18} />
        </span>
        <p>
          Thank you. We&apos;ve got the transaction ID for {learnerName} and will confirm once we&apos;ve matched it to
          our MoMo statement.
        </p>
      </div>
    );
  }

  return (
    <form className="hm" onSubmit={save} noValidate>
      <style>{css}</style>
      <p className="hm-title">One more thing: your MoMo transaction ID</p>
      <p className="hm-text">
        It helps us match your {formatUgx(FEE_UGX)} payment to {learnerName}. You&apos;ll find it in the confirmation
        SMS from MTN after paying merchant code <strong>{MERCHANT_CODE}</strong>.
      </p>
      <div className="hm-row">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          inputMode="numeric"
          placeholder="Transaction ID"
          aria-label="MoMo transaction ID"
          className={`hm-input${error ? " has-error" : ""}`}
        />
        <button type="submit" className="hm-btn" disabled={state === "saving" || !value.trim()}>
          {state === "saving" ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="hm-error">{error}</p>}
      <p className="hm-later">Don&apos;t have it right now? No problem — the link in your email works any time.</p>
    </form>
  );
}

const css = `
.hm{ text-align:left; background:#FFF7EF; border:1px solid rgba(239,134,51,.35); border-radius:18px; padding:18px; display:flex; flex-direction:column; gap:10px; max-width:520px; margin:0 auto 24px; font-family:var(--font-body),system-ui,sans-serif; }
.hm *{ box-sizing:border-box; }
.hm-title{ margin:0; font-family:var(--font-heading),sans-serif; font-weight:700; font-size:18px; color:#002D5B; }
.hm-text,.hm-later{ margin:0; font-size:14px; line-height:1.6; color:#4C616C; }
.hm-later{ font-size:12.5px; }
.hm-row{ display:flex; gap:8px; }
.hm-input{ flex:1; min-width:0; font:inherit; font-size:15px; padding:11px 16px; border-radius:999px; border:1.5px solid rgba(0,45,91,.15); background:#fff; outline:none; }
.hm-input:focus{ border-color:#002D5B; }
.hm-input.has-error{ border-color:#c0392b; }
.hm-btn{ font:inherit; font-size:15px; font-weight:700; padding:11px 22px; border:none; border-radius:999px; background:#EF8633; color:#fff; cursor:pointer; }
.hm-btn:disabled{ opacity:.6; cursor:default; }
.hm-error{ margin:0; font-size:12.5px; font-weight:600; color:#c0392b; }
.hm-saved{ flex-direction:row; align-items:flex-start; background:#E6F4EC; border-color:rgba(30,127,79,.3); }
.hm-saved p{ margin:0; font-size:14px; line-height:1.6; color:#1E5A3A; }
.hm-tick{ width:28px; height:28px; flex-shrink:0; border-radius:50%; background:#1E7F4F; color:#fff; display:grid; place-items:center; }
`;
