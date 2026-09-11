import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SaleDetail } from "@/components/sale-detail";
import { getFarmContext, getSaleDetails } from "@/services/farm-services";

export default async function SaleDetailsPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; const { farm, user } = await getFarmContext(); const sale = await getSaleDetails(farm.id, id); if (!sale) notFound(); return <AppShell farm={farm} user={user}><SaleDetail farm={farm} sale={sale} /></AppShell>; }