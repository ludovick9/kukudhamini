import { AppShell } from "@/components/app-shell";
import { BatchManager } from "@/components/batch-manager";
import { getBatches, getFarmContext } from "@/services/farm-services";

export default async function BatchesPage() {
	const { farm, user } = await getFarmContext();
	const batches = await getBatches(farm.id);
	return <AppShell farm={farm} user={user}><BatchManager batches={batches} farm={farm} /></AppShell>;
}