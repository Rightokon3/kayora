import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { adminApiFetch } from "../services/adminApi";
import { AdminSettingsService } from "../services/adminSettings";

const POLL_INTERVAL_MS = 20000;

interface NotificationEventsResponse {
  serverTime: string;
  newOrders: { orderNumber: string; customerName: string; amount: number; createdAt: string }[];
  driverUpdates: { driverId: string; name: string; dutyStatus: string; updatedAt: string }[];
}

function fireBrowserNotification(title: string, body: string) {
  // Native push (iOS/Android) needs expo-notifications wired up with a
  // real push provider (FCM/APNs) — a separate infrastructure piece not
  // set up in this project. This covers Web only, which is what "an
  // alert on this laptop" means in practice today.
  if (Platform.OS !== "web") return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

/**
 * Call once, near the top of the authenticated admin tree (AdminLayout),
 * so it runs continuously across every admin page — not just Settings.
 * Polls GET /admin/notifications/events every 20s and fires a real
 * browser Notification for each new order / driver update found, but
 * ONLY if the admin's corresponding toggle (read fresh from the server
 * every cycle, so a toggle flip takes effect within one poll interval)
 * is currently on.
 */
export function useAdminAlerts() {
  const sinceRef = useRef<string>(new Date().toISOString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }

    const poll = async () => {
      try {
        const [prefs, events] = await Promise.all([
          AdminSettingsService.getNotificationPreferences(),
          adminApiFetch<NotificationEventsResponse>(
            `/admin/notifications/events?since=${encodeURIComponent(sinceRef.current)}`
          ),
        ]);

        if (prefs.newOrderNotifications) {
          events.newOrders.forEach((order) => {
            fireBrowserNotification(
              "New Order Received",
              `${order.customerName} placed an order for ₦${order.amount.toLocaleString("en-NG")} (${order.orderNumber})`
            );
          });
        }

        if (prefs.driverAlerts) {
          events.driverUpdates.forEach((driver) => {
            fireBrowserNotification("Driver Update", `${driver.name} is now ${driver.dutyStatus.replace("_", " ")}`);
          });
        }

        sinceRef.current = events.serverTime;
      } catch (e) {
        // Silent — a missed poll cycle just means the next one covers a
        // slightly wider time window; not worth surfacing to the admin.
      }
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
}