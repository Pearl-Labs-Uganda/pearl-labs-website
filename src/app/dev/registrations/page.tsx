import { listRegistrations } from "@/lib/registrations";
import RegistrationsDashboard from "@/components/dev/RegistrationsDashboard";
import { markVerifiedAction } from "./actions";

export default function DevRegistrationsPage() {
  const registrations = listRegistrations();
  return <RegistrationsDashboard registrations={registrations} onMarkVerified={markVerifiedAction} />;
}
