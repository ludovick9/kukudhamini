import { NotificationCenter } from "@/components/notification-center";
import { generateHealthNotifications, getFarmContext } from "@/services/farm-services";

export default async function NotificationsPage() {
	const preliminary = await getFarmContext();
	await generateHealthNotifications(preliminary.farm.id);
	const { farm, user } = await getFarmContext();
	return <NotificationCenter farm={farm} user={user} />;
}