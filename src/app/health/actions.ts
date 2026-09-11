"use server";

import { revalidatePath } from "next/cache";
import { completeHealthTask, createHealthTask, generateHealthNotifications, getFarmContext, updateHealthTask } from "@/services/farm-services";

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