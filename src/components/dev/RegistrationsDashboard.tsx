"use client";

import { useState } from "react";
import type { RegistrationRow } from "@/lib/registrations";
import { formatUgx, MODULE_NAMES } from "@/lib/fee";

const GREEN = "#002D5B";
const ORANGE = "#EF8633";
const BORDER = "rgba(0,45,91,0.15)";
const CREAM = "#F4FAFF";

interface Props {
  registrations: RegistrationRow[];
  onMarkVerified: (id: number) => Promise<void>;
}

function Row({
  row,
  showVerifyButton,
  onMarkVerified,
}: {
  row: RegistrationRow;
  showVerifyButton: boolean;
  onMarkVerified: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async () => {
    setVerifying(true);
    await onMarkVerified(row.id);
    setVerifying(false);
  };

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, marginBottom: 10, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 4,
          padding: "14px 16px",
          background: "#fff",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        <span style={{ fontWeight: 700, color: GREEN, fontSize: 14 }}>{row.studentName}</span>
        <span style={{ fontSize: 12.5, color: "#4C616C" }}>{row.parentName} · {row.phone}</span>
        <span style={{ fontSize: 12.5, color: "#4C616C" }}>{row.modules.join(", ")}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: ORANGE }}>{formatUgx(row.amountDue)}</span>
        <span style={{ fontSize: 11, color: "#4C616C" }}>{new Date(row.createdAt).toLocaleString()}</span>
      </button>

      {open && (
        <div style={{ padding: "14px 16px", borderTop: `1px solid ${BORDER}`, background: CREAM, fontSize: 13, lineHeight: 1.8, color: "#111D23" }}>
          <p><strong>Email:</strong> {row.email}</p>
          <p><strong>Alt phone:</strong> {row.altPhone || "Not provided"}</p>
          <p><strong>Address:</strong> {row.address}</p>
          <p><strong>Student age / gender:</strong> {row.age} / {row.gender}</p>
          <p><strong>School / Class:</strong> {row.school} / {row.classGrade}</p>
          <p><strong>Cohort:</strong> {row.cohort}</p>
          <p><strong>Has laptop:</strong> {row.hasLaptop}</p>
          <p><strong>Heard about us:</strong> {row.hearAbout}{row.hearAboutOther ? ` (${row.hearAboutOther})` : ""}</p>
          <p><strong>Pick-up service:</strong> {row.pickupService}{row.pickupLocation ? ` — ${row.pickupLocation}` : ""}</p>
          <p><strong>Medical info:</strong> {row.medicalInfo || "Not provided"}</p>
          <p><strong>Additional info:</strong> {row.additionalInfo || "Not provided"}</p>
          <p><strong>Photo consent:</strong> {row.photoConsent}</p>
          <p><strong>Transaction ID:</strong> {row.transactionId || "Not provided"}</p>
          {row.verifiedAt && <p><strong>Verified at:</strong> {new Date(row.verifiedAt).toLocaleString()}</p>}

          {showVerifyButton && (
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              style={{
                marginTop: 10,
                padding: "9px 18px",
                background: GREEN,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: verifying ? "wait" : "pointer",
              }}
            >
              {verifying ? "Marking…" : "Mark Verified"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#4C616C" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: GREEN, marginTop: 4 }}>{value}</div>
    </div>
  );
}

// Single-hue magnitude bars (demand, not identity) — one accent color, no legend needed.
// Value is direct-labeled at the bar end, so every reading is visible without hover.
function BarBreakdown({
  title,
  items,
}: {
  title: string;
  items: { name: string; count: number; caption?: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
      <h3 style={{ fontSize: 12.5, fontWeight: 700, color: GREEN, marginBottom: 14 }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => (
          <div key={item.name}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: "#4C616C", marginBottom: 4 }}>
              <span>{item.name}</span>
              <span style={{ fontWeight: 700, color: GREEN, whiteSpace: "nowrap" }}>
                {item.count}
                {item.caption ? ` · ${item.caption}` : ""}
              </span>
            </div>
            <div style={{ height: 8, background: CREAM, borderRadius: 4 }}>
              <div
                style={{
                  height: "100%",
                  width: `${(item.count / max) * 100}%`,
                  background: ORANGE,
                  borderRadius: "0 4px 4px 0",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({
  title,
  rows,
  showVerifyButton,
  onMarkVerified,
  emptyText,
}: {
  title: string;
  rows: RegistrationRow[];
  showVerifyButton: boolean;
  onMarkVerified: (id: number) => Promise<void>;
  emptyText: string;
}) {
  return (
    <section style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 16, minWidth: 0 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, color: GREEN, marginBottom: 14 }}>
        {title} <span style={{ color: "#4C616C", fontWeight: 600 }}>({rows.length})</span>
      </h2>
      <div style={{ maxHeight: 640, overflowY: "auto", paddingRight: 2 }}>
        {rows.length === 0 ? (
          <p style={{ fontSize: 13, color: "#4C616C" }}>{emptyText}</p>
        ) : (
          rows.map((row) => (
            <Row key={row.id} row={row} showVerifyButton={showVerifyButton} onMarkVerified={onMarkVerified} />
          ))
        )}
      </div>
    </section>
  );
}

// Matches the "30 Spots" figure quoted on /apply and /bootcamps — the bootcamp
// caps at 30 students total, not per cohort.
const TOTAL_SPOTS = 30;

export default function RegistrationsDashboard({ registrations, onMarkVerified }: Props) {
  const unpaid = registrations.filter((r) => !r.transactionId);
  const awaiting = registrations.filter((r) => r.transactionId && !r.verified);
  const verified = registrations.filter((r) => r.transactionId && r.verified);

  // A transaction ID means the family is claiming a spot, verified or not.
  const reservedCount = awaiting.length + verified.length;
  const capacityPct = Math.min(100, Math.round((reservedCount / TOTAL_SPOTS) * 100));
  const conversionRate =
    registrations.length > 0 ? Math.round((verified.length / registrations.length) * 100) : 0;
  const laptopProvisionCount = registrations.filter((r) => r.hasLaptop && r.hasLaptop !== "Yes").length;

  const moduleDemand = MODULE_NAMES.map((name) => {
    const registeredFor = registrations.filter((r) => r.modules.includes(name));
    const confirmedRevenue = registeredFor
      .filter((r) => r.verified)
      .reduce((sum, r) => sum + r.amountDue / r.modules.length, 0);
    return {
      name,
      count: registeredFor.length,
      caption: `${formatUgx(Math.round(confirmedRevenue))} confirmed`,
    };
  });

  const cohortCounts = new Map<string, number>();
  for (const r of registrations) cohortCounts.set(r.cohort, (cohortCounts.get(r.cohort) ?? 0) + 1);
  const cohortSplit = Array.from(cohortCounts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, count]) => ({ name, count }));

  const channelCounts = new Map<string, number>();
  for (const r of registrations) {
    if (!r.hearAbout) continue;
    channelCounts.set(r.hearAbout, (channelCounts.get(r.hearAbout) ?? 0) + 1);
  }
  const channelBreakdown = Array.from(channelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px 96px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: GREEN, marginBottom: 32 }}>
        Bootcamp Registrations
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatTile label="Total registrations" value={registrations.length} />
        <StatTile label="Verified" value={verified.length} />
        <StatTile label="Conversion rate" value={`${conversionRate}%`} />
        <StatTile label="Need a laptop provided" value={laptopProvisionCount} />
      </div>

      <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 8 }}>
          <span style={{ color: "#4C616C", fontWeight: 600 }}>Spots reserved</span>
          <span style={{ color: GREEN, fontWeight: 700 }}>{reservedCount} / {TOTAL_SPOTS}</span>
        </div>
        <div style={{ height: 10, background: CREAM, borderRadius: 5 }}>
          <div style={{ height: "100%", width: `${capacityPct}%`, background: ORANGE, borderRadius: "0 5px 5px 0" }} />
        </div>
        <p style={{ fontSize: 11.5, color: "#4C616C", marginTop: 8 }}>
          {verified.length} verified · {awaiting.length} awaiting confirmation
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
        <BarBreakdown title="Module demand" items={moduleDemand} />
        <BarBreakdown title="Cohort split" items={cohortSplit} />
        <BarBreakdown title="How they heard about us" items={channelBreakdown} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, alignItems: "start" }}>
        <Section
          title="Unpaid"
          rows={unpaid}
          showVerifyButton={false}
          onMarkVerified={onMarkVerified}
          emptyText="No registrations without a transaction ID."
        />
        <Section
          title="Awaiting Verification"
          rows={awaiting}
          showVerifyButton
          onMarkVerified={onMarkVerified}
          emptyText="Nothing waiting on verification."
        />
        <Section
          title="Verified"
          rows={verified}
          showVerifyButton={false}
          onMarkVerified={onMarkVerified}
          emptyText="No verified registrations yet."
        />
      </div>
    </div>
  );
}
