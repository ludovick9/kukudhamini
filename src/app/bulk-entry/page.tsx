import { AppShell } from "@/components/app-shell";
import { BulkEntryManager } from "@/components/bulk-entry-manager";
import { getFarmContext, getBatches, getFeedOptions } from "@/services/farm-services";

export default async function BulkEntryPage() {
  const { farm, user } = await getFarmContext();
  const [batches, options] = await Promise.all([getBatches(farm.id), getFeedOptions(farm.id)]);
  return <AppShell farm={farm} user={user}><div className="page-heading"><div><p className="eyebrow">Operational tools</p><h1>Bulk entry</h1><p className="heading-subtitle">Record repeated feed movements and health tasks in one pass.</p></div></div><BulkEntryManager batches={batches} products={options.products.map((item) => ({ id: item.id, name: item.name, type: item.type }))} /></AppShell>;
}