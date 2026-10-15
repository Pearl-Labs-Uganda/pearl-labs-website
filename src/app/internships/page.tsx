import type { Metadata } from "next";
import InternshipPlacement from "@/components/InternshipPlacement";
import MicrosoftClarity from "@/components/MicrosoftClarity";

export const metadata: Metadata = {
  title: "Internships — Pearl AI Labs",
  description: "Apply for an AI or Robotics internship placement at Pearl AI Labs, National ICT Hub, Nakawa.",
};

export default function InternshipsPage() {
  return (
    <>
      <MicrosoftClarity />
      <InternshipPlacement />
    </>
  );
}
