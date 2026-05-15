"use client";

import { useRef, useState } from "react";
import Link from "next/link";

// ── Brand tokens (Pearl Labs) ─────────────────────────────────
const PRIMARY      = "#002D5B";
const PRIMARY_LIGHT = "#003F80";
const ACCENT       = "#EF8633";
const ACCENT_MID   = "#d4732a";
const BG           = "#F4FAFF";
const BG_SURFACE   = "#FFFFFF";
const TEXT_PRIMARY = "#111D23";
const TEXT_SECONDARY = "#4C616C";
const BORDER       = "rgba(0,45,91,0.12)";

const MODULES = [
  "Module 01 — Data Science & Artificial Intelligence",
  "Module 02 — Embedded Systems & IoT",
  "Module 03 — IT Project Management",
  "Full Programme (All 3 Modules + Capstone)",
];

const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Graduate / Postgrad", "Other"];

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  institution: string;
  course: string;
  yearOfStudy: string;
  module: string;
  motivation: string;
  portfolio: string;
}

const INITIAL: FormState = {
  fullName: "", email: "", phone: "",
  institution: "", course: "", yearOfStudy: "",
  module: "", motivation: "", portfolio: "",
};

type Status = "idle" | "sending" | "sent" | "error";
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export default function InternshipApply() {
  const [form,    setForm]    = useState<FormState>(INITIAL);
  const [errors,  setErrors]  = useState<Partial<FormState>>({});
  const [status,  setStatus]  = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string>("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string>("");
  const [focused, setFocused] = useState<string | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // ── Validation ──────────────────────────────────────────────
  const validate = (): Partial<FormState> => {
    const e: Partial<FormState> = {};
    if (!form.fullName.trim())    e.fullName    = "Required";
    if (!form.email.trim())       e.email       = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim())       e.phone       = "Required";
    if (!form.institution.trim()) e.institution = "Required";
    if (!form.course.trim())      e.course      = "Required";
    if (!form.yearOfStudy)        e.yearOfStudy = "Required";
    if (!form.module)             e.module      = "Required";
    if (form.motivation.trim().length < 30)
      e.motivation = "Please write at least 30 characters";
    return e;
  };

  const change = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAttachmentError("");

    if (!file) {
      setAttachment(null);
      return;
    }

    if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
      setAttachment(null);
      setAttachmentError("Only PDF, DOC, DOCX, and TXT files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setAttachment(null);
      setAttachmentError("Attachment must be smaller than 5MB.");
      e.target.value = "";
      return;
    }

    setAttachment(file);
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentError("");
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = "";
    }
  };

  // ── Submit — sends directly through server API ───────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (attachmentError) {
      setStatus("error");
      setSubmitError(attachmentError);
      return;
    }

    setStatus("sending");
    setSubmitError("");

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      if (attachment) payload.append("attachment", attachment);

      const response = await fetch("/api/internship-apply", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to submit application");
      }

      setStatus("sent");
      setForm(INITIAL);
      clearAttachment();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit application";
      setSubmitError(message);
      setStatus("error");
    }
  };

  // ── Field style helper ───────────────────────────────────────
  const fieldStyle = (name: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
    width: "100%",
    padding: "13px 16px",
    fontSize: 14,
    fontFamily: "inherit",
    color: PRIMARY,
    background: focused === name ? "#fff" : BG,
    border: `1.5px solid ${errors[name as keyof FormState] ? "#C0392B" : focused === name ? ACCENT : BORDER}`,
    borderRadius: 8,
    outline: "none",
    transition: "border-color 0.2s, background 0.2s",
    boxSizing: "border-box",
    ...extra,
  });

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: TEXT_SECONDARY,
    marginBottom: 7,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#C0392B",
    marginTop: 4,
  };

  // ── Success screen ───────────────────────────────────────────
  if (status === "sent") {
    return (
      <div style={s.page}>
        <div style={s.successWrap}>
          <div style={s.successIcon}>✓</div>
          <h2 style={s.successTitle}>Application Sent!</h2>
          <p style={s.successText}>
            Your internship application has been submitted successfully.
            Our team will review it and reach out using your provided contact details.
            For urgent questions, email us at{" "}
            <a href="mailto:pearllabsug@gmail.com" style={{ color: ACCENT }}>
              pearllabsug@gmail.com
            </a>.
          </p>
          <Link href="/" style={s.backLink}>← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={s.header}>
        <Link href="/" style={s.navBack}>← pearllabs.ug</Link>
        <div style={s.pill}>
          <span style={s.pillDot} />
          Deadline: 28th May · ICT Hub Nakawa
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={s.hero}>
        <p style={s.eyebrow}>Open Programme · University Students Encouraged</p>
        <h1 style={s.heroTitle}>
          Apply for the<br />
          <em style={s.heroItalic}>Internship</em>
        </h1>
        <p style={s.heroSub}>
          Pearl Labs × componentPulse — hands-on training in Data Science & AI,
          Embedded Systems & IoT, and IT Project Management, culminating in a
          real-world capstone project. Located at ICT Hub Nakawa, Kampala.
        </p>

        <div style={s.statsRow}>
          {[
            { v: "28 May",  l: "Deadline" },
            { v: "3",       l: "Modules" },
            { v: "Nakawa",  l: "ICT Hub" },
            { v: "Free",    l: "No Cost" },
          ].map(stat => (
            <div key={stat.l} style={s.stat}>
              <div style={s.statVal}>{stat.v}</div>
              <div style={s.statLbl}>{stat.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form card ────────────────────────────────────────── */}
      <div style={s.formWrap}>
        <div style={s.formCard}>

          <div style={s.formHeader}>
            <h2 style={s.formTitle}>Your Details</h2>
            <p style={s.formSub}>All fields marked are required unless stated otherwise.</p>
          </div>

          <div style={s.divider} />

          {/* Section: Personal */}
          <p style={s.sectionLabel}>Personal Information</p>
          <div style={s.row2}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                style={fieldStyle("fullName")}
                value={form.fullName}
                onChange={change("fullName")}
                onFocus={() => setFocused("fullName")}
                onBlur={() => setFocused(null)}
                placeholder="e.g. Jazirah Namubiru"
              />
              {errors.fullName && <p style={errorStyle}>{errors.fullName}</p>}
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                style={fieldStyle("email")}
                type="email"
                value={form.email}
                onChange={change("email")}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="you@example.com"
              />
              {errors.email && <p style={errorStyle}>{errors.email}</p>}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Phone Number (WhatsApp preferred)</label>
            <input
              style={fieldStyle("phone")}
              value={form.phone}
              onChange={change("phone")}
              onFocus={() => setFocused("phone")}
              onBlur={() => setFocused(null)}
              placeholder="+256 7XX XXX XXX"
            />
            {errors.phone && <p style={errorStyle}>{errors.phone}</p>}
          </div>

          <div style={s.divider} />

          {/* Section: Academic */}
          <p style={s.sectionLabel}>Academic Background</p>
          <div style={s.row2}>
            <div>
              <label style={labelStyle}>University / Institution</label>
              <input
                style={fieldStyle("institution")}
                value={form.institution}
                onChange={change("institution")}
                onFocus={() => setFocused("institution")}
                onBlur={() => setFocused(null)}
                placeholder="e.g. UICT, Makerere, MUBS"
              />
              {errors.institution && <p style={errorStyle}>{errors.institution}</p>}
            </div>
            <div>
              <label style={labelStyle}>Course / Programme</label>
              <input
                style={fieldStyle("course")}
                value={form.course}
                onChange={change("course")}
                onFocus={() => setFocused("course")}
                onBlur={() => setFocused(null)}
                placeholder="e.g. Information Technology"
              />
              {errors.course && <p style={errorStyle}>{errors.course}</p>}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Year of Study</label>
            <select
              style={fieldStyle("yearOfStudy", { cursor: "pointer" })}
              value={form.yearOfStudy}
              onChange={change("yearOfStudy")}
              onFocus={() => setFocused("yearOfStudy")}
              onBlur={() => setFocused(null)}
            >
              <option value="">Select year…</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            {errors.yearOfStudy && <p style={errorStyle}>{errors.yearOfStudy}</p>}
          </div>

          <div style={s.divider} />

          {/* Section: Programme */}
          <p style={s.sectionLabel}>Programme Preference</p>
          <div>
            <label style={labelStyle}>Module of Interest</label>
            <select
              style={fieldStyle("module", { cursor: "pointer" })}
              value={form.module}
              onChange={change("module")}
              onFocus={() => setFocused("module")}
              onBlur={() => setFocused(null)}
            >
              <option value="">Select a module…</option>
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.module && <p style={errorStyle}>{errors.module}</p>}
          </div>

          <div style={s.divider} />

          {/* Section: Motivation */}
          <p style={s.sectionLabel}>Motivation</p>
          <div>
            <label style={labelStyle}>Why do you want to join Pearl AI Labs?</label>
            <div style={s.motivationWrap}>
            <textarea
              style={fieldStyle("motivation", { minHeight: 140, resize: "vertical", lineHeight: "1.7", paddingRight: 56 })}
              value={form.motivation}
              onChange={change("motivation")}
              onFocus={() => setFocused("motivation")}
              onBlur={() => setFocused(null)}
              placeholder="Tell us about your interest in AI, embedded systems, or tech in Uganda. What do you hope to build or learn?"
            />
              <button
                type="button"
                onClick={() => attachmentInputRef.current?.click()}
                style={s.attachBtn}
                aria-label="Attach supporting document"
                title="Attach supporting document"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05L12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.2-9.19a3.5 3.5 0 1 1 4.95 4.95l-9.2 9.2a1.5 1.5 0 0 1-2.12-2.13l8.49-8.48" />
                </svg>
              </button>
              <input
                ref={attachmentInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleAttachmentSelect}
                style={{ display: "none" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              {errors.motivation
                ? <p style={errorStyle}>{errors.motivation}</p>
                : <span />}
              <span style={{ fontSize: 11, color: TEXT_SECONDARY }}>
                {form.motivation.length} chars
              </span>
            </div>
            <div style={s.attachmentRow}>
              {attachment ? (
                <>
                  <span style={s.attachmentName}>Attached: {attachment.name}</span>
                  <button type="button" onClick={clearAttachment} style={s.removeAttachmentBtn}>
                    Remove
                  </button>
                </>
              ) : (
                <span style={s.attachmentHint}>Optional: add supporting document (PDF, DOC, DOCX, TXT, max 5MB).</span>
              )}
            </div>
            {attachmentError && <p style={errorStyle}>{attachmentError}</p>}
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>
              LinkedIn / GitHub / Portfolio{" "}
              <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: TEXT_SECONDARY }}>
                — optional
              </span>
            </label>
            <input
              style={fieldStyle("portfolio")}
              value={form.portfolio}
              onChange={change("portfolio")}
              onFocus={() => setFocused("portfolio")}
              onBlur={() => setFocused(null)}
              placeholder="https://..."
            />
          </div>

          {/* Deadline notice */}
          <div style={s.deadlineBanner}>
            ⏰ <strong>Application deadline: 28th May 2026.</strong> Submit early — slots are limited.
            Questions? Email <a href="mailto:pearllabsug@gmail.com" style={{ color: ACCENT }}>pearllabsug@gmail.com</a>
          </div>

          {status === "error" && (
            <div style={s.errorBanner}>
              ⚠ {submitError || "We could not submit your application right now."} Please try again, or email us at{" "}
              <a href="mailto:pearllabsug@gmail.com" style={{ color: "#C0392B", fontWeight: 600 }}>
                pearllabsug@gmail.com
              </a>.
            </div>
          )}

          <div style={s.divider} />

          <button
            onClick={handleSubmit}
            disabled={status === "sending"}
            style={s.submitBtn}
          >
            {status === "sending" ? "Submitting..." : "Submit Application →"}
          </button>

          <p style={s.disclaimer}>
            By submitting you agree Pearl Labs may contact you regarding your application.
            Your data will not be shared with third parties.
          </p>
        </div>
      </div>

      {/* ── Footer strip ─────────────────────────────────────── */}
      <div style={s.footerStrip}>
        Pearl Labs × componentPulse · ICT Hub Nakawa, Kampala · 2026
        <span style={{ margin: "0 12px", opacity: 0.3 }}>|</span>
        Partners: Lwera Electronics · National ICT Innovation Hub
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page: {
    fontFamily: "'Inter', system-ui, sans-serif",
    background: BG,
    color: PRIMARY,
    minHeight: "100vh",
  },

  // Header
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    rowGap: 10,
    columnGap: 12,
    maxWidth: 800,
    margin: "0 auto",
    padding: "24px 32px",
  },
  navBack: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    textDecoration: "none",
    fontWeight: 500,
    flexShrink: 0,
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    flexWrap: "wrap" as const,
    gap: 7,
    fontSize: "clamp(10px, 2.2vw, 11px)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: TEXT_SECONDARY,
    border: `1px solid ${BORDER}`,
    borderRadius: 999,
    padding: "5px 14px",
    lineHeight: 1.35,
    whiteSpace: "normal" as const,
    maxWidth: "100%",
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: ACCENT,
    display: "inline-block",
  },

  // Hero
  hero: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "24px 32px 48px",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: ACCENT,
    marginBottom: 14,
    fontWeight: 600,
  },
  heroTitle: {
    fontSize: "clamp(40px, 7vw, 72px)",
    fontWeight: 800,
    lineHeight: 1.0,
    letterSpacing: "-0.03em",
    color: PRIMARY,
    marginBottom: 20,
  },
  heroItalic: {
    fontStyle: "italic",
    color: ACCENT,
  },
  heroSub: {
    fontSize: 15,
    lineHeight: 1.75,
    color: TEXT_SECONDARY,
    maxWidth: 520,
    marginBottom: 40,
  },
  statsRow: {
    display: "flex",
    gap: 40,
    flexWrap: "wrap" as const,
  },
  stat: { display: "flex", flexDirection: "column" as const, gap: 4 },
  statVal: {
    fontSize: 28,
    fontWeight: 800,
    color: ACCENT,
    lineHeight: 1,
    letterSpacing: "-0.02em",
  },
  statLbl: {
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: TEXT_SECONDARY,
  },

  // Form
  formWrap: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "0 32px 80px",
  },
  formCard: {
    background: "#fff",
    borderRadius: 16,
    border: `1px solid ${BORDER}`,
    padding: "40px 40px",
    boxShadow: "0 4px 40px rgba(0,45,91,0.06)",
  },
  formHeader: { marginBottom: 4 },
  formTitle: {
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "-0.02em",
    color: PRIMARY,
    marginBottom: 6,
  },
  formSub: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    lineHeight: 1.6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: ACCENT,
    marginBottom: 18,
  },
  divider: {
    height: 1,
    background: BORDER,
    margin: "28px 0",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
  },
  motivationWrap: {
    position: "relative" as const,
  },
  attachBtn: {
    position: "absolute" as const,
    right: 12,
    top: 12,
    width: 32,
    height: 32,
    borderRadius: 8,
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: ACCENT,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  attachmentRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 10,
  },
  attachmentHint: {
    fontSize: 11,
    color: TEXT_SECONDARY,
  },
  attachmentName: {
    fontSize: 12,
    color: PRIMARY,
    maxWidth: "80%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  removeAttachmentBtn: {
    border: `1px solid ${BORDER}`,
    background: "#fff",
    color: TEXT_SECONDARY,
    fontSize: 11,
    borderRadius: 999,
    padding: "5px 10px",
    cursor: "pointer",
  },

  // Submit
  submitBtn: {
    width: "100%",
    padding: "16px",
    background: ACCENT,
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.01em",
    border: "none",
    borderRadius: 8,
    transition: "background 0.18s",
  },
  disclaimer: {
    fontSize: 11,
    color: TEXT_SECONDARY,
    lineHeight: 1.7,
    textAlign: "center" as const,
    marginTop: 16,
  },
  errorBanner: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 13,
    color: "#C0392B",
    marginTop: 20,
  },
  deadlineBanner: {
    background: "#FFF8F0",
    border: `1px solid ${ACCENT}33`,
    borderRadius: 8,
    padding: "13px 16px",
    fontSize: 13,
    color: PRIMARY,
    lineHeight: 1.7,
    marginTop: 24,
  },

  // Success
  successWrap: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "120px 32px",
    textAlign: "center" as const,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: PRIMARY,
    color: "#fff",
    fontSize: 28,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 28px",
  },
  successTitle: {
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: PRIMARY,
    marginBottom: 16,
  },
  successText: {
    fontSize: 15,
    lineHeight: 1.75,
    color: TEXT_SECONDARY,
    marginBottom: 36,
  },
  backLink: {
    display: "inline-block",
    fontSize: 14,
    fontWeight: 600,
    color: ACCENT,
    textDecoration: "none",
  },

  // Footer
  footerStrip: {
    borderTop: `1px solid ${BORDER}`,
    textAlign: "center" as const,
    padding: "20px 32px",
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: TEXT_SECONDARY,
  },
};