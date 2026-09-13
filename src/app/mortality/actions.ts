"use server";

import { revalidatePath } from "next/cache";
import { createMortality, deleteMortality, getFarmContext, updateMortality } from "@/services/farm-services";

export type MortalityActionState = { ok: boolean; message: string };
const initialState: MortalityActionState = { ok: false, message: "" };

export async function mortalityAction(previous: MortalityActionState = initialState, formData: FormData): Promise<MortalityActionState> {
  void previous;
  try {
    const { farm } = await getFarmContext();
    const mortalityId = String(formData.get("mortalityId") ?? "");
    const input = {
      batchId: String(formData.get("batchId") ?? ""),
      date: String(formData.get("date") ?? ""),
      quantity: String(formData.get("quantity") ?? ""),
      cause: String(formData.get("cause") ?? "") || undefined,
      notes: String(formData.get("notes") ?? "") || undefined,
    };

    if (mortalityId) await updateMortality(farm.id, mortalityId, input); else await createMortality(farm.id, input);

    revalidatePath("/mortality");
    revalidatePath("/dashboard");
    revalidatePath("/batches");
    return { ok: true, message: mortalityId ? "Mortality record updated." : "Mortality record saved." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The mortality record could not be saved." };
  }
}

export async function deleteMortalityAction(previous: MortalityActionState = initialState, formData: FormData): Promise<MortalityActionState> {
  void previous;
  try {
    const { farm } = await getFarmContext();
    const mortalityId = String(formData.get("mortalityId") ?? "");
    if (!mortalityId) throw new Error("Mortality record not found.");

    await deleteMortality(farm.id, mortalityId);

    revalidatePath("/mortality");
    revalidatePath("/dashboard");
    revalidatePath("/batches");
    return { ok: true, message: "Mortality record deleted." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The mortality record could not be deleted." };
  }
}
