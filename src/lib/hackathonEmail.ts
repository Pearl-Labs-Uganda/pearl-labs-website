import { escapeHtml, transport } from "@/lib/placementEmail";
import { summaryRows, weekLabel, type HackathonFields } from "@/lib/hackathon";

const STAFF_PAGE = "https://pearllabs.ug/pl-a9004ed60a/hackathon";

// To Pearl: a backup copy of every registration (the database is the main record).
export async function sendHackathonStaffEmail(f: HackathonFields, saved: boolean) {
  const { user, mailer } = transport();
  const rows = summaryRows(f);
  const where = saved
    ? `All registrations: ${STAFF_PAGE}`
    : "⚠ This registration could NOT be saved to the website database — this email is the only copy.";
  const text = ["STEM Innovation Hackathon — pre-registration", "", ...rows.map(([k, v]) => `${k}: ${v}`), "", where].join("\n");
  const html = `<h2>STEM Innovation Hackathon — pre-registration</h2>${rows
    .map(([k, v]) => `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</p>`)
    .join("")}<p>${escapeHtml(where)}</p>`;
  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? `Pearl Labs Website <${user}>`,
    to: process.env.HACKATHON_TO_EMAIL ?? process.env.INTERNSHIP_TO_EMAIL ?? user,
    replyTo: f.parentEmail,
    subject: `${saved ? "" : "[NOT SAVED] "}Hackathon registration — ${f.learnerName} — ${f.school}`,
    text,
    html,
  });
}

// To the parent: received, nothing promised. Dates, fees and next steps come later from staff.
export async function sendHackathonParentEmail(f: HackathonFields) {
  const { user, mailer } = transport();
  const first = f.parentName.trim().split(/\s+/)[0];
  const lines = [
    `Hi ${first},`,
    "",
    `Thank you for registering ${f.learnerName} for the STEM Innovation Hackathon at the National ICT Innovation Hub, Nakawa (preferred week: ${weekLabel(f.week)}).`,
    f.trip === "Yes" ? "We've also noted that you'd like to apply for the trip." : "",
    "We'll contact you with the confirmed dates, fees and next steps.",
    "",
    "Pearl AI Labs and AeRoCAD Learners",
    "pearllabsug@gmail.com · +256 763 839356",
  ].filter((l, i, all) => l !== "" || all[i - 1] !== "");
  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? `Pearl AI Labs <${user}>`,
    to: f.parentEmail,
    replyTo: process.env.HACKATHON_TO_EMAIL ?? process.env.INTERNSHIP_TO_EMAIL ?? user,
    subject: `We've received ${f.learnerName}'s hackathon registration`,
    text: lines.join("\n"),
    html: lines.map((l) => (l ? `<p>${escapeHtml(l)}</p>` : "")).join(""),
  });
}
