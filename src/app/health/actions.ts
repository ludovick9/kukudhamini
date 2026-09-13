"use server";

import { revalidatePath } from "next/cache";
import { completeHealthTask, createHealthTask, deleteHealthTask, generateHealthNotifications, getFarmContext, updateHealthTask } from "@/services/farm-services";

export type HealthActionState = { ok: boolean; message: string };
const initialState: HealthActionState = { ok: false, message: "" };
const value = (formData: FormData, name: string) => String(formData.get(name) ?? "");
const refreshHealth = (taskId?: string) => { revalidatePath("/health"); revalidatePath("/dashboard"); if (taskId) revalidatePath(`/batches/${taskId}`); };

export async function healthTaskAction(previous: HealthActionState = initialState, formData: FormData): Promise<HealthActionState> {
  void previous;
  try {
    const { farm } = await getFarmContext();
    const taskId = value(formData, "taskId");
    const input = { batchId: value(formData, "batchId") || undefined, title: value(formData, "title"), type: value(formData, "type"), scheduledAt: value(formData, "scheduledAt"), status: value(formData, "status") || "UPCOMING", instructions: value(formData, "instructions") || undefined, notes: value(formData, "notes") || undefined };
    if (taskId) await updateHealthTask(farm.id, taskId, input); else await createHealthTask(farm.id, input);
    await generateHealthNotifications(farm.id);
    refreshHealth(taskId);
    return { ok: true, message: taskId ? "Health task updated." : "Health task created." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The health task could not be saved." };
  }
}

export async function completeHealthTaskAction(previous: HealthActionState = initialState, formData: FormData): Promise<HealthActionState> {
  void previous;
  try {
    const { farm } = await getFarmContext();
    const taskId = value(formData, "taskId");
    await completeHealthTask(farm.id, taskId);
    refreshHealth(taskId);
    return { ok: true, message: "Health task marked completed." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The health task could not be completed." };
  }
}

export async function deleteHealthTaskAction(previous: HealthActionState = initialState, formData: FormData): Promise<HealthActionState> {
  void previous;
  try {
    const { farm } = await getFarmContext();
    const taskId = value(formData, "taskId");
    if (!taskId) throw new Error("Health task not found.");

    await deleteHealthTask(farm.id, taskId);
    refreshHealth(taskId);
    return { ok: true, message: "Health task deleted." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The health task could not be deleted." };
  }
}

export async function healthBulkAction(previous: HealthActionState = initialState, formData: FormData): Promise<HealthActionState> {
  void previous;
  try {
    const { farm } = await getFarmContext();
    const rows = value(formData, "rows").split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    const batchId = value(formData, "batchId");
    const type = value(formData, "type");
    const time = value(formData, "time") || "09:00";
    if (!batchId || !type) throw new Error("Choose a batch and health task type.");
    if (rows.length === 0) throw new Error("Add at least one health task row.");
    for (const row of rows) {
      const [date, title] = row.split(",").map((item) => item.trim());
      if (!date || !title) throw new Error("Each health row must contain date and task title.");
      await createHealthTask(farm.id, { batchId, type, title, scheduledAt: `${date}T${time}`, status: "UPCOMING", instructions: value(formData, "instructions") || undefined });
    }
    await generateHealthNotifications(farm.id);
    revalidatePath("/health"); revalidatePath("/dashboard");
    return { ok: true, message: `${rows.length} health tasks created.` };
  } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Bulk health entry failed." }; }
}