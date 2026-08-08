"use client";

import { useState } from "react";
import Link from "next/link";

const tracks = [
  {
    id: "T1", label: "Track 01",
    title: "AI & Coding", duration: "10 Sessions · 30 hrs",
    blurb:
      "Learn how computers are instructed and how modern AI — including large language models — learns, reasons and generates. Move from thinking like a programmer to building and prompting AI-powered projects.",
    cohorts: [
      {
        name: "Cohort A — Explorers (9–13)",
        competency:
          "Designs and builds a simple AI-powered project using block-based coding (Scratch, Teachable Machine), demonstrating computational thinking and responsible use of technology.",
      },
      {
        name: "Cohort B — Innovators (13–19)",
        competency:
          "Writes Python programs and builds a working AI-powered application — applying core machine-learning and LLM concepts, prompt engineering and responsible-AI principles.",
      },
    ],
  },
  {
    id: "T2", label: "Track 02",
    title: "Robotics", duration: "10 Sessions · 30 hrs",
    blurb:
      "Discover how sensors, actuators and code combine to make machines sense and act on the world — building and programming working robots.",
    cohorts: [
      {
        name: "Cohort A — Explorers (9–13)",
        competency:
          "Builds and programs a simple robot that senses and responds to its environment, working safely and collaboratively.",
      },
      {
        name: "Cohort B — Innovators (13–19)",
        competency:
          "Designs, programs and tests an autonomous robot integrating embedded systems, sensor feedback and an element of AI/mechatronics to solve a defined task.",
      },
    ],
  },
  {
    id: "T3", label: "Track 03",
    title: "Aerospace CAD & 3D Printing", duration: "10 Sessions · 30 hrs",
    blurb:
      "Links design thinking, computer-aided design and additive manufacturing to the aerospace and drone industries — turning ideas into 3D-printed parts and flying models.",
    cohorts: [
      {
        name: "Cohort A — Explorers (9–13)",
        competency:
          "Designs simple 3D models, 3D-prints a part, and builds and tests a basic flying model, applying design thinking and the principles of flight.",
      },
      {
        name: "Cohort B — Innovators (13–19)",
        competency:
          "Produces parametric CAD models, 3D-prints functional parts, and designs, builds and tests an aircraft or drone airframe, applying aerodynamics and an engineering design process.",
      },
    ],
  },
];

const glance = [
  { label: "Dates", value: "24th Aug – 4th Sept 2026" },
  { label: "Schedule", value: "Monday – Friday, 9:00am – 12:00pm" },
  { label: "Duration", value: "2 Weeks · 10 Sessions" },
  { label: "Venue", value: "National ICT Hub, Nakawa" },
  { label: "Ages", value: "9 – 19 (Cohort A: 9–13, Cohort B: 13–19)" },
  { label: "Fee", value: "UGX 500,000 / learner — materials, snacks & certificate included" },
];

const programmeAims = [
  "Spark curiosity and confidence in deep-tech fields that will shape the future — AI, automation and aerospace.",
  "Move every learner from concept to a working, demonstrable project within two weeks.",
  "Build transferable skills: computational thinking, problem-solving, teamwork and creativity.",
  "Instil responsible, ethical and safe use of technology from the very start.",
  "Give learners a portfolio artefact and a taste of a possible future study and career pathway.",
];

// ── Brand tokens (Pearl Labs) ─────────────────────────────────
const b = {
  cream: "#F4FAFF", creamDark: "#E3F0F8",
  green: "#002D5B", greenLight: "#003F80",
  orange: "#EF8633", orangeHover: "#d4732a",
  textPrimary: "#111D23", textMuted: "#4C616C",
  textLight: "#4C616C", border: "rgba(0,45,91,0.12)",
};

export default function InternshipOpportunities() {
  const [activeTrack, setActiveTrack] = useState<string | null>(null);

  return (
    <div style={s.page}>

      {/* ── HERO ── */}
      <section style={s.hero}>
        <div style={s.pill}>
          <span style={s.pillDot} />
          KateD Learning × Pearl Labs · National ICT Hub, Nakawa
        </div>

        <h1 style={s.heroTitle}>
          Deep Tech<br />
          <em style={s.heroItalic}>Bootcamp</em>
        </h1>

        <p style={s.heroSub}>
          A two-week, hands-on intensive introducing learners aged 9–19 to three
          frontier-technology fields — AI &amp; Coding, Robotics, and Aerospace CAD
          &amp; 3D Printing. Each learner picks one track and builds a real,
          showcase-ready project by the end of the programme.
        </p>

        <div style={s.heroCtas}>
          <Link href="/apply" style={s.btnSolid}>
            Register Now →
          </Link>
          <a href="#tracks" style={s.btnOutline}>
            View Tracks
          </a>
        </div>

        <div style={s.statsRow}>
          {[
            { value: "3",       label: "Tracks" },
            { value: "10",      label: "Sessions" },
            { value: "9–19",    label: "Ages" },
            { value: "UGX 500K", label: "Per Learner" },
          ].map((stat) => (
            <div key={stat.label} style={s.stat}>
              <div style={s.statVal}>{stat.value}</div>
              <div style={s.statLbl}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={s.rule} />

      {/* ── TRACKS ── */}
      <section id="tracks" style={s.section}>
        <p style={s.eyebrow}>Programme Tracks</p>
        <h2 style={s.sectionTitle}>One Track. Two Weeks. Real Skills.</h2>
        <p style={s.sectionSub}>
          Each learner selects one deep-tech track and stays with it for the full
          two weeks — depth over breadth. Content is levelled for two age cohorts,
          from first principles to a working, showcase-ready project.
        </p>

        <div style={s.grid}>
          {tracks.map((track, idx) => {
            const open = activeTrack === track.id;
            return (
              <div
                key={track.id}
                style={{
                  ...s.card,
                  borderColor: open ? b.orange : b.border,
                  background:  open ? "#FAF7F3" : b.cream,
                }}
                onClick={() => setActiveTrack(open ? null : track.id)}
              >
                <div style={s.cardTop}>
                  <span style={s.cardLabel}>{track.label}</span>
                  <span style={s.cardDuration}>{track.duration}</span>
                </div>
                <h3 style={s.cardTitle}>{track.title}</h3>
                <p style={s.cardBlurb}>{track.blurb}</p>
                <div style={s.cardFooter}>
                  <span style={{ ...s.toggleLink, color: open ? b.orange : b.textMuted }}>
                    {open ? "Hide cohort details ↑" : "View cohort details ↓"}
                  </span>
                  <span style={{ ...s.bigIndex, opacity: open ? 0.05 : 0.04 }}>
                    0{idx + 1}
                  </span>
                </div>
                {open && (
                  <div style={s.cohortList}>
                    {track.cohorts.map((c) => (
                      <div key={c.name} style={s.cohortItem}>
                        <div style={s.cohortName}>{c.name}</div>
                        <p style={s.cohortDesc}>{c.competency}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── PROGRAMME AT A GLANCE ── */}
      <section style={s.section}>
        <p style={s.eyebrow}>Logistics</p>
        <h2 style={s.sectionTitle}>Programme at a Glance</h2>
        <div style={s.glanceGrid}>
          {glance.map((item) => (
            <div key={item.label} style={s.glanceItem}>
              <div style={s.glanceLabel}>{item.label}</div>
              <div style={s.glanceValue}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROGRAMME AIMS ── */}
      <section style={s.capstoneWrap}>
        <div style={s.capstoneInner}>
          <p style={s.capstoneEyebrow}>Learn. Build. Innovate.</p>
          <h2 style={s.capstoneTitle}>Why This<br />Bootcamp.</h2>
          <p style={s.capstoneDesc}>
            The Pearl Labs Deep Tech Bootcamp, in partnership with KateD Learning,
            is designed and sequenced around clear, project-based outcomes —
            every learner leaves with a working artefact, not just notes.
          </p>
          <div style={s.objGrid}>
            {programmeAims.map((aim, i) => (
              <div key={i} style={s.objItem}>
                <div style={s.objNum}>0{i + 1}</div>
                <p style={s.objText}>{aim}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={s.ctaSection}>
        <p style={s.eyebrow}>Limited Slots Available</p>
        <h2 style={s.ctaTitle}>Ready to Register?</h2>
        <p style={s.ctaSub}>
          24th August – 4th September 2026 at National ICT Hub, Nakawa.
          UGX 500,000 per learner. Email <strong>pearllabsug@gmail.com</strong> or
          call <strong>+256 763 839356</strong> with any questions.
        </p>
        <Link href="/apply" style={{ ...s.btnSolid, fontSize: 16, padding: "16px 52px" }}>
          Register Now →
        </Link>
      </section>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Inter', system-ui, sans-serif", background: b.cream, color: b.textPrimary, minHeight: "100vh" },
  hero: { maxWidth: 960, margin: "0 auto", padding: "80px 32px 64px" },
  pill: { display: "inline-flex", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: "clamp(10px, 2.2vw, 11px)", letterSpacing: "0.13em", textTransform: "uppercase", color: b.textMuted, border: `1px solid ${b.border}`, borderRadius: 999, padding: "5px 14px", marginBottom: 32, lineHeight: 1.35, whiteSpace: "normal", maxWidth: "100%" },
  pillDot: { width: 6, height: 6, borderRadius: "50%", background: b.orange, display: "inline-block" },
  heroTitle: { fontSize: "clamp(52px, 9vw, 96px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", color: b.green, marginBottom: 24 },
  heroItalic: { fontStyle: "italic", color: b.orange },
  heroSub: { fontSize: 16, lineHeight: 1.75, color: b.textMuted, maxWidth: 560, marginBottom: 40 },
  heroCtas: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 64, alignItems: "center" },
  btnSolid: { display: "inline-block", fontSize: 14, fontWeight: 600, color: "#fff", background: b.orange, border: "none", borderRadius: 6, padding: "13px 28px", cursor: "pointer", letterSpacing: "0.01em", textDecoration: "none" },
  btnOutline: { display: "inline-block", fontSize: 14, fontWeight: 600, color: b.green, border: `1.5px solid ${b.border}`, borderRadius: 6, padding: "13px 28px", cursor: "pointer", letterSpacing: "0.01em", textDecoration: "none", background: "transparent" },
  statsRow: { display: "flex", gap: 48, flexWrap: "wrap" },
  stat: { display: "flex", flexDirection: "column", gap: 4 },
  statVal: { fontSize: 34, fontWeight: 800, color: b.orange, lineHeight: 1, letterSpacing: "-0.02em" },
  statLbl: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: b.textLight },
  rule: { height: 1, background: b.border, maxWidth: 960, margin: "0 auto" },
  section: { maxWidth: 960, margin: "0 auto", padding: "72px 32px" },
  eyebrow: { fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: b.orange, marginBottom: 14, fontWeight: 600 },
  sectionTitle: { fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, letterSpacing: "-0.02em", color: b.green, marginBottom: 12, lineHeight: 1.1 },
  sectionSub: { fontSize: 15, lineHeight: 1.7, color: b.textMuted, maxWidth: 560, marginBottom: 48 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  card: { border: "1.5px solid", borderRadius: 12, padding: "28px 24px", cursor: "pointer", transition: "border-color 0.2s, background 0.2s", position: "relative", overflow: "hidden" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardLabel: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: b.orange, fontWeight: 600 },
  cardDuration: { fontSize: 11, color: b.textMuted, border: `1px solid ${b.border}`, borderRadius: 999, padding: "3px 10px" },
  cardTitle: { fontSize: 18, fontWeight: 700, color: b.green, lineHeight: 1.3, marginBottom: 10 },
  cardBlurb: { fontSize: 13, color: b.textMuted, lineHeight: 1.6, marginBottom: 20 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  toggleLink: { fontSize: 12, fontWeight: 500, transition: "color 0.2s" },
  bigIndex: { fontSize: 64, fontWeight: 900, color: b.green, lineHeight: 1, letterSpacing: "-0.04em", userSelect: "none", transition: "opacity 0.2s" },
  cohortList: { display: "flex", flexDirection: "column", gap: 14, padding: "20px 0 0 0", borderTop: `1px solid ${b.border}`, marginTop: 20 },
  cohortItem: { display: "flex", flexDirection: "column", gap: 4 },
  cohortName: { fontSize: 12, fontWeight: 700, color: b.green },
  cohortDesc: { fontSize: 12.5, color: b.textMuted, lineHeight: 1.6 },
  glanceGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 },
  glanceItem: { padding: "20px 22px", background: "#fff", border: `1px solid ${b.border}`, borderRadius: 10 },
  glanceLabel: { fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: b.orange, marginBottom: 8 },
  glanceValue: { fontSize: 14, color: b.green, fontWeight: 600, lineHeight: 1.5 },
  capstoneWrap: { background: b.green, padding: "80px 32px" },
  capstoneInner: { maxWidth: 960, margin: "0 auto" },
  capstoneEyebrow: { fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: b.orange, marginBottom: 20, fontWeight: 600 },
  capstoneTitle: { fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 800, letterSpacing: "-0.03em", color: b.cream, marginBottom: 20, lineHeight: 1.0 },
  capstoneDesc: { fontSize: 15, lineHeight: 1.8, color: "rgba(244,250,255,0.5)", maxWidth: 580, marginBottom: 56 },
  objGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, borderTop: "1px solid rgba(244,250,255,0.1)", paddingTop: 48 },
  objItem: { display: "flex", flexDirection: "column", gap: 10 },
  objNum: { fontSize: 30, fontWeight: 800, color: b.orange, opacity: 0.65, lineHeight: 1, letterSpacing: "-0.02em" },
  objText: { fontSize: 13, lineHeight: 1.7, color: "rgba(244,250,255,0.6)" },
  ctaSection: { maxWidth: 700, margin: "0 auto", padding: "96px 32px 120px", textAlign: "center" },
  ctaTitle: { fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, letterSpacing: "-0.03em", color: b.green, marginBottom: 16, lineHeight: 1.05 },
  ctaSub: { fontSize: 15, lineHeight: 1.75, color: b.textMuted, marginBottom: 40 },
};
