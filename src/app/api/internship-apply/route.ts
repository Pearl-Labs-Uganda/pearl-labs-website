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

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<ApplicationPayload>;
    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const toEmail = process.env.INTERNSHIP_TO_EMAIL ?? smtpUser;

    if (!smtpUser || !smtpPass || !toEmail) {
      return NextResponse.json(
        { error: "Email server is not configured" },
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
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `Pearl Labs Website <${smtpUser}>`,
      to: toEmail,
      replyTo: app.email,
      subject: `Internship Application - ${app.fullName}`,
      text,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to submit internship application:", error);
    return NextResponse.json(
      { error: "Could not send application" },
      { status: 500 },
    );
  }
}
