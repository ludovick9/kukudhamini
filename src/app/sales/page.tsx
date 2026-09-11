import { AppShell } from "@/components/app-shell";
import { SalesManager } from "@/components/sales-manager";
import { getFarmContext, getPaymentSummary, getSaleOptions, getSales, getSalesSummary } from "@/services/farm-services";

export default async function SalesPage() {
	const { farm, user } = await getFarmContext();
	const [sales, options, summary, paymentSummary] = await Promise.all([getSales(farm.id), getSaleOptions(farm.id), getSalesSummary(farm.id), getPaymentSummary(farm.id)]);
	return <AppShell farm={farm} user={user}><SalesManager farm={farm} sales={sales} batches={options.batches} customers={options.customers} summary={summary} paymentSummary={paymentSummary} /></AppShell>;
}