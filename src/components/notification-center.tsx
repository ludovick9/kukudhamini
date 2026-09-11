import type { Farm, User } from "@/domain/types";
import { AppShell } from "@/components/app-shell";
import { NotificationCenterClient } from "@/components/notification-center-client";
import { getNotifications } from "@/services/farm-services";

export async function NotificationCenter({ farm, user }: { farm: Farm; user: User }) {
  const notifications = await getNotifications(farm.id);
  return <AppShell farm={farm} user={user}><NotificationCenterClient notifications={notifications} /></AppShell>;
}