/* ============================================================
   ADMIN SETTINGS — DEMO TYPES
   ------------------------------------------------------------
   Shapes mirror what a real GET /admin/settings (or similar)
   endpoint would eventually return — swapping the demo service
   for real adminApiFetch calls later shouldn't require touching
   these types or the screen itself.
============================================================ */

export interface AdminProfile {
  profilePicture: string | null;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: "super_admin" | "admin";
  createdAt: string; // ISO date
}

export interface ProfileUpdateInput {
  profilePicture: string | null;
  username: string;
  fullName: string;
  email: string;
  phone: string;
}

export interface PasswordUpdateInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UsernameUpdateInput {
  newUsername: string;
  currentPassword: string;
}

export interface NotificationPreferences {
  systemNotifications: boolean;
  newOrderNotifications: boolean;
  driverAlerts: boolean;
  customerReports: boolean;
}

export interface SystemInfo {
  appVersion: string;
  buildNumber: string;
  apiStatus: "Online" | "Degraded" | "Offline";
  databaseStatus: "Connected" | "Disconnected";
  lastSyncTime: string; // ISO date
  companyName: string;
  copyrightYear: number;
}