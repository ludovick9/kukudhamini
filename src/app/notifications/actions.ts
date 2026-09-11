"use server";

import { revalidatePath } from "next/cache";
import { getFarmContext, markAllNotificationsRead, markNotificationRead } from "@/services/farm-services";

export type NotificationActionState = { ok: boolean; message: string };

export async function markNotificationReadAction(previous: NotificationActionState, formData: FormData): Promise<NotificationActionState> {
  void previous;
  try { const { farm } = await getFarmContext(); await markNotificationRead(farm.id, String(formData.get("notificationId") ?? "")); revalidatePath("/notifications"); revalidatePath("/dashboard"); return { ok: true, message: "Notification marked as read." }; } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Notification could not be updated." }; }
}

export async function markAllNotificationsReadAction(previous: NotificationActionState): Promise<NotificationActionState> {
  void previous;
  try { const { farm } = await getFarmContext(); await markAllNotificationsRead(farm.id); revalidatePath("/notifications"); revalidatePath("/dashboard"); return { ok: true, message: "All notifications marked as read." }; } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Notifications could not be updated." }; }
}