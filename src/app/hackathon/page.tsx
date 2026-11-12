import type { Metadata } from "next";
import HackathonRegister from "@/components/HackathonRegister";
import MicrosoftClarity from "@/components/MicrosoftClarity";

export const metadata: Metadata = {
  title: "STEM Innovation Hackathon — Pearl AI Labs",
  description:
    "Pre-register for a one-week STEM hackathon for school learners at the National ICT Innovation Hub, Nakawa. Winning teams get first priority for the Technotion World Cup in Malaysia.",
};

export default function HackathonPage() {
  return (
    <>
      <MicrosoftClarity />
      <HackathonRegister />
    </>
  );
}
