import { AppShell } from "@/components/app-shell";
import { OfflineCenter, SettingsManager } from "@/components/settings-manager";
import { getFarmContext } from "@/services/farm-services";

export default async function SettingsPage() { const { farm, user } = await getFarmContext(); return <AppShell farm={farm} user={user}><OfflineCenter farmId={farm.id} /><SettingsManager farm={farm} user={user} /></AppShell>; }