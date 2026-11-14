import type { Metadata } from "next";
import HackathonRegister from "@/components/HackathonRegister";
import MicrosoftClarity from "@/components/MicrosoftClarity";

export const metadata: Metadata = {
  title: "Technoxian Hackathon — Pearl AI Labs",
  description:
    "Register for a one-week STEM hackathon for school learners at the National ICT Innovation Hub, Nakawa. Winning teams get first priority for the Technoxian World Cup in Malaysia.",
};

export default function HackathonPage() {
  return (
    <>
      {/* The hackathon has its own Clarity project. Project ids are public (they ship in the page). */}
      <MicrosoftClarity projectId={process.env.NEXT_PUBLIC_HACKATHON_CLARITY_ID ?? "zctady31ls"} />
      <HackathonRegister />
    </>
  );
}
