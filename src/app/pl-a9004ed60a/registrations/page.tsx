import { listRegistrations } from "@/lib/registrations";
import { getEventCounts } from "@/lib/analyticsEvents";
import { listIncompleteLeads } from "@/lib/leads";
import RegistrationsDashboard from "@/components/dev/RegistrationsDashboard";
import { markVerifiedAction, deleteLeadAction } from "./actions";

// Reads live DB state on every visit — without this, Next.js prerenders the
// page once at build time (the auth check lives in middleware.ts, not here,
// so there's no request-time API to trigger dynamic rendering automatically)
// and only refreshes it when markVerifiedAction/deleteLeadAction happen to
// call revalidatePath. New registrations submitted in between never appear.
export const dynamic = "force-dynamic";

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
