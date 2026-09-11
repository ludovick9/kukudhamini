"use server";

import { revalidatePath } from "next/cache";
import { createPayment, getFarmContext } from "@/services/farm-services";

export async function paymentAction(previous: { ok: boolean; message: string }, formData: FormData) {
  void previous;
  try { const { farm } = await getFarmContext(); const saleId = String(formData.get("saleId") ?? ""); await createPayment(farm.id, { saleId, amount: String(formData.get("amount") ?? ""), paymentMethod: String(formData.get("paymentMethod") ?? ""), paymentDate: String(formData.get("paymentDate") ?? ""), reference: String(formData.get("reference") ?? "") || undefined, notes: String(formData.get("notes") ?? "") || undefined }); revalidatePath(`/sales/${saleId}`); revalidatePath("/sales"); revalidatePath("/dashboard"); return { ok: true, message: "Payment recorded successfully." }; } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "The payment could not be recorded." }; }
}