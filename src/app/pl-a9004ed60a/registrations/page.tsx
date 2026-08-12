import { listRegistrations } from "@/lib/registrations";
import { getEventCounts } from "@/lib/analyticsEvents";
import RegistrationsDashboard from "@/components/dev/RegistrationsDashboard";
import { markVerifiedAction } from "./actions";

export default function DevRegistrationsPage() {
  const registrations = listRegistrations();
  const eventCounts = getEventCounts();
  return (
    <RegistrationsDashboard
      registrations={registrations}
      eventCounts={eventCounts}
      onMarkVerified={markVerifiedAction}
    />
  );
}
