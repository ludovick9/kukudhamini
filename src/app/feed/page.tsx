import { AppShell } from "@/components/app-shell";
import { FeedManager } from "@/components/feed-manager";
import { getFarmContext, getFeedOptions, getFeedStock, getFeedSummary, getFeedTransactions } from "@/services/farm-services";

export default async function FeedPage() {
	const { farm, user } = await getFarmContext();
	const [stock, transactions, options, summary] = await Promise.all([getFeedStock(farm.id), getFeedTransactions(farm.id), getFeedOptions(farm.id), getFeedSummary(farm.id)]);
	return <AppShell farm={farm} user={user}><FeedManager farm={farm} stock={stock} transactions={transactions} products={options.products.map((item) => ({ id: item.id, name: item.name, type: item.type, lowStockThreshold: Number(item.lowStockThreshold) }))} suppliers={options.suppliers.map((item) => ({ id: item.id, name: item.name }))} batches={options.batches} summary={summary} /></AppShell>;
}