"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Copy, Check, ChevronDown } from "lucide-react";
import { MODULE_NAMES, computeAmountDue, formatUgx } from "@/lib/fee";
import { trackEvent } from "@/lib/analytics";
import { normalizeTransactionId, isValidMomoTransactionId } from "@/lib/transactionId";

const MERCHANT_CODE = "07778381";

const DRAFT_KEY = "pearlLabsBootcampDraft";
const LEAD_SESSION_KEY = "pearlLabsLeadSessionId";

// ── Brand tokens (Pearl Labs) ─────────────────────────────────
const GREEN      = "#002D5B";
const ORANGE     = "#EF8633";
const CREAM      = "#F4FAFF";
const TEXT_MUTED = "#4C616C";
const TEXT_LIGHT = "#4C616C";
const BORDER     = "rgba(0,45,91,0.12)";

// ── Form-card palette ─────────────────────────────────────────
// Three roles, applied inside the registration card only — the page around it
// keeps the brand colours. White is background and nothing else, black is
// every word, grey is anything you touch: fields sit on the light grey,
// buttons and the payment panels on the darker one so they read as raised.
const FORM_GREY   = "#F1F1F1";
const BUTTON_GREY = "#D4D4D4";
const FORM_BLACK  = "#111111";

const COHORTS = [
  "Cohort A — Explorers (Ages 6–13)",
  "Cohort B — Innovators (Ages 13–19)",
];

const PAYMENT_METHODS = ["MTN MoMo", "Cash"];

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

export interface FormState {
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
  paymentMethod: string;
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
  paymentMethod: "", transactionId: "",
  pickupService: "", pickupLocation: "",
  medicalInfo: "", additionalInfo: "",
  agreeTerms: false, photoConsent: "",
};

type Status = "idle" | "sending" | "sent" | "error";
type FieldErrors = Partial<Record<keyof FormState, string>>;

interface Draft {
  form: FormState;
  registrationId: number | null;
}

// Resuming a lead from a staff-generated link (src/app/apply/resume/[token])
// seeds the form with everything that lead already entered, and reuses their
// sessionId so finishing the form updates that same saved record instead of
// creating a duplicate.
interface ResumeLead {
  sessionId: string;
  form: Partial<FormState>;
}

interface InternshipApplyProps {
  resumeLead?: ResumeLead;
  registrationFull?: boolean;
  registrationFullMessage?: string;
}

export default function InternshipApply({
  resumeLead,
  registrationFull = false,
  registrationFullMessage,
}: InternshipApplyProps = {}) {
  const [form, setForm] = useState<FormState>(() =>
    resumeLead ? { ...INITIAL, ...resumeLead.form } : INITIAL,
  );
  const [registrationId, setRegistrationId] = useState<number | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [submitError, setSubmitError] = useState<string>("");
  const [focused, setFocused] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
  });
  const loadedDraft = useRef(false);
  const formStarted = useRef(false);
  const sessionId = useRef<string>("");

  const toggleSection = (id: number) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allExpanded = Object.values(openSections).every(Boolean);
  const toggleAllSections = () => {
    const next = !allExpanded;
    setOpenSections({ 1: next, 2: next, 3: next, 4: next, 5: next, 6: next, 7: next });
  };

  const sectionHasErrors = (sec: number): boolean => {
    switch (sec) {
      case 1:
        return Boolean(errors.parentName || errors.relationship || errors.profession || errors.phone || errors.email || errors.address);
      case 2:
        return Boolean(errors.studentName || errors.age || errors.gender || errors.school || errors.classGrade || errors.cohort || errors.hasLaptop);
      case 3:
        return Boolean(errors.modules || errors.hearAbout || errors.hearAboutOther);
      case 4:
        return Boolean(errors.paymentMethod || errors.transactionId);
      case 5:
        return Boolean(errors.pickupService || errors.pickupLocation);
      case 6:
        return Boolean(errors.medicalInfo || errors.additionalInfo);
      case 7:
        return Boolean(errors.agreeTerms || errors.photoConsent);
      default:
        return false;
    }
  };

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

  // ── Load any saved draft & session ID on mount ────────────────
  useEffect(() => {
    try {
      if (resumeLead) {
        // A resume link is the authoritative source — don't let a stale
        // local draft on this device (or a different lead's session)
        // override the data staff just confirmed with the parent.
        sessionId.current = resumeLead.sessionId;
        window.localStorage.setItem(LEAD_SESSION_KEY, resumeLead.sessionId);
        return;
      }

      let sid = window.localStorage.getItem(LEAD_SESSION_KEY);
      if (!sid) {
        sid = "lead_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
        window.localStorage.setItem(LEAD_SESSION_KEY, sid);
      }
      sessionId.current = sid;

      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as Draft;
        setForm({ ...INITIAL, ...draft.form });
        setRegistrationId(draft.registrationId ?? null);
      }
    } catch {
      sessionId.current = resumeLead?.sessionId ?? "lead_" + Date.now().toString(36);
    } finally {
      loadedDraft.current = true;
    }
  }, [resumeLead]);

  // ── Persist the draft on every change, once the initial load has run ──
  useEffect(() => {
    if (!loadedDraft.current) return;
    const draft: Draft = { form, registrationId };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [form, registrationId]);

  // ── Auto-sync partial lead when phone number is entered ──────
  useEffect(() => {
    if (!loadedDraft.current || form.phone.replace(/\D/g, "").length < 10) return;
    if (status === "sent") return;

    const timer = setTimeout(() => {
      fetch("/api/internship-apply/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId.current,
          ...form,
        }),
        keepalive: true,
      }).catch(() => {});
    }, 800);

    return () => clearTimeout(timer);
  }, [form, status]);

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

    if (!form.paymentMethod)       e.paymentMethod = "Please select how you'll be paying";
    if (form.paymentMethod === "MTN MoMo") {
      if (!form.transactionId.trim())
        e.transactionId = "Required — your progress is already saved, so it's safe to come back once you've paid and have your MoMo confirmation SMS";
      else if (!isValidMomoTransactionId(form.transactionId))
        e.transactionId = "Doesn't look like a valid Transaction ID — check your MoMo confirmation SMS";
    }

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
    trackEvent("momo_code_copied");
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
    window.localStorage.removeItem(LEAD_SESSION_KEY);
    const newSid = "lead_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
    sessionId.current = newSid;
    try { window.localStorage.setItem(LEAD_SESSION_KEY, newSid); } catch {}
    setForm(INITIAL);
    setRegistrationId(null);
    setErrors({});
    setStatus("idle");
    setSubmitError("");
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      setOpenSections(prev => ({
        ...prev,
        1: prev[1] || Boolean(e.parentName || e.relationship || e.profession || e.phone || e.email || e.address),
        2: prev[2] || Boolean(e.studentName || e.age || e.gender || e.school || e.classGrade || e.cohort || e.hasLaptop),
        3: prev[3] || Boolean(e.modules || e.hearAbout || e.hearAboutOther),
        4: prev[4] || Boolean(e.transactionId),
        5: prev[5] || Boolean(e.pickupService || e.pickupLocation),
        6: prev[6] || Boolean(e.medicalInfo || e.additionalInfo),
        7: prev[7] || Boolean(e.agreeTerms || e.photoConsent),
      }));
      return;
    }

    setStatus("sending");
    setSubmitError("");

    const hasTransactionId = normalizeTransactionId(form.transactionId) !== null;

    try {
      const response = await fetch("/api/internship-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: registrationId ?? undefined,
          sessionId: sessionId.current || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error || "Failed to submit registration");
      }

      trackEvent("form_submitted", { has_payment: hasTransactionId });

      // Both payment methods are fully complete on a successful submit:
      // MoMo already requires a valid Transaction ID to get past validate(),
      // and Cash never has one by design — so there's no "come back and
      // finish later" state left to represent here.
      window.localStorage.removeItem(DRAFT_KEY);
      // Rotate the session id so a second registration on this same device
      // (another child, same parent) gets its own row instead of matching
      // this completed one by sessionId and overwriting it.
      window.localStorage.removeItem(LEAD_SESSION_KEY);
      sessionId.current = "lead_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
      setForm(INITIAL);
      setRegistrationId(null);
      setStatus("sent");
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
    color: FORM_BLACK,
    background: focused === name ? "#fff" : FORM_GREY,
    // Focus and error both go to solid black; the message beside an errored
    // field names the problem in words, so nothing rests on telling two
    // shades apart.
    border: `1.5px solid ${errors[name as keyof FormState] || focused === name ? FORM_BLACK : BORDER}`,
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
    color: FORM_BLACK,
    marginBottom: 7,
  };

  const errorStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: FORM_BLACK,
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

  // The two medical prompts are different lengths, so the longer label wraps
  // to two lines and the shorter one doesn't. Each cell is a flex column with
  // the box pushed to the bottom — the grid already makes both cells the same
  // height, so pinning to the bottom lines the boxes up regardless of how the
  // labels wrap, and it relaxes on its own once the grid stacks to one column.
  const renderTextarea = (field: keyof FormState, label: string) => (
    <div style={s.textareaCell}>
      <label style={labelStyle}>{label}</label>
      <textarea
        style={fieldStyle(field, { minHeight: 90, resize: "vertical", marginTop: "auto" })}
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

  // ── Registration closed by staff ───────────────────────────────
  // Checked here (not just in the API) so nothing renders a submittable form
  // at all while full — the API route also rejects a direct POST as a
  // second layer, since this is a display-only gate.
  if (registrationFull) {
    return (
      <div style={s.page}>
        <div style={s.successWrap}>
          <h2 style={s.successTitle}>Registration Full</h2>
          <p style={s.successText}>
            {registrationFullMessage ||
              "Registration is currently full. Email us at pearllabsug@gmail.com if you'd like to be added to a waitlist."}
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
            { v: "6–19",     l: "Ages" },
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

          <div style={s.divider} />

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <button
              type="button"
              onClick={toggleAllSections}
              style={s.expandAllBtn}
            >
              {allExpanded ? "Collapse all sections" : "Expand all sections"}
            </button>
          </div>

          {/* Section 1: Parent / Guardian */}
          <button
            type="button"
            onClick={() => toggleSection(1)}
            style={s.sectionHeaderBtn}
            aria-expanded={openSections[1]}
          >
            <div style={s.sectionHeaderTitleWrap}>
              <p style={s.sectionLabel}>1. Parent / Guardian Information</p>
              {sectionHasErrors(1) && <span style={s.sectionErrorBadge}>Incomplete</span>}
            </div>
            <ChevronDown
              size={18}
              style={{
                ...s.sectionChevron,
                transform: openSections[1] ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          {openSections[1] && (
            <div style={{ marginTop: 14 }}>
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
            </div>
          )}

          <div style={s.divider} />

          {/* Section 2: Student */}
          <button
            type="button"
            onClick={() => toggleSection(2)}
            style={s.sectionHeaderBtn}
            aria-expanded={openSections[2]}
          >
            <div style={s.sectionHeaderTitleWrap}>
              <p style={s.sectionLabel}>2. Student Information</p>
              {sectionHasErrors(2) && <span style={s.sectionErrorBadge}>Incomplete</span>}
            </div>
            <ChevronDown
              size={18}
              style={{
                ...s.sectionChevron,
                transform: openSections[2] ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          {openSections[2] && (
            <div style={{ marginTop: 14 }}>
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
            </div>
          )}

          <div style={s.divider} />

          {/* Section 3: Programme selection */}
          <button
            type="button"
            onClick={() => toggleSection(3)}
            style={s.sectionHeaderBtn}
            aria-expanded={openSections[3]}
          >
            <div style={s.sectionHeaderTitleWrap}>
              <p style={s.sectionLabel}>3. Programme Selection</p>
              {sectionHasErrors(3) && <span style={s.sectionErrorBadge}>Incomplete</span>}
            </div>
            <ChevronDown
              size={18}
              style={{
                ...s.sectionChevron,
                transform: openSections[3] ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          {openSections[3] && (
            <div style={{ marginTop: 14 }}>
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
            </div>
          )}

          <div style={s.divider} />

          {/* Section 4: Payment */}
          <button
            type="button"
            onClick={() => toggleSection(4)}
            style={s.sectionHeaderBtn}
            aria-expanded={openSections[4]}
          >
            <div style={s.sectionHeaderTitleWrap}>
              <p style={s.sectionLabel}>4. Payment</p>
              {sectionHasErrors(4) && <span style={s.sectionErrorBadge}>Incomplete</span>}
            </div>
            <ChevronDown
              size={18}
              style={{
                ...s.sectionChevron,
                transform: openSections[4] ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          {openSections[4] && (
            <div style={{ marginTop: 14 }}>
              <div style={s.amountBox}>
                <span style={s.amountLabel}>Amount Due</span>
                <span style={s.amountValue}>{formatUgx(computeAmountDue(form.modules))}</span>
              </div>

              <div style={{ marginTop: 18 }}>
                {renderSelect("paymentMethod", "How will you pay? *", PAYMENT_METHODS)}
              </div>

              {form.paymentMethod === "MTN MoMo" && (
                <>
                  <div style={{ ...s.row2, marginTop: 18 }}>
                    <button
                      type="button"
                      onClick={copyMerchantCode}
                      style={s.merchantCodeBox}
                    >
                      <span style={s.merchantCodeLabel}>Merchant Code</span>
                      <span style={s.merchantCodeRight}>
                        <span style={s.merchantCodeValue}>{MERCHANT_CODE}</span>
                        {codeCopied ? (
                          <Check size={18} color="#ffffff" />
                        ) : (
                          <Copy size={18} color="#ffffff" />
                        )}
                      </span>
                    </button>
                    {codeCopied && <p style={s.copiedHint}>Copied!</p>}
                  </div>

                  <p style={s.paymentInstructions}>
                    Dial <strong>*165*3#</strong> on the parent/guardian&apos;s MTN line,
                    select <strong>Pay Merchant / Pay Bill</strong>, then enter the
                    merchant code above, the amount above, and confirm with your MTN
                    MoMo PIN.
                  </p>

                  <div style={{ marginTop: 18 }}>
                    {renderInput("transactionId", "Transaction ID *", {
                      placeholder: "e.g. from your MTN MoMo confirmation SMS",
                    })}
                    <p style={s.fieldHint}>
                      Required to submit. Don&apos;t have it yet? That&apos;s fine
                      — everything you&apos;ve entered is already saved on our
                      end, so just come back and finish once you&apos;ve paid.
                    </p>
                  </div>
                </>
              )}

              {form.paymentMethod === "Cash" && (
                <p style={s.cashNote}>
                  <strong>Paying cash:</strong> bring the amount above in person —
                  on the first day of the bootcamp, or any time before then
                  during working hours, at Pearl Labs.
                </p>
              )}
            </div>
          )}

          <div style={s.divider} />

          {/* Section 5: Drop-off & pick-up */}
          <button
            type="button"
            onClick={() => toggleSection(5)}
            style={s.sectionHeaderBtn}
            aria-expanded={openSections[5]}
          >
            <div style={s.sectionHeaderTitleWrap}>
              <p style={s.sectionLabel}>5. Drop-off &amp; Pick-up Service</p>
              {sectionHasErrors(5) && <span style={s.sectionErrorBadge}>Incomplete</span>}
            </div>
            <ChevronDown
              size={18}
              style={{
                ...s.sectionChevron,
                transform: openSections[5] ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          {openSections[5] && (
            <div style={{ marginTop: 14 }}>
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
            </div>
          )}

          <div style={s.divider} />

          {/* Section 6: Medical */}
          <button
            type="button"
            onClick={() => toggleSection(6)}
            style={s.sectionHeaderBtn}
            aria-expanded={openSections[6]}
          >
            <div style={s.sectionHeaderTitleWrap}>
              <p style={s.sectionLabel}>6. Medical Information</p>
              {sectionHasErrors(6) && <span style={s.sectionErrorBadge}>Incomplete</span>}
            </div>
            <ChevronDown
              size={18}
              style={{
                ...s.sectionChevron,
                transform: openSections[6] ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          {openSections[6] && (
            <div style={{ marginTop: 14 }}>
              <div style={s.row2}>
                {renderTextarea("medicalInfo", "Allergies, medical conditions, or special needs?")}
                {renderTextarea("additionalInfo", "Anything else you'd like us to know?")}
              </div>
            </div>
          )}

          <div style={s.divider} />

          {/* Section 7: Consent */}
          <button
            type="button"
            onClick={() => toggleSection(7)}
            style={s.sectionHeaderBtn}
            aria-expanded={openSections[7]}
          >
            <div style={s.sectionHeaderTitleWrap}>
              <p style={s.sectionLabel}>7. Consent &amp; Confirmation</p>
              {sectionHasErrors(7) && <span style={s.sectionErrorBadge}>Incomplete</span>}
            </div>
            <ChevronDown
              size={18}
              style={{
                ...s.sectionChevron,
                transform: openSections[7] ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          {openSections[7] && (
            <div style={{ marginTop: 14 }}>
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
            </div>
          )}

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
            {status === "sending" ? "Submitting Registration…" : "Submit Registration →"}
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
  formTitle: { fontSize: 24, fontWeight: 800, color: FORM_BLACK, letterSpacing: "-0.01em" },
  formSub: { fontSize: 13, color: FORM_BLACK, marginTop: 6, lineHeight: 1.6, maxWidth: 480 },
  draftBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 12.5, color: FORM_BLACK, background: FORM_GREY, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 14px", marginTop: 16 },
  draftBannerLink: { background: "none", border: "none", color: FORM_BLACK, fontWeight: 600, fontSize: 12.5, cursor: "pointer", padding: 0, textDecoration: "underline" },
  divider: { height: 1, background: BORDER, margin: "24px 0" },
  expandAllBtn: { background: "none", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, color: FORM_BLACK, cursor: "pointer" },
  sectionHeaderBtn: { width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", padding: "4px 0", cursor: "pointer", textAlign: "left" },
  sectionHeaderTitleWrap: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  sectionLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: FORM_BLACK, margin: 0 },
  sectionErrorBadge: { fontSize: 10.5, fontWeight: 700, color: "#C0392B", background: "rgba(192, 57, 43, 0.08)", border: "1px solid rgba(192, 57, 43, 0.25)", padding: "2px 8px", borderRadius: 999, letterSpacing: "0.02em" },
  sectionChevron: { transition: "transform 0.2s ease", color: FORM_BLACK, flexShrink: 0, marginLeft: 8 },
  sectionHint: { fontSize: 13, color: FORM_BLACK, marginBottom: 14, lineHeight: 1.6 },
  row2: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 },
  textareaCell: { display: "flex", flexDirection: "column" },
  row3: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(185px, 1fr))", gap: 18 },
  checkboxRow: { display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: FORM_BLACK, lineHeight: 1.6, cursor: "pointer" },
  checkbox: { marginTop: 3, width: 16, height: 16, accentColor: FORM_BLACK, flexShrink: 0, cursor: "pointer" },
  moduleGroup: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginTop: 8 },
  moduleRow: { display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: FORM_BLACK, fontWeight: 500, cursor: "pointer", padding: "12px 14px", background: FORM_GREY, border: `1.5px solid ${BORDER}`, borderRadius: 8, lineHeight: 1.35 },
  // The amount and the merchant code are a matched pair — same grey, so the
  // row reads as one instruction: what you owe, where you send it.
  amountBox: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: BUTTON_GREY, borderRadius: 10, padding: "16px 20px" },
  amountLabel: { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: FORM_BLACK, fontWeight: 700 },
  amountValue: { fontSize: 20, fontWeight: 800, color: FORM_BLACK },
  paymentInstructions: { fontSize: 13.5, color: FORM_BLACK, lineHeight: 1.8, background: FORM_GREY, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "14px 16px", marginTop: 14 },
  cashNote: { fontSize: 14, color: "#fff", lineHeight: 1.7, background: ORANGE, border: `1.5px solid ${ORANGE}`, borderRadius: 8, padding: "14px 16px", marginTop: 12 },
  merchantCodeBox: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: ORANGE, border: `1.5px solid ${ORANGE}`, borderRadius: 10, padding: "14px 20px", width: "100%", height: "100%", cursor: "pointer", font: "inherit", color: "#fff" },
  merchantCodeLabel: { fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff", fontWeight: 700 },
  merchantCodeRight: { display: "flex", alignItems: "center", gap: 10 },
  merchantCodeValue: { fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "0.08em", fontFamily: "monospace" },
  copiedHint: { fontSize: 12, color: ORANGE, fontWeight: 600, marginTop: 6, textAlign: "right" },
  fieldHint: { fontSize: 11.5, color: FORM_BLACK, marginTop: 6, lineHeight: 1.6 },
  paymentNote: { fontSize: 12.5, color: FORM_BLACK, lineHeight: 1.7, marginTop: 28, padding: "14px 16px", background: FORM_GREY, borderRadius: 8, border: `1px solid ${BORDER}` },
  submitErrorText: { fontSize: 13, fontWeight: 600, color: FORM_BLACK, marginTop: 16 },
  submitBtn: { width: "100%", marginTop: 24, padding: "18px 24px", background: "#FFF2E5", color: ORANGE, fontSize: 16, fontWeight: 800, letterSpacing: "0.02em", border: `2.5px solid ${ORANGE}`, borderRadius: 10, textAlign: "center", boxShadow: "0 4px 16px rgba(239, 134, 51, 0.18)", cursor: "pointer" },
  successWrap: { maxWidth: 480, margin: "0 auto", padding: "120px 32px", textAlign: "center" },
  successIcon: { width: 64, height: 64, borderRadius: "50%", background: "#E9F6EE", color: "#1E7B45", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" },
  successTitle: { fontSize: 26, fontWeight: 800, color: GREEN, marginBottom: 14 },
  successText: { fontSize: 14, lineHeight: 1.75, color: TEXT_MUTED, marginBottom: 28 },
  backLink: { fontSize: 13, fontWeight: 600, color: ORANGE, textDecoration: "none" },
};
