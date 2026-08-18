"use server";

import { revalidatePath } from "next/cache";
import { markVerified } from "@/lib/registrations";
import { deleteLead, restoreLead, setLeadContacted, generateResumeToken } from "@/lib/leads";
import { setRegistrationFull } from "@/lib/settings";

export async function markVerifiedAction(id: number): Promise<void> {
  markVerified(id);
  revalidatePath("/pl-a9004ed60a/registrations");
}

export async function deleteLeadAction(id: number): Promise<void> {
  deleteLead(id);
  revalidatePath("/pl-a9004ed60a/registrations");
}

export async function restoreLeadAction(id: number): Promise<void> {
  restoreLead(id);
  revalidatePath("/pl-a9004ed60a/registrations");
}

export async function setLeadContactedAction(id: number, contacted: boolean): Promise<void> {
  setLeadContacted(id, contacted);
  revalidatePath("/pl-a9004ed60a/registrations");
}

export async function generateResumeLinkAction(id: number): Promise<string | null> {
  const result = generateResumeToken(id);
  if (!result) return null;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pearllabs.ug";
  revalidatePath("/pl-a9004ed60a/registrations");
  return `${baseUrl}/apply/resume/${result.token}`;
}

export async function setRegistrationFullAction(full: boolean, message: string): Promise<void> {
  setRegistrationFull(full, message);
  // /apply and /apply/resume/[token] are both force-dynamic and read this on
  // every request, so this also takes effect there without a redeploy.
  revalidatePath("/pl-a9004ed60a/registrations");
  revalidatePath("/apply");
}
