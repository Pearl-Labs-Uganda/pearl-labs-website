import { escapeHtml, transport } from "@/lib/placementEmail";
import { FEE_UGX, formatUgx, summaryRows, weekLabel, type HackathonFields, type HackathonRow } from "@/lib/hackathon";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pearllabs.ug";
const STAFF_PAGE = `${SITE}/pl-ac/hackathon`;
export const payLink = (token: string) => `${SITE}/hackathon/pay/${token}`;
const staffInbox = (user: string) => process.env.HACKATHON_TO_EMAIL ?? process.env.INTERNSHIP_TO_EMAIL ?? user;

// To Pearl: a backup copy of every registration (the database is the main record).
export async function sendHackathonStaffEmail(f: HackathonFields, saved: boolean) {
  const { user, mailer } = transport();
  const rows = summaryRows(f);
  const where = saved
    ? `Check the payment and see everyone: ${STAFF_PAGE}`
    : "⚠ This registration could NOT be saved to the website database — this email is the only copy.";
  const tag = f.paymentMethod === "Cash" ? "[CASH] " : f.transactionId ? "[MOMO] " : "[MOMO, NO ID YET] ";
  const text = ["STEM Innovation Hackathon — registration", "", ...rows.map(([k, v]) => `${k}: ${v}`), "", where].join("\n");
  const html = `<h2>STEM Innovation Hackathon — registration</h2>${rows
    .map(([k, v]) => `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</p>`)
    .join("")}<p>${escapeHtml(where)}</p>`;
  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? `Pearl Labs Website <${user}>`,
    to: staffInbox(user),
    replyTo: f.parentEmail,
    subject: `${saved ? "" : "[NOT SAVED] "}${tag}Hackathon — ${f.learnerName} — ${f.school}`,
    text,
    html,
  });
}

// To the parent: what we received and what happens next. Nothing is promised beyond that.
export async function sendHackathonParentEmail(f: HackathonFields, payToken: string | null) {
  const { user, mailer } = transport();
  const first = f.parentName.trim().split(/\s+/)[0];
  const payment =
    f.paymentMethod === "Cash"
      ? `You chose to pay in cash. Please bring ${formatUgx(FEE_UGX)} to Pearl AI Labs at the National ICT Innovation Hub, Nakawa, during working hours before the hackathon, or on the first day.`
      : f.transactionId
        ? `We've received your MTN MoMo transaction ID (${f.transactionId}) for ${formatUgx(FEE_UGX)}. We'll confirm once we've checked it against our statement.`
        : `Thank you for paying ${formatUgx(FEE_UGX)} by MTN MoMo. So we can match your payment, please add the transaction ID from your MoMo confirmation SMS${payToken ? ` here: ${payLink(payToken)}` : " by replying to this email"}.`;
  const lines = [
    `Hi ${first},`,
    "",
    `${f.learnerName} is registered for the STEM Innovation Hackathon at the National ICT Innovation Hub, Nakawa, for the week of ${weekLabel(f.week)}.`,
    payment,
    ...(f.trip === "Yes" ? ["We've also noted that they'd like to apply for the trip. We'll share the details."] : []),
    "",
    "We'll be in touch with the programme and what to bring.",
    "",
    "Pearl AI Labs and AeRoCAD Learners",
    "pearllabsug@gmail.com · +256 763 839356",
  ];
  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? `Pearl AI Labs <${user}>`,
    to: f.parentEmail,
    replyTo: staffInbox(user),
    subject: `${f.learnerName} is registered for the STEM Innovation Hackathon`,
    text: lines.join("\n"),
    html: lines.map((l) => (l ? `<p>${escapeHtml(l)}</p>` : "")).join(""),
  });
}

// To Pearl: a family added their MoMo transaction ID through their pay link.
export async function sendHackathonIdAddedEmail(r: HackathonRow) {
  const { user, mailer } = transport();
  const lines = [
    `${r.parentName} added the MoMo transaction ID for ${r.learnerName} (${r.school}).`,
    `Transaction ID: ${r.transactionId}`,
    `Amount: ${formatUgx(r.amountDue)}`,
    "",
    `Check it against the MoMo statement, then press Verify: ${STAFF_PAGE}`,
  ];
  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? `Pearl Labs Website <${user}>`,
    to: staffInbox(user),
    subject: `[MOMO ID ADDED] Hackathon — ${r.learnerName}`,
    text: lines.join("\n"),
    html: lines.map((l) => (l ? `<p>${escapeHtml(l)}</p>` : "")).join(""),
  });
}
