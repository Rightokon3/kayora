import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Palette } from "../../contexts/ThemeContext";

export interface AdminUser {
  name: string;
  role: "super_admin" | "admin";
  profilePicture: string | null;
}

const MENU_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "grid-outline",
    route: "/admin/dashboard" as const,
  },
  {
    key: "customers",
    label: "Customers",
    icon: "people-outline",
    route: "/admin/customers" as const,
  },
  {
    key: "drivers",
    label: "Drivers",
    icon: "people-circle-outline",
    route: "/admin/drivers" as const,
  },
  {
    key: "manage-vehicles",
    label: "Vehicles",
    icon: "car-outline",
    route: "/admin/manage-vehicles" as const,
  },
  {
    key: "products",
    label: "Products",
    icon: "cube-outline",
    route: "/admin/products" as const,
  },
  {
    key: "orders",
    label: "Orders",
    icon: "receipt-outline",
    route: "/admin/orders" as const,
  },
   {
    key: "settings",
    label: "Settings",
    icon: "settings-outline",
    route: "/admin/settings" as const,
  },
  {
    key: "manage-admins",
    label: "Manage Administrators",
    icon: "shield-checkmark-outline",
    route: "/admin/manage-admins" as const,
    superAdminOnly: true,
  },
];

function SidebarBase({
  palette,
  user,
  onNavigate,
}: {
  palette: Palette;
  user: AdminUser;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const roleLabel =
    user.role === "super_admin" ? "Super Administrator" : "Administrator";

  const visibleMenuItems = MENU_ITEMS.filter(
    (item) => !item.superAdminOnly || user.role === "super_admin"
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.sidebarBg,
          borderRightColor: palette.border,
        },
      ]}
    >
      <View style={styles.logoRow}>
        <View style={[styles.logoBadge, { backgroundColor: palette.primary }]}>
          <Text style={styles.logoBadgeText}>K</Text>
        </View>
        <Text style={[styles.brandText, { color: palette.text }]}>
          Kayora <Text style={{ fontWeight: "600" }}>Administrator</Text>
        </Text>
      </View>

      <View style={styles.menuList}>
        {visibleMenuItems.map((item) => {
          const isActive = pathname?.includes(item.key);
          return (
            <Pressable
              key={item.key}
              onPress={() => {
                router.push(item.route as any);
                onNavigate?.();
              }}
              style={[
                styles.menuItem,
                isActive && {
                  backgroundColor: palette.sidebarActiveBg,
                  borderRadius: 12,
                },
              ]}
            >
              <Ionicons
                name={item.icon as any}
                size={19}
                color={isActive ? palette.primary : palette.muted}
              />
              <Text
                style={[
                  styles.menuLabel,
                  {
                    color: isActive ? palette.primary : palette.muted,
                    fontWeight: isActive ? "700" : "500",
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.profileRow, { borderTopColor: palette.border }]}>
        {user.profilePicture ? (
          <View
            style={[styles.avatarCircle, { backgroundColor: palette.primary }]}
          />
        ) : (
          <View
            style={[styles.avatarCircle, { backgroundColor: palette.pillBg }]}
          >
            <Text style={[styles.avatarInitial, { color: palette.text }]}>
              {user.name.trim().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ marginLeft: 10 }}>
          <Text style={[styles.profileName, { color: palette.text }]}>
            {user.name}
          </Text>
          <Text style={[styles.profileRole, { color: palette.muted }]}>
            {roleLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

export const Sidebar = memo(SidebarBase);

const styles = StyleSheet.create({
  container: {
    width: 260,
    height: "100%",
    borderRightWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
    justifyContent: "space-between",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    paddingHorizontal: 6,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoBadgeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  brandText: { fontSize: 15, fontWeight: "800" },

  menuList: { flex: 1, gap: 4 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuLabel: { fontSize: 14.5 },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 16, fontWeight: "800" },
  profileName: { fontSize: 13.5, fontWeight: "700" },
  profileRole: { fontSize: 11.5, marginTop: 2 },
});