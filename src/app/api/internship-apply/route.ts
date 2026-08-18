import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { formatUgx } from "@/lib/fee";
import { saveRegistration, type RegistrationInput, type RegistrationRow } from "@/lib/registrations";
import { markLeadSubmitted } from "@/lib/leads";
import { isValidMomoTransactionId } from "@/lib/transactionId";
import { getRegistrationCapacityStatus } from "@/lib/settings";

interface RegistrationPayload extends RegistrationInput {
  id?: number;
  sessionId?: string;
}

const requiredFields: Array<keyof RegistrationInput> = [
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
  "hearAbout",
  "pickupService",
  "photoConsent",
  "paymentMethod",
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

function validatePayload(payload: Partial<RegistrationPayload>): string | null {
  for (const field of requiredFields) {
    const value = payload[field];
    if (!value || !String(value).trim()) {
      return `${field} is required`;
    }
  }

  if (!Array.isArray(payload.modules) || payload.modules.length === 0) {
    return "Select at least one module";
  }

  if (!isValidEmail(payload.email as string)) {
    return "Invalid email address";
  }

  if (payload.agreeTerms !== true) {
    return "You must confirm the information is accurate and agree to enrol the student";
  }

  if (payload.pickupService === "Yes" && !(payload.pickupLocation ?? "").trim()) {
    return "Please share the pick-up location";
  }

  if (payload.hearAbout === "Other" && !(payload.hearAboutOther ?? "").trim()) {
    return "Please tell us how you heard about us";
  }

  if (payload.paymentMethod !== "MTN MoMo" && payload.paymentMethod !== "Cash") {
    return "Please select how you'll be paying";
  }

  if (payload.paymentMethod === "MTN MoMo") {
    if (!(payload.transactionId ?? "").trim()) {
      return "Transaction ID is required for MTN MoMo payments";
    }
    if (!isValidMomoTransactionId(payload.transactionId)) {
      return "That doesn't look like a valid Transaction ID — check your MTN MoMo confirmation SMS";
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    // Staff can manually declare the bootcamp full — this is checked here,
    // not just hidden in the UI, so a request sent straight to this endpoint
    // can't bypass it. The dashboard's capacity numbers are unaffected; this
    // is an independent override.
    const capacity = getRegistrationCapacityStatus();
    if (capacity.full) {
      return NextResponse.json({ error: capacity.message }, { status: 403 });
    }

    const payload = (await request.json()) as Partial<RegistrationPayload>;
    const validationError = validatePayload(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const reg = payload as RegistrationPayload;
    const row = saveRegistration(
      {
        parentName: reg.parentName,
        relationship: reg.relationship,
        profession: reg.profession,
        phone: reg.phone,
        altPhone: reg.altPhone,
        email: reg.email,
        address: reg.address,
        studentName: reg.studentName,
        age: reg.age,
        gender: reg.gender,
        school: reg.school,
        classGrade: reg.classGrade,
        cohort: reg.cohort,
        hasLaptop: reg.hasLaptop,
        modules: reg.modules,
        hearAbout: reg.hearAbout,
        hearAboutOther: reg.hearAboutOther,
        pickupService: reg.pickupService,
        pickupLocation: reg.pickupLocation,
        medicalInfo: reg.medicalInfo,
        additionalInfo: reg.additionalInfo,
        agreeTerms: reg.agreeTerms,
        photoConsent: reg.photoConsent,
        paymentMethod: reg.paymentMethod,
        // Cash payers pay in person — ignore any stray transaction ID rather
        // than trusting the client, so a cash registration can never end up
        // looking like an unverified MoMo payment.
        transactionId: reg.paymentMethod === "Cash" ? undefined : reg.transactionId,
      },
      reg.id,
      reg.sessionId,
    );

    if (reg.sessionId) {
      markLeadSubmitted(reg.sessionId);
    }

    // Every submission gets emailed as a backup, paid or not — the dashboard
    // has had bugs hide real submissions before, so the inbox is the
    // fallback source of truth. The subject line flags payment status so
    // it stays scannable.
    //
    // The registration row above is already saved by this point, so an
    // email failure below must never turn into a client-facing error — that
    // would tell a parent their submission failed when it didn't, and the
    // frontend's response is to let them resubmit, creating duplicate rows.
    try {
      await sendRegistrationEmail(row);
    } catch (emailError) {
      console.error("Registration saved but confirmation email failed:", emailError);
    }

    return NextResponse.json({ ok: true, id: row.id });
  } catch (error) {
    console.error("Failed to submit bootcamp registration:", error);
    return NextResponse.json({ error: "Could not save registration" }, { status: 500 });
  }
}

async function sendRegistrationEmail(row: RegistrationRow) {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const toEmail = process.env.INTERNSHIP_TO_EMAIL ?? smtpUser;

    if (!smtpUser || !smtpPass || !toEmail) {
      throw new Error(
        "Email server is not configured. Set SMTP_USER, SMTP_PASS, and INTERNSHIP_TO_EMAIL in your environment.",
      );
    }

    if (!isValidEmail(toEmail)) {
      throw new Error(
        "INTERNSHIP_TO_EMAIL is invalid. Please provide a full email address like hello@pearllabs.ug.",
      );
    }

    const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
    const smtpPort = Number(process.env.SMTP_PORT ?? 587);
    const smtpSecure = String(process.env.SMTP_SECURE ?? "false") === "true";

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const modulesList = row.modules.join(", ");
    const amountText = formatUgx(row.amountDue);

    const text = [
      "Pearl AI Labs Deep Tech Bootcamp — Registration",
      "",
      "PARENT / GUARDIAN",
      `Name: ${row.parentName}`,
      `Relationship to Student: ${row.relationship}`,
      `Profession: ${row.profession}`,
      `Phone: ${row.phone}`,
      `Alternative Phone: ${row.altPhone?.trim() || "Not provided"}`,
      `Email: ${row.email}`,
      `Address: ${row.address}`,
      "",
      "STUDENT",
      `Name: ${row.studentName}`,
      `Age: ${row.age}`,
      `Gender: ${row.gender}`,
      `School: ${row.school}`,
      `Class / Grade: ${row.classGrade}`,
      `Cohort: ${row.cohort}`,
      `Has a laptop: ${row.hasLaptop}`,
      "",
      "PROGRAMME SELECTION",
      `Modules: ${modulesList}`,
      `Amount Due: ${amountText}`,
      `How they heard about us: ${row.hearAbout}${row.hearAbout === "Other" ? ` (${row.hearAboutOther})` : ""}`,
      "",
      "PAYMENT",
      `Payment Method: ${row.paymentMethod}`,
      `Transaction ID: ${row.transactionId ?? "Not provided"}`,
      "",
      "DROP-OFF & PICK-UP",
      `Wants drop-off/pick-up service: ${row.pickupService}`,
      `Pick-up location: ${row.pickupService === "Yes" ? row.pickupLocation : "N/A"}`,
      "",
      "MEDICAL / ADDITIONAL INFO",
      `Allergies / medical conditions / special needs: ${row.medicalInfo?.trim() || "Not provided"}`,
      `Additional info: ${row.additionalInfo?.trim() || "Not provided"}`,
      "",
      "CONSENT",
      `Agreed to enrol: ${row.agreeTerms ? "Yes" : "No"}`,
      `Photo/recording consent: ${row.photoConsent}`,
    ].join("\n");

    const html = `
      <h2>Pearl AI Labs Deep Tech Bootcamp — Registration</h2>
      <h3>Parent / Guardian</h3>
      <p><strong>Name:</strong> ${escapeHtml(row.parentName)}</p>
      <p><strong>Relationship to Student:</strong> ${escapeHtml(row.relationship)}</p>
      <p><strong>Profession:</strong> ${escapeHtml(row.profession)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(row.phone)}</p>
      <p><strong>Alternative Phone:</strong> ${escapeHtml(row.altPhone?.trim() || "Not provided")}</p>
      <p><strong>Email:</strong> ${escapeHtml(row.email)}</p>
      <p><strong>Address:</strong> ${escapeHtml(row.address)}</p>
      <h3>Student</h3>
      <p><strong>Name:</strong> ${escapeHtml(row.studentName)}</p>
      <p><strong>Age:</strong> ${escapeHtml(row.age)}</p>
      <p><strong>Gender:</strong> ${escapeHtml(row.gender)}</p>
      <p><strong>School:</strong> ${escapeHtml(row.school)}</p>
      <p><strong>Class / Grade:</strong> ${escapeHtml(row.classGrade)}</p>
      <p><strong>Cohort:</strong> ${escapeHtml(row.cohort)}</p>
      <p><strong>Has a laptop:</strong> ${escapeHtml(row.hasLaptop)}</p>
      <h3>Programme Selection</h3>
      <p><strong>Modules:</strong> ${escapeHtml(modulesList)}</p>
      <p><strong>Amount Due:</strong> ${escapeHtml(amountText)}</p>
      <p><strong>How they heard about us:</strong> ${escapeHtml(row.hearAbout)}${row.hearAbout === "Other" ? ` (${escapeHtml(row.hearAboutOther ?? "")})` : ""}</p>
      <h3>Payment</h3>
      <p><strong>Payment Method:</strong> ${escapeHtml(row.paymentMethod)}</p>
      <p><strong>Transaction ID:</strong> ${escapeHtml(row.transactionId ?? "Not provided")}</p>
      <h3>Drop-off &amp; Pick-up</h3>
      <p><strong>Wants service:</strong> ${escapeHtml(row.pickupService)}</p>
      <p><strong>Pick-up location:</strong> ${escapeHtml(row.pickupService === "Yes" ? row.pickupLocation ?? "" : "N/A")}</p>
      <h3>Medical / Additional Info</h3>
      <p><strong>Allergies / medical conditions / special needs:</strong> ${escapeHtml(row.medicalInfo?.trim() || "Not provided")}</p>
      <p><strong>Additional info:</strong> ${escapeHtml(row.additionalInfo?.trim() || "Not provided")}</p>
      <h3>Consent</h3>
      <p><strong>Agreed to enrol:</strong> ${row.agreeTerms ? "Yes" : "No"}</p>
      <p><strong>Photo/recording consent:</strong> ${escapeHtml(row.photoConsent)}</p>
    `;

    const subjectTag =
      row.paymentMethod === "Cash"
        ? "[CASH] "
        : row.transactionId
          ? ""
          : "[UNPAID] ";

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? `Pearl Labs Website <${smtpUser}>`,
      to: toEmail,
      replyTo: row.email,
      subject: `${subjectTag}Bootcamp Registration - ${row.studentName} (${row.parentName})`,
      text,
      html,
    });
}
