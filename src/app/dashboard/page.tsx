import { AppShell } from "@/components/app-shell";
import { DashboardView } from "@/components/dashboard";
import { generateHealthNotifications, getDashboardData, getFarmContext } from "@/services/farm-services";

export default async function DashboardPage() {
  const preliminary = await getFarmContext();
  await generateHealthNotifications(preliminary.farm.id);
  const { farm, user } = await getFarmContext();
  return <AppShell farm={farm} user={user}><DashboardView data={await getDashboardData(farm.id)} farm={farm} user={user} /></AppShell>;
}