"use server";

import { revalidatePath } from "next/cache";
import { markVerified } from "@/lib/registrations";
import { deleteLead } from "@/lib/leads";

export async function markVerifiedAction(id: number): Promise<void> {
  markVerified(id);
  revalidatePath("/pl-a9004ed60a/registrations");
}

export async function deleteLeadAction(id: number): Promise<void> {
  deleteLead(id);
  revalidatePath("/pl-a9004ed60a/registrations");
}
