"use server";

import { revalidatePath } from "next/cache";
import {
  getFarmContext,
  createBatch,
  updateBatch,
  updateBatchStatus,
  deleteBatch,
  
} from "@/services/farm-services";

export interface BatchActionState {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

const initialState: BatchActionState = { ok: false, message: "" };

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function errorState(error: unknown): BatchActionState {
  if (error && typeof error === "object" && "issues" in error) {
    const issues = (error as { issues: Array<{ path: Array<string | number>; message: string }> }).issues;
    return { ok: false, message: "Please review the highlighted fields.", fieldErrors: Object.fromEntries(issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message])) };
  }
  return { ok: false, message: error instanceof Error ? error.message : "The batch could not be saved." };
}

export async function createBatchAction(previous: BatchActionState = initialState, formData: FormData): Promise<BatchActionState> {
  void previous;
  try {
    const { farm } = await getFarmContext();
    await createBatch(farm.id, { name: formValue(formData, "name"), breed: formValue(formData, "breed"), arrivalDate: formValue(formData, "arrivalDate"), initialBirdCount: formValue(formData, "initialBirdCount"), expectedHarvestDate: formValue(formData, "expectedHarvestDate"), status: formValue(formData, "status") || "ACTIVE", notes: formValue(formData, "notes") || undefined });
    revalidatePath("/batches");
    revalidatePath("/dashboard");
    return { ok: true, message: "Batch created successfully." };
  } catch (error) {
    return errorState(error);
  }
}

export async function updateBatchAction(previous: BatchActionState = initialState, formData: FormData): Promise<BatchActionState> {
  void previous;
  try {
    const { farm } = await getFarmContext();
    await updateBatch(farm.id, formValue(formData, "batchId"), { name: formValue(formData, "name"), breed: formValue(formData, "breed"), arrivalDate: formValue(formData, "arrivalDate"), initialBirdCount: formValue(formData, "initialBirdCount"), expectedHarvestDate: formValue(formData, "expectedHarvestDate"), status: formValue(formData, "status") || "ACTIVE", notes: formValue(formData, "notes") || undefined });
    revalidatePath("/batches");
    revalidatePath(`/batches/${formValue(formData, "batchId")}`);
    revalidatePath("/dashboard");
    return { ok: true, message: "Batch details updated." };
  } catch (error) {
    return errorState(error);
  }
}

export async function changeBatchStatusAction(previous: BatchActionState = initialState, formData: FormData): Promise<BatchActionState> {
  void previous;
  try {
    const { farm } = await getFarmContext();
    const batchId = formValue(formData, "batchId");
    await updateBatchStatus(farm.id, batchId, formValue(formData, "status"));
    revalidatePath("/batches");
    revalidatePath(`/batches/${batchId}`);
    revalidatePath("/dashboard");
    return { ok: true, message: "Batch status updated." };
  } catch (error) {
    return errorState(error);
  }
}
export async function deleteBatchAction(
  previous: BatchActionState = initialState,
  formData: FormData,
): Promise<BatchActionState> {
  void previous;

  try {
    const { farm } = await getFarmContext();
    const batchId = formValue(formData, "batchId");

    await deleteBatch(farm.id, batchId);

    revalidatePath("/batches");
    revalidatePath("/dashboard");

    return { ok: true, message: "Batch deleted successfully." };
  } catch (error) {
    return errorState(error);
  }
}