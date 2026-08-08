import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface RegistrationPayload {
  // Section 1: Parent / Guardian
  parentName: string;
  relationship: string;
  profession: string;
  phone: string;
  altPhone?: string;
  email: string;
  address: string;
  // Section 2: Student
  studentName: string;
  age: string;
  gender: string;
  school: string;
  classGrade: string;
  cohort: string;
  hasLaptop: string;
  // Section 3: Programme selection
  track: string;
  hearAbout: string;
  hearAboutOther?: string;
  // Section 4: Drop-off & pick-up
  pickupService: string;
  pickupLocation?: string;
  // Section 5: Medical
  medicalInfo?: string;
  additionalInfo?: string;
  // Section 6: Consent
  agreeTerms: boolean;
  photoConsent: string;
  signature: string;
}

const requiredFields: Array<keyof RegistrationPayload> = [
  "parentName",
  "relationship",
  "profession",
  "phone",
  "email",
  "address",
  "studentName",
  "age",
  "gender",
  "school",
  "classGrade",
  "cohort",
  "hasLaptop",
  "track",
  "hearAbout",
  "pickupService",
  "photoConsent",
  "signature",
];

function isValidEmail(value: string): boolean {
  return /\S+@\S+\.\S+/.test(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
    error: `Could not send registration: ${message}`,
    status: 500,
  };
}

function validatePayload(payload: Partial<RegistrationPayload>): string | null {
  for (const field of requiredFields) {
    if (!payload[field] || !String(payload[field]).trim()) {
      return `${field} is required`;
    }
  }

  if (!isValidEmail(payload.email as string)) {
    return "Invalid email address";
  }

  if (payload.agreeTerms !== true) {
    return "You must confirm the information is accurate and agree to enrol the student";
  }

  if (
    payload.pickupService === "Yes" &&
    !(payload.pickupLocation ?? "").trim()
  ) {
    return "Please share the pick-up location";
  }

  if (
    payload.hearAbout === "Other" &&
    !(payload.hearAboutOther ?? "").trim()
  ) {
    return "Please tell us how you heard about us";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Partial<RegistrationPayload>;
    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
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

    const reg = payload as RegistrationPayload;

    const text = [
      "Pearl Labs Deep Tech Bootcamp — Registration",
      "",
      "PARENT / GUARDIAN",
      `Name: ${reg.parentName}`,
      `Relationship to Student: ${reg.relationship}`,
      `Profession: ${reg.profession}`,
      `Phone: ${reg.phone}`,
      `Alternative Phone: ${reg.altPhone?.trim() || "Not provided"}`,
      `Email: ${reg.email}`,
      `Address: ${reg.address}`,
      "",
      "STUDENT",
      `Name: ${reg.studentName}`,
      `Age: ${reg.age}`,
      `Gender: ${reg.gender}`,
      `School: ${reg.school}`,
      `Class / Grade: ${reg.classGrade}`,
      `Cohort: ${reg.cohort}`,
      `Has a laptop: ${reg.hasLaptop}`,
      "",
      "PROGRAMME SELECTION",
      `Track: ${reg.track}`,
      `How they heard about us: ${reg.hearAbout}${reg.hearAbout === "Other" ? ` (${reg.hearAboutOther})` : ""}`,
      "",
      "DROP-OFF & PICK-UP",
      `Wants drop-off/pick-up service: ${reg.pickupService}`,
      `Pick-up location: ${reg.pickupService === "Yes" ? reg.pickupLocation : "N/A"}`,
      "",
      "MEDICAL / ADDITIONAL INFO",
      `Allergies / medical conditions / special needs: ${reg.medicalInfo?.trim() || "Not provided"}`,
      `Additional info: ${reg.additionalInfo?.trim() || "Not provided"}`,
      "",
      "CONSENT",
      `Agreed to enrol: ${reg.agreeTerms ? "Yes" : "No"}`,
      `Photo/recording consent: ${reg.photoConsent}`,
      `Signature: ${reg.signature}`,
    ].join("\n");

    const html = `
      <h2>Pearl Labs Deep Tech Bootcamp — Registration</h2>
      <h3>Parent / Guardian</h3>
      <p><strong>Name:</strong> ${escapeHtml(reg.parentName)}</p>
      <p><strong>Relationship to Student:</strong> ${escapeHtml(reg.relationship)}</p>
      <p><strong>Profession:</strong> ${escapeHtml(reg.profession)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(reg.phone)}</p>
      <p><strong>Alternative Phone:</strong> ${escapeHtml(reg.altPhone?.trim() || "Not provided")}</p>
      <p><strong>Email:</strong> ${escapeHtml(reg.email)}</p>
      <p><strong>Address:</strong> ${escapeHtml(reg.address)}</p>
      <h3>Student</h3>
      <p><strong>Name:</strong> ${escapeHtml(reg.studentName)}</p>
      <p><strong>Age:</strong> ${escapeHtml(reg.age)}</p>
      <p><strong>Gender:</strong> ${escapeHtml(reg.gender)}</p>
      <p><strong>School:</strong> ${escapeHtml(reg.school)}</p>
      <p><strong>Class / Grade:</strong> ${escapeHtml(reg.classGrade)}</p>
      <p><strong>Cohort:</strong> ${escapeHtml(reg.cohort)}</p>
      <p><strong>Has a laptop:</strong> ${escapeHtml(reg.hasLaptop)}</p>
      <h3>Programme Selection</h3>
      <p><strong>Track:</strong> ${escapeHtml(reg.track)}</p>
      <p><strong>How they heard about us:</strong> ${escapeHtml(reg.hearAbout)}${reg.hearAbout === "Other" ? ` (${escapeHtml(reg.hearAboutOther ?? "")})` : ""}</p>
      <h3>Drop-off &amp; Pick-up</h3>
      <p><strong>Wants service:</strong> ${escapeHtml(reg.pickupService)}</p>
      <p><strong>Pick-up location:</strong> ${escapeHtml(reg.pickupService === "Yes" ? reg.pickupLocation ?? "" : "N/A")}</p>
      <h3>Medical / Additional Info</h3>
      <p><strong>Allergies / medical conditions / special needs:</strong> ${escapeHtml(reg.medicalInfo?.trim() || "Not provided")}</p>
      <p><strong>Additional info:</strong> ${escapeHtml(reg.additionalInfo?.trim() || "Not provided")}</p>
      <h3>Consent</h3>
      <p><strong>Agreed to enrol:</strong> ${reg.agreeTerms ? "Yes" : "No"}</p>
      <p><strong>Photo/recording consent:</strong> ${escapeHtml(reg.photoConsent)}</p>
      <p><strong>Signature:</strong> ${escapeHtml(reg.signature)}</p>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `Pearl Labs Website <${smtpUser}>`,
      to: toEmail,
      replyTo: reg.email,
      subject: `Bootcamp Registration - ${reg.studentName} (${reg.parentName})`,
      text,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to submit bootcamp registration:", error);
    const isProduction = process.env.NODE_ENV === "production";
    const detailed = getMailErrorResponse(error);

    return NextResponse.json(
      {
        error: isProduction ? "Could not send registration" : detailed.error,
      },
      { status: detailed.status },
    );
  }
}
