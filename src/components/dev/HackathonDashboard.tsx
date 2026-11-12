"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, MessageSquare, Phone } from "lucide-react";
import { INTERESTS, WEEKS, hackathonCsv, interestsText, tally, weekLabel, type HackathonRow } from "@/lib/hackathon";

const GREEN = "#002D5B";
const ORANGE = "#EF8633";
const BORDER = "rgba(0,45,91,0.15)";
const CREAM = "#F4FAFF";
const MUTED = "#4C616C";

function download(rows: HackathonRow[]) {
  const blob = new Blob([hackathonCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hackathon-registrations-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Pinned locale so server and client render the same text.
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? `256${d.slice(1)}` : d;
};

function Tile({ label, value, caption }: { label: string; value: string | number; caption?: string }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: MUTED }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: GREEN, marginTop: 4 }}>{value}</div>
      {caption && <div style={{ fontSize: 11, fontWeight: 600, color: ORANGE, marginTop: 2 }}>{caption}</div>}
    </div>
  );
}

function Bars({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, minWidth: 0 }}>
      <h3 style={{ fontSize: 12.5, fontWeight: 700, color: GREEN, margin: "0 0 14px" }}>{title}</h3>
      {items.length === 0 && <p style={{ fontSize: 12, color: MUTED, margin: 0 }}>Nothing yet.</p>}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => (
          <div key={item.name}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: MUTED, marginBottom: 4 }}>
              <span style={{ overflowWrap: "anywhere" }}>{item.name}</span>
              <span style={{ fontWeight: 700, color: GREEN }}>{item.count}</span>
            </div>
            <div style={{ height: 8, background: CREAM, borderRadius: 4 }}>
              <div style={{ height: "100%", width: `${(item.count / max) * 100}%`, background: ORANGE, borderRadius: "0 4px 4px 0" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RowCard({ r }: { r: HackathonRow }) {
  const [open, setOpen] = useState(false);
  const btn: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    fontSize: 12,
    fontWeight: 700,
    color: GREEN,
    border: `1px solid ${BORDER}`,
    borderRadius: 7,
    padding: "5px 10px",
    textDecoration: "none",
    background: "#fff",
  };
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", fontFamily: "inherit", minWidth: 0 }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>
            {r.learnerName} <span style={{ fontWeight: 500, color: MUTED }}>· {r.age} · {r.classGrade}</span>
          </div>
          <div style={{ fontSize: 12.5, color: MUTED, marginTop: 2 }}>
            {r.school} · {weekLabel(r.week)}
            {r.trip === "Yes" ? " · Trip" : ""}
          </div>
        </button>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11.5, color: "#8C9BA5" }}>{when(r.createdAt)}</span>
          <a href={`tel:${r.parentPhone.replace(/\s/g, "")}`} style={btn}>
            <Phone size={13} /> Call
          </a>
          <a href={`https://wa.me/${waNumber(r.parentPhone)}`} target="_blank" rel="noreferrer" style={btn}>
            <MessageSquare size={13} /> WhatsApp
          </a>
        </div>
      </div>
      {open && (
        <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.7, marginTop: 10, borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
          <div><strong>Parent / guardian:</strong> {r.parentName} ({r.relationship}) · {r.parentPhone} · {r.parentEmail}</div>
          <div><strong>Gender:</strong> {r.gender}</div>
          <div><strong>Interests:</strong> {interestsText(r.interests)}</div>
          <div><strong>Has laptop:</strong> {r.hasLaptop} · <strong>Trip:</strong> {r.trip} · <strong>Passport:</strong> {r.passport}</div>
          <div><strong>Heard from:</strong> {r.hearAbout} · <strong>Photo consent:</strong> {r.photoConsent}</div>
        </div>
      )}
    </div>
  );
}

export default function HackathonDashboard({ rows }: { rows: HackathonRow[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q
    ? rows.filter((r) => [r.learnerName, r.school, r.parentName, r.parentPhone].some((v) => v.toLowerCase().includes(q)))
    : rows;

  const count = (pred: (r: HackathonRow) => boolean) => rows.filter(pred).length;
  const byWeek = Object.entries(WEEKS).map(([k, name]) => ({ name, count: count((r) => r.week === k) }));
  const byInterest = Object.entries(INTERESTS)
    .map(([k, name]) => ({ name, count: count((r) => r.interests.includes(k)) }))
    .sort((a, b) => b.count - a.count);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px 96px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Link href="/pl-a9004ed60a/registrations" style={{ fontSize: 13, color: MUTED, textDecoration: "none" }}>
        ← Bootcamp registrations
      </Link>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, margin: "10px 0 24px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: GREEN, margin: 0 }}>Hackathon Pre-registrations</h1>
        <button
          type="button"
          onClick={() => download(rows)}
          disabled={rows.length === 0}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px",
            background: GREEN,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: rows.length === 0 ? "not-allowed" : "pointer",
            opacity: rows.length === 0 ? 0.6 : 1,
            fontFamily: "inherit",
          }}
        >
          <Download size={15} />
          Export CSV ({rows.length})
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
        <Tile label="Registered" value={rows.length} />
        <Tile label="Want the trip" value={count((r) => r.trip === "Yes")} />
        <Tile label="Have a passport" value={count((r) => r.passport === "Yes")} />
        <Tile label="Need a laptop" value={count((r) => r.hasLaptop === "No")} />
        <Tile label="Schools" value={tally(rows.map((r) => r.school)).length} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 28 }}>
        <Bars title="Preferred week" items={byWeek} />
        <Bars title="By school" items={tally(rows.map((r) => r.school))} />
        <Bars title="Interests" items={byInterest} />
        <Bars title="Gender" items={tally(rows.map((r) => r.gender))} />
        <Bars title="How they heard" items={tally(rows.map((r) => r.hearAbout))} />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: GREEN, margin: 0 }}>
          Learners <span style={{ color: MUTED, fontWeight: 600 }}>({shown.length})</span>
        </h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, school or phone"
          style={{ fontSize: 13, fontFamily: "inherit", padding: "8px 14px", borderRadius: 999, border: `1px solid ${BORDER}`, minWidth: 0, width: 260, maxWidth: "100%" }}
        />
      </div>
      {rows.length === 0 ? (
        <div style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "36px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: MUTED, fontWeight: 600, margin: 0 }}>No pre-registrations yet.</p>
          <p style={{ fontSize: 12.5, color: "#8C9BA5", marginTop: 4 }}>They appear here as soon as a family submits /hackathon.</p>
        </div>
      ) : (
        shown.map((r) => <RowCard key={r.id} r={r} />)
      )}
    </div>
  );
}
