/* ============================================================
   ROLE & PERMISSION ARCHITECTURE
   ------------------------------------------------------------
   Extracted out of login.tsx into its own file so both login.tsx
   and AdminAuthContext.tsx (and any future protected screen) can
   import AdminRole/hasPermission without a circular import between
   the two. This is the source of truth for role-based access
   across the entire Admin Panel — every protected page reads
   currentUser.role and/or hasPermission() from here.
============================================================ */
export type AdminRole = "super_admin" | "admin";

export const PERMISSIONS = {
  MANAGE_ADMINS: "manage_admins",
  MANAGE_ROLES: "manage_roles",
  ACCESS_SECURITY_SETTINGS: "access_security_settings",
  MANAGE_DRIVERS: "manage_drivers",
  MANAGE_CUSTOMERS: "manage_customers",
  MANAGE_ORDERS: "manage_orders",
  MANAGE_PRODUCTS: "manage_products",
  MANAGE_DISTRIBUTORS: "manage_distributors",
  MANAGE_NOTIFICATIONS: "manage_notifications",
  VIEW_ANALYTICS: "view_analytics",
  VIEW_REPORTS: "view_reports",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.MANAGE_ORDERS,
    PERMISSIONS.MANAGE_DRIVERS,
    PERMISSIONS.MANAGE_CUSTOMERS,
    PERMISSIONS.MANAGE_PRODUCTS,
    PERMISSIONS.MANAGE_DISTRIBUTORS,
    PERMISSIONS.MANAGE_NOTIFICATIONS,
    PERMISSIONS.VIEW_REPORTS,
  ],
};

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}