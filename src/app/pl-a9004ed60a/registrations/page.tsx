import { listRegistrations } from "@/lib/registrations";
import { getEventCounts } from "@/lib/analyticsEvents";
import { listIncompleteLeads } from "@/lib/leads";
import RegistrationsDashboard from "@/components/dev/RegistrationsDashboard";
import { markVerifiedAction, deleteLeadAction } from "./actions";

export default function DevRegistrationsPage() {
  const registrations = listRegistrations();
  const eventCounts = getEventCounts();
  const incompleteLeads = listIncompleteLeads();

  return (
    <RegistrationsDashboard
      registrations={registrations}
      eventCounts={eventCounts}
      incompleteLeads={incompleteLeads}
      onMarkVerified={markVerifiedAction}
      onDeleteLead={deleteLeadAction}
    />
  );
}
