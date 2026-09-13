import { AppShell } from "@/components/app-shell";
import { DashboardView } from "@/components/dashboard";
import { generateHealthNotifications, getDashboardData, getFarmContext, getUnreadNotificationCount } from "@/services/farm-services";

export default async function DashboardPage() {
  const preliminary = await getFarmContext();
  await generateHealthNotifications(preliminary.farm.id);
  const [unreadNotificationCount, data] = await Promise.all([getUnreadNotificationCount(preliminary.farm.id), getDashboardData(preliminary.farm.id)]);
  const farm = { ...preliminary.farm, unreadNotificationCount };
  return <AppShell farm={farm} user={preliminary.user}><DashboardView data={data} farm={farm} user={preliminary.user} /></AppShell>;
}