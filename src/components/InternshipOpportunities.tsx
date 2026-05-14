"use client";

import { useState } from "react";
import Link from "next/link";

const modules = [
  {
    id: "M1", label: "Module 01",
    title: "Data Science & Artificial Intelligence", duration: "15 Days",
    topics: [
      "Introduction to Data Science and AI", "Python Programming Basics",
      "Introduction to Machine Learning", "Data Preprocessing",
      "Exploratory Data Analysis", "Modeling", "Model Evaluation",
      "Introduction to Time-Series Data", "Model Deployment",
    ],
  },
  {
    id: "M2", label: "Module 02",
    title: "Embedded Systems & IoT", duration: "12 Days",
    topics: [
      "Introduction to Embedded Systems", "Basic Electronics Concepts",
      "Microcontroller Setup and Programming", "Input and Output Control",
      "Sensors and Actuators", "Introduction to IoT",
      "Integration of Embedded Systems and AI",
    ],
  },
  {
    id: "M3", label: "Module 03",
    title: "IT Project Management", duration: "3 Days",
    topics: [
      "Introduction to IT Project Management", "Understanding IT Project Lifecycles",
      "Defining Requirements and Project Scope", "Planning and Task Breakdown",
      "Time and Resource Management", "Team Collaboration in Tech Projects",
      "Version Control and Code Management", "Documentation in IT Projects",
      "Testing and Quality Assurance", "Risk Management in IT Systems",
      "Deployment and Maintenance Basics", "Presentation and Technical Communication",
      "Project Evaluation and Reflection",
    ],
  },
];

const capstoneObjectives = [
  "Apply data science and AI techniques to a real problem",
  "Collect or use real-world data",
  "Build and integrate an embedded system",
  "Demonstrate end-to-end system functionality",
  "Practice project planning, execution, and presentation",
];

const b = {
  cream: "#F0EDE8", creamDark: "#E8E3DC",
  green: "#1C3A2F", greenLight: "#2A5242",
  orange: "#C4621A", orangeHover: "#D4763A",
  textPrimary: "#1C3A2F", textMuted: "#6B6B5E",
  textLight: "#9B9B8E", border: "rgba(28,58,47,0.12)",
};

export default function InternshipOpportunities() {
  const [activeModule, setActiveModule] = useState<string | null>(null);

  return (
    <div style={s.page}>

      {/* ── HERO ── */}
      <section style={s.hero}>
        <div style={s.pill}>
          <span style={s.pillDot} />
          ICT Hub Nakawa · Deadline 28th May
        </div>

        <h1 style={s.heroTitle}>
          Internship<br />
          <em style={s.heroItalic}>Programme</em>
        </h1>

        <p style={s.heroSub}>
          Pearl Labs × componentPulse — hands-on training in Data Science & AI,
          Embedded Systems & IoT, and IT Project Management. Located at ICT Hub
          Nakawa, Kampala. University students encouraged to apply.
        </p>

        <div style={s.heroCtas}>
          {/* ✅ NOW LINKS TO THE APPLY PAGE */}
          <Link href="/internship/apply" style={s.btnSolid}>
            Apply Now →
          </Link>
          <a href="#structure" style={s.btnOutline}>
            View Structure
          </a>
        </div>

        <div style={s.statsRow}>
          {[
            { value: "40", label: "Total Days" },
            { value: "3",  label: "Core Modules" },
            { value: "1",  label: "Capstone Project" },
            { value: "UG", label: "Kampala, Uganda" },
          ].map((stat) => (
            <div key={stat.label} style={s.stat}>
              <div style={s.statVal}>{stat.value}</div>
              <div style={s.statLbl}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={s.rule} />

      {/* ── MODULES ── */}
      <section id="structure" style={s.section}>
        <p style={s.eyebrow}>Program Structure</p>
        <h2 style={s.sectionTitle}>Three Modules. One Capstone.</h2>
        <p style={s.sectionSub}>
          Each module builds on the last — from data fundamentals through
          hardware integration and professional project delivery.
        </p>

        <div style={s.grid}>
          {modules.map((mod, idx) => {
            const open = activeModule === mod.id;
            return (
              <div
                key={mod.id}
                style={{
                  ...s.card,
                  borderColor: open ? b.orange : b.border,
                  background:  open ? "#FAF7F3" : b.cream,
                }}
                onClick={() => setActiveModule(open ? null : mod.id)}
              >
                <div style={s.cardTop}>
                  <span style={s.cardLabel}>{mod.label}</span>
                  <span style={s.cardDuration}>{mod.duration}</span>
                </div>
                <h3 style={s.cardTitle}>{mod.title}</h3>
                <div style={s.cardFooter}>
                  <span style={{ ...s.toggleLink, color: open ? b.orange : b.textMuted }}>
                    {open ? "Hide topics ↑" : "View topics ↓"}
                  </span>
                  <span style={{ ...s.bigIndex, opacity: open ? 0.05 : 0.04 }}>
                    0{idx + 1}
                  </span>
                </div>
                {open && (
                  <ul style={s.topicList}>
                    {mod.topics.map((t, i) => (
                      <li key={i} style={s.topicItem}>
                        <span style={s.dot} />
                        {t}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── CAPSTONE ── */}
      <section style={s.capstoneWrap}>
        <div style={s.capstoneInner}>
          <p style={s.capstoneEyebrow}>Capstone Project · 10 Days</p>
          <h2 style={s.capstoneTitle}>Build Something<br />Real.</h2>
          <p style={s.capstoneDesc}>
            A practical, team-based challenge where interns design and implement
            a complete system integrating data science, AI, and embedded systems
            — emphasising real-world problem solving and end-to-end execution.
          </p>
          <div style={s.objGrid}>
            {capstoneObjectives.map((obj, i) => (
              <div key={i} style={s.objItem}>
                <div style={s.objNum}>0{i + 1}</div>
                <p style={s.objText}>{obj}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={s.ctaSection}>
        <p style={s.eyebrow}>Limited Slots Available</p>
        <h2 style={s.ctaTitle}>Ready to Apply?</h2>
        <p style={s.ctaSub}>
          Deadline is <strong>28th May 2026</strong>. Join a cohort of passionate builders
          at ICT Hub Nakawa. Email <strong>pearllabsug@gmail.com</strong> with any questions.
        </p>
        {/* ✅ NOW LINKS TO THE APPLY PAGE */}
        <Link href="/internship/apply" style={{ ...s.btnSolid, fontSize: 16, padding: "16px 52px" }}>
          Apply Now →
        </Link>
      </section>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'Inter', system-ui, sans-serif", background: b.cream, color: b.textPrimary, minHeight: "100vh" },
  hero: { maxWidth: 960, margin: "0 auto", padding: "80px 32px 64px" },
  pill: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, letterSpacing: "0.13em", textTransform: "uppercase", color: b.textMuted, border: `1px solid ${b.border}`, borderRadius: 999, padding: "5px 14px", marginBottom: 32 },
  pillDot: { width: 6, height: 6, borderRadius: "50%", background: b.orange, display: "inline-block" },
  heroTitle: { fontSize: "clamp(52px, 9vw, 96px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", color: b.green, marginBottom: 24 },
  heroItalic: { fontStyle: "italic", color: b.orange },
  heroSub: { fontSize: 16, lineHeight: 1.75, color: b.textMuted, maxWidth: 520, marginBottom: 40 },
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
  sectionSub: { fontSize: 15, lineHeight: 1.7, color: b.textMuted, maxWidth: 500, marginBottom: 48 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  card: { border: "1.5px solid", borderRadius: 12, padding: "28px 24px", cursor: "pointer", transition: "border-color 0.2s, background 0.2s", position: "relative", overflow: "hidden" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardLabel: { fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: b.orange, fontWeight: 600 },
  cardDuration: { fontSize: 11, color: b.textMuted, border: `1px solid ${b.border}`, borderRadius: 999, padding: "3px 10px" },
  cardTitle: { fontSize: 18, fontWeight: 700, color: b.green, lineHeight: 1.3, marginBottom: 20 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  toggleLink: { fontSize: 12, fontWeight: 500, transition: "color 0.2s" },
  bigIndex: { fontSize: 64, fontWeight: 900, color: b.green, lineHeight: 1, letterSpacing: "-0.04em", userSelect: "none", transition: "opacity 0.2s" },
  topicList: { listStyle: "none", display: "flex", flexDirection: "column", gap: 0, padding: "20px 0 0 0", borderTop: `1px solid ${b.border}`, marginTop: 20 },
  topicItem: { display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: b.textMuted, lineHeight: 1.5, padding: "5px 0" },
  dot: { width: 5, height: 5, borderRadius: "50%", background: b.orange, flexShrink: 0, opacity: 0.7 },
  capstoneWrap: { background: b.green, padding: "80px 32px" },
  capstoneInner: { maxWidth: 960, margin: "0 auto" },
  capstoneEyebrow: { fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: b.orange, marginBottom: 20, fontWeight: 600 },
  capstoneTitle: { fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#F0EDE8", marginBottom: 20, lineHeight: 1.0 },
  capstoneDesc: { fontSize: 15, lineHeight: 1.8, color: "rgba(240,237,232,0.5)", maxWidth: 580, marginBottom: 56 },
  objGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, borderTop: "1px solid rgba(240,237,232,0.1)", paddingTop: 48 },
  objItem: { display: "flex", flexDirection: "column", gap: 10 },
  objNum: { fontSize: 30, fontWeight: 800, color: b.orange, opacity: 0.65, lineHeight: 1, letterSpacing: "-0.02em" },
  objText: { fontSize: 13, lineHeight: 1.7, color: "rgba(240,237,232,0.6)" },
  ctaSection: { maxWidth: 700, margin: "0 auto", padding: "96px 32px 120px", textAlign: "center" },
  ctaTitle: { fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, letterSpacing: "-0.03em", color: b.green, marginBottom: 16, lineHeight: 1.05 },
  ctaSub: { fontSize: 15, lineHeight: 1.75, color: b.textMuted, marginBottom: 40 },
};