"use server";

import { revalidatePath } from "next/cache";
import { createMortality, getFarmContext } from "@/services/farm-services";

export type MortalityActionState = { ok: boolean; message: string };
const initialState: MortalityActionState = { ok: false, message: "" };

export async function mortalityAction(previous: MortalityActionState = initialState, formData: FormData): Promise<MortalityActionState> {
  void previous;
  try {
    const { farm } = await getFarmContext();
    await createMortality(farm.id, {
      batchId: String(formData.get("batchId") ?? ""),
      date: String(formData.get("date") ?? ""),
      quantity: String(formData.get("quantity") ?? ""),
      cause: String(formData.get("cause") ?? "") || undefined,
      notes: String(formData.get("notes") ?? "") || undefined,
    });
    revalidatePath("/mortality");
    revalidatePath("/dashboard");
    revalidatePath("/batches");
    return { ok: true, message: "Mortality record saved." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The mortality record could not be saved." };
  }
}
