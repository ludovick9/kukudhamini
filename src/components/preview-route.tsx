import { AppShell } from "@/components/app-shell";
import { PlaceholderPage } from "@/components/placeholder-page";
import { getFarmContext } from "@/services/farm-services";

export async function PreviewRoute({ title }: { title: string }) {
  const { farm, user } = await getFarmContext();
  return <AppShell farm={farm} user={user}><PlaceholderPage title={title} /></AppShell>;
}