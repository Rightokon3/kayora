import { adminApiFetch } from "./adminApi";

export const AdminNotificationService = {
  async registerPushToken(expoPushToken: string): Promise<void> {
    await adminApiFetch("/admin/push-token", {
      method: "POST",
      body: JSON.stringify({ expoPushToken }),
    });
  },
};