"use server";

import { revalidatePath } from "next/cache";
import { createSale, getFarmContext } from "@/services/farm-services";

export async function saleAction(previous: { ok: boolean; message: string }, formData: FormData) {
  void previous;
  try {
    const { farm } = await getFarmContext();
    await createSale(farm.id, { batchId: String(formData.get("batchId") ?? ""), customerId: String(formData.get("customerId") ?? "") || undefined, date: String(formData.get("date") ?? ""), birdsSold: String(formData.get("birdsSold") ?? ""), totalWeight: String(formData.get("totalWeight") ?? "") || undefined, pricingMode: String(formData.get("pricingMode") ?? ""), pricePerKg: String(formData.get("pricePerKg") ?? "") || undefined, pricePerBird: String(formData.get("pricePerBird") ?? "") || undefined, notes: String(formData.get("notes") ?? "") || undefined });
    revalidatePath("/sales"); revalidatePath("/dashboard"); revalidatePath("/batches");
    return { ok: true, message: "Sale recorded successfully." };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "The sale could not be recorded." }; }
}