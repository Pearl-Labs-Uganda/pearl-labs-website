import { listHackathonRegistrations } from "@/lib/hackathonStore";
import HackathonDashboard from "@/components/dev/HackathonDashboard";

// Auth lives in middleware.ts, so without this the page would be prerendered at build time
// and never show new registrations.
export const dynamic = "force-dynamic";

export default function DevHackathonPage() {
  return <HackathonDashboard rows={listHackathonRegistrations()} />;
}
