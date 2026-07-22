import { adminApiFetch } from "./adminApi";
import {
  AdminProfile,
  ProfileUpdateInput,
  PasswordUpdateInput,
  UsernameUpdateInput,
  NotificationPreferences,
  SystemInfo,
} from "../types/adminSettings";

/* ============================================================
   ADMIN SETTINGS SERVICE (REAL)
   ------------------------------------------------------------
   Replaces services/adminSettingsDemo.ts. Same exported object
   name and function signatures on purpose — settings.tsx only
   needed its import path changed, nothing else.
============================================================ */

export const AdminSettingsService = {
  async getProfile(): Promise<AdminProfile> {
    return adminApiFetch<AdminProfile>("/admin/settings/profile");
  },

  /** input.password is the admin's current password — required, confirms it's really them. */
  async updateProfile(input: ProfileUpdateInput): Promise<AdminProfile> {
    return adminApiFetch<AdminProfile>("/admin/settings/profile", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  async updatePassword(input: PasswordUpdateInput): Promise<{ success: true }> {
    return adminApiFetch<{ success: true }>("/admin/settings/password", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async updateUsername(input: UsernameUpdateInput): Promise<AdminProfile> {
    return adminApiFetch<AdminProfile>("/admin/settings/username", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    return adminApiFetch<NotificationPreferences>("/admin/settings/notifications");
  },

  async updateNotificationPreference(
    key: keyof NotificationPreferences,
    value: boolean
  ): Promise<NotificationPreferences> {
    return adminApiFetch<NotificationPreferences>("/admin/settings/notifications", {
      method: "PATCH",
      body: JSON.stringify({ [key]: value }),
    });
  },

  async getSystemInfo(): Promise<SystemInfo> {
    return adminApiFetch<SystemInfo>("/admin/settings/system-info");
  },
};