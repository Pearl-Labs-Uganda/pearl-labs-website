"use client";

import { useState } from "react";
import Link from "next/link";
import { MODULE_NAMES, computeAmountDue, formatUgx } from "@/lib/fee";

// ── Brand tokens (Pearl Labs) ─────────────────────────────────
const GREEN      = "#002D5B";
const ORANGE     = "#EF8633";
const CREAM      = "#F4FAFF";
const TEXT_MUTED = "#4C616C";
const TEXT_LIGHT = "#4C616C";
const BORDER     = "rgba(0,45,91,0.12)";

const COHORTS = [
  "Cohort A — Explorers (Ages 9–13)",
  "Cohort B — Innovators (Ages 13–19)",
];

const HEAR_ABOUT_OPTIONS = [
  "Social Media",
  "Friend / Family Referral",
  "School",
  "Flyer / Poster",
  "Other",
];

interface FormState {
  // Section 1: Parent / Guardian
  parentName: string;
  relationship: string;
  profession: string;
  phone: string;
  altPhone: string;
  email: string;
  address: string;
  // Section 2: Student
  studentName: string;
  age: string;
  gender: string;
  school: string;
  classGrade: string;
  cohort: string;
  hasLaptop: string;
  // Section 3: Programme selection
  modules: string[];
  hearAbout: string;
  hearAboutOther: string;
  // Section 4: Drop-off & pick-up
  pickupService: string;
  pickupLocation: string;
  // Section 5: Medical
  medicalInfo: string;
  additionalInfo: string;
  // Section 6: Consent
  agreeTerms: boolean;
  photoConsent: string;
}

const INITIAL: FormState = {
  parentName: "", relationship: "", profession: "", phone: "", altPhone: "",
  email: "", address: "",
  studentName: "", age: "", gender: "", school: "", classGrade: "",
  cohort: "", hasLaptop: "",
  modules: [], hearAbout: "", hearAboutOther: "",
  pickupService: "", pickupLocation: "",
  medicalInfo: "", additionalInfo: "",
  agreeTerms: false, photoConsent: "",
};

type Status = "idle" | "sending" | "sent" | "error";
type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function InternshipApply() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string>("");
  const [focused, setFocused] = useState<string | null>(null);

  // ── Validation ──────────────────────────────────────────────
  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!form.parentName.trim())   e.parentName = "Required";
    if (!form.relationship.trim()) e.relationship = "Required";
    if (!form.profession.trim())   e.profession = "Required";
    if (!form.phone.trim())        e.phone = "Required";
    if (!form.email.trim())        e.email = "Required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.address.trim())      e.address = "Required";

    if (!form.studentName.trim())  e.studentName = "Required";
    if (!form.age.trim())          e.age = "Required";
    if (!form.gender)              e.gender = "Required";
    if (!form.school.trim())       e.school = "Required";
    if (!form.classGrade.trim())   e.classGrade = "Required";
    if (!form.cohort)              e.cohort = "Required";
    if (!form.hasLaptop)           e.hasLaptop = "Required";

    if (form.modules.length === 0) e.modules = "Select at least one module";
    if (!form.hearAbout)           e.hearAbout = "Required";
    if (form.hearAbout === "Other" && !form.hearAboutOther.trim())
      e.hearAboutOther = "Please tell us how you heard about us";

    if (!form.pickupService)       e.pickupService = "Required";
    if (form.pickupService === "Yes" && !form.pickupLocation.trim())
      e.pickupLocation = "Required";

    if (!form.agreeTerms)          e.agreeTerms = "You must agree to continue";
    if (!form.photoConsent)        e.photoConsent = "Required";

    return e;
  };

  const change = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

  const toggleModule = (name: string) => {
    setForm(prev => ({
      ...prev,
      modules: prev.modules.includes(name)
        ? prev.modules.filter(m => m !== name)
        : [...prev.modules, name],
    }));
    if (errors.modules) setErrors(prev => ({ ...prev, modules: undefined }));
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setStatus("sending");
    setSubmitError("");

    try {
      const response = await fetch("/api/internship-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to submit registration");
      }

      setStatus("sent");
      setForm(INITIAL);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit registration";
      setSubmitError(message);
      setStatus("error");
    }
  };

  // ── Field style helpers ─────────────────────────────────────
  const fieldStyle = (name: string, extra: React.CSSProperties = {}): React.CSSProperties => ({
    width: "100%",
    padding: "13px 16px",
    fontSize: 14,
    fontFamily: "inherit",
    color: GREEN,
    background: focused === name ? "#fff" : CREAM,
    border: `1.5px solid ${errors[name as keyof FormState] ? "#C0392B" : focused === name ? ORANGE : BORDER}`,
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
    color: TEXT_MUTED,
    marginBottom: 7,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 11,
    color: "#C0392B",
    marginTop: 4,
  };

  // Small helper to render a labelled <select>
  const renderSelect = (
    field: keyof FormState,
    label: string,
    options: string[],
    placeholder = "Select…",
  ) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <select
        style={fieldStyle(field)}
        value={form[field] as string}
        onChange={change(field)}
        onFocus={() => setFocused(field)}
        onBlur={() => setFocused(null)}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {errors[field] && <p style={errorStyle}>{errors[field]}</p>}
    </div>
  );

  // ── Success screen ───────────────────────────────────────────
  if (status === "sent") {
    return (
      <div style={s.page}>
        <div style={s.successWrap}>
          <div style={s.successIcon}>✓</div>
          <h2 style={s.successTitle}>Registration Sent!</h2>
          <p style={s.successText}>
            Your bootcamp registration has been submitted successfully.
            Our team will review it and reach out using your provided contact details
            to confirm the spot and payment.
            For urgent questions, email us at{" "}
            <a href="mailto:pearllabsug@gmail.com" style={{ color: ORANGE }}>
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
          24 Aug – 4 Sep 2026 · National ICT Hub, Nakawa
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={s.hero}>
        <p style={s.eyebrow}>Deep Tech Bootcamp · Register a Student</p>
        <h1 style={s.heroTitle}>
          Secure Your<br />
          <em style={s.heroItalic}>Child&apos;s Spot</em>
        </h1>
        <p style={s.heroSub}>
          Pearl AI Labs, in partnership with Lwera Electronics &amp; Semi-conductors
          and the National ICT Innovation Hub, is opening registration
          for the Deep Tech Bootcamp — AI &amp; Coding, Robotics, and Aerospace CAD
          &amp; 3D Printing. Held at National ICT Hub, Nakawa.
        </p>

        <div style={s.statsRow}>
          {[
            { v: "UGX 500K", l: "Per Module" },
            { v: "Mon–Sat",  l: "Schedule" },
            { v: "Nakawa",   l: "ICT Hub" },
            { v: "9–19",     l: "Ages" },
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
            <h2 style={s.formTitle}>Registration Form</h2>
            <p style={s.formSub}>Fields marked with an asterisk (*) are required.</p>
          </div>

          <div style={s.divider} />

          {/* Section 1: Parent / Guardian */}
          <p style={s.sectionLabel}>1. Parent / Guardian Information</p>
          <div style={s.row2}>
            <div>
              <label style={labelStyle}>Parent/Guardian Full Name *</label>
              <input
                style={fieldStyle("parentName")}
                value={form.parentName}
                onChange={change("parentName")}
                onFocus={() => setFocused("parentName")}
                onBlur={() => setFocused(null)}
                placeholder="e.g. Jane Namubiru"
              />
              {errors.parentName && <p style={errorStyle}>{errors.parentName}</p>}
            </div>
            <div>
              <label style={labelStyle}>Relationship to Student *</label>
              <input
                style={fieldStyle("relationship")}
                value={form.relationship}
                onChange={change("relationship")}
                onFocus={() => setFocused("relationship")}
                onBlur={() => setFocused(null)}
                placeholder="e.g. Mother, Father, Guardian"
              />
              {errors.relationship && <p style={errorStyle}>{errors.relationship}</p>}
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Profession *</label>
            <input
              style={fieldStyle("profession")}
              value={form.profession}
              onChange={change("profession")}
              onFocus={() => setFocused("profession")}
              onBlur={() => setFocused(null)}
            />
            {errors.profession && <p style={errorStyle}>{errors.profession}</p>}
          </div>

          <div style={{ ...s.row2, marginTop: 20 }}>
            <div>
              <label style={labelStyle}>Primary Phone Number *</label>
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
            <div>
              <label style={labelStyle}>Alternative Phone Number</label>
              <input
                style={fieldStyle("altPhone")}
                value={form.altPhone}
                onChange={change("altPhone")}
                onFocus={() => setFocused("altPhone")}
                onBlur={() => setFocused(null)}
                placeholder="Optional"
              />
            </div>
          </div>

          <div style={{ ...s.row2, marginTop: 20 }}>
            <div>
              <label style={labelStyle}>Email Address *</label>
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
            <div>
              <label style={labelStyle}>Home Address *</label>
              <input
                style={fieldStyle("address")}
                value={form.address}
                onChange={change("address")}
                onFocus={() => setFocused("address")}
                onBlur={() => setFocused(null)}
              />
              {errors.address && <p style={errorStyle}>{errors.address}</p>}
            </div>
          </div>

          <div style={s.divider} />

          {/* Section 2: Student */}
          <p style={s.sectionLabel}>2. Student Information</p>
          <div style={s.row2}>
            <div>
              <label style={labelStyle}>Student Full Name *</label>
              <input
                style={fieldStyle("studentName")}
                value={form.studentName}
                onChange={change("studentName")}
                onFocus={() => setFocused("studentName")}
                onBlur={() => setFocused(null)}
              />
              {errors.studentName && <p style={errorStyle}>{errors.studentName}</p>}
            </div>
            <div>
              <label style={labelStyle}>Age *</label>
              <input
                style={fieldStyle("age")}
                value={form.age}
                onChange={change("age")}
                onFocus={() => setFocused("age")}
                onBlur={() => setFocused(null)}
                placeholder="e.g. 10, 14"
              />
              {errors.age && <p style={errorStyle}>{errors.age}</p>}
            </div>
          </div>

          <div style={{ ...s.row2, marginTop: 20 }}>
            {renderSelect("gender", "Gender *", ["Male", "Female"])}
            <div>
              <label style={labelStyle}>School Name *</label>
              <input
                style={fieldStyle("school")}
                value={form.school}
                onChange={change("school")}
                onFocus={() => setFocused("school")}
                onBlur={() => setFocused(null)}
              />
              {errors.school && <p style={errorStyle}>{errors.school}</p>}
            </div>
          </div>

          <div style={{ ...s.row2, marginTop: 20 }}>
            <div>
              <label style={labelStyle}>Class / Grade *</label>
              <input
                style={fieldStyle("classGrade")}
                value={form.classGrade}
                onChange={change("classGrade")}
                onFocus={() => setFocused("classGrade")}
                onBlur={() => setFocused(null)}
              />
              {errors.classGrade && <p style={errorStyle}>{errors.classGrade}</p>}
            </div>
            {renderSelect("cohort", "Which cohort does the student fall under? *", COHORTS)}
          </div>

          <div style={{ marginTop: 20 }}>
            {renderSelect(
              "hasLaptop",
              "Does the student have a laptop? *",
              ["Yes", "No — Pearl AI Labs will provide a computer"],
            )}
          </div>

          <div style={s.divider} />

          {/* Section 3: Programme selection */}
          <p style={s.sectionLabel}>3. Programme Selection</p>
          <p style={s.sectionHint}>
            Select one or more modules. Fee: UGX 500,000 per module, discounted
            to UGX 450,000 per module when enrolling in two or more.
          </p>

          <label style={labelStyle}>Which module(s) would you like the student to join? *</label>
          <div style={s.moduleGroup}>
            {MODULE_NAMES.map((name) => (
              <label key={name} style={s.moduleRow}>
                <input
                  type="checkbox"
                  checked={form.modules.includes(name)}
                  onChange={() => toggleModule(name)}
                  style={s.checkbox}
                />
                <span>{name}</span>
              </label>
            ))}
          </div>
          {errors.modules && <p style={errorStyle}>{errors.modules}</p>}

          <div style={s.amountBox}>
            <span style={s.amountLabel}>Amount Due</span>
            <span style={s.amountValue}>{formatUgx(computeAmountDue(form.modules))}</span>
          </div>

          <div style={{ marginTop: 20 }}>
            {renderSelect("hearAbout", "How did you hear about us? *", HEAR_ABOUT_OPTIONS)}
          </div>

          {form.hearAbout === "Other" && (
            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>Please specify</label>
              <input
                style={fieldStyle("hearAboutOther")}
                value={form.hearAboutOther}
                onChange={change("hearAboutOther")}
                onFocus={() => setFocused("hearAboutOther")}
                onBlur={() => setFocused(null)}
              />
              {errors.hearAboutOther && <p style={errorStyle}>{errors.hearAboutOther}</p>}
            </div>
          )}

          <div style={s.divider} />

          {/* Section 4: Drop-off & pick-up */}
          <p style={s.sectionLabel}>4. Drop-off &amp; Pick-up Service</p>
          <p style={s.sectionHint}>
            We offer drop-off and pick-up services for students attending the training.
          </p>
          {renderSelect(
            "pickupService",
            "Would you like to use our drop-off and pick-up service? *",
            ["Yes", "No"],
          )}

          {form.pickupService === "Yes" && (
            <div style={{ marginTop: 20 }}>
              <label style={labelStyle}>Pick-up Location</label>
              <input
                style={fieldStyle("pickupLocation")}
                value={form.pickupLocation}
                onChange={change("pickupLocation")}
                onFocus={() => setFocused("pickupLocation")}
                onBlur={() => setFocused(null)}
                placeholder="Share your child's pick-up location"
              />
              {errors.pickupLocation && <p style={errorStyle}>{errors.pickupLocation}</p>}
            </div>
          )}

          <div style={s.divider} />

          {/* Section 5: Medical */}
          <p style={s.sectionLabel}>5. Medical Information</p>
          <div>
            <label style={labelStyle}>
              Does your child have any allergies, medical conditions, or special needs we should be aware of?
            </label>
            <textarea
              style={fieldStyle("medicalInfo", { minHeight: 90, resize: "vertical" })}
              value={form.medicalInfo}
              onChange={change("medicalInfo")}
              onFocus={() => setFocused("medicalInfo")}
              onBlur={() => setFocused(null)}
            />
          </div>
          <div style={{ marginTop: 20 }}>
            <label style={labelStyle}>Any additional information you&apos;d like us to know?</label>
            <textarea
              style={fieldStyle("additionalInfo", { minHeight: 90, resize: "vertical" })}
              value={form.additionalInfo}
              onChange={change("additionalInfo")}
              onFocus={() => setFocused("additionalInfo")}
              onBlur={() => setFocused(null)}
            />
          </div>

          <div style={s.divider} />

          {/* Section 6: Consent */}
          <p style={s.sectionLabel}>6. Consent &amp; Confirmation</p>

          <label style={s.checkboxRow}>
            <input
              type="checkbox"
              checked={form.agreeTerms}
              onChange={(e) => {
                setForm(prev => ({ ...prev, agreeTerms: e.target.checked }));
                if (errors.agreeTerms) setErrors(prev => ({ ...prev, agreeTerms: undefined }));
              }}
              style={s.checkbox}
            />
            <span>
              I confirm the information provided above is accurate and I agree to enrol
              my child in the Pearl AI Labs Deep Tech Bootcamp. *
            </span>
          </label>
          {errors.agreeTerms && <p style={errorStyle}>{errors.agreeTerms}</p>}

          <div style={{ marginTop: 18 }}>
            {renderSelect(
              "photoConsent",
              "I consent to my child being photographed / recorded during the program for promotional use by Pearl AI Labs / Lwera Electronics & Semi-conductors. *",
              ["Yes", "No"],
            )}
          </div>

          <p style={s.paymentNote}>
            Payment of UGX 500,000/module (UGX 450,000/module for 2+ modules)
            confirms your child&apos;s spot.
            Contact: <strong>pearllabsug@gmail.com</strong> · <strong>+256 763 839356</strong>
          </p>

          {status === "error" && (
            <p style={s.submitErrorText}>{submitError}</p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={status === "sending"}
            style={{
              ...s.submitBtn,
              opacity: status === "sending" ? 0.7 : 1,
              cursor: status === "sending" ? "wait" : "pointer",
            }}
          >
            {status === "sending" ? "Submitting…" : "Submit Registration →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Inter', system-ui, sans-serif", background: CREAM, color: "#111D23", minHeight: "100vh" },
  header: { maxWidth: 760, margin: "0 auto", padding: "32px 32px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  navBack: { fontSize: 13, fontWeight: 600, color: GREEN, textDecoration: "none" },
  pill: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_MUTED, border: `1px solid ${BORDER}`, borderRadius: 999, padding: "5px 14px" },
  pillDot: { width: 6, height: 6, borderRadius: "50%", background: ORANGE, display: "inline-block" },
  hero: { maxWidth: 760, margin: "0 auto", padding: "40px 32px 56px" },
  eyebrow: { fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: ORANGE, marginBottom: 14, fontWeight: 600 },
  heroTitle: { fontSize: "clamp(40px, 7vw, 68px)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.03em", color: GREEN, marginBottom: 20 },
  heroItalic: { fontStyle: "italic", color: ORANGE },
  heroSub: { fontSize: 15, lineHeight: 1.75, color: TEXT_MUTED, maxWidth: 560, marginBottom: 36 },
  statsRow: { display: "flex", gap: 40, flexWrap: "wrap" },
  stat: { display: "flex", flexDirection: "column", gap: 4 },
  statVal: { fontSize: 22, fontWeight: 800, color: ORANGE, lineHeight: 1, letterSpacing: "-0.01em" },
  statLbl: { fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_LIGHT },
  formWrap: { maxWidth: 760, margin: "0 auto", padding: "0 32px 96px" },
  formCard: { background: "#fff", borderRadius: 16, padding: "40px", border: `1px solid ${BORDER}`, boxShadow: "0 8px 44px rgba(0,45,91,0.07)" },
  formHeader: { marginBottom: 24 },
  formTitle: { fontSize: 24, fontWeight: 800, color: GREEN, letterSpacing: "-0.01em" },
  formSub: { fontSize: 13, color: TEXT_MUTED, marginTop: 6 },
  divider: { height: 1, background: BORDER, margin: "28px 0" },
  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN, marginBottom: 6 },
  sectionHint: { fontSize: 13, color: TEXT_MUTED, marginBottom: 18, lineHeight: 1.6 },
  row2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 },
  checkboxRow: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, cursor: "pointer" },
  checkbox: { marginTop: 3, width: 16, height: 16, accentColor: ORANGE, flexShrink: 0, cursor: "pointer" },
  moduleGroup: { display: "flex", flexDirection: "column", gap: 10, marginTop: 8 },
  moduleRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: GREEN, fontWeight: 500, cursor: "pointer", padding: "12px 16px", background: CREAM, border: `1.5px solid ${BORDER}`, borderRadius: 8 },
  amountBox: { display: "flex", justifyContent: "space-between", alignItems: "center", background: GREEN, borderRadius: 10, padding: "16px 20px", marginTop: 18 },
  amountLabel: { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(244,250,255,0.7)", fontWeight: 700 },
  amountValue: { fontSize: 20, fontWeight: 800, color: "#fff" },
  paymentNote: { fontSize: 12.5, color: TEXT_MUTED, lineHeight: 1.7, marginTop: 28, padding: "14px 16px", background: CREAM, borderRadius: 8, border: `1px solid ${BORDER}` },
  submitErrorText: { fontSize: 13, color: "#C0392B", marginTop: 16 },
  submitBtn: { width: "100%", marginTop: 20, padding: "15px", background: ORANGE, color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: "0.01em", border: "none", borderRadius: 8, textAlign: "center" },
  successWrap: { maxWidth: 480, margin: "0 auto", padding: "120px 32px", textAlign: "center" },
  successIcon: { width: 64, height: 64, borderRadius: "50%", background: "#E9F6EE", color: "#1E7B45", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" },
  successTitle: { fontSize: 26, fontWeight: 800, color: GREEN, marginBottom: 14 },
  successText: { fontSize: 14, lineHeight: 1.75, color: TEXT_MUTED, marginBottom: 28 },
  backLink: { fontSize: 13, fontWeight: 600, color: ORANGE, textDecoration: "none" },
};
