import type { Metadata } from "next";
import InternshipApply from "@/components/InternshipApply";
import MicrosoftClarity from "@/components/MicrosoftClarity";
import { getRegistrationCapacityStatus } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Apply — Pearl AI Labs Bootcamps",
  description:
    "Apply for the Pearl AI Labs bootcamp programme in Data Science, AI, and Embedded Systems. Based in Kampala, Uganda.",
};

// Staff can toggle "registration full" from the dev dashboard at any time —
// without this export the page would be prerendered once at build time and
// never pick up that change until the next deploy.
export const dynamic = "force-dynamic";

export default function ApplyPage() {
  const capacity = getRegistrationCapacityStatus();

  return (
    <>
      <MicrosoftClarity />
      <InternshipApply registrationFull={capacity.full} registrationFullMessage={capacity.message} />
    </>
  );
}
