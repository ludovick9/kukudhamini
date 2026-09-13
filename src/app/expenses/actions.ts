"use server";

import { revalidatePath } from "next/cache";
import { createExpense, deleteExpense, getFarmContext, updateExpense } from "@/services/farm-services";
import { safeActionMessage } from "@/server/action-errors";

export async function expenseAction(_previous: { ok: boolean; message: string }, formData: FormData) {
  try {
    const { farm } = await getFarmContext(); const expenseId = String(formData.get("expenseId") ?? "");
    const input = { categoryId: String(formData.get("categoryId") ?? ""), supplierId: String(formData.get("supplierId") ?? "") || undefined, batchId: String(formData.get("batchId") ?? "") || undefined, date: String(formData.get("date") ?? ""), description: String(formData.get("description") ?? ""), quantity: 1, unit: "item", unitPrice: String(formData.get("amount") ?? ""), paymentMethod: String(formData.get("paymentMethod") ?? ""), notes: String(formData.get("notes") ?? "") || undefined };
    if (expenseId) await updateExpense(farm.id, expenseId, input); else await createExpense(farm.id, input);
    revalidatePath("/expenses"); revalidatePath("/dashboard");
    return { ok: true, message: expenseId ? "Expense updated successfully." : "Expense recorded successfully." };
  } catch (error) {
    return { ok: false, message: safeActionMessage(error, "The expense could not be saved.", "expenseAction") };
  }
}

export async function deleteExpenseAction(_previous: { ok: boolean; message: string }, formData: FormData) {
  try {
    const { farm } = await getFarmContext();
    const expenseId = String(formData.get("expenseId") ?? "");
    if (!expenseId) throw new Error("Expense not found.");

    await deleteExpense(farm.id, expenseId);

    revalidatePath("/expenses");
    revalidatePath("/dashboard");
    return { ok: true, message: "Expense deleted successfully." };
  } catch (error) {
    return { ok: false, message: safeActionMessage(error, "The expense could not be deleted.", "deleteExpenseAction") };
  }
}