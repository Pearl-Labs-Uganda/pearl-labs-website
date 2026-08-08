import type { Metadata } from "next";
import InternshipApply from "@/components/InternshipApply";

export const metadata: Metadata = {
  title: "Apply — Pearl AI Labs Bootcamps",
  description:
    "Apply for the Pearl AI Labs bootcamp programme in Data Science, AI, and Embedded Systems. Based in Kampala, Uganda.",
};

export default function ApplyPage() {
  return <InternshipApply />;
}
