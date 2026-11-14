import nodemailer from "nodemailer";
import { availabilityText, emailAttachmentPlan, TRACKS, type PlacementFields } from "@/lib/placement";

export interface LoadedFile {
  kind: "cv" | "other";
  name: string;
  size: number;
  mime: string;
  bytes: Uint8Array;
}

const WORKSPACE = "https://workspace.pearllabs.ug";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function transport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error("Email server is not configured. Set SMTP_USER and SMTP_PASS.");
  return {
    user,
    mailer: nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: String(process.env.SMTP_SECURE ?? "false") === "true",
      auth: { user, pass },
    }),
  };
}

const trackName = (f: PlacementFields) => TRACKS[f.track as keyof typeof TRACKS] ?? f.track;

// To Pearl: every answer, the documents that fit (CV first), and where to find it in the Workspace.
export async function sendPearlEmail(f: PlacementFields, files: LoadedFile[], applicationId: string | null) {
  const { user, mailer } = transport();
  const to = process.env.INTERNSHIP_TO_EMAIL ?? user;
  const plan = emailAttachmentPlan(files.map((x) => x.size));
  const rows: [string, string][] = [
    ["Name", f.fullName],
    ["Email", f.email],
    ["Phone", f.phone],
    ["Gender", f.gender],
    ["University / institution", f.institution],
    ["Course / programme", f.course],
    ["Track", trackName(f)],
    ["Available", availabilityText(f.days, f.preferredTime)],
    ["Why this track", f.whyTrack],
    ["Projects / skills", f.skills],
    ["GitHub / portfolio", f.portfolioUrl || "Not provided"],
    ["Documents", files.map((x) => `${x.kind === "cv" ? "CV" : "Other"}: ${x.name}`).join(", ")],
  ];
  const skipped = plan.skip.map((i) => files[i].name);
  const skippedNote = `Not attached (too large for email${applicationId ? " — they're in the Workspace" : " — ask the applicant to resend"}): ${skipped.join(", ")}`;
  const where = applicationId
    ? `Open in the Workspace: ${WORKSPACE}/?tab=admin&sub=applications&app=${applicationId}`
    : "⚠ This application could NOT be saved to the Workspace — this email is the only copy.";
  const text = [
    "Pearl AI Labs — Internship Placement Application",
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    ...(skipped.length ? [skippedNote, ""] : []),
    where,
  ].join("\n");
  const html = `<h2>Internship Placement Application</h2>${rows
    .map(([k, v]) => `<p><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v).replace(/\n/g, "<br>")}</p>`)
    .join("")}${skipped.length ? `<p>${escapeHtml(skippedNote)}</p>` : ""}<p>${escapeHtml(where)}</p>`;
  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? `Pearl Labs Website <${user}>`,
    to,
    replyTo: f.email,
    subject: `${applicationId ? "" : "[NOT IN WORKSPACE] "}Internship Application — ${trackName(f)} — ${f.fullName}`,
    text,
    html,
    attachments: plan.attach.map((i) => ({
      filename: files[i].name,
      content: Buffer.from(files[i].bytes),
      contentType: files[i].mime,
    })),
  });
}

// To the applicant: received, nothing promised. Decisions are communicated personally by staff.
export async function sendApplicantEmail(f: PlacementFields) {
  const { user, mailer } = transport();
  const first = f.fullName.trim().split(/\s+/)[0];
  const lines = [
    `Hi ${first},`,
    "",
    `Thank you for applying for the ${trackName(f)} internship placement at Pearl AI Labs. We've received your application and documents.`,
    "Our team will review it and contact you directly.",
    "",
    "Pearl AI Labs",
    "pearllabsug@gmail.com · 0793 662 227",
  ];
  await mailer.sendMail({
    from: process.env.SMTP_FROM ?? `Pearl AI Labs <${user}>`,
    to: f.email,
    replyTo: process.env.INTERNSHIP_TO_EMAIL ?? user,
    subject: `We've received your ${trackName(f)} internship application`,
    text: lines.join("\n"),
    html: lines.map((l) => (l ? `<p>${escapeHtml(l)}</p>` : "")).join(""),
  });
}
