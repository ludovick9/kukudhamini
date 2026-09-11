import { MortalityManager } from "@/components/mortality-manager";
import { getBatches, getFarmContext, getMortality } from "@/services/farm-services";
import { AppShell } from "@/components/app-shell";

export default async function MortalityPage() {
	const { farm, user } = await getFarmContext();
	const [records, batches] = await Promise.all([getMortality(farm.id), getBatches(farm.id)]);
	return <AppShell farm={farm} user={user}><MortalityManager records={records} batches={batches} timezone={farm.timezone} /></AppShell>;
}