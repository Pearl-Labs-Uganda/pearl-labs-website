"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import {
  ACCEPT_ATTR,
  DAYS,
  GENDERS,
  MAX_OTHER_FILES,
  TEXT_MAX,
  TIMES,
  TRACKS,
  emptyFields,
  fieldErrors,
  fileProblem,
  filesProblem,
  type PlacementFields,
} from "@/lib/placement";

const DRAFT_KEY = "pearlLabsInternshipDraft";

const b = {
  cream: "#F4FAFF",
  green: "#002D5B",
  orange: "#EF8633",
  text: "#111D23",
  muted: "#4C616C",
  border: "rgba(0,45,91,0.12)",
  red: "#c0392b",
};

const trackCards = [
  {
    key: "ai",
    title: "AI",
    blurb: "Machine learning, large language models and AI-powered applications — from data to a working, deployed project.",
  },
  {
    key: "robotics",
    title: "Robotics",
    blurb: "Sensors, embedded systems and code — designing, building and programming robots that sense and act.",
  },
];

type Errors = Partial<Record<keyof PlacementFields | "files", string>>;
type Status = "idle" | "sending" | "sent";

const formatSize = (n: number) =>
  n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

export default function InternshipPlacement() {
  const [form, setForm] = useState<PlacementFields>(emptyFields);
  const [cv, setCv] = useState<File | null>(null);
  const [others, setOthers] = useState<File[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [submitError, setSubmitError] = useState("");
  const started = useRef(false);
  const restored = useRef(false);
  const honeypot = useRef<HTMLInputElement>(null);

  // Restore the typed answers (not files — browsers can't keep those) from this device.
  useEffect(() => {
    trackEvent("internship_view");
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Partial<PlacementFields>;
        setForm({ ...emptyFields(), ...draft });
      }
    } catch {
    } finally {
      restored.current = true;
    }
  }, []);

  useEffect(() => {
    if (!restored.current || status === "sent") return;
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [form, status]);

  const markStarted = () => {
    if (started.current) return;
    started.current = true;
    trackEvent("internship_started");
  };

  const set = <K extends keyof PlacementFields>(key: K, value: PlacementFields[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const toggleDay = (day: string) =>
    set("days", form.days.includes(day) ? form.days.filter((d) => d !== day) : [...form.days, day]);

  const pickCv = (list: FileList | null) => {
    const file = list?.[0] ?? null;
    const problem = file ? fileProblem(file) : null;
    setErrors((e) => ({ ...e, files: problem ?? undefined }));
    if (!problem) setCv(file);
  };

  const pickOthers = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    const problem =
      picked.map(fileProblem).find(Boolean) ??
      (others.length + picked.length > MAX_OTHER_FILES ? `Attach at most ${MAX_OTHER_FILES} other documents` : null);
    setErrors((e) => ({ ...e, files: problem ?? undefined }));
    if (!problem) setOthers((o) => [...o, ...picked]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found: Errors = { ...fieldErrors(form) };
    const fileErr = filesProblem(cv, others);
    if (fileErr) found.files = fileErr;
    setErrors(found);
    setSubmitError("");
    if (Object.values(found).some(Boolean)) return;

    const data = new FormData();
    (Object.keys(form) as (keyof PlacementFields)[]).forEach((key) => {
      if (key === "days") form.days.forEach((d) => data.append("days", d));
      else data.append(key, form[key] as string);
    });
    data.append("website", honeypot.current?.value ?? "");
    if (cv) data.append("cv", cv);
    others.forEach((f) => data.append("other", f));

    // XHR rather than fetch: it reports upload progress.
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/placement-apply");
    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    xhr.onload = () => {
      let body: { ok?: boolean; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status === 200 && body.ok) {
        trackEvent("internship_submitted", { track: form.track });
        try {
          window.localStorage.removeItem(DRAFT_KEY);
        } catch {}
        setStatus("sent");
      } else {
        setSubmitError(body.error ?? "We couldn't send your application — please try again.");
        setStatus("idle");
      }
    };
    xhr.onerror = () => {
      setSubmitError("No connection — check your internet and try again. Your answers are kept.");
      setStatus("idle");
    };
    setProgress(0);
    setStatus("sending");
    xhr.send(data);
  };

  if (status === "sent") {
    return (
      <div style={s.page}>
        <div style={{ ...s.wrap, textAlign: "center", paddingTop: 120 }}>
          <div style={s.successIcon}>✓</div>
          <h1 style={s.h2}>Application received</h1>
          <p style={{ ...s.lead, marginLeft: "auto", marginRight: "auto" }}>
            Thank you — we&apos;ve received your application and documents, and sent a confirmation to {form.email}.
            Our team will review it and contact you directly.
          </p>
          <Link href="/" style={s.btnOutline}>
            Back to Pearl AI Labs
          </Link>
        </div>
      </div>
    );
  }

  const field = (key: keyof PlacementFields, label: string, type = "text", placeholder?: string) => (
    <label style={s.label}>
      {label}
      <input
        type={type}
        value={form[key] as string}
        placeholder={placeholder}
        onFocus={markStarted}
        onChange={(e) => set(key, e.target.value as never)}
        style={{ ...s.input, borderColor: errors[key] ? b.red : b.border }}
      />
      {errors[key] && <span style={s.error}>{errors[key]}</span>}
    </label>
  );

  const area = (key: "whyTrack" | "skills", label: string) => (
    <label style={s.label}>
      {label}
      <textarea
        value={form[key]}
        maxLength={TEXT_MAX}
        onFocus={markStarted}
        onChange={(e) => set(key, e.target.value)}
        style={{ ...s.input, ...s.textarea, borderColor: errors[key] ? b.red : b.border }}
      />
      <span style={s.hint}>
        {form[key].length} / {TEXT_MAX}
      </span>
      {errors[key] && <span style={s.error}>{errors[key]}</span>}
    </label>
  );

  const chip = (active: boolean): React.CSSProperties => ({
    ...s.chip,
    background: active ? b.green : "#fff",
    color: active ? "#fff" : b.green,
    borderColor: active ? b.green : b.border,
  });

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div style={s.page}>
      <section style={s.wrap}>
        <Link href="/" style={s.back}>
          ← Pearl AI Labs
        </Link>
        <p style={s.eyebrow}>Opportunities · Internship placements</p>
        <h1 style={s.h1}>
          Intern at <em style={{ color: b.orange }}>Pearl AI Labs</em>
        </h1>
        <p style={s.lead}>
          Hands-on placements for university students in two tracks — AI and Robotics — at our lab in the National
          ICT Hub, Nakawa. You&apos;ll work on real projects alongside our team. See what past interns built in our{" "}
          <Link href="/portfolio" style={{ color: b.orange }}>
            portfolio
          </Link>
          .
        </p>
        <div style={s.cards}>
          {trackCards.map((t) => (
            <div key={t.key} style={s.card}>
              <p style={s.eyebrow}>Track</p>
              <h3 style={s.cardTitle}>{t.title}</h3>
              <p style={s.cardBlurb}>{t.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <form onSubmit={submit} noValidate style={{ ...s.wrap, paddingTop: 0 }}>
        <h2 style={s.h2}>Apply</h2>
        <input
          ref={honeypot}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: "absolute", left: -9999, width: 1, height: 1 }}
        />

        <fieldset style={s.section}>
          <legend style={s.legend}>About you</legend>
          <div style={s.grid}>
            {field("fullName", "Full name")}
            {field("email", "Email", "email")}
            {field("phone", "Phone", "tel", "+256 …")}
          </div>
          <span style={{ ...s.label, marginTop: 14 }}>Gender</span>
          <div style={s.chips}>
            {GENDERS.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => {
                  markStarted();
                  set("gender", g);
                }}
                style={chip(form.gender === g)}
              >
                {g}
              </button>
            ))}
          </div>
          {errors.gender && <span style={s.error}>{errors.gender}</span>}
        </fieldset>

        <fieldset style={s.section}>
          <legend style={s.legend}>Education</legend>
          <div style={s.grid}>
            {field("institution", "University / institution")}
            {field("course", "Course / programme")}
          </div>
        </fieldset>

        <fieldset style={s.section}>
          <legend style={s.legend}>Placement</legend>
          <span style={s.label}>Track</span>
          <div style={s.chips}>
            {Object.entries(TRACKS).map(([k, label]) => (
              <button
                type="button"
                key={k}
                onClick={() => {
                  markStarted();
                  set("track", k);
                }}
                style={chip(form.track === k)}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.track && <span style={s.error}>{errors.track}</span>}
          <span style={{ ...s.label, marginTop: 18 }}>Days you can be around</span>
          <div style={s.chips}>
            {DAYS.map(([k, label]) => (
              <button
                type="button"
                key={k}
                onClick={() => {
                  markStarted();
                  toggleDay(k);
                }}
                style={chip(form.days.includes(k))}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.days && <span style={s.error}>{errors.days}</span>}
          <span style={{ ...s.label, marginTop: 18 }}>Preferred time</span>
          <div style={s.chips}>
            {Object.entries(TIMES).map(([k, label]) => (
              <button
                type="button"
                key={k}
                onClick={() => {
                  markStarted();
                  set("preferredTime", k);
                }}
                style={chip(form.preferredTime === k)}
              >
                {label}
              </button>
            ))}
          </div>
          {errors.preferredTime && <span style={s.error}>{errors.preferredTime}</span>}
        </fieldset>

        <fieldset style={s.section}>
          <legend style={s.legend}>Motivation</legend>
          {area("whyTrack", "Why this track?")}
          {area("skills", "Relevant projects or skills")}
          {field("portfolioUrl", "GitHub / portfolio link (optional)", "url", "https://")}
        </fieldset>

        <fieldset style={s.section}>
          <legend style={s.legend}>Documents</legend>
          <p style={s.hint}>PDF, Word or image (JPG, PNG), up to 10 MB each.</p>
          <label style={s.label}>
            CV (required)
            <input
              type="file"
              accept={ACCEPT_ATTR}
              onChange={(e) => {
                markStarted();
                pickCv(e.target.files);
                e.target.value = "";
              }}
              style={s.file}
            />
          </label>
          {cv && (
            <div style={s.fileRow}>
              <span>
                📄 {cv.name} · {formatSize(cv.size)}
              </span>
              <button type="button" onClick={() => setCv(null)} style={s.remove}>
                Remove
              </button>
            </div>
          )}
          <label style={{ ...s.label, marginTop: 14 }}>
            Other documents (optional, up to {MAX_OTHER_FILES}) — e.g. a recommendation letter or transcript
            <input
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              disabled={others.length >= MAX_OTHER_FILES}
              onChange={(e) => {
                markStarted();
                pickOthers(e.target.files);
                e.target.value = "";
              }}
              style={s.file}
            />
          </label>
          {others.map((f, i) => (
            <div key={`${f.name}-${i}`} style={s.fileRow}>
              <span>
                📎 {f.name} · {formatSize(f.size)}
              </span>
              <button type="button" onClick={() => setOthers((o) => o.filter((_, j) => j !== i))} style={s.remove}>
                Remove
              </button>
            </div>
          ))}
          {errors.files && <span style={s.error}>{errors.files}</span>}
        </fieldset>

        {hasErrors && <p style={s.error}>Please fix the highlighted fields above.</p>}
        {submitError && <p style={s.error}>{submitError}</p>}
        {status === "sending" && (
          <div style={s.progressTrack}>
            <div style={{ ...s.progressBar, width: `${progress}%` }} />
          </div>
        )}
        <button
          type="submit"
          disabled={status === "sending"}
          style={{ ...s.btnSolid, opacity: status === "sending" ? 0.7 : 1 }}
        >
          {status === "sending" ? `Sending… ${progress}%` : "Submit application →"}
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
  cards: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 },
  card: { background: "#fff", border: `1px solid ${b.border}`, borderRadius: 12, padding: "4px 22px 20px" },
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
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 },
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
  textarea: { minHeight: 110, resize: "vertical", borderRadius: 18 },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { font: "inherit", fontSize: 14, fontWeight: 600, border: "1.5px solid", borderRadius: 999, padding: "8px 16px", cursor: "pointer" },
  file: { font: "inherit", fontWeight: 400, fontSize: 14, maxWidth: "100%" },
  fileRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    padding: "8px 12px",
    background: b.cream,
    borderRadius: 10,
    marginTop: 8,
    overflowWrap: "anywhere",
  },
  remove: { font: "inherit", fontSize: 13, color: b.red, background: "none", border: "none", cursor: "pointer", flexShrink: 0 },
  hint: { fontSize: 12.5, color: b.muted, fontWeight: 400, margin: "4px 0" },
  error: { display: "block", fontSize: 12.5, color: b.red, fontWeight: 500, marginTop: 4 },
  progressTrack: { height: 6, background: "#E3F0F8", borderRadius: 999, overflow: "hidden", margin: "12px 0" },
  progressBar: { height: "100%", background: b.orange, transition: "width .2s" },
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
