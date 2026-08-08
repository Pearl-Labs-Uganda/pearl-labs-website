"use server";

import { revalidatePath } from "next/cache";
import { markVerified } from "@/lib/registrations";

export async function markVerifiedAction(id: number): Promise<void> {
  markVerified(id);
  revalidatePath("/dev/registrations");
}
