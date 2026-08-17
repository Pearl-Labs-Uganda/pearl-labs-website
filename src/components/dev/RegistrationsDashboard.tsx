"use client";

import { useState } from "react";
import type { RegistrationRow } from "@/lib/registrations";
import type { EventCounts } from "@/lib/analyticsEvents";
import type { IncompleteLeadRow } from "@/lib/leads";
import { formatUgx, MODULE_NAMES } from "@/lib/fee";
import { Phone, MessageSquare, Trash2, Copy, Check, RotateCcw } from "lucide-react";

const GREEN = "#002D5B";
const ORANGE = "#EF8633";
const BORDER = "rgba(0,45,91,0.15)";
const CREAM = "#F4FAFF";

interface Props {
  registrations: RegistrationRow[];
  eventCounts: EventCounts;
  incompleteLeads: IncompleteLeadRow[];
  dismissedLeads: IncompleteLeadRow[];
  onMarkVerified: (id: number) => Promise<void>;
  onDeleteLead: (id: number) => Promise<void>;
  onRestoreLead: (id: number) => Promise<void>;
}

function TabBar({
  active,
  onChange,
  leadsCount,
  registrationsCount,
}: {
  active: "analytics" | "registrations" | "leads";
  onChange: (tab: "analytics" | "registrations" | "leads") => void;
  leadsCount: number;
  registrationsCount: number;
}) {
  const tabs: { id: "analytics" | "registrations" | "leads"; label: string }[] = [
    { id: "analytics", label: "Analytics" },
    { id: "registrations", label: `Registrations (${registrationsCount})` },
    { id: "leads", label: `Incomplete Leads (${leadsCount})` },
  ];
  return (
    <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${BORDER}`, marginBottom: 24 }}>
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              padding: "10px 18px",
              fontSize: 13.5,
              fontWeight: 700,
              color: isActive ? GREEN : "#4C616C",
              background: "none",
              border: "none",
              borderBottom: `2px solid ${isActive ? ORANGE : "transparent"}`,
              marginBottom: -1,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function pct(part: number, whole: number): string {
  if (whole <= 0) return "—";
  const rounded = Math.round((part / whole) * 100);
  // Round-to-whole-percent reads as "nobody did this" when it's actually a
  // handful of people out of hundreds of visits — say so explicitly instead.
  if (rounded === 0 && part > 0) return "<1%";
  return `${rounded}%`;
}

// Pinning an explicit locale + format keeps server and client output identical.
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
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
        <span style={{ fontSize: 11, color: "#4C616C" }}>
          {row.paymentMethod || "Payment method not recorded"} · {formatDateTime(row.createdAt)}
        </span>
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
          <p><strong>Payment method:</strong> {row.paymentMethod || "Not recorded (submitted before this was tracked)"}</p>
          <p><strong>Transaction ID:</strong> {row.transactionId || "Not provided"}</p>
          {row.verifiedAt && <p><strong>Verified at:</strong> {formatDateTime(row.verifiedAt)}</p>}

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

function LeadRowCard({
  lead,
  dismissed = false,
  onDelete,
  onRestore,
}: {
  lead: IncompleteLeadRow;
  dismissed?: boolean;
  onDelete?: (id: number) => Promise<void>;
  onRestore?: (id: number) => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const copyPhone = () => {
    navigator.clipboard.writeText(lead.phone).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm(`Delete incomplete lead for ${lead.phone}?`)) return;
    setDeleting(true);
    await onDelete(lead.id);
    setDeleting(false);
  };

  const handleRestore = async () => {
    if (!onRestore) return;
    setRestoring(true);
    await onRestore(lead.id);
    setRestoring(false);
  };

  const cleanDigits = lead.phone.replace(/[^0-9]/g, "");
  // If phone begins with 0, format for international Uganda format 256
  const waNumber = cleanDigits.startsWith("0")
    ? "256" + cleanDigits.slice(1)
    : cleanDigits.startsWith("256")
    ? cleanDigits
    : cleanDigits;

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: "18px 20px",
        marginBottom: 12,
        boxShadow: "0 2px 10px rgba(0,45,91,0.03)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: GREEN, letterSpacing: "0.02em" }}>
              {lead.phone}
            </span>
            <button
              type="button"
              onClick={copyPhone}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: CREAM,
                border: `1px solid ${BORDER}`,
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 11,
                fontWeight: 600,
                color: "#4C616C",
                cursor: "pointer",
              }}
            >
              {copied ? <Check size={12} color="#1E7B45" /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111D23", marginTop: 4 }}>
            {lead.parentName ? lead.parentName : <span style={{ color: "#8C9BA5", fontStyle: "italic" }}>Parent name not filled</span>}
            {lead.studentName && <span style={{ color: "#4C616C" }}> · Student: {lead.studentName}</span>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a
            href={`tel:${lead.phone}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              background: GREEN,
              color: "#fff",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <Phone size={13} />
            Call
          </a>
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 12px",
              background: "#25D366",
              color: "#fff",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <MessageSquare size={13} />
            WhatsApp
          </a>
          {dismissed ? (
            <button
              type="button"
              onClick={handleRestore}
              disabled={restoring}
              title="Restore Lead"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 12px",
                background: CREAM,
                color: GREEN,
                border: `1px solid ${BORDER}`,
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: restoring ? "wait" : "pointer",
              }}
            >
              <RotateCcw size={13} />
              {restoring ? "Restoring…" : "Restore"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              title="Dismiss / Delete Lead"
              style={{
                padding: "7px 10px",
                background: "#FCEBEB",
                color: "#C0392B",
                border: "1px solid rgba(192,57,43,0.2)",
                borderRadius: 6,
                fontSize: 12,
                cursor: deleting ? "wait" : "pointer",
              }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", fontSize: 12, color: "#4C616C", borderTop: `1px solid ${BORDER}`, paddingTop: 10 }}>
        {lead.email && <span><strong>Email:</strong> {lead.email}</span>}
        {lead.modules.length > 0 ? (
          <span>
            <strong>Modules:</strong> {lead.modules.join(", ")}{" "}
            <span style={{ color: ORANGE, fontWeight: 700 }}>({formatUgx(lead.amountDue)})</span>
          </span>
        ) : (
          <span style={{ fontStyle: "italic", color: "#8C9BA5" }}>No modules chosen yet</span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#8C9BA5" }}>
          Last active: {formatDateTime(lead.updatedAt)}
        </span>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  caption,
}: {
  label: string;
  value: string | number;
  caption?: string;
}) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#4C616C" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: GREEN, marginTop: 4 }}>{value}</div>
      {caption && <div style={{ fontSize: 11, fontWeight: 600, color: ORANGE, marginTop: 2 }}>{caption}</div>}
    </div>
  );
}

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

export default function RegistrationsDashboard({
  registrations,
  eventCounts,
  incompleteLeads,
  dismissedLeads,
  onMarkVerified,
  onDeleteLead,
  onRestoreLead,
}: Props) {
  const [view, setView] = useState<"analytics" | "registrations" | "leads">("analytics");
  const [showDismissed, setShowDismissed] = useState(false);
  // Rows saved before payment_method existed have "" — treat those as MoMo,
  // since MoMo was the only option at the time.
  const isCash = (r: RegistrationRow) => r.paymentMethod === "Cash";
  const unpaid = registrations.filter((r) => !isCash(r) && !r.transactionId && !r.verified);
  const awaiting = registrations.filter((r) => !isCash(r) && r.transactionId && !r.verified);
  const cashAwaiting = registrations.filter((r) => isCash(r) && !r.verified);
  const verified = registrations.filter((r) => r.verified);

  // Choosing cash or giving a transaction ID both mean the family is
  // claiming a spot, verified or not.
  const reservedCount = awaiting.length + cashAwaiting.length + verified.length;
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
      <h1 style={{ fontSize: 26, fontWeight: 800, color: GREEN, marginBottom: 24 }}>
        Bootcamp Registrations &amp; Analytics
      </h1>

      <TabBar
        active={view}
        onChange={setView}
        leadsCount={incompleteLeads.length}
        registrationsCount={registrations.length}
      />

      {view === "analytics" ? (
        <>
          {/* Earliest funnel stage — counted server-side in our own DB */}
          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#4C616C", marginBottom: 10 }}>
            Apply Page Funnel
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
            <StatTile label="Visits" value={eventCounts.applyView} />
            <StatTile
              label="Started the form"
              value={eventCounts.formStarted}
              caption={`${pct(eventCounts.formStarted, eventCounts.applyView)} of visits`}
            />
            <StatTile
              label="MoMo code copied"
              value={eventCounts.momoCodeCopied}
              caption={`${pct(eventCounts.momoCodeCopied, eventCounts.applyView)} of visits`}
            />
            <StatTile
              label="Registrations completed"
              value={registrations.length}
              caption={`${pct(registrations.length, eventCounts.formStarted)} of starts`}
            />
          </div>
          {/* Raw submit-button clicks — can be higher than "Registrations
              completed" when someone resubmits (e.g. saving unpaid, then
              coming back to add a transaction ID). Shown separately so a
              busy retry session never reads as more real registrations than
              actually happened. */}
          <p style={{ fontSize: 11.5, color: "#8C9BA5", marginTop: -12, marginBottom: 20 }}>
            {eventCounts.formSubmitted} submit-button clicks recorded in total
            {eventCounts.formSubmitted > registrations.length
              ? ` — ${eventCounts.formSubmitted - registrations.length} were resubmissions of an existing registration, not new ones`
              : ""}
            .
          </p>

          <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#4C616C", marginBottom: 10 }}>
            Registration &amp; Lead Stats
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
            <StatTile label="Total registrations" value={registrations.length} />
            <StatTile label="Verified" value={verified.length} />
            <StatTile label="Incomplete leads" value={incompleteLeads.length} caption="Phone entered, unsubmitted" />
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
              {verified.length} verified · {awaiting.length} awaiting MoMo confirmation · {cashAwaiting.length} paying cash
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <BarBreakdown title="Module demand" items={moduleDemand} />
            <BarBreakdown title="Cohort split" items={cohortSplit} />
            <BarBreakdown title="How they heard about us" items={channelBreakdown} />
          </div>
        </>
      ) : view === "registrations" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 20, alignItems: "start" }}>
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
            title="Paying Cash"
            rows={cashAwaiting}
            showVerifyButton
            onMarkVerified={onMarkVerified}
            emptyText="No one has chosen to pay cash yet."
          />
          <Section
            title="Verified"
            rows={verified}
            showVerifyButton={false}
            onMarkVerified={onMarkVerified}
            emptyText="No verified registrations yet."
          />
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 18 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: GREEN, marginBottom: 4 }}>
              Started but Unfinished Forms
            </h2>
            <p style={{ fontSize: 13, color: "#4C616C", lineHeight: 1.6, maxWidth: 680 }}>
              These parents typed in their phone number on the registration form but left without submitting.
              You can contact them directly via call or WhatsApp to assist with questions or help them complete payment.
            </p>
          </div>

          {incompleteLeads.length === 0 ? (
            <div style={{ background: CREAM, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "36px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: "#4C616C", fontWeight: 600 }}>
                No incomplete leads captured yet.
              </p>
              <p style={{ fontSize: 12.5, color: "#8C9BA5", marginTop: 4 }}>
                When visitors enter a phone number on /apply without submitting, they will appear here automatically.
              </p>
            </div>
          ) : (
            <div>
              {incompleteLeads.map((lead) => (
                <LeadRowCard key={lead.id} lead={lead} onDelete={onDeleteLead} />
              ))}
            </div>
          )}

          {dismissedLeads.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <button
                type="button"
                onClick={() => setShowDismissed((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: "#4C616C",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                {showDismissed ? "Hide" : "Show"} dismissed leads ({dismissedLeads.length})
              </button>

              {showDismissed && (
                <div style={{ marginTop: 14 }}>
                  {dismissedLeads.map((lead) => (
                    <LeadRowCard key={lead.id} lead={lead} dismissed onRestore={onRestoreLead} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
