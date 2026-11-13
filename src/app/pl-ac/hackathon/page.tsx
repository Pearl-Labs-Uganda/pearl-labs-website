import type { Metadata } from "next";
import { listHackathonLeads, listHackathonSignups } from "@/lib/hackathonStore";
import { getFunnel } from "@/lib/analyticsEvents";
import HackathonDashboard from "@/components/dev/HackathonDashboard";
import { setLeadFlagAction, setVerifiedAction } from "./actions";

export const metadata: Metadata = { title: "Hackathon desk — Pearl AI Labs", robots: { index: false, follow: false } };

// Auth lives in middleware.ts, so without this the page would be prerendered at build time
// and never show new registrations.
export const dynamic = "force-dynamic";

export default function HackathonDeskPage() {
  const funnel = getFunnel([
    "hackathon_view",
    "hackathon_started",
    "hackathon_parent_done",
    "hackathon_child_done",
    "hackathon_submitted",
  ]);
  const leads = listHackathonLeads();
  return (
    <HackathonDashboard
      rows={listHackathonSignups()}
      leads={leads.open}
      dismissedLeads={leads.dismissed}
      funnel={funnel}
      onSetVerified={setVerifiedAction}
      onSetLeadFlag={setLeadFlagAction}
    />
  );
}
