import { AppShell } from "@/components/app-shell";
import { ExportsManager } from "@/components/exports-manager";
import { getExpenses, getFarmContext, getFeedTransactions, getMortality, getSales } from "@/services/farm-services";

export default async function ExportsPage() {
  const { farm, user } = await getFarmContext();
  const [expenses, feed, sales, mortality] = await Promise.all([getExpenses(farm.id), getFeedTransactions(farm.id), getSales(farm.id), getMortality(farm.id)]);
  return <AppShell farm={farm} user={user}><div className="page-heading"><div><p className="eyebrow">Operational tools</p><h1>Exports</h1><p className="heading-subtitle">Download filtered farm records for accounting, review, or sharing.</p></div></div><ExportsManager expenses={expenses} feed={feed} sales={sales} mortality={mortality} /></AppShell>;
}