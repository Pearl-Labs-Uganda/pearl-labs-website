"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import {
  GENDERS,
  HEAR_ABOUT,
  INTERESTS,
  RELATIONSHIPS,
  WEEKS,
  YES_NO,
  emptyFields,
  fieldErrors,
  type HackathonFields,
} from "@/lib/hackathon";

const DRAFT_KEY = "pearlLabsHackathonDraft";

const b = {
  cream: "#F4FAFF",
  green: "#002D5B",
  orange: "#EF8633",
  text: "#111D23",
  muted: "#4C616C",
  border: "rgba(0,45,91,0.12)",
  red: "#c0392b",
};

const highlights = [
  {
    title: "Build",
    blurb: "A full week of hands-on building with drones, robotics, AI and coding, 3D printing and aerospace design, using real lab equipment.",
  },
  {
    title: "Pitch",
    blurb: "The week ends with a pitching day. Teams present what they built to a panel of judges.",
  },
  {
    title: "Malaysia",
    blurb: "The winning teams get first priority to represent Uganda at the Technotion World Cup in Malaysia.",
  },
];

const LEARNER_KEYS: (keyof HackathonFields)[] = [
  "learnerName", "age", "gender", "school", "classGrade", "interests", "hasLaptop", "trip", "passport", "photoConsent",
];

type Errors = Partial<Record<keyof HackathonFields, string>>;
type Status = "idle" | "sending" | "sent";

const newSessionId = () => `hk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

export default function HackathonRegister() {
  const [form, setForm] = useState<HackathonFields>(emptyFields);
  const [sessionId, setSessionId] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState("");
  const started = useRef(false);
  const restored = useRef(false);
  const honeypot = useRef<HTMLInputElement>(null);

  // Restore an unfinished draft from this device.
  useEffect(() => {
    trackEvent("hackathon_view");
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { form?: Partial<HackathonFields>; sessionId?: string };
        setForm({ ...emptyFields(), ...draft.form });
        setSessionId(draft.sessionId || newSessionId());
      } else setSessionId(newSessionId());
    } catch {
      setSessionId(newSessionId());
    } finally {
      restored.current = true;
    }
  }, []);

  useEffect(() => {
    if (!restored.current || status === "sent") return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, sessionId }));
    } catch {}
  }, [form, sessionId, status]);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackEvent("hackathon_started");
  };

  const set = <K extends keyof HackathonFields>(key: K, value: HackathonFields[K]) => {
    markStarted();
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const toggleInterest = (k: string) =>
    set("interests", form.interests.includes(k) ? form.interests.filter((i) => i !== k) : [...form.interests, k]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = fieldErrors(form);
    setErrors(found);
    setSubmitError("");
    if (Object.values(found).some(Boolean)) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/hackathon-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sessionId, website: honeypot.current?.value ?? "" }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (res.ok && body.ok) {
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

  // Same parent, another child: keep the parent's details, clear the learner's.
  const registerAnother = () => {
    const blank = emptyFields();
    setForm((f) => {
      const next = { ...f };
      for (const k of LEARNER_KEYS) (next as Record<string, unknown>)[k] = blank[k];
      return next;
    });
    setSessionId(newSessionId());
    setErrors({});
    setStatus("idle");
    started.current = false;
  };

  if (status === "sent") {
    return (
      <div style={s.page}>
        <div style={{ ...s.wrap, textAlign: "center", paddingTop: 120 }}>
          <div style={s.successIcon}>✓</div>
          <h1 style={s.h2}>Registration received</h1>
          <p style={{ ...s.lead, marginLeft: "auto", marginRight: "auto" }}>
            Thank you. {form.learnerName} is pre-registered for the STEM Innovation Hackathon. We&apos;ll contact you
            on {form.parentPhone} with the confirmed dates, fees and next steps.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button type="button" onClick={registerAnother} style={s.btnSolid}>
              Register another child
            </button>
            <Link href="/" style={s.btnOutline}>
              Back to Pearl AI Labs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const field = (key: keyof HackathonFields, label: string, type = "text", placeholder?: string, inputMode?: "numeric") => (
    <label style={s.label}>
      {label}
      <input
        type={type}
        inputMode={inputMode}
        value={form[key] as string}
        placeholder={placeholder}
        onChange={(e) => set(key, e.target.value as never)}
        style={{ ...s.input, borderColor: errors[key] ? b.red : b.border }}
      />
      {errors[key] && <span style={s.error}>{errors[key]}</span>}
    </label>
  );

  const chip = (active: boolean): React.CSSProperties => ({
    ...s.chip,
    background: active ? b.green : "#fff",
    color: active ? "#fff" : b.green,
    borderColor: active ? b.green : b.border,
  });

  const choice = (key: keyof HackathonFields, label: string, options: readonly (readonly [string, string])[], hint?: string) => (
    <div style={{ marginTop: 16 }}>
      <span style={s.label}>{label}</span>
      {hint && <p style={{ ...s.hint, marginTop: -2, marginBottom: 8 }}>{hint}</p>}
      <div style={s.chips}>
        {options.map(([value, text]) => (
          <button type="button" key={value} onClick={() => set(key, value as never)} style={chip(form[key] === value)}>
            {text}
          </button>
        ))}
      </div>
      {errors[key] && <span style={s.error}>{errors[key]}</span>}
    </div>
  );

  const pairs = (list: readonly string[]) => list.map((v) => [v, v] as const);
  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div style={s.page}>
      <section style={s.wrap}>
        <Link href="/" style={s.back}>
          ← Pearl AI Labs
        </Link>
        <p style={s.eyebrow}>Opportunities · Hackathon</p>
        <h1 style={s.h1}>
          STEM Innovation <em style={{ color: b.orange }}>Hackathon</em>
        </h1>
        <p style={s.lead}>
          A one-week hackathon for school learners at the National ICT Innovation Hub, Nakawa, run by Pearl AI Labs
          and AeRoCAD Learners in December 2026. Learners build real projects in teams and pitch them on the final
          day. Pre-register below to hold a place. Fees and the final dates will be shared with registered families.
        </p>
        <div style={s.cards}>
          {highlights.map((h) => (
            <div key={h.title} style={s.card}>
              <h3 style={s.cardTitle}>{h.title}</h3>
              <p style={s.cardBlurb}>{h.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={submit} noValidate style={{ ...s.wrap, paddingTop: 0 }}>
        <h2 style={s.h2}>Pre-register</h2>
        <input
          ref={honeypot}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: -9999, width: 1, height: 1 }}
        />

        <fieldset style={s.section}>
          <legend style={s.legend}>The learner</legend>
          <div style={s.grid}>
            {field("learnerName", "Full name")}
            {field("age", "Age", "text", "e.g. 14", "numeric")}
          </div>
          <div style={s.grid}>
            {field("school", "School")}
            {field("classGrade", "Class", "text", "e.g. P7, S2")}
          </div>
          {choice("gender", "Gender", pairs(GENDERS))}
        </fieldset>

        <fieldset style={s.section}>
          <legend style={s.legend}>Parent or guardian</legend>
          <div style={s.grid}>
            {field("parentName", "Full name")}
            {field("parentPhone", "Phone", "tel", "+256 …")}
            {field("parentEmail", "Email", "email")}
          </div>
          {choice("relationship", "Relationship to the learner", pairs(RELATIONSHIPS))}
        </fieldset>

        <fieldset style={s.section}>
          <legend style={s.legend}>The hackathon</legend>
          {choice("week", "Preferred week", Object.entries(WEEKS))}
          <div style={{ marginTop: 16 }}>
            <span style={s.label}>What interests the learner most?</span>
            <p style={{ ...s.hint, marginTop: -2, marginBottom: 8 }}>Tick all that apply.</p>
            <div style={s.chips}>
              {Object.entries(INTERESTS).map(([k, label]) => (
                <button type="button" key={k} onClick={() => toggleInterest(k)} style={chip(form.interests.includes(k))}>
                  {label}
                </button>
              ))}
            </div>
            {errors.interests && <span style={s.error}>{errors.interests}</span>}
          </div>
          {choice("hasLaptop", "Does the learner have a laptop to bring?", pairs(YES_NO))}
          {choice("hearAbout", "How did you hear about the hackathon?", pairs(HEAR_ABOUT))}
        </fieldset>

        <fieldset style={s.section}>
          <legend style={s.legend}>Trip</legend>
          {choice(
            "trip",
            "Would the learner also like to apply for the trip?",
            pairs(YES_NO),
            "The trip is separate from the hackathon. We'll share the details with families who apply.",
          )}
          {choice(
            "passport",
            "Does the learner have a valid passport?",
            pairs(YES_NO),
            "This helps us plan early for Malaysia if the learner's team wins.",
          )}
        </fieldset>

        <fieldset style={s.section}>
          <legend style={s.legend}>Consent</legend>
          {choice("photoConsent", "May we use photos and videos of the learner from the hackathon?", pairs(YES_NO))}
          <label style={{ ...s.check, marginTop: 18 }}>
            <input
              type="checkbox"
              checked={form.parentConsent}
              onChange={(e) => set("parentConsent", e.target.checked)}
              style={{ width: 18, height: 18, accentColor: b.green, flexShrink: 0, marginTop: 2 }}
            />
            <span>
              I am the learner&apos;s parent or guardian and I agree to them taking part in the hackathon.
            </span>
          </label>
          {errors.parentConsent && <span style={s.error}>{errors.parentConsent}</span>}
        </fieldset>

        {hasErrors && <p style={s.error}>Please fix the highlighted fields above.</p>}
        {submitError && <p style={s.error}>{submitError}</p>}
        <button
          type="submit"
          disabled={status === "sending"}
          style={{ ...s.btnSolid, opacity: status === "sending" ? 0.7 : 1 }}
        >
          {status === "sending" ? "Sending…" : "Pre-register →"}
        </button>
        <p style={s.hint}>
          Questions? Email <strong>pearllabsug@gmail.com</strong> or call <strong>+256 763 839356</strong>.
        </p>
      </form>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    background: b.cream,
    color: b.text,
    minHeight: "100vh",
    fontFamily: "var(--font-body), system-ui, sans-serif",
    overflowX: "hidden",
  },
  wrap: { maxWidth: 820, margin: "0 auto", padding: "56px 16px 40px", position: "relative" },
  back: { color: b.muted, textDecoration: "none", fontSize: 13 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: b.orange,
    fontWeight: 600,
    margin: "28px 0 10px",
  },
  h1: {
    fontFamily: "var(--font-heading)",
    fontSize: "clamp(40px, 7vw, 72px)",
    fontWeight: 800,
    lineHeight: 1.02,
    letterSpacing: "-0.03em",
    color: b.green,
    margin: "0 0 20px",
  },
  h2: {
    fontFamily: "var(--font-heading)",
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: 800,
    color: b.green,
    margin: "8px 0 20px",
  },
  lead: { fontSize: 16, lineHeight: 1.75, color: b.muted, maxWidth: 620, marginBottom: 28 },
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 },
  card: { background: "#fff", border: `1px solid ${b.border}`, borderRadius: 12, padding: "18px 22px 20px" },
  cardTitle: { fontFamily: "var(--font-heading)", fontSize: 22, fontWeight: 700, color: b.green, margin: "0 0 8px" },
  cardBlurb: { fontSize: 14, lineHeight: 1.6, color: b.muted, margin: 0 },
  section: {
    border: `1px solid ${b.border}`,
    borderRadius: 12,
    background: "#fff",
    padding: "18px 18px 22px",
    margin: "0 0 16px",
    minWidth: 0,
  },
  legend: { fontFamily: "var(--font-heading)", fontWeight: 700, color: b.green, padding: "0 6px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 6 },
  label: { display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600, color: b.green, marginBottom: 6 },
  input: {
    font: "inherit",
    fontWeight: 400,
    fontSize: 15,
    color: b.text,
    background: b.cream,
    border: "1.5px solid",
    borderRadius: 999,
    padding: "11px 16px",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { font: "inherit", fontSize: 14, fontWeight: 600, border: "1.5px solid", borderRadius: 999, padding: "8px 16px", cursor: "pointer" },
  check: { display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, lineHeight: 1.5, color: b.text, cursor: "pointer" },
  hint: { fontSize: 12.5, color: b.muted, fontWeight: 400, margin: "4px 0" },
  error: { display: "block", fontSize: 12.5, color: b.red, fontWeight: 500, marginTop: 4 },
  btnSolid: {
    font: "inherit",
    fontSize: 15,
    fontWeight: 700,
    color: "#fff",
    background: b.orange,
    border: "none",
    borderRadius: 999,
    padding: "14px 34px",
    cursor: "pointer",
    margin: "8px 0 12px",
  },
  btnOutline: {
    display: "inline-block",
    fontSize: 14,
    fontWeight: 600,
    color: b.green,
    border: `1.5px solid ${b.border}`,
    borderRadius: 999,
    padding: "12px 26px",
    textDecoration: "none",
    margin: "8px 0 12px",
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: b.orange,
    color: "#fff",
    fontSize: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
};
