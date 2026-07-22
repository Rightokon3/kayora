import { useEffect } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { AdminNotificationService } from "../services/AdminNotificationService";

// Requires: npx expo install expo-notifications expo-device

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Call this once near the root of the admin app (e.g. in AdminLayout, so
 * it registers once per session rather than once per screen). Requests
 * push permission, gets an Expo push token for this device, and sends
 * it to the backend so new distributor-application submissions can
 * reach the admin's phone.
 */
export function useAdminPushNotifications() {
  useEffect(() => {
    let cancelled = false;

    async function register() {
      if (!Device.isDevice) {
        // Push tokens aren't issued on simulators/emulators.
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.HIGH,
        });
      }

      const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync();

      if (!cancelled) {
        try {
          await AdminNotificationService.registerPushToken(expoPushToken);
        } catch {
          // Non-fatal — the admin panel still works without push;
          // it'll just retry registering next time this mounts.
        }
      }
    }

    register();

    return () => {
      cancelled = true;
    };
  }, []);
}