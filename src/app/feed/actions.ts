"use server";

import { revalidatePath } from "next/cache";
import { getFarmContext, createFeedProduct, createFeedTransaction } from "@/services/farm-services";

export async function feedTransactionAction(_previous: { ok: boolean; message: string }, formData: FormData) {
  try {
    const { farm } = await getFarmContext();
    await createFeedTransaction(farm.id, { productId: String(formData.get("productId") ?? ""), batchId: String(formData.get("batchId") ?? "") || undefined, supplierId: String(formData.get("supplierId") ?? "") || undefined, type: String(formData.get("type") ?? ""), quantity: String(formData.get("quantity") ?? ""), unit: String(formData.get("unit") ?? "kg"), unitPrice: String(formData.get("unitPrice") ?? "") || undefined, date: String(formData.get("date") ?? ""), notes: String(formData.get("notes") ?? "") || undefined });
    revalidatePath("/feed"); revalidatePath("/dashboard"); return { ok: true, message: "Feed transaction recorded." };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "The feed transaction could not be saved." }; }
}

export async function feedProductAction(_previous: { ok: boolean; message: string }, formData: FormData) {
  try { const { farm } = await getFarmContext(); await createFeedProduct(farm.id, { name: String(formData.get("name") ?? ""), type: String(formData.get("type") ?? ""), lowStockThreshold: String(formData.get("lowStockThreshold") ?? "") }); revalidatePath("/feed"); return { ok: true, message: "Feed product created." }; }
  catch (error) { return { ok: false, message: error instanceof Error ? error.message : "The feed product could not be saved." }; }
}