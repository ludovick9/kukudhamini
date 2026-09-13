"use server";

import { revalidatePath } from "next/cache";
import { createFeedProduct, createFeedTransaction, deleteFeedTransaction, getFarmContext, updateFeedTransaction } from "@/services/farm-services";

export async function feedTransactionAction(_previous: { ok: boolean; message: string }, formData: FormData) {
  try {
    const { farm } = await getFarmContext();
    const transactionId = String(formData.get("transactionId") ?? "");
    const input = {
      productId: String(formData.get("productId") ?? ""),
      batchId: String(formData.get("batchId") ?? "") || undefined,
      supplierId: String(formData.get("supplierId") ?? "") || undefined,
      type: String(formData.get("type") ?? ""),
      quantity: String(formData.get("quantity") ?? ""),
      unit: String(formData.get("unit") ?? "kg"),
      unitPrice: String(formData.get("unitPrice") ?? "") || undefined,
      date: String(formData.get("date") ?? ""),
      notes: String(formData.get("notes") ?? "") || undefined,
    };

    if (transactionId) await updateFeedTransaction(farm.id, transactionId, input); else await createFeedTransaction(farm.id, input);

    revalidatePath("/feed"); revalidatePath("/dashboard"); return { ok: true, message: "Feed transaction recorded." };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "The feed transaction could not be saved." }; }
}

export async function deleteFeedTransactionAction(_previous: { ok: boolean; message: string }, formData: FormData) {
  try {
    const { farm } = await getFarmContext();
    const transactionId = String(formData.get("transactionId") ?? "");
    if (!transactionId) throw new Error("Feed transaction not found.");

    await deleteFeedTransaction(farm.id, transactionId);

    revalidatePath("/feed");
    revalidatePath("/dashboard");
    return { ok: true, message: "Feed transaction deleted." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The feed transaction could not be deleted." };
  }
}

export async function feedProductAction(_previous: { ok: boolean; message: string }, formData: FormData) {
  try { const { farm } = await getFarmContext(); await createFeedProduct(farm.id, { name: String(formData.get("name") ?? ""), type: String(formData.get("type") ?? ""), lowStockThreshold: String(formData.get("lowStockThreshold") ?? "") }); revalidatePath("/feed"); return { ok: true, message: "Feed product created." }; }
  catch (error) { return { ok: false, message: error instanceof Error ? error.message : "The feed product could not be saved." }; }
}

export async function feedBulkAction(_previous: { ok: boolean; message: string }, formData: FormData) {
  try {
    const { farm } = await getFarmContext();
    const rows = String(formData.get("rows") ?? "").split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    const common = { productId: String(formData.get("productId") ?? ""), batchId: String(formData.get("batchId") ?? "") || undefined, supplierId: String(formData.get("supplierId") ?? "") || undefined, type: String(formData.get("type") ?? ""), unit: String(formData.get("unit") ?? "kg") };
    if (!common.productId || !common.type) throw new Error("Choose a product and transaction type.");
    if (rows.length === 0) throw new Error("Add at least one feed row.");
    for (const row of rows) {
      const [date, quantity, unitPrice] = row.split(",").map((value) => value.trim());
      if (!date || !quantity) throw new Error("Each feed row must contain date and quantity.");
      await createFeedTransaction(farm.id, { ...common, date, quantity, unitPrice: unitPrice || undefined });
    }
    revalidatePath("/feed"); revalidatePath("/dashboard");
    return { ok: true, message: `${rows.length} feed movements recorded.` };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Bulk feed entry failed." }; }
}