import type { Metadata } from "next";
import { getLeadByResumeToken, type IncompleteLeadRow } from "@/lib/leads";
import InternshipApply, { type FormState } from "@/components/InternshipApply";
import MicrosoftClarity from "@/components/MicrosoftClarity";
import { getRegistrationCapacityStatus } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Continue Your Registration — Pearl AI Labs Bootcamps",
};

const GREEN = "#002D5B";
const ORANGE = "#EF8633";
const CREAM = "#F4FAFF";

function leadToFormState(lead: IncompleteLeadRow): Partial<FormState> {
  return {
    parentName: lead.parentName ?? "",
    relationship: lead.relationship ?? "",
    profession: lead.profession ?? "",
    phone: lead.phone,
    altPhone: lead.altPhone ?? "",
    email: lead.email ?? "",
    address: lead.address ?? "",
    studentName: lead.studentName ?? "",
    age: lead.age ?? "",
    gender: lead.gender ?? "",
    school: lead.school ?? "",
    classGrade: lead.classGrade ?? "",
    cohort: lead.cohort ?? "",
    hasLaptop: lead.hasLaptop ?? "",
    modules: lead.modules,
    hearAbout: lead.hearAbout ?? "",
    hearAboutOther: lead.hearAboutOther ?? "",
    transactionId: lead.transactionId ?? "",
    pickupService: lead.pickupService ?? "",
    pickupLocation: lead.pickupLocation ?? "",
    medicalInfo: lead.medicalInfo ?? "",
    additionalInfo: lead.additionalInfo ?? "",
    agreeTerms: lead.agreeTerms,
    photoConsent: lead.photoConsent ?? "",
    // Payment method wasn't captured on the incomplete-lead side (added
    // after lead capture), so the parent picks it fresh when they get there.
  };
}

export default async function ResumeApplicationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const lead = getLeadByResumeToken(token);
  const capacity = getRegistrationCapacityStatus();

  if (!lead) {
    return (
      <div style={{ minHeight: "100vh", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "1.8rem", fontWeight: 800, color: GREEN, marginBottom: 12 }}>
            This link has expired
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "1rem", color: "#4C616C", lineHeight: 1.6, marginBottom: 20 }}>
            Resume links are only valid for 48 hours. Contact us and we&apos;ll
            get you a new one, or you&apos;re welcome to start a fresh
            registration.
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "#111D23" }}>
            <strong>pearllabsug@gmail.com</strong> · <strong style={{ color: ORANGE }}>+256 763 839356</strong>
          </p>
          <a href="/apply" style={{ display: "inline-block", marginTop: 24, color: ORANGE, fontWeight: 700, textDecoration: "none" }}>
            Start a new registration →
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <MicrosoftClarity />
      <InternshipApply
        resumeLead={{ sessionId: lead.sessionId, form: leadToFormState(lead) }}
        registrationFull={capacity.full}
        registrationFullMessage={capacity.message}
      />
    </>
  );
}
