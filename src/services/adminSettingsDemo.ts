import {
  AdminProfile,
  ProfileUpdateInput,
  PasswordUpdateInput,
  UsernameUpdateInput,
  NotificationPreferences,
  SystemInfo,
} from "../types/AdminSettings";

/* ============================================================
   DEMO SETTINGS SERVICE
   ------------------------------------------------------------
   Every function here is shaped exactly like the real Laravel
   call it will become — same signature, same Promise<T> return,
   same simulated network delay. When the backend is ready, only
   THIS file changes: swap the setTimeout/demo-object bodies for
   real `adminApiFetch(...)` calls (see services/adminApi.ts,
   already used by every other admin page). settings.tsx itself
   should need zero changes.
============================================================ */

const DEMO_DELAY_MS = 600;

let demoProfile: AdminProfile = {
  profilePicture: null,
  username: "kayora.admin",
  fullName: "Right Uwaifo",
  email: "admin@kayora.com",
  phone: "+234 801 234 5678",
  role: "admin",
  createdAt: "2025-03-14T09:00:00Z",
};

let demoNotifications: NotificationPreferences = {
  systemNotifications: true,
  newOrderNotifications: true,
  driverAlerts: true,
  customerReports: false,
};

const demoSystemInfo: SystemInfo = {
  appVersion: "1.4.2",
  buildNumber: "2026.07.114",
  apiStatus: "Online",
  databaseStatus: "Connected",
  lastSyncTime: new Date().toISOString(),
  companyName: "Kayora Water Delivery",
  copyrightYear: new Date().getFullYear(),
};

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), DEMO_DELAY_MS));
}

export const AdminSettingsService = {
  async getProfile(): Promise<AdminProfile> {
    // Future: return adminApiFetch<AdminProfile>("/admin/settings/profile");
    return delay({ ...demoProfile });
  },

  async updateProfile(input: ProfileUpdateInput): Promise<AdminProfile> {
    // Future: return adminApiFetch<AdminProfile>("/admin/settings/profile", { method: "PUT", body: JSON.stringify(input) });
    demoProfile = { ...demoProfile, ...input };
    return delay({ ...demoProfile });
  },

  async updatePassword(input: PasswordUpdateInput): Promise<{ success: true }> {
    // Future: return adminApiFetch("/admin/settings/password", { method: "PATCH", body: JSON.stringify(input) });
    if (input.newPassword !== input.confirmPassword) {
      throw new Error("Passwords do not match.");
    }
    return delay({ success: true as const });
  },

  async updateUsername(input: UsernameUpdateInput): Promise<AdminProfile> {
    // Future: return adminApiFetch<AdminProfile>("/admin/settings/username", { method: "PATCH", body: JSON.stringify(input) });
    demoProfile = { ...demoProfile, username: input.newUsername };
    return delay({ ...demoProfile });
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    // Future: return adminApiFetch<NotificationPreferences>("/admin/settings/notifications");
    return delay({ ...demoNotifications });
  },

  async updateNotificationPreference(
    key: keyof NotificationPreferences,
    value: boolean
  ): Promise<NotificationPreferences> {
    // Future: return adminApiFetch<NotificationPreferences>("/admin/settings/notifications", { method: "PATCH", body: JSON.stringify({ [key]: value }) });
    demoNotifications = { ...demoNotifications, [key]: value };
    return delay({ ...demoNotifications });
  },

  async getSystemInfo(): Promise<SystemInfo> {
    // Future: return adminApiFetch<SystemInfo>("/admin/settings/system-info");
    return delay({ ...demoSystemInfo, lastSyncTime: new Date().toISOString() });
  },
};