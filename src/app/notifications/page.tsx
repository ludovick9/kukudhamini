import { NotificationCenter } from "@/components/notification-center";
import { generateHealthNotifications, getFarmContext, getUnreadNotificationCount } from "@/services/farm-services";

export default async function NotificationsPage() {
	const preliminary = await getFarmContext();
	await generateHealthNotifications(preliminary.farm.id);
	const unreadNotificationCount = await getUnreadNotificationCount(preliminary.farm.id);
	return <NotificationCenter farm={{ ...preliminary.farm, unreadNotificationCount }} user={preliminary.user} />;
}