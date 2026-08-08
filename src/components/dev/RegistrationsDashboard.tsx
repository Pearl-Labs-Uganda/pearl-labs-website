"use client";

import { useState } from "react";
import type { RegistrationRow } from "@/lib/registrations";
import { formatUgx } from "@/lib/fee";

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

export default function RegistrationsDashboard({ registrations, onMarkVerified }: Props) {
  const unpaid = registrations.filter((r) => !r.transactionId);
  const awaiting = registrations.filter((r) => r.transactionId && !r.verified);
  const verified = registrations.filter((r) => r.transactionId && r.verified);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px 96px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: GREEN, marginBottom: 32 }}>
        Bootcamp Registrations
      </h1>

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
