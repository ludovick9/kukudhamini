import { AppShell } from "@/components/app-shell";
import { ExpenseManager } from "@/components/expense-manager";
import { getExpenses, getExpenseOptions, getExpenseSummary, getFarmContext } from "@/services/farm-services";

export default async function ExpensesPage() {
	const { farm, user } = await getFarmContext();
	const [expenses, options, summary] = await Promise.all([getExpenses(farm.id), getExpenseOptions(farm.id), getExpenseSummary(farm.id)]);
	return <AppShell farm={farm} user={user}><ExpenseManager farm={farm} expenses={expenses} categories={options.categories.map((item) => ({ id: item.id, name: item.name }))} suppliers={options.suppliers.map((item) => ({ id: item.id, name: item.name }))} batches={options.batches} summary={summary} /></AppShell>;
}