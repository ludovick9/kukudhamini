import { AppShell } from "@/components/app-shell";
import { HealthManager } from "@/components/health-manager";
import { getBatches, getFarmContext, getHealthSummary, getHealthTasks } from "@/services/farm-services";

export default async function HealthPage() {
	const { farm, user } = await getFarmContext();
	const [batches, tasks, summary] = await Promise.all([getBatches(farm.id), getHealthTasks(farm.id), getHealthSummary(farm.id)]);
	return <AppShell farm={farm} user={user}><HealthManager batches={batches} tasks={tasks} summary={summary} /></AppShell>;
}