"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, EyeOff, Link2, LogOut, MessageSquare, Phone, RotateCcw, Search, UserCheck } from "lucide-react";
import {
  FEE_UGX,
  INTERESTS,
  STEPS,
  WEEKS,
  formatUgx,
  hackathonCsv,
  interestsText,
  paymentStatus,
  tally,
  weekLabel,
  type HackathonLead,
  type HackathonRow,
  type PaymentStatus,
} from "@/lib/hackathon";
import type { FunnelStep } from "@/lib/analyticsEvents";

interface Props {
  rows: HackathonRow[];
  leads: HackathonLead[];
  dismissedLeads: HackathonLead[];
  funnel: FunnelStep[];
  onSetVerified: (id: number, verified: boolean) => Promise<void>;
  onSetLeadFlag: (id: number, flag: "contacted" | "dismissed", value: boolean) => Promise<void>;
}

type Filter = "All" | PaymentStatus | "Unfinished";
const FILTERS: Filter[] = ["All", "Awaiting check", "Needs MoMo ID", "Paying cash", "Verified", "Unfinished"];

const FUNNEL_LABELS: Record<string, string> = {
  hackathon_view: "Visited",
  hackathon_started: "Started",
  hackathon_parent_done: "Parent step",
  hackathon_child_done: "Child step",
  hackathon_submitted: "Submitted",
};

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

// Pinned locale and time zone so the server and the browser render the same text.
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Kampala",
  });

const waNumber = (phone: string) => {
  const d = phone.replace(/\D/g, "");
  return d.startsWith("0") ? `256${d.slice(1)}` : d;
};

const pct = (part: number, whole: number) => {
  if (whole <= 0) return "—";
  const r = Math.round((part / whole) * 100);
  return r === 0 && part > 0 ? "<1%" : `${r}%`;
};

function Bars({ items, empty = "Nothing yet." }: { items: { name: string; count: number }[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) return <p className="hk-muted">{empty}</p>;
  return (
    <ul className="hk-bars">
      {items.map((item) => (
        <li key={item.name}>
          <div className="hk-bar-head">
            <span>{item.name}</span>
            <strong>{item.count}</strong>
          </div>
          <div className="hk-bar-track">
            <div className="hk-bar-fill" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatusPill({ status }: { status: PaymentStatus }) {
  const cls = status === "Verified" ? "ok" : status === "Paying cash" ? "cash" : status === "Needs MoMo ID" ? "need" : "wait";
  return <span className={`hk-pill hk-pill-${cls}`}>{status}</span>;
}

function LearnerRow({ r, onSetVerified }: { r: HackathonRow; onSetVerified: Props["onSetVerified"] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const status = paymentStatus(r);
  const toggle = () => start(() => onSetVerified(r.id, !r.verified));
  const [copied, setCopied] = useState(false);
  // The family's own link for adding the MoMo ID, to paste into WhatsApp.
  const copyPayLink = () => {
    if (!r.payToken) return;
    navigator.clipboard
      ?.writeText(`${window.location.origin}/hackathon/pay/${r.payToken}`)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <div className={`hk-row${open ? " is-open" : ""}`}>
      <button type="button" className="hk-row-main" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="hk-cell hk-child">
          <strong>
            {r.learnerName}
            {r.site !== "pearllabs.ug" && <span className="hk-site">via {r.site}</span>}
          </strong>
          <small>
            {r.age} yrs · {r.classGrade} · {r.school}
          </small>
        </span>
        <span className="hk-cell hk-week">{weekLabel(r.week)}</span>
        <span className="hk-cell hk-parent">
          <span>{r.parentName}</span>
          <small>{r.parentPhone}</small>
        </span>
        <span className="hk-cell hk-pay">
          <span>{r.paymentMethod === "Cash" ? "Cash" : "MoMo"}</span>
          <small className="hk-mono">{r.transactionId || "—"}</small>
        </span>
        <span className="hk-cell hk-status">
          <StatusPill status={status} />
        </span>
      </button>
      <div className="hk-row-actions">
        {status === "Needs MoMo ID" && r.payToken && (
          <button type="button" className="hk-btn hk-btn-ghost" onClick={copyPayLink} title="Copy the link where the family adds their MoMo ID">
            {copied ? <Check size={14} /> : <Link2 size={14} />}
            {copied ? "Copied" : "Pay link"}
          </button>
        )}
        <button type="button" className={`hk-btn ${r.verified ? "hk-btn-ghost" : "hk-btn-ok"}`} onClick={toggle} disabled={pending}>
          {r.verified ? <RotateCcw size={14} /> : <Check size={14} />}
          {pending ? "Saving…" : r.verified ? "Undo" : r.paymentMethod === "Cash" ? "Cash received" : "Verify"}
        </button>
        <a className="hk-icon" href={`tel:${r.parentPhone.replace(/\s/g, "")}`} title="Call" aria-label={`Call ${r.parentName}`}>
          <Phone size={15} />
        </a>
        <a
          className="hk-icon"
          href={`https://wa.me/${waNumber(r.parentPhone)}`}
          target="_blank"
          rel="noreferrer"
          title="WhatsApp"
          aria-label={`WhatsApp ${r.parentName}`}
        >
          <MessageSquare size={15} />
        </a>
      </div>
      {open && (
        <dl className="hk-details">
          <div><dt>Parent</dt><dd>{r.parentName} ({r.relationship}) · {r.parentEmail}</dd></div>
          <div><dt>Gender</dt><dd>{r.gender}</dd></div>
          <div><dt>Interests</dt><dd>{interestsText(r.interests)}</dd></div>
          <div><dt>Laptop</dt><dd>{r.hasLaptop === "Yes" ? "Bringing one" : "Needs one"}</dd></div>
          <div><dt>Trip</dt><dd>{r.trip === "Yes" ? `Applying · passport: ${r.passport}` : "Not applying"}</dd></div>
          <div><dt>Photos</dt><dd>{r.photoConsent === "Yes" ? "Allowed" : "Not allowed"}</dd></div>
          <div><dt>Amount</dt><dd>{formatUgx(r.amountDue)}</dd></div>
          <div><dt>Registered</dt><dd>{when(r.createdAt)}</dd></div>
          {r.verifiedAt && <div><dt>Verified</dt><dd>{when(r.verifiedAt)}</dd></div>}
        </dl>
      )}
    </div>
  );
}

function LeadRow({ lead, onSetLeadFlag }: { lead: HackathonLead; onSetLeadFlag: Props["onSetLeadFlag"] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const f = lead.fields;
  const flag = (k: "contacted" | "dismissed", v: boolean) => start(() => onSetLeadFlag(lead.id, k, v));
  const copyPhone = () =>
    navigator.clipboard
      ?.writeText(f.parentPhone)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});

  return (
    <div className={`hk-row hk-lead${lead.contacted ? " is-contacted" : ""}`}>
      <button type="button" className="hk-row-main hk-lead-main" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="hk-cell hk-child">
          <strong>
            {f.parentName || "No name yet"}
            {lead.site !== "pearllabs.ug" && <span className="hk-site">via {lead.site}</span>}
          </strong>
          <small>
            {f.parentPhone}
            {f.learnerName ? ` · for ${f.learnerName}` : ""}
          </small>
        </span>
        <span className="hk-cell">
          <span>Stopped at</span>
          <small>{STEPS[lead.step]}</small>
        </span>
        <span className="hk-cell">
          <span>{when(lead.updatedAt)}</span>
          <small>last active</small>
        </span>
        <span className="hk-cell hk-status">
          {lead.dismissed ? (
            <span className="hk-pill hk-pill-cash">Dismissed</span>
          ) : lead.contacted ? (
            <span className="hk-pill hk-pill-ok">Contacted</span>
          ) : (
            <span className="hk-pill hk-pill-need">To call</span>
          )}
        </span>
      </button>
      <div className="hk-row-actions">
        {lead.dismissed ? (
          <button type="button" className="hk-btn hk-btn-ghost" onClick={() => flag("dismissed", false)} disabled={pending}>
            <RotateCcw size={14} /> Restore
          </button>
        ) : (
          <>
            <button
              type="button"
              className={`hk-btn ${lead.contacted ? "hk-btn-ghost" : "hk-btn-ok"}`}
              onClick={() => flag("contacted", !lead.contacted)}
              disabled={pending}
            >
              {lead.contacted ? <RotateCcw size={14} /> : <UserCheck size={14} />}
              {lead.contacted ? "Undo" : "Contacted"}
            </button>
            <button
              type="button"
              className="hk-icon"
              onClick={() => flag("dismissed", true)}
              disabled={pending}
              title="Dismiss"
              aria-label="Dismiss"
            >
              <EyeOff size={15} />
            </button>
          </>
        )}
        <button type="button" className="hk-icon" onClick={copyPhone} title="Copy phone" aria-label="Copy phone">
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
        <a className="hk-icon" href={`tel:${f.parentPhone.replace(/\s/g, "")}`} title="Call" aria-label="Call">
          <Phone size={15} />
        </a>
        <a
          className="hk-icon"
          href={`https://wa.me/${waNumber(f.parentPhone)}`}
          target="_blank"
          rel="noreferrer"
          title="WhatsApp"
          aria-label="WhatsApp"
        >
          <MessageSquare size={15} />
        </a>
      </div>
      {open && (
        <dl className="hk-details">
          <div><dt>Parent</dt><dd>{[f.parentName, f.relationship && `(${f.relationship})`, f.parentEmail].filter(Boolean).join(" ") || "—"}</dd></div>
          <div><dt>Child</dt><dd>{[f.learnerName, f.age && `${f.age} yrs`, f.classGrade, f.school].filter(Boolean).join(" · ") || "—"}</dd></div>
          <div><dt>Week</dt><dd>{f.week ? weekLabel(f.week) : "—"}</dd></div>
          <div><dt>Interests</dt><dd>{f.interests.length ? interestsText(f.interests) : "—"}</dd></div>
          <div><dt>Trip</dt><dd>{f.trip || "—"}</dd></div>
          <div><dt>Payment</dt><dd>{f.paymentMethod ? `${f.paymentMethod}${f.transactionId ? ` · ${f.transactionId}` : ""}` : "—"}</dd></div>
          <div><dt>Started</dt><dd>{when(lead.createdAt)}</dd></div>
        </dl>
      )}
    </div>
  );
}

export default function HackathonDashboard({ rows, leads, dismissedLeads, funnel, onSetVerified, onSetLeadFlag }: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [showDismissed, setShowDismissed] = useState(false);

  const stats = useMemo(() => {
    const verified = rows.filter((r) => r.verified);
    return {
      verified: verified.length,
      awaiting: rows.filter((r) => paymentStatus(r) === "Awaiting check").length,
      needId: rows.filter((r) => paymentStatus(r) === "Needs MoMo ID").length,
      cash: rows.filter((r) => paymentStatus(r) === "Paying cash").length,
      collected: verified.reduce((s, r) => s + r.amountDue, 0),
      expected: rows.reduce((s, r) => s + r.amountDue, 0),
      trip: rows.filter((r) => r.trip === "Yes").length,
      tripPassport: rows.filter((r) => r.trip === "Yes" && r.passport === "Yes").length,
      needLaptop: rows.filter((r) => r.hasLaptop === "No").length,
      schools: tally(rows.map((r) => r.school)),
      weeks: Object.entries(WEEKS).map(([k, name]) => ({ name, count: rows.filter((r) => r.week === k).length })),
      interests: Object.entries(INTERESTS)
        .map(([k, name]) => ({ name, count: rows.filter((r) => r.interests.includes(k)).length }))
        .sort((a, b) => b.count - a.count),
      gender: tally(rows.map((r) => r.gender)),
      sites: tally(rows.map((r) => r.site)),
    };
  }, [rows]);

  const q = query.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (filter === "All" || paymentStatus(r) === filter) &&
      (!q || [r.learnerName, r.school, r.parentName, r.parentPhone, r.transactionId, r.site].some((v) => v.toLowerCase().includes(q))),
  );
  const matchLead = (l: HackathonLead) =>
    !q || [l.fields.parentName, l.fields.parentPhone, l.fields.learnerName, l.fields.school].some((v) => v.toLowerCase().includes(q));
  // Not yet contacted first, then most recent.
  const shownLeads = leads.filter(matchLead).sort((a, b) => Number(a.contacted) - Number(b.contacted));
  const countFor = (f: Filter) =>
    f === "All" ? rows.length : f === "Unfinished" ? leads.length : rows.filter((r) => paymentStatus(r) === f).length;

  // The funnel ends with the people who actually registered and whose payment is confirmed.
  const funnelSteps = [
    ...funnel.map((s) => ({ label: FUNNEL_LABELS[s.type] ?? s.type, value: s.unique, note: `${s.total} total` })),
    { label: "Paid (verified)", value: stats.verified, note: `${rows.length} registered` },
  ];
  const top = Math.max(1, funnelSteps[0]?.value ?? 1);

  const signOut = async () => {
    await fetch("/api/pl-ac/logout", { method: "POST" }).catch(() => {});
    router.push("/pl-ac/login");
    router.refresh();
  };

  return (
    <div className="hk">
      <style>{css}</style>
      <header className="hk-top">
        <div className="hk-top-in">
          <div className="hk-brand">
            <span className="hk-dot" /> Pearl AI Labs <span className="hk-sep">/</span> Hackathon desk
          </div>
          <button type="button" className="hk-signout" onClick={signOut}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="hk-main">
        <section className="hk-hero">
          <div>
            <p className="hk-eyebrow">National ICT Innovation Hub · December 2026</p>
            <h1>STEM Innovation Hackathon</h1>
            <p className="hk-muted">Fee {formatUgx(FEE_UGX)} per child · MoMo and cash</p>
          </div>
          <button type="button" className="hk-btn hk-btn-primary" onClick={() => download(rows)} disabled={rows.length === 0}>
            <Download size={15} /> Export CSV
          </button>
        </section>

        <section className="hk-kpis">
          <div className="hk-kpi hk-kpi-dark">
            <span>Registered</span>
            <strong>{rows.length}</strong>
            <small>{stats.schools.length} {stats.schools.length === 1 ? "school" : "schools"}</small>
          </div>
          <div className="hk-kpi">
            <span>Money confirmed</span>
            <strong>{formatUgx(stats.collected)}</strong>
            <div className="hk-meter">
              <div style={{ width: `${stats.expected ? (stats.collected / stats.expected) * 100 : 0}%` }} />
            </div>
            <small>of {formatUgx(stats.expected)} registered</small>
          </div>
          <div className="hk-kpi">
            <span>MoMo to check</span>
            <strong>{stats.awaiting}</strong>
            <small>{stats.needId ? `+ ${stats.needId} waiting for an ID` : "against the MoMo statement"}</small>
          </div>
          <div className="hk-kpi">
            <span>Paying cash</span>
            <strong>{stats.cash}</strong>
            <small>not yet received</small>
          </div>
          <button type="button" className="hk-kpi hk-kpi-alert" onClick={() => setFilter("Unfinished")}>
            <span>Unfinished forms</span>
            <strong>{leads.length}</strong>
            <small>{leads.filter((l) => !l.contacted).length} still to call</small>
          </button>
        </section>

        <section className="hk-card">
          <div className="hk-card-head">
            <h2>Funnel</h2>
            <span className="hk-muted">Unique visitors (each browser counted once)</span>
          </div>
          <ol className="hk-funnel">
            {funnelSteps.map((s, i) => (
              <li key={s.label}>
                <div className="hk-funnel-bar">
                  <div style={{ height: `${Math.max(4, (s.value / top) * 100)}%` }} />
                </div>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
                <small>{i === 0 ? s.note : `${pct(s.value, funnelSteps[i - 1].value)} of previous`}</small>
              </li>
            ))}
          </ol>
        </section>

        <section className="hk-grid">
          <div className="hk-card">
            <h2>Week</h2>
            <div className="hk-split">
              {stats.weeks.map((w) => (
                <div key={w.name}>
                  <strong>{w.count}</strong>
                  <span>{w.name}</span>
                </div>
              ))}
            </div>
            <h3>Needs</h3>
            <div className="hk-split">
              <div>
                <strong>{stats.needLaptop}</strong>
                <span>need a laptop</span>
              </div>
              <div>
                <strong>{stats.trip}</strong>
                <span>want the trip · {stats.tripPassport} with passport</span>
              </div>
            </div>
          </div>
          <div className="hk-card">
            <h2>Schools</h2>
            <Bars items={stats.schools.slice(0, 8)} />
            {stats.schools.length > 8 && <p className="hk-muted">+ {stats.schools.length - 8} more in the CSV</p>}
          </div>
          <div className="hk-card">
            <h2>Interests</h2>
            <Bars items={stats.interests} />
            <h3>Gender</h3>
            <Bars items={stats.gender} />
            <h3>Registered on</h3>
            <Bars items={stats.sites} />
          </div>
        </section>

        <section className="hk-card hk-list">
          <div className="hk-list-head">
            <div className="hk-tabs" role="tablist">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  className={`hk-tab${filter === f ? " is-active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f} <span>{countFor(f)}</span>
                </button>
              ))}
            </div>
            <label className="hk-search">
              <Search size={15} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, school, phone or MoMo ID" />
            </label>
          </div>

          {filter === "Unfinished" ? (
            <>
              <p className="hk-note">
                Families who typed a phone number but didn&apos;t finish. They drop off this list once they register.
              </p>
              {shownLeads.length === 0 ? (
                <div className="hk-empty">
                  <strong>No unfinished forms</strong>
                  <span>Anyone who enters a phone number and stops will show up here.</span>
                </div>
              ) : (
                shownLeads.map((l) => <LeadRow key={l.id} lead={l} onSetLeadFlag={onSetLeadFlag} />)
              )}
              {dismissedLeads.length > 0 && (
                <div className="hk-dismissed">
                  <button type="button" className="hk-link" onClick={() => setShowDismissed((v) => !v)}>
                    {showDismissed ? "Hide" : "Show"} dismissed ({dismissedLeads.length})
                  </button>
                  {showDismissed && dismissedLeads.map((l) => <LeadRow key={l.id} lead={l} onSetLeadFlag={onSetLeadFlag} />)}
                </div>
              )}
            </>
          ) : (
            <>
          <div className="hk-thead" aria-hidden="true">
            <span>Child</span>
            <span>Week</span>
            <span>Parent</span>
            <span>Payment</span>
            <span>Status</span>
          </div>

          {rows.length === 0 ? (
            <div className="hk-empty">
              <strong>No registrations yet</strong>
              <span>They appear here as soon as a family submits pearllabs.ug/hackathon.</span>
            </div>
          ) : shown.length === 0 ? (
            <div className="hk-empty">
              <strong>Nothing matches</strong>
              <span>Try another filter or search.</span>
            </div>
          ) : (
            shown.map((r) => <LearnerRow key={r.id} r={r} onSetVerified={onSetVerified} />)
          )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

const css = `
.hk { --navy:#002D5B; --orange:#EF8633; --cream:#F4FAFF; --ink:#111D23; --muted:#4C616C; --line:rgba(0,45,91,.1);
  --ok:#1E7F4F; --okbg:#E6F4EC; --waitbg:#FFF1E4; --cashbg:#E8EFF7;
  min-height:100vh; background:var(--cream); color:var(--ink); font-family:var(--font-body),system-ui,sans-serif; }
.hk *{ box-sizing:border-box; }
.hk h1,.hk h2,.hk h3{ font-family:var(--font-heading),sans-serif; color:var(--navy); margin:0; }
.hk-muted{ color:var(--muted); font-size:13px; margin:0; }
.hk-top{ background:var(--navy); color:#fff; }
.hk-top-in{ max-width:1200px; margin:0 auto; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; gap:12px; }
.hk-brand{ display:flex; align-items:center; gap:8px; font-size:13px; font-weight:700; letter-spacing:.02em; }
.hk-sep{ opacity:.4; }
.hk-dot{ width:8px; height:8px; border-radius:50%; background:var(--orange); }
.hk-signout{ display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.1); color:#fff; border:none; border-radius:999px; padding:7px 14px; font:inherit; font-size:12.5px; font-weight:600; cursor:pointer; }
.hk-signout:hover{ background:rgba(255,255,255,.18); }
.hk-main{ max-width:1200px; margin:0 auto; padding:28px 16px 80px; display:flex; flex-direction:column; gap:18px; }
.hk-hero{ display:flex; justify-content:space-between; align-items:flex-end; gap:16px; flex-wrap:wrap; }
.hk-hero h1{ font-size:clamp(28px,4.5vw,42px); font-weight:700; letter-spacing:-.025em; line-height:1.05; margin:6px 0 8px; }
.hk-eyebrow{ font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--orange); margin:0; }
.hk-btn{ display:inline-flex; align-items:center; gap:6px; border:none; border-radius:999px; font:inherit; font-size:13px; font-weight:700; padding:9px 16px; cursor:pointer; white-space:nowrap; }
.hk-btn:disabled{ opacity:.5; cursor:default; }
.hk-btn-primary{ background:var(--navy); color:#fff; padding:11px 20px; }
.hk-btn-ok{ background:var(--navy); color:#fff; }
.hk-btn-ghost{ background:#fff; color:var(--muted); border:1px solid var(--line); }
.hk-kpis{ display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:12px; }
.hk-kpi-alert{ font:inherit; text-align:left; cursor:pointer; background:#FFF7EF; border-color:rgba(239,134,51,.4); }
.hk-kpi-alert:hover{ border-color:var(--orange); }
.hk-note{ margin:0; padding:12px 18px; font-size:13px; color:var(--muted); border-bottom:1px solid var(--line); background:#FAFCFE; }
.hk-row-main.hk-lead-main{ grid-template-columns:2.2fr 1fr 1fr 1fr; }
.hk-lead.is-contacted{ opacity:.75; }
.hk-dismissed{ padding:12px 0 0; border-top:1px solid var(--line); }
.hk-link{ background:none; border:none; padding:0 18px; font:inherit; font-size:12.5px; font-weight:700; color:var(--muted); text-decoration:underline; cursor:pointer; margin-bottom:8px; }
.hk-site{ display:inline-block; margin-left:8px; padding:1px 8px; border-radius:999px; background:#EEF2FF; color:#3B4BA8; font-size:11px; font-weight:700; vertical-align:middle; }
.hk-pill-need{ background:#FDECEC; color:#B03A2E; }
button.hk-icon{ cursor:pointer; padding:0; }
.hk-kpi{ background:#fff; border:1px solid var(--line); border-radius:16px; padding:16px 18px; display:flex; flex-direction:column; gap:4px; min-width:0; }
.hk-kpi span{ font-size:12px; font-weight:600; color:var(--muted); }
.hk-kpi strong{ font-family:var(--font-heading),sans-serif; font-size:28px; font-weight:700; color:var(--navy); letter-spacing:-.02em; overflow-wrap:anywhere; }
.hk-kpi small{ font-size:12px; color:var(--muted); }
.hk-kpi-dark{ background:var(--navy); border-color:var(--navy); }
.hk-kpi-dark span,.hk-kpi-dark small{ color:rgba(255,255,255,.7); }
.hk-kpi-dark strong{ color:#fff; font-size:40px; }
.hk-meter{ height:6px; background:var(--cream); border-radius:999px; overflow:hidden; margin:4px 0 2px; }
.hk-meter div{ height:100%; background:var(--orange); border-radius:999px; }
.hk-card{ background:#fff; border:1px solid var(--line); border-radius:16px; padding:18px; min-width:0; }
.hk-card h2{ font-size:15px; font-weight:700; margin-bottom:14px; }
.hk-card h3{ font-size:13px; font-weight:700; margin:18px 0 10px; }
.hk-card-head{ display:flex; justify-content:space-between; align-items:baseline; gap:12px; flex-wrap:wrap; }
.hk-funnel{ list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:10px; }
.hk-funnel li{ display:flex; flex-direction:column; gap:2px; min-width:0; }
.hk-funnel-bar{ height:90px; background:var(--cream); border-radius:10px; display:flex; align-items:flex-end; overflow:hidden; margin-bottom:8px; }
.hk-funnel-bar div{ width:100%; background:linear-gradient(180deg,var(--orange),#F4A866); border-radius:10px 10px 0 0; }
.hk-funnel li:last-child .hk-funnel-bar div{ background:var(--navy); }
.hk-funnel strong{ font-family:var(--font-heading),sans-serif; font-size:22px; color:var(--navy); }
.hk-funnel span{ font-size:12.5px; font-weight:600; color:var(--ink); }
.hk-funnel small{ font-size:11.5px; color:var(--muted); }
.hk-grid{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; }
.hk-split{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.hk-split div{ background:var(--cream); border-radius:12px; padding:12px 14px; display:flex; flex-direction:column; gap:2px; }
.hk-split strong{ font-family:var(--font-heading),sans-serif; font-size:26px; color:var(--navy); }
.hk-split span{ font-size:12px; color:var(--muted); }
.hk-bars{ list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; }
.hk-bar-head{ display:flex; justify-content:space-between; gap:8px; font-size:12.5px; color:var(--muted); margin-bottom:4px; }
.hk-bar-head span{ overflow-wrap:anywhere; }
.hk-bar-head strong{ color:var(--navy); }
.hk-bar-track{ height:7px; background:var(--cream); border-radius:999px; overflow:hidden; }
.hk-bar-fill{ height:100%; background:var(--orange); border-radius:999px; }
.hk-list{ padding:0; overflow:hidden; }
.hk-list-head{ display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; padding:14px 18px; border-bottom:1px solid var(--line); }
.hk-tabs{ display:flex; gap:6px; flex-wrap:wrap; }
.hk-tab{ border:1px solid var(--line); background:#fff; color:var(--muted); border-radius:999px; padding:6px 12px; font:inherit; font-size:12.5px; font-weight:600; cursor:pointer; }
.hk-tab span{ margin-left:4px; opacity:.7; }
.hk-tab.is-active{ background:var(--navy); border-color:var(--navy); color:#fff; }
.hk-search{ display:flex; align-items:center; gap:8px; background:var(--cream); border-radius:999px; padding:8px 14px; color:var(--muted); width:300px; max-width:100%; }
.hk-search input{ border:none; background:none; outline:none; font:inherit; font-size:13px; color:var(--ink); width:100%; min-width:0; }
.hk-thead,.hk-row-main{ display:grid; grid-template-columns:2.2fr .9fr 1.5fr 1.3fr 1fr; gap:12px; align-items:center; }
.hk-thead{ padding:10px 18px; padding-right:300px; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); background:#FAFCFE; border-bottom:1px solid var(--line); }
.hk-row{ position:relative; border-bottom:1px solid var(--line); }
.hk-row:last-child{ border-bottom:none; }
.hk-row:hover{ background:#FBFDFF; }
.hk-row-main{ width:100%; padding:14px 18px; padding-right:300px; background:none; border:none; text-align:left; font:inherit; color:inherit; cursor:pointer; }
.hk-cell{ display:flex; flex-direction:column; gap:2px; font-size:13.5px; min-width:0; }
.hk-cell small{ font-size:12px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.hk-child strong{ color:var(--navy); font-size:14px; }
.hk-mono{ font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
.hk-row-actions{ position:absolute; right:18px; top:12px; display:flex; gap:6px; align-items:center; }
.hk-icon{ width:32px; height:32px; display:grid; place-items:center; border-radius:50%; border:1px solid var(--line); color:var(--navy); background:#fff; }
.hk-icon:hover{ border-color:var(--navy); }
.hk-pill{ display:inline-block; padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; white-space:nowrap; width:max-content; }
.hk-pill-ok{ background:var(--okbg); color:var(--ok); }
.hk-pill-wait{ background:var(--waitbg); color:#B35A12; }
.hk-pill-cash{ background:var(--cashbg); color:var(--navy); }
.hk-details{ margin:0; padding:0 18px 16px; display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:8px 20px; }
.hk-details div{ display:flex; gap:8px; font-size:13px; }
.hk-details dt{ color:var(--muted); min-width:80px; }
.hk-details dd{ margin:0; color:var(--ink); overflow-wrap:anywhere; }
.hk-empty{ padding:40px 18px; text-align:center; display:flex; flex-direction:column; gap:4px; }
.hk-empty strong{ color:var(--navy); }
.hk-empty span{ font-size:13px; color:var(--muted); }
@media (max-width:960px){
  .hk-kpis{ grid-template-columns:repeat(2,minmax(0,1fr)); }
  .hk-row-main.hk-lead-main{ grid-template-columns:1fr 1fr; }
  .hk-grid{ grid-template-columns:1fr; }
  .hk-funnel{ grid-template-columns:repeat(3,minmax(0,1fr)); row-gap:18px; }
  .hk-thead{ display:none; }
  .hk-row-main{ grid-template-columns:1fr 1fr; padding-right:18px; padding-bottom:6px; }
  .hk-child{ grid-column:1 / -1; }
  .hk-row-actions{ position:static; padding:0 18px 14px; }
}
@media (max-width:480px){
  .hk-kpis{ grid-template-columns:1fr 1fr; gap:8px; }
  .hk-kpi strong{ font-size:22px; }
  .hk-kpi-dark strong{ font-size:30px; }
  .hk-search{ width:100%; }
}
`;
