"use server";

import { revalidatePath } from "next/cache";
import { createSale, deleteSale, getFarmContext, updateSale } from "@/services/farm-services";
import { safeActionMessage } from "@/server/action-errors";

export async function saleAction(previous: { ok: boolean; message: string }, formData: FormData) {
  void previous;
  try {
    const { farm } = await getFarmContext();
    const saleId = String(formData.get("saleId") ?? "");
    const input = {
      batchId: String(formData.get("batchId") ?? ""),
      customerId: String(formData.get("customerId") ?? "") || undefined,
      date: String(formData.get("date") ?? ""),
      birdsSold: String(formData.get("birdsSold") ?? ""),
      totalWeight: String(formData.get("totalWeight") ?? "") || undefined,
      pricingMode: String(formData.get("pricingMode") ?? ""),
      pricePerKg: String(formData.get("pricePerKg") ?? "") || undefined,
      pricePerBird: String(formData.get("pricePerBird") ?? "") || undefined,
      notes: String(formData.get("notes") ?? "") || undefined,
    };

    if (saleId) await updateSale(farm.id, saleId, input); else await createSale(farm.id, input);

    revalidatePath("/sales"); revalidatePath("/dashboard"); revalidatePath("/batches");
    return { ok: true, message: saleId ? "Sale updated successfully." : "Sale recorded successfully." };
  } catch (error) { return { ok: false, message: safeActionMessage(error, "The sale could not be recorded.", "saleAction") }; }
}

export async function deleteSaleAction(previous: { ok: boolean; message: string }, formData: FormData) {
  void previous;
  try {
    const { farm } = await getFarmContext();
    const saleId = String(formData.get("saleId") ?? "");
    if (!saleId) throw new Error("Sale not found.");

    await deleteSale(farm.id, saleId);

    revalidatePath("/sales");
    revalidatePath("/dashboard");
    revalidatePath("/batches");
    return { ok: true, message: "Sale deleted successfully." };
  } catch (error) {
    return { ok: false, message: safeActionMessage(error, "The sale could not be deleted.", "deleteSaleAction") };
  }
}