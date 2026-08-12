"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { MODULE_NAMES, computeAmountDue, formatUgx } from "@/lib/fee";
import { trackEvent } from "@/lib/analytics";

const MERCHANT_CODE = "07778381";

const DRAFT_KEY = "pearlLabsBootcampDraft";

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

// Pearl AI Labs is deliberately absent — this is already the Pearl Labs site.
const PARTNERS = [
  { name: "Lwera Electronics & Semi-conductors", logo: "/logos/lwera.png" },
  { name: "National ICT Innovation Hub", logo: "/logos/national-ict-hub.png" },
  { name: "AeRoCAD Learners", logo: "/logos/aerocad.png" },
  { name: "Kate D", logo: "/logos/kate-d.png" },
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
  // Section 4: Payment
  transactionId: string;
  // Section 5: Drop-off & pick-up
  pickupService: string;
  pickupLocation: string;
  // Section 6: Medical
  medicalInfo: string;
  additionalInfo: string;
  // Section 7: Consent
  agreeTerms: boolean;
  photoConsent: string;
}

const INITIAL: FormState = {
  parentName: "", relationship: "", profession: "", phone: "", altPhone: "",
  email: "", address: "",
  studentName: "", age: "", gender: "", school: "", classGrade: "",
  cohort: "", hasLaptop: "",
  modules: [], hearAbout: "", hearAboutOther: "",
  transactionId: "",
  pickupService: "", pickupLocation: "",
  medicalInfo: "", additionalInfo: "",
  agreeTerms: false, photoConsent: "",
};

type Status = "idle" | "sending" | "saved" | "sent" | "error";
type FieldErrors = Partial<Record<keyof FormState, string>>;

interface Draft {
  form: FormState;
  registrationId: number | null;
}

export default function InternshipApply() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string>("");
  const [focused, setFocused] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const loadedDraft = useRef(false);
  const formStarted = useRef(false);

  // Fires once per visit, on the first field the visitor touches — pairs with
  // form_submitted in handleSubmit to build a start-to-finish funnel in GA4.
  const handleFieldFocus = (field: string) => {
    setFocused(field);
    if (!formStarted.current) {
      formStarted.current = true;
      trackEvent("form_started");
    }
  };

  // ── Track the visit — top of the visit → started → submitted funnel ──
  useEffect(() => {
    trackEvent("apply_view");
  }, []);

  // ── Load any saved draft on mount ────────────────────────────
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Draft;
        setForm({ ...INITIAL, ...draft.form });
        setRegistrationId(draft.registrationId ?? null);
      }
    } catch {
      // Ignore a corrupted or inaccessible draft — start fresh.
    } finally {
      loadedDraft.current = true;
    }
  }, []);

  // ── Persist the draft on every change, once the initial load has run ──
  useEffect(() => {
    if (!loadedDraft.current) return;
    const draft: Draft = { form, registrationId };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [form, registrationId]);

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

  const copyMerchantCode = () => {
    navigator.clipboard.writeText(MERCHANT_CODE).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
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

  const startNewRegistration = () => {
    window.localStorage.removeItem(DRAFT_KEY);
    setForm(INITIAL);
    setRegistrationId(null);
    setErrors({});
    setStatus("idle");
    setSubmitError("");
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setStatus("sending");
    setSubmitError("");

    const hasTransactionId = Boolean(form.transactionId.trim());

    try {
      const response = await fetch("/api/internship-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: registrationId ?? undefined }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to submit registration");
      }

      const data = (await response.json()) as { ok: boolean; id: number };
      trackEvent("form_submitted", { has_payment: hasTransactionId });

      if (hasTransactionId) {
        window.localStorage.removeItem(DRAFT_KEY);
        setForm(INITIAL);
        setRegistrationId(null);
        setStatus("sent");
      } else {
        setRegistrationId(data.id);
        setStatus("saved");
      }
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
        onFocus={() => handleFieldFocus(field)}
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

  // Matching helper for a labelled <input>, so the row layout below stays readable
  const renderInput = (
    field: keyof FormState,
    label: string,
    opts: { placeholder?: string; type?: string } = {},
  ) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        style={fieldStyle(field)}
        type={opts.type ?? "text"}
        value={form[field] as string}
        onChange={change(field)}
        onFocus={() => handleFieldFocus(field)}
        onBlur={() => setFocused(null)}
        placeholder={opts.placeholder}
      />
      {errors[field] && <p style={errorStyle}>{errors[field]}</p>}
    </div>
  );

  const renderTextarea = (field: keyof FormState, label: string) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <textarea
        style={fieldStyle(field, { minHeight: 90, resize: "vertical" })}
        value={form[field] as string}
        onChange={change(field)}
        onFocus={() => handleFieldFocus(field)}
        onBlur={() => setFocused(null)}
      />
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
        <Link href="/bootcamps" style={s.navBack}>← pearllabs.ug</Link>
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

        {/* Partner logos — the paragraph above already names them, so no label here.
            Reuses the sitewide fadeUp keyframe (globals.css) that the Hero uses,
            staggered per logo so new entries in PARTNERS need no extra CSS. */}
        <div style={s.partnersRow}>
          {PARTNERS.map((p, i) => (
            <img
              key={p.name}
              src={p.logo}
              alt={p.name}
              className="animate-fade-up"
              style={{ ...s.partnerLogo, animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>

        <div style={s.statsRow}>
          {[
            { v: "30",       l: "Spots" },
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

      {/* ── Open House banner ───────────────────────────────── */}
      <div style={s.tourWrap}>
        <div style={s.tourCard}>
          <span style={s.tourPill}>
            <span style={s.pillDot} />
            Open House · Parents &amp; Students Welcome
          </span>
          <h3 style={s.tourTitle}>
            Come See Where <em style={s.tourItalic}>They&apos;ll Be Learning</em>
          </h3>
          <p style={s.tourText}>
            Two days before the bootcamp begins, we&apos;re opening the lab so
            you can see it for yourself. Walk through the space your child
            would be training in at National ICT Hub, Nakawa, and have a look
            at the equipment up close — the 3D printer and the robotics car
            included. Bring the children along. No booking, nothing to pay —
            just come through.
          </p>
          <div style={s.tourFacts}>
            <div style={s.tourFact}>
              <div style={s.tourFactLabel}>Date</div>
              <div style={s.tourFactValue}>Sat, 22 Aug 2026</div>
            </div>
            <div style={s.tourFact}>
              <div style={s.tourFactLabel}>Time</div>
              <div style={s.tourFactValue}>9:00am – 12:00pm</div>
            </div>
            <div style={s.tourFact}>
              <div style={s.tourFactLabel}>Venue</div>
              <div style={s.tourFactValue}>National ICT Hub, Nakawa</div>
            </div>
            <div style={s.tourFact}>
              <div style={s.tourFactLabel}>Entry</div>
              <div style={s.tourFactValue}>Free · No booking</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form card ────────────────────────────────────────── */}
      <div style={s.formWrap}>
        <div style={s.formCard}>

          <div style={s.formHeader}>
            <h2 style={s.formTitle}>Registration Form</h2>
            <p style={s.formSub}>
              Fields marked with an asterisk (*) are required. Your answers
              save automatically on this device, so it&apos;s safe to close
              this page and pick up where you left off later.
            </p>
          </div>

          {registrationId !== null && (
            <div style={s.draftBanner}>
              <span>Your progress is saved on this device.</span>
              <button type="button" onClick={startNewRegistration} style={s.draftBannerLink}>
                Start a new registration
              </button>
            </div>
          )}

          {status === "saved" && (
            <div style={s.savedBanner}>
              Registration saved — once you&apos;ve paid via MTN MoMo, come back
              to this page (your details will still be here), add your
              Transaction ID below, and submit again to complete your spot.
            </div>
          )}

          <div style={s.divider} />

          {/* Section 1: Parent / Guardian */}
          <p style={s.sectionLabel}>1. Parent / Guardian Information</p>
          <div style={s.row3}>
            {renderInput("parentName", "Full Name *", { placeholder: "e.g. Jane Namubiru" })}
            {renderInput("relationship", "Relationship *", { placeholder: "e.g. Mother, Guardian" })}
            {renderInput("profession", "Profession *")}
          </div>
          <div style={{ ...s.row3, marginTop: 18 }}>
            {renderInput("phone", "Primary Phone *", { placeholder: "+256 7XX XXX XXX" })}
            {renderInput("altPhone", "Alt. Phone", { placeholder: "Optional" })}
            {renderInput("email", "Email Address *", { type: "email", placeholder: "you@example.com" })}
          </div>
          <div style={{ marginTop: 18 }}>
            {renderInput("address", "Home Address *")}
          </div>

          <div style={s.divider} />

          {/* Section 2: Student */}
          <p style={s.sectionLabel}>2. Student Information</p>
          <div style={s.row3}>
            {renderInput("studentName", "Student Name *")}
            {renderInput("age", "Age *", { placeholder: "e.g. 10, 14" })}
            {renderSelect("gender", "Gender *", ["Male", "Female"])}
          </div>
          <div style={{ ...s.row3, marginTop: 18 }}>
            {renderInput("school", "School Name *")}
            {renderInput("classGrade", "Class / Grade *")}
            {renderSelect("cohort", "Cohort *", COHORTS)}
          </div>
          <div style={{ marginTop: 18 }}>
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

          <div style={{ ...s.row2, marginTop: 18 }}>
            {renderSelect("hearAbout", "How did you hear about us? *", HEAR_ABOUT_OPTIONS)}
            {form.hearAbout === "Other" && renderInput("hearAboutOther", "Please specify *")}
          </div>

          <div style={s.divider} />

          {/* Section 4: Payment */}
          <p style={s.sectionLabel}>4. Payment</p>

          <div style={{ ...s.row2, marginTop: 16 }}>
            <div style={s.amountBox}>
              <span style={s.amountLabel}>Amount Due</span>
              <span style={s.amountValue}>{formatUgx(computeAmountDue(form.modules))}</span>
            </div>
            <div>
              <button
                type="button"
                onClick={copyMerchantCode}
                style={s.merchantCodeBox}
              >
                <span style={s.merchantCodeLabel}>Merchant Code</span>
                <span style={s.merchantCodeRight}>
                  <span style={s.merchantCodeValue}>{MERCHANT_CODE}</span>
                  {codeCopied ? (
                    <Check size={18} color={ORANGE} />
                  ) : (
                    <Copy size={18} color={ORANGE} />
                  )}
                </span>
              </button>
              {codeCopied && <p style={s.copiedHint}>Copied!</p>}
            </div>
          </div>

          <p style={s.paymentInstructions}>
            Dial <strong>*165*3#</strong> on the parent/guardian&apos;s MTN line,
            select <strong>Pay Merchant / Pay Bill</strong>, then enter the
            merchant code above, the amount above, and confirm with your MTN
            MoMo PIN.
          </p>

          <div style={{ marginTop: 18 }}>
            {renderInput("transactionId", "Transaction ID", {
              placeholder: "e.g. from your MTN MoMo confirmation SMS",
            })}
            <p style={s.fieldHint}>
              Don&apos;t have it yet? Leave this blank and submit — your
              details are saved, so you can come back and add it once
              you&apos;ve paid.
            </p>
          </div>

          <div style={s.divider} />

          {/* Section 5: Drop-off & pick-up */}
          <p style={s.sectionLabel}>5. Drop-off &amp; Pick-up Service</p>
          <p style={s.sectionHint}>
            We offer drop-off and pick-up services for students attending the training.
          </p>
          <div style={s.row2}>
            {renderSelect(
              "pickupService",
              "Use our drop-off and pick-up service? *",
              ["Yes", "No"],
            )}
            {form.pickupService === "Yes" &&
              renderInput("pickupLocation", "Pick-up Location *", {
                placeholder: "Share your child's pick-up location",
              })}
          </div>

          <div style={s.divider} />

          {/* Section 6: Medical */}
          <p style={s.sectionLabel}>6. Medical Information</p>
          <div style={s.row2}>
            {renderTextarea("medicalInfo", "Allergies, medical conditions, or special needs?")}
            {renderTextarea("additionalInfo", "Anything else you'd like us to know?")}
          </div>

          <div style={s.divider} />

          {/* Section 6: Consent */}
          <p style={s.sectionLabel}>7. Consent &amp; Confirmation</p>

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
              "I consent to my child being photographed / recorded during the programme for promotional use by Pearl AI Labs / Lwera Electronics & Semi-conductors. *",
              ["Yes", "No"],
            )}
          </div>

          <p style={s.paymentNote}>
            Payment confirms your child&apos;s spot.
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
  partnersRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: "16px 26px", marginTop: -14, marginBottom: 38 },
  partnerLogo: { height: 40, width: "auto", maxWidth: 185, objectFit: "contain", flexShrink: 0 },
  hero: { maxWidth: 760, margin: "0 auto", padding: "40px 32px 56px" },
  eyebrow: { fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: ORANGE, marginBottom: 14, fontWeight: 600 },
  heroTitle: { fontSize: "clamp(40px, 7vw, 68px)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.03em", color: GREEN, marginBottom: 20 },
  heroItalic: { fontStyle: "italic", color: ORANGE },
  heroSub: { fontSize: 15, lineHeight: 1.75, color: TEXT_MUTED, maxWidth: 560, marginBottom: 36 },
  statsRow: { display: "flex", gap: 40, flexWrap: "wrap" },
  stat: { display: "flex", flexDirection: "column", gap: 4 },
  statVal: { fontSize: 22, fontWeight: 800, color: ORANGE, lineHeight: 1, letterSpacing: "-0.01em" },
  statLbl: { fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: TEXT_LIGHT },
  tourWrap: { maxWidth: 760, margin: "0 auto", padding: "0 32px 48px" },
  tourCard: { background: GREEN, borderRadius: 16, padding: "36px 40px" },
  tourPill: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#F4FAFF", border: "1px solid rgba(244,250,255,0.25)", borderRadius: 999, padding: "5px 14px", marginBottom: 18, fontWeight: 600 },
  tourTitle: { fontSize: "clamp(22px, 3.4vw, 30px)", fontWeight: 800, letterSpacing: "-0.01em", color: "#F4FAFF", lineHeight: 1.25, marginBottom: 14 },
  tourItalic: { fontStyle: "italic", color: ORANGE },
  tourText: { fontSize: 14, lineHeight: 1.75, color: "rgba(244,250,255,0.72)", maxWidth: 560, marginBottom: 28 },
  tourFacts: { display: "flex", gap: 32, flexWrap: "wrap", borderTop: "1px solid rgba(244,250,255,0.15)", paddingTop: 22 },
  tourFact: { display: "flex", flexDirection: "column", gap: 4 },
  tourFactLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: ORANGE },
  tourFactValue: { fontSize: 13.5, fontWeight: 600, color: "#F4FAFF" },
  formWrap: { maxWidth: 760, margin: "0 auto", padding: "0 32px 96px" },
  formCard: { background: "#fff", borderRadius: 16, padding: "40px", border: `1px solid ${BORDER}`, boxShadow: "0 8px 44px rgba(0,45,91,0.07)" },
  formHeader: { marginBottom: 24 },
  formTitle: { fontSize: 24, fontWeight: 800, color: GREEN, letterSpacing: "-0.01em" },
  formSub: { fontSize: 13, color: TEXT_MUTED, marginTop: 6, lineHeight: 1.6, maxWidth: 480 },
  draftBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 12.5, color: TEXT_MUTED, background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", marginTop: 16 },
  draftBannerLink: { background: "none", border: "none", color: ORANGE, fontWeight: 600, fontSize: 12.5, cursor: "pointer", padding: 0, textDecoration: "underline" },
  savedBanner: { fontSize: 13, color: GREEN, lineHeight: 1.6, background: "#FFF6EC", border: `1px solid ${ORANGE}`, borderRadius: 8, padding: "14px 16px", marginTop: 16 },
  divider: { height: 1, background: BORDER, margin: "24px 0" },
  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: GREEN, marginBottom: 6 },
  sectionHint: { fontSize: 13, color: TEXT_MUTED, marginBottom: 14, lineHeight: 1.6 },
  row2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 },
  row3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: 18 },
  checkboxRow: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6, cursor: "pointer" },
  checkbox: { marginTop: 3, width: 16, height: 16, accentColor: ORANGE, flexShrink: 0, cursor: "pointer" },
  moduleGroup: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginTop: 8 },
  moduleRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: GREEN, fontWeight: 500, cursor: "pointer", padding: "12px 14px", background: CREAM, border: `1.5px solid ${BORDER}`, borderRadius: 8, lineHeight: 1.35 },
  amountBox: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: GREEN, borderRadius: 10, padding: "16px 20px" },
  amountLabel: { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(244,250,255,0.7)", fontWeight: 700 },
  amountValue: { fontSize: 20, fontWeight: 800, color: "#fff" },
  paymentInstructions: { fontSize: 13.5, color: TEXT_MUTED, lineHeight: 1.8, background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 16px", marginTop: 14 },
  merchantCodeBox: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "#FFF6EC", border: `1.5px solid ${ORANGE}`, borderRadius: 10, padding: "14px 20px", width: "100%", height: "100%", cursor: "pointer", font: "inherit" },
  merchantCodeLabel: { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: ORANGE, fontWeight: 700 },
  merchantCodeRight: { display: "flex", alignItems: "center", gap: 10 },
  merchantCodeValue: { fontSize: 22, fontWeight: 800, color: GREEN, letterSpacing: "0.08em", fontFamily: "monospace" },
  copiedHint: { fontSize: 12, color: ORANGE, fontWeight: 600, marginTop: 6, textAlign: "right" },
  fieldHint: { fontSize: 11.5, color: TEXT_MUTED, marginTop: 6, lineHeight: 1.6 },
  paymentNote: { fontSize: 12.5, color: TEXT_MUTED, lineHeight: 1.7, marginTop: 28, padding: "14px 16px", background: CREAM, borderRadius: 8, border: `1px solid ${BORDER}` },
  submitErrorText: { fontSize: 13, color: "#C0392B", marginTop: 16 },
  submitBtn: { width: "100%", marginTop: 20, padding: "15px", background: ORANGE, color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: "0.01em", border: "none", borderRadius: 8, textAlign: "center" },
  successWrap: { maxWidth: 480, margin: "0 auto", padding: "120px 32px", textAlign: "center" },
  successIcon: { width: 64, height: 64, borderRadius: "50%", background: "#E9F6EE", color: "#1E7B45", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" },
  successTitle: { fontSize: 26, fontWeight: 800, color: GREEN, marginBottom: 14 },
  successText: { fontSize: 14, lineHeight: 1.75, color: TEXT_MUTED, marginBottom: 28 },
  backLink: { fontSize: 13, fontWeight: 600, color: ORANGE, textDecoration: "none" },
};
