"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import HackathonMomoId from "@/components/HackathonMomoId";
import {
  CHILD_AND_PAYMENT_KEYS,
  FEE_UGX,
  GENDERS,
  INTERESTS,
  MERCHANT_CODE,
  PAYMENT_METHODS,
  RELATIONSHIPS,
  STEPS,
  WEEKS,
  YES_NO,
  emptyFields,
  fieldErrors,
  firstStepWithErrors,
  formatUgx,
  leadPhoneReady,
  stepErrors,
  type HackathonFields,
  type Step,
} from "@/lib/hackathon";

const DRAFT_KEY = "pearlLabsHackathonDraft2";

const highlights = [
  {
    title: "Build",
    blurb: "A full week of hands-on building with drones, robotics, AI and coding, 3D printing and aerospace design, using real lab equipment.",
  },
  { title: "Pitch", blurb: "The week ends with a pitching day. Teams present what they built to a panel of judges." },
  { title: "Malaysia", blurb: "The winning teams get first priority to represent Uganda at the Technotion World Cup in Malaysia." },
];

type Errors = Partial<Record<keyof HackathonFields, string>>;
type Status = "idle" | "sending" | "sent";

const newSessionId = () => `hk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

export default function HackathonRegister() {
  const [form, setForm] = useState<HackathonFields>(emptyFields);
  const [step, setStep] = useState<Step>(0);
  const [sessionId, setSessionId] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState("");
  const [copied, setCopied] = useState(false);
  const [payToken, setPayToken] = useState<string | null>(null);
  const started = useRef(false);
  const stepsDone = useRef(new Set<number>());
  const restored = useRef(false);
  const honeypot = useRef<HTMLInputElement>(null);
  const formTop = useRef<HTMLDivElement>(null);

  // Restore an unfinished draft from this device.
  useEffect(() => {
    trackEvent("hackathon_view");
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      const draft = raw ? (JSON.parse(raw) as { form?: Partial<HackathonFields>; sessionId?: string; step?: Step }) : null;
      if (draft?.form) setForm({ ...emptyFields(), ...draft.form });
      if (draft?.step === 1 || draft?.step === 2) setStep(draft.step);
      setSessionId(draft?.sessionId || newSessionId());
    } catch {
      setSessionId(newSessionId());
    } finally {
      restored.current = true;
    }
  }, []);

  useEffect(() => {
    if (!restored.current || status === "sent") return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, sessionId, step }));
    } catch {}
  }, [form, sessionId, step, status]);

  // Never lose a family who started: once the parent's phone has 10 digits, everything typed so
  // far is saved on our side (and kept up to date), so staff can follow up if they stop.
  useEffect(() => {
    if (!restored.current || status !== "idle" || !sessionId || !leadPhoneReady(form.parentPhone)) return;
    const timer = setTimeout(() => {
      fetch("/api/hackathon-register/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sessionId, step, website: honeypot.current?.value ?? "" }),
        keepalive: true,
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [form, sessionId, step, status]);

  const set = <K extends keyof HackathonFields>(key: K, value: HackathonFields[K]) => {
    if (!started.current) {
      started.current = true;
      trackEvent("hackathon_started");
    }
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const scrollToForm = () => formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goTo = (next: Step) => {
    setStep(next);
    setSubmitError("");
    scrollToForm();
  };

  const next = () => {
    const found = stepErrors(step, form);
    setErrors(found);
    if (Object.keys(found).length) return;
    if (step < 2 && !stepsDone.current.has(step)) {
      stepsDone.current.add(step);
      trackEvent(step === 0 ? "hackathon_parent_done" : "hackathon_child_done");
    }
    goTo((step + 1) as Step);
  };

  const copyCode = () => {
    navigator.clipboard
      ?.writeText(MERCHANT_CODE)
      .then(() => {
        setCopied(true);
        trackEvent("hackathon_momo_copied");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 2) return next();
    const found = fieldErrors(form);
    setErrors(found);
    setSubmitError("");
    const bad = firstStepWithErrors(found);
    if (bad !== null) {
      if (bad !== step) goTo(bad);
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/hackathon-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sessionId, website: honeypot.current?.value ?? "" }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; payToken?: string | null };
      if (res.ok && body.ok) {
        setPayToken(body.payToken ?? null);
        trackEvent("hackathon_submitted");
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {}
        setStatus("sent");
        window.scrollTo({ top: 0 });
      } else {
        setSubmitError(body.error ?? "We couldn't send the registration — please try again.");
        setStatus("idle");
      }
    } catch {
      setSubmitError("No connection — check your internet and try again. Your answers are kept.");
      setStatus("idle");
    }
  };

  // Same parent, another child: keep the parent's details, start at the child step.
  const registerAnother = () => {
    const blank = emptyFields();
    setForm((f) => {
      const n = { ...f };
      for (const k of CHILD_AND_PAYMENT_KEYS) (n as Record<string, unknown>)[k] = blank[k];
      return n;
    });
    setSessionId(newSessionId());
    setPayToken(null);
    setErrors({});
    setStep(1);
    setStatus("idle");
  };

  if (status === "sent") {
    return (
      <div className="hr">
        <style>{css}</style>
        <div className="hr-wrap hr-done">
          <div className="hr-done-icon">
            <Check size={30} />
          </div>
          <h1 className="hr-h2">You&apos;re registered</h1>
          <p className="hr-lead">
            {form.learnerName} is registered for the STEM Innovation Hackathon ({WEEKS[form.week as keyof typeof WEEKS]}).{" "}
            {form.paymentMethod === "Cash"
              ? `Please bring ${formatUgx(FEE_UGX)} in cash to Pearl AI Labs before the hackathon starts.`
              : form.transactionId
                ? "We'll confirm your MoMo payment once we've checked it."
                : "Thank you for paying by MoMo."}{" "}
            We&apos;ve sent the details to {form.parentEmail}.
          </p>
          {form.paymentMethod === "MTN MoMo" && !form.transactionId && payToken && (
            <HackathonMomoId token={payToken} learnerName={form.learnerName.split(/\s+/)[0]} />
          )}
          <div className="hr-actions hr-actions-center">
            <button type="button" onClick={registerAnother} className="hr-btn hr-btn-primary">
              Register another child
            </button>
            <Link href="/" className="hr-btn hr-btn-ghost">
              Back to Pearl AI Labs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const err = (key: keyof HackathonFields) => (errors[key] ? <span className="hr-error">{errors[key]}</span> : null);

  const field = (
    key: keyof HackathonFields,
    label: string,
    opts: { type?: string; placeholder?: string; inputMode?: "numeric" | "tel" | "email"; autoComplete?: string } = {},
  ) => (
    <label className="hr-field">
      <span className="hr-label">{label}</span>
      <input
        type={opts.type ?? "text"}
        inputMode={opts.inputMode}
        autoComplete={opts.autoComplete}
        value={form[key] as string}
        placeholder={opts.placeholder}
        onChange={(e) => set(key, e.target.value as never)}
        className={`hr-input${errors[key] ? " has-error" : ""}`}
      />
      {err(key)}
    </label>
  );

  const choice = (
    key: keyof HackathonFields,
    label: string,
    options: readonly (readonly [string, string])[],
    hint?: string,
    onPick?: (v: string) => void,
  ) => (
    <div className="hr-field">
      <span className="hr-label">{label}</span>
      {hint && <span className="hr-hint">{hint}</span>}
      <div className="hr-chips" role="radiogroup" aria-label={label}>
        {options.map(([value, text]) => (
          <button
            type="button"
            role="radio"
            aria-checked={form[key] === value}
            key={value}
            onClick={() => (onPick ? onPick(value) : set(key, value as never))}
            className={`hr-chip${form[key] === value ? " is-on" : ""}`}
          >
            {text}
          </button>
        ))}
      </div>
      {err(key)}
    </div>
  );

  const pairs = (list: readonly string[]) => list.map((v) => [v, v] as const);

  return (
    <div className="hr">
      <style>{css}</style>
      <section className="hr-wrap">
        <Link href="/" className="hr-back">
          ← Pearl AI Labs
        </Link>
        <p className="hr-eyebrow">Opportunities · Hackathon</p>
        <h1 className="hr-h1">
          STEM Innovation <em>Hackathon</em>
        </h1>
        <p className="hr-lead">
          A one-week hackathon for school learners at the National ICT Innovation Hub, Nakawa, run by Pearl AI Labs and
          AeRoCAD Learners in December 2026. Learners build real projects in teams and pitch them on the final day.
        </p>
        <div className="hr-facts">
          <div>
            <span>When</span>
            <strong>7–12 or 14–19 Dec</strong>
          </div>
          <div>
            <span>Where</span>
            <strong>ICT Hub, Nakawa</strong>
          </div>
          <div>
            <span>Fee</span>
            <strong>{formatUgx(FEE_UGX)}</strong>
          </div>
        </div>
        <div className="hr-cards">
          {highlights.map((h) => (
            <div key={h.title} className="hr-card">
              <h3>{h.title}</h3>
              <p>{h.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <div ref={formTop} className="hr-anchor" />
      <form onSubmit={submit} noValidate className="hr-wrap hr-form">
        <h2 className="hr-h2">Register</h2>
        <input
          ref={honeypot}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: -9999, width: 1, height: 1 }}
        />

        <ol className="hr-steps" aria-label="Registration steps">
          {STEPS.map((label, i) => (
            <li key={label} className={i === step ? "is-current" : i < step ? "is-done" : ""}>
              <button type="button" disabled={i >= step} onClick={() => goTo(i as Step)}>
                <span className="hr-step-num">{i < step ? <Check size={14} /> : i + 1}</span>
                <span className="hr-step-label">{label}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="hr-panel">
          {step === 0 && (
            <>
              <p className="hr-panel-intro">Who should we contact about this registration?</p>
              <div className="hr-grid">
                {field("parentName", "Your full name", { autoComplete: "name" })}
                {field("parentPhone", "Phone (WhatsApp if possible)", { type: "tel", inputMode: "tel", placeholder: "07…", autoComplete: "tel" })}
              </div>
              <div className="hr-grid">
                {field("parentEmail", "Email", { type: "email", inputMode: "email", autoComplete: "email" })}
                {choice("relationship", "You are the child's", pairs(RELATIONSHIPS))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="hr-panel-intro">Tell us about the child taking part.</p>
              <div className="hr-grid">
                {field("learnerName", "Child's full name")}
                <div className="hr-grid hr-grid-tight">
                  {field("age", "Age", { inputMode: "numeric", placeholder: "e.g. 14" })}
                  {field("classGrade", "Class", { placeholder: "e.g. P7, S2" })}
                </div>
              </div>
              <div className="hr-grid">
                {field("school", "School")}
                {choice("gender", "Gender", pairs(GENDERS))}
              </div>
              {choice("week", "Which week?", Object.entries(WEEKS))}
              <div className="hr-field">
                <span className="hr-label">What interests them most?</span>
                <span className="hr-hint">Tick all that apply. We use this to form teams.</span>
                <div className="hr-chips">
                  {Object.entries(INTERESTS).map(([k, label]) => (
                    <button
                      type="button"
                      key={k}
                      aria-pressed={form.interests.includes(k)}
                      onClick={() =>
                        set("interests", form.interests.includes(k) ? form.interests.filter((i) => i !== k) : [...form.interests, k])
                      }
                      className={`hr-chip${form.interests.includes(k) ? " is-on" : ""}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {err("interests")}
              </div>
              <div className="hr-grid">
                {choice("hasLaptop", "Will they bring a laptop?", pairs(YES_NO))}
                {choice("photoConsent", "May we use photos and videos of them?", pairs(YES_NO))}
              </div>
              <div className="hr-sub">
                {choice("trip", "Would they also like to apply for the trip?", pairs(YES_NO), "Details will be shared", (v) => {
                  set("trip", v);
                  if (v !== "Yes") set("passport", "");
                })}
                {form.trip === "Yes" &&
                  choice("passport", "Do they have a valid passport?", pairs(YES_NO), "This helps us plan for Malaysia if their team wins.")}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="hr-amount">
                <div>
                  <span>Hackathon fee for {form.learnerName || "your child"}</span>
                  <strong>{formatUgx(FEE_UGX)}</strong>
                </div>
              </div>
              {choice("paymentMethod", "How will you pay?", pairs(PAYMENT_METHODS), undefined, (v) => {
                set("paymentMethod", v);
                if (v !== "MTN MoMo") set("transactionId", "");
              })}

              {form.paymentMethod === "MTN MoMo" && (
                <div className="hr-momo">
                  <ol className="hr-howto">
                    <li>
                      Dial <strong>*165*3#</strong> on your MTN line and choose <strong>Pay Merchant</strong>.
                    </li>
                    <li>
                      Enter merchant code
                      <button type="button" className="hr-code" onClick={copyCode} aria-label="Copy the merchant code">
                        {MERCHANT_CODE} {copied ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                      {copied && <span className="hr-copied">Copied</span>}
                    </li>
                    <li>
                      Enter <strong>{FEE_UGX.toLocaleString("en-US")}</strong> and confirm with your PIN.
                    </li>
                    <li>Type the transaction ID from MTN&apos;s confirmation SMS below.</li>
                  </ol>
                  {field("transactionId", "Transaction ID", { placeholder: "From the MoMo SMS", inputMode: "numeric" })}
                  <span className="hr-hint">
                    Paid but can&apos;t find the SMS right now? You can still finish. We&apos;ll ask for the ID afterwards
                    so we can match your payment.
                  </span>
                </div>
              )}

              {form.paymentMethod === "Cash" && (
                <p className="hr-cash">
                  Bring <strong>{formatUgx(FEE_UGX)}</strong> in person to Pearl AI Labs at the National ICT Innovation Hub,
                  Nakawa, during working hours before the hackathon, or on the first day.
                </p>
              )}

              <label className={`hr-consent${errors.parentConsent ? " has-error" : ""}`}>
                <input
                  type="checkbox"
                  checked={form.parentConsent}
                  onChange={(e) => set("parentConsent", e.target.checked)}
                />
                <span>I am {form.learnerName ? `${form.learnerName}'s` : "the child's"} parent or guardian and I agree to them taking part in the hackathon.</span>
              </label>
              {err("parentConsent")}
            </>
          )}

          {submitError && <p className="hr-error hr-error-block">{submitError}</p>}
          {Object.values(errors).some(Boolean) && !submitError && (
            <p className="hr-error hr-error-block">Please fix the highlighted answers.</p>
          )}

          <div className="hr-actions">
            {step > 0 && (
              <button type="button" className="hr-btn hr-btn-ghost" onClick={() => goTo((step - 1) as Step)}>
                ← Back
              </button>
            )}
            <button type="submit" className="hr-btn hr-btn-primary" disabled={status === "sending"}>
              {step < 2 ? `Next: ${STEPS[step + 1]} →` : status === "sending" ? "Sending…" : "Complete registration"}
            </button>
          </div>
        </div>

        <p className="hr-help">
          Questions? Email <strong>pearllabsug@gmail.com</strong> or call <strong>+256 763 839356</strong>.
        </p>
      </form>
    </div>
  );
}

const css = `
.hr { --navy:#002D5B; --orange:#EF8633; --cream:#F4FAFF; --ink:#111D23; --muted:#4C616C; --line:rgba(0,45,91,.12); --red:#c0392b;
  background:var(--cream); color:var(--ink); min-height:100vh; font-family:var(--font-body),system-ui,sans-serif; overflow-x:hidden; }
.hr *{ box-sizing:border-box; }
.hr-wrap{ max-width:820px; margin:0 auto; padding:56px 16px 32px; position:relative; }
.hr-back{ color:var(--muted); text-decoration:none; font-size:13px; }
.hr-eyebrow{ font-size:11px; letter-spacing:.15em; text-transform:uppercase; color:var(--orange); font-weight:600; margin:28px 0 10px; }
.hr-h1{ font-family:var(--font-heading); font-size:clamp(40px,7vw,72px); font-weight:800; line-height:1.02; letter-spacing:-.03em; color:var(--navy); margin:0 0 20px; }
.hr-h1 em{ color:var(--orange); }
.hr-h2{ font-family:var(--font-heading); font-size:clamp(28px,4vw,40px); font-weight:800; color:var(--navy); margin:0 0 18px; }
.hr-lead{ font-size:16px; line-height:1.75; color:var(--muted); max-width:640px; margin:0 0 24px; }
.hr-facts{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:16px; }
.hr-facts div{ background:var(--navy); color:#fff; border-radius:14px; padding:14px 16px; display:flex; flex-direction:column; gap:2px; min-width:0; }
.hr-facts span{ font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:rgba(255,255,255,.65); font-weight:700; }
.hr-facts strong{ font-family:var(--font-heading); font-size:17px; }
.hr-cards{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
.hr-card{ background:#fff; border:1px solid var(--line); border-radius:14px; padding:16px 18px; }
.hr-card h3{ font-family:var(--font-heading); font-size:20px; font-weight:700; color:var(--navy); margin:0 0 6px; }
.hr-card p{ font-size:14px; line-height:1.6; color:var(--muted); margin:0; }
.hr-anchor{ scroll-margin-top:80px; }
.hr-form{ padding-top:16px; }
.hr-steps{ list-style:none; margin:0 0 14px; padding:0; display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
.hr-steps button{ width:100%; display:flex; align-items:center; gap:10px; background:#fff; border:1.5px solid var(--line); border-radius:999px; padding:8px 14px 8px 8px; font:inherit; color:var(--muted); cursor:default; }
.hr-steps li.is-done button{ cursor:pointer; color:var(--navy); }
.hr-steps li.is-current button{ border-color:var(--navy); color:var(--navy); }
.hr-step-num{ width:28px; height:28px; flex-shrink:0; border-radius:50%; display:grid; place-items:center; font-size:13px; font-weight:800; background:var(--cream); }
.hr-steps li.is-current .hr-step-num{ background:var(--navy); color:#fff; }
.hr-steps li.is-done .hr-step-num{ background:var(--orange); color:#fff; }
.hr-step-label{ font-size:14px; font-weight:700; }
.hr-panel{ background:#fff; border:1px solid var(--line); border-radius:20px; padding:22px 20px 20px; display:flex; flex-direction:column; gap:16px; }
.hr-panel-intro{ margin:0; font-size:15px; color:var(--muted); }
.hr-grid{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; align-items:start; }
.hr-grid-tight{ gap:10px; }
.hr-field{ display:flex; flex-direction:column; gap:6px; min-width:0; }
.hr-label{ font-size:13px; font-weight:700; color:var(--navy); }
.hr-hint{ font-size:12.5px; color:var(--muted); margin-top:-2px; }
.hr-input{ font:inherit; font-size:15px; color:var(--ink); background:var(--cream); border:1.5px solid var(--line); border-radius:999px; padding:11px 16px; outline:none; width:100%; }
.hr-input:focus{ border-color:var(--navy); background:#fff; }
.hr-input.has-error{ border-color:var(--red); }
.hr-chips{ display:flex; flex-wrap:wrap; gap:8px; }
.hr-chip{ font:inherit; font-size:14px; font-weight:600; border:1.5px solid var(--line); border-radius:999px; padding:8px 16px; cursor:pointer; background:#fff; color:var(--navy); }
.hr-chip.is-on{ background:var(--navy); border-color:var(--navy); color:#fff; }
.hr-sub{ background:var(--cream); border-radius:16px; padding:14px 16px; display:flex; flex-direction:column; gap:14px; }
.hr-error{ display:block; font-size:12.5px; color:var(--red); font-weight:600; }
.hr-error-block{ margin:0; }
.hr-amount{ background:var(--navy); color:#fff; border-radius:16px; padding:18px 20px; }
.hr-amount div{ display:flex; justify-content:space-between; align-items:baseline; gap:12px; flex-wrap:wrap; }
.hr-amount span{ font-size:14px; color:rgba(255,255,255,.75); }
.hr-amount strong{ font-family:var(--font-heading); font-size:28px; letter-spacing:-.01em; }
.hr-momo{ display:flex; flex-direction:column; gap:12px; background:#FFF7EF; border:1px solid rgba(239,134,51,.35); border-radius:16px; padding:16px; }
.hr-howto{ margin:0; padding-left:20px; display:flex; flex-direction:column; gap:8px; font-size:14px; line-height:1.55; }
.hr-code{ display:inline-flex; align-items:center; gap:6px; margin-left:8px; background:var(--orange); color:#fff; border:none; border-radius:999px; padding:4px 12px; font-family:ui-monospace,Menlo,monospace; font-size:15px; font-weight:800; letter-spacing:.06em; cursor:pointer; vertical-align:middle; }
.hr-copied{ margin-left:8px; font-size:12px; font-weight:700; color:#B35A12; }
.hr-cash{ margin:0; background:var(--cream); border-radius:16px; padding:16px; font-size:14px; line-height:1.65; }
.hr-consent{ display:flex; gap:10px; align-items:flex-start; font-size:14px; line-height:1.5; cursor:pointer; padding:12px 14px; border:1.5px solid var(--line); border-radius:14px; }
.hr-consent.has-error{ border-color:var(--red); }
.hr-consent input{ width:18px; height:18px; accent-color:var(--navy); flex-shrink:0; margin-top:2px; }
.hr-actions{ display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-top:4px; }
.hr-actions .hr-btn-primary{ margin-left:auto; }
.hr-actions-center{ justify-content:center; }
.hr-actions-center .hr-btn-primary{ margin-left:0; }
.hr-btn{ font:inherit; font-size:15px; font-weight:700; border-radius:999px; padding:13px 26px; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; border:1.5px solid transparent; }
.hr-btn-primary{ background:var(--orange); color:#fff; }
.hr-btn-primary:disabled{ opacity:.65; cursor:default; }
.hr-btn-ghost{ background:#fff; color:var(--navy); border-color:var(--line); }
.hr-help{ font-size:12.5px; color:var(--muted); margin:14px 0 0; }
.hr-done{ text-align:center; padding-top:120px; }
.hr-done .hr-lead{ margin-left:auto; margin-right:auto; }
.hr-done-icon{ width:64px; height:64px; border-radius:50%; background:var(--orange); color:#fff; display:grid; place-items:center; margin:0 auto 20px; }
@media (max-width:640px){
  .hr-facts,.hr-cards{ grid-template-columns:1fr; }
  .hr-facts{ grid-template-columns:repeat(3,minmax(0,1fr)); }
  .hr-facts div{ padding:10px 12px; }
  .hr-facts strong{ font-size:14px; }
  .hr-grid{ grid-template-columns:1fr; }
  .hr-grid-tight{ grid-template-columns:1fr 1fr; }
  .hr-step-label{ font-size:12.5px; }
  .hr-steps button{ padding:6px 8px 6px 6px; gap:6px; }
  .hr-panel{ padding:18px 14px; }
  .hr-btn{ padding:12px 20px; }
}
`;
