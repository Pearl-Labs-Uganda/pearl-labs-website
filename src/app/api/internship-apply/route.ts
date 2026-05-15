import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface ApplicationPayload {
  fullName: string;
  email: string;
  phone: string;
  institution: string;
  course: string;
  yearOfStudy: string;
  module: string;
  motivation: string;
  portfolio?: string;
}

interface ParsedApplicationRequest {
  payload: Partial<ApplicationPayload>;
  attachment: File | null;
}

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const requiredFields: Array<keyof ApplicationPayload> = [
  "fullName",
  "email",
  "phone",
  "institution",
  "course",
  "yearOfStudy",
  "module",
  "motivation",
];

function isValidEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return "Unknown error";
}

function getMailErrorResponse(error: unknown): { error: string; status: number } {
  const message = getErrorMessage(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login") ||
    lower.includes("badcredentials") ||
    lower.includes("535-5.7.8")
  ) {
    return {
      error:
        "Email authentication failed. For Gmail SMTP, use a Google App Password (not your regular Gmail password) in SMTP_PASS.",
      status: 500,
    };
  }

  return {
    error: `Could not send application: ${message}`,
    status: 500,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validatePayload(payload: Partial<ApplicationPayload>): string | null {
  for (const field of requiredFields) {
    if (!payload[field] || !String(payload[field]).trim()) {
      return `${field} is required`;
    }
  }

  if (!isValidEmail(payload.email as string)) {
    return "Invalid email address";
  }

  if ((payload.motivation as string).trim().length < 30) {
    return "Motivation must be at least 30 characters";
  }

  return null;
}

async function parseApplicationRequest(
  request: Request,
): Promise<ParsedApplicationRequest> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const payload: Partial<ApplicationPayload> = {
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      institution: String(formData.get("institution") ?? ""),
      course: String(formData.get("course") ?? ""),
      yearOfStudy: String(formData.get("yearOfStudy") ?? ""),
      module: String(formData.get("module") ?? ""),
      motivation: String(formData.get("motivation") ?? ""),
      portfolio: String(formData.get("portfolio") ?? ""),
    };

    const file = formData.get("attachment");
    const attachment = file instanceof File ? file : null;

    return { payload, attachment };
  }

  const payload = (await request.json()) as Partial<ApplicationPayload>;
  return { payload, attachment: null };
}

function validateAttachment(file: File | null): string | null {
  if (!file) return null;

  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(file.type)) {
    return "Only PDF, DOC, DOCX, and TXT attachments are supported.";
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    return "Attachment must be smaller than 5MB.";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const { payload, attachment } = await parseApplicationRequest(request);
    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const attachmentError = validateAttachment(attachment);
    if (attachmentError) {
      return NextResponse.json({ error: attachmentError }, { status: 400 });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const toEmail = process.env.INTERNSHIP_TO_EMAIL ?? smtpUser;

    if (!smtpUser || !smtpPass || !toEmail) {
      return NextResponse.json(
        {
          error:
            "Email server is not configured. Set SMTP_USER, SMTP_PASS, and INTERNSHIP_TO_EMAIL in your environment.",
        },
        { status: 500 },
      );
    }

    if (!isValidEmail(toEmail)) {
      return NextResponse.json(
        {
          error:
            "INTERNSHIP_TO_EMAIL is invalid. Please provide a full email address like hello@pearllabs.ug.",
        },
        { status: 500 },
      );
    }

    const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT ?? 587);
    const smtpSecure = String(process.env.SMTP_SECURE ?? "false") === "true";

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const app = payload as ApplicationPayload;

    const text = [
      "Pearl Labs Internship Application",
      "",
      "PERSONAL DETAILS",
      `Full Name: ${app.fullName}`,
      `Email: ${app.email}`,
      `Phone: ${app.phone}`,
      "",
      "ACADEMIC BACKGROUND",
      `Institution: ${app.institution}`,
      `Course: ${app.course}`,
      `Year of Study: ${app.yearOfStudy}`,
      "",
      "PROGRAMME PREFERENCE",
      `Module: ${app.module}`,
      "",
      "MOTIVATION",
      app.motivation,
      "",
      "PORTFOLIO / LINKS",
      app.portfolio?.trim() || "Not provided",
      "",
      "SUPPORTING DOCUMENT",
      attachment ? attachment.name : "Not provided",
    ].join("\n");

    const html = `
      <h2>Pearl Labs Internship Application</h2>
      <h3>Personal Details</h3>
      <p><strong>Full Name:</strong> ${escapeHtml(app.fullName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(app.email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(app.phone)}</p>
      <h3>Academic Background</h3>
      <p><strong>Institution:</strong> ${escapeHtml(app.institution)}</p>
      <p><strong>Course:</strong> ${escapeHtml(app.course)}</p>
      <p><strong>Year of Study:</strong> ${escapeHtml(app.yearOfStudy)}</p>
      <h3>Programme Preference</h3>
      <p><strong>Module:</strong> ${escapeHtml(app.module)}</p>
      <h3>Motivation</h3>
      <p>${escapeHtml(app.motivation).replace(/\n/g, "<br />")}</p>
      <h3>Portfolio / Links</h3>
      <p>${escapeHtml(app.portfolio?.trim() || "Not provided")}</p>
      <h3>Supporting Document</h3>
      <p>${escapeHtml(attachment ? attachment.name : "Not provided")}</p>
    `;

    const attachments = [];
    if (attachment) {
      const bytes = await attachment.arrayBuffer();
      attachments.push({
        filename: attachment.name,
        content: Buffer.from(bytes),
        contentType: attachment.type,
      });
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `Pearl Labs Website <${smtpUser}>`,
      to: toEmail,
      replyTo: app.email,
      subject: `Internship Application - ${app.fullName}`,
      text,
      html,
      attachments,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to submit internship application:", error);
    const isProduction = process.env.NODE_ENV === "production";
    const detailed = getMailErrorResponse(error);

    return NextResponse.json(
      {
        error: isProduction ? "Could not send application" : detailed.error,
      },
      { status: detailed.status },
    );
  }
}
