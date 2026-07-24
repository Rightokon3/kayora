import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../contexts/ThemeContext";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { adminApiFetch, ApiError } from "../../services/adminApi";
import { AdminLayout } from "../../components/layout/AdminLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Role = "Super Administrator" | "Administrator";
type Status = "Active" | "Inactive";

interface Administrator {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  department: string;
  role: Role;
  status: Status;
  lastLogin: string;
  dateCreated: string;
  permissions: string[];
}

interface PermissionGroup {
  key: string;
  label: string;
  permissions: { key: string; label: string }[];
}

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const ROLES: Role[] = ["Super Administrator", "Administrator"];

const DEPARTMENTS = [
  "Management",
  "Operations",
  "Customer Support",
  "Logistics & Dispatch",
  "Finance & Accounting",
  "Engineering & IT",
  "Marketing & Sales",
];

const FILTER_ROLES = ["All", "Super Administrator", "Administrator"];

const PERMISSION_GROUPS: PermissionGroup[] = [
  { key: "dashboard", label: "Dashboard", permissions: [{ key: "view_dashboard", label: "View Dashboard" }] },
  {
    key: "orders",
    label: "Orders",
    permissions: [
      { key: "view_orders", label: "View Orders" },
      { key: "edit_orders", label: "Edit Orders" },
      { key: "delete_orders", label: "Delete Orders" },
      { key: "assign_drivers", label: "Assign Drivers" },
    ],
  },
  {
    key: "products",
    label: "Products",
    permissions: [
      { key: "view_products", label: "View Products" },
      { key: "add_products", label: "Add Products" },
      { key: "edit_products", label: "Edit Products" },
      { key: "delete_products", label: "Delete Products" },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    permissions: [
      { key: "view_customers", label: "View Customers" },
      { key: "delete_customers", label: "Delete Customers" },
    ],
  },
  {
    key: "drivers",
    label: "Drivers",
    permissions: [
      { key: "view_drivers", label: "View Drivers" },
      { key: "add_drivers", label: "Add Drivers" },
      { key: "edit_drivers", label: "Edit Drivers" },
      { key: "delete_drivers", label: "Delete Drivers" },
      { key: "track_drivers", label: "Track Drivers" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    permissions: [
      { key: "view_reports", label: "View Reports" },
      { key: "export_reports", label: "Export Reports" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    permissions: [
      { key: "view_settings", label: "View Settings" },
      { key: "manage_settings", label: "Manage Settings" },
    ],
  },
  {
    key: "admin_management",
    label: "Administrator Management",
    permissions: [
      { key: "view_admins", label: "View Administrators" },
      { key: "add_admins", label: "Add Administrators" },
      { key: "edit_admins", label: "Edit Administrators" },
      { key: "delete_admins", label: "Delete Administrators" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Backend-connected service layer
// ---------------------------------------------------------------------------

const adminService = {
  async getAdministrators(): Promise<Administrator[]> {
    return adminApiFetch<Administrator[]>("/admin/admins");
  },
  async searchAdministrators(_all: Administrator[], query: string): Promise<Administrator[]> {
    const q = query.trim();
    const path = q ? `/admin/admins?search=${encodeURIComponent(q)}` : "/admin/admins";
    return adminApiFetch<Administrator[]>(path);
  },
  async checkAvailability(
    username: string,
    email: string,
    excludeId?: string
  ): Promise<{ usernameTaken: boolean; emailTaken: boolean }> {
    const params = new URLSearchParams();
    if (username.trim()) params.set("username", username.trim());
    if (email.trim()) params.set("email", email.trim());
    if (excludeId) params.set("excludeId", excludeId);
    return adminApiFetch<{ usernameTaken: boolean; emailTaken: boolean }>(
      `/admin/admins/check-availability?${params.toString()}`
    );
  },
  async createAdministrator(payload: Partial<Administrator> & { password: string }): Promise<Administrator> {
    return adminApiFetch<Administrator>("/admin/admins", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async updateAdministrator(id: string, payload: Partial<Administrator>): Promise<Administrator> {
    return adminApiFetch<Administrator>(`/admin/admins/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  async confirmPassword(password: string): Promise<boolean> {
    const result = await adminApiFetch<{ valid: boolean }>("/admin/admins/confirm-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    return result.valid;
  },
  async deleteAdministrator(id: string): Promise<void> {
    await adminApiFetch(`/admin/admins/${id}`, { method: "DELETE" });
  },
  assignPermissions(permissions: string[]): string[] {
    return permissions;
  },
};

// ---------------------------------------------------------------------------
// Small shared bits
// ---------------------------------------------------------------------------

function initialsOf(a: Administrator) {
  if (a.username) {
    return a.username[0].toUpperCase();
  }
  return `${a.firstName?.[0] ?? ""}${a.lastName?.[0] ?? ""}`.toUpperCase();
}

function statusColor(colors: any, status: Status) {
  switch (status) {
    case "Active":
      return { bg: colors.success + "1A", fg: colors.success ?? "#1E9E5A" };
    case "Inactive":
      return { bg: colors.border, fg: colors.muted };
  }
}

function roleBadgeColor(colors: any, role: Role) {
  switch (role) {
    case "Super Administrator":
      return { bg: colors.primary + "1A", fg: colors.primary ?? "#0D4A8C" };
    case "Administrator":
      return { bg: colors.warning + "1A", fg: colors.warning ?? "#B7791F" };
  }
}

// ---------------------------------------------------------------------------
// Access Denied screen
// ---------------------------------------------------------------------------

function AccessDeniedView({ colors, onGoBack }: { colors: any; onGoBack: () => void }) {
  return (
    <View style={[localStyles(colors).centerFill, { padding: 24 }]}>
      <View style={localStyles(colors).lockCircle}>
        <Ionicons name="lock-closed" size={40} color={colors.primary} />
      </View>
      <Text style={[localStyles(colors).deniedTitle]}>Access Restricted</Text>
      <Text style={[localStyles(colors).deniedSubtitle]}>
        Only the Super Administrator can access this page.
      </Text>
      <Pressable style={localStyles(colors).primaryButton} onPress={onGoBack}>
        <Ionicons name="arrow-back" size={18} color={"#FFFFFF"} />
        <Text style={localStyles(colors).primaryButtonText}>Go Back</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error">("success");
  const anim = useRef(new Animated.Value(0)).current;

  const show = useCallback(
    (msg: string, toneValue: "success" | "error" = "success") => {
      setMessage(msg);
      setTone(toneValue);
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMessage(null));
    },
    [anim]
  );

  return useMemo(() => ({ message, tone, anim, show }), [message, tone, anim, show]);
}

function ToastView({ colors, toast }: { colors: any; toast: ReturnType<typeof useToast> }) {
  if (!toast.message) return null;
  const isSuccess = toast.tone === "success";
  return (
    <Animated.View
      style={[
        localStyles(colors).toast,
        {
          backgroundColor: isSuccess ? colors.success ?? "#1E9E5A" : colors.danger ?? "#D64545",
          opacity: toast.anim,
          transform: [
            {
              translateY: toast.anim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }),
            },
          ],
        },
      ]}
    >
      <Ionicons
        name={isSuccess ? "checkmark-circle" : "alert-circle"}
        size={18}
        color="#FFFFFF"
      />
      <Text style={localStyles(colors).toastText}>{toast.message}</Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SkeletonBlock({ colors, width, height, style }: { colors: any; width: number | string; height: number; style?: any }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: 8, backgroundColor: colors.border ?? "#E2E5EA", opacity: pulse },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ManageAdministratorsScreen() {
  const { palette: colors } = useTheme();
  const { admin: authedAdmin } = useAdminAuth();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const isSuperAdmin = authedAdmin?.role === "super_admin";

  const sidebarUser = {
    name: (authedAdmin as any)?.fullName ?? (authedAdmin as any)?.name ?? "Admin",
    role: (isSuperAdmin ? "super_admin" : "admin") as "super_admin" | "admin",
    profilePicture: (authedAdmin as any)?.profilePicture ?? null,
  };

  const styles = useMemo(() => localStyles(colors), [colors]);
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<Administrator[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [filterOpen, setFilterOpen] = useState(false);

  const [viewTarget, setViewTarget] = useState<Administrator | null>(null);
  const [editTarget, setEditTarget] = useState<Administrator | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Administrator | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAdministrators();
      setAdmins(data);
    } catch (e) {
      toast.show("Could not load administrators. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast.show]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadAdmins();
  }, [isSuperAdmin, loadAdmins]);

  const [filtered, setFiltered] = useState<Administrator[]>([]);
  useEffect(() => {
    if (!isSuperAdmin) return;
    let mounted = true;
    adminService
      .searchAdministrators(admins, query)
      .then((res) => {
        if (mounted) setFiltered(res);
      })
      .catch(() => {
        if (mounted) toast.show("Search failed. Please try again.", "error");
      });
    return () => {
      mounted = false;
    };
  }, [query, isSuperAdmin]);

  useEffect(() => {
    setFiltered(admins);
  }, [admins]);

  const roleFiltered = useMemo(() => {
    if (roleFilter === "All") return filtered;
    return filtered.filter((a) => a.role === roleFilter);
  }, [filtered, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: admins.length,
      active: admins.filter((a) => a.status === "Active").length,
      pending: 0,
    };
  }, [admins]);

  const handleGoBack = useCallback(() => {
    try {
      const { router } = require("expo-router");
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/admin/dashboard");
      }
    } catch {
      // no-op
    }
  }, []);

  if (!isSuperAdmin) {
    return (
      <AdminLayout title="Manage Administrators" user={sidebarUser}>
        <AccessDeniedView colors={colors} onGoBack={handleGoBack} />
      </AdminLayout>
    );
  }

  const handleSaveEdit = async (updated: Administrator) => {
    // No try/catch here on purpose — EditAdminModal needs the rejection to
    // reach its own handleSave so it can show "username taken" / "email
    // taken" inline instead of a generic toast. It still shows a generic
    // toast itself for anything that isn't a field-level error.
    const saved = await adminService.updateAdministrator(updated.id, updated);
    setAdmins((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
    setEditTarget(null);
    toast.show("Administrator updated successfully.");
  };

  const handleCreate = async (payload: Partial<Administrator> & { password: string }) => {
    // Same reasoning as handleSaveEdit above — AddAdminModal's handleSubmit
    // catches this to show inline field errors and jump back to step 0.
    const created = await adminService.createAdministrator(payload);
    setAdmins((prev) => [created, ...prev]);
    setAddOpen(false);
    toast.show("Administrator created successfully.");
  };

  const handleDeleteConfirmed = async (id: string) => {
    try {
      await adminService.deleteAdministrator(id);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      setDeleteTarget(null);
      toast.show("Administrator deleted successfully.");
    } catch (e) {
      toast.show("Could not delete this administrator. Please try again.", "error");
    }
  };

  return (
    <AdminLayout title="Manage Administrators" user={sidebarUser}>
      <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Manage Administrators</Text>
            <Text style={styles.pageSubtitle}>
              Create, manage and organize administrator accounts and access.
            </Text>
          </View>
          <Pressable
            style={[styles.primaryButton, isMobile && styles.fullWidthButton]}
            onPress={() => setAddOpen(true)}
          >
            <Ionicons name="add" size={18} color={"#FFFFFF"} />
            <Text style={styles.primaryButtonText}>Add Administrator</Text>
          </Pressable>
        </View>

        <View style={[styles.statsRow, isMobile && styles.statsRowMobile]}>
          <StatCard colors={colors} icon="people" label="Total Administrators" value={stats.total} />
          <StatCard colors={colors} icon="checkmark-circle" label="Active Administrators" value={stats.active} />
          <StatCard colors={colors} icon="mail-unread" label="Pending Invitations" value={stats.pending} />
        </View>

        <View style={[styles.toolbarRow, isMobile && styles.toolbarRowMobile]}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search administrators..."
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={16} color={colors.muted} />
              </Pressable>
            )}
          </View>

          <View style={{ position: "relative" }}>
            <Pressable style={styles.filterButton} onPress={() => setFilterOpen((v) => !v)}>
              <Text style={styles.filterButtonText}>{roleFilter}</Text>
              <Ionicons name="chevron-down" size={16} color={colors.text} />
            </Pressable>
            {filterOpen && (
              <View style={styles.filterDropdown}>
                {FILTER_ROLES.map((r) => (
                  <Pressable
                    key={r}
                    style={styles.filterOption}
                    onPress={() => {
                      setRoleFilter(r);
                      setFilterOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        roleFilter === r && { color: colors.primary, fontWeight: "600" },
                      ]}
                    >
                      {r}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {loading ? (
          <View style={styles.card}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={styles.skeletonRow}>
                <SkeletonBlock colors={colors} width={40} height={40} style={{ borderRadius: 20 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <SkeletonBlock colors={colors} width="60%" height={12} />
                  <SkeletonBlock colors={colors} width="40%" height={10} />
                </View>
                <SkeletonBlock colors={colors} width={70} height={22} style={{ borderRadius: 11 }} />
              </View>
            ))}
          </View>
        ) : roleFiltered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyTitle}>No administrators found.</Text>
            <Text style={styles.emptySubtitle}>
              Create your first administrator to get started.
            </Text>
          </View>
        ) : isMobile ? (
          <View style={{ gap: 12 }}>
            {roleFiltered.map((admin) => (
              <AdminCard
                key={admin.id}
                admin={admin}
                colors={colors}
                onView={() => setViewTarget(admin)}
                onEdit={() => setEditTarget(admin)}
                onDelete={() => setDeleteTarget(admin)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>Administrator</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Department</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Role</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Last Login</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Actions</Text>
            </View>
            {roleFiltered.map((admin) => (
              <View key={admin.id} style={styles.tableRow}>
                <View style={[styles.adminCell, { flex: 2.2 }]}>
                  <Avatar admin={admin} colors={colors} size={36} />
                  <View>
                    <Text style={styles.adminName}>
                      {admin.firstName} {admin.lastName}
                    </Text>
                    <Text style={styles.adminUsername}>@{admin.username}</Text>
                  </View>
                </View>
                <Text style={[styles.tableCellText, { flex: 1.5 }]}>{admin.department || "—"}</Text>
                <View style={{ flex: 1.5 }}>
                  <Badge colors={colors} {...roleBadgeColor(colors, admin.role)} text={admin.role} />
                </View>
                <View style={{ flex: 1 }}>
                  <Badge colors={colors} {...statusColor(colors, admin.status)} text={admin.status} />
                </View>
                <Text style={[styles.tableCellText, { flex: 1.3 }]}>{admin.lastLogin}</Text>
                <View style={[styles.actionsCell, { flex: 1 }]}>
                  <Pressable onPress={() => setViewTarget(admin)} style={styles.iconButton}>
                    <Ionicons name="eye-outline" size={18} color={colors.muted} />
                  </Pressable>
                  <Pressable onPress={() => setEditTarget(admin)} style={styles.iconButton}>
                    <Ionicons name="create-outline" size={18} color={colors.primary} />
                  </Pressable>
                  <Pressable onPress={() => setDeleteTarget(admin)} style={styles.iconButton}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger ?? "#D64545"} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ToastView colors={colors} toast={toast} />

      {viewTarget && (
        <ViewAdminModal admin={viewTarget} colors={colors} isMobile={isMobile} onClose={() => setViewTarget(null)} />
      )}

      {editTarget && (
        <EditAdminModal
          admin={editTarget}
          colors={colors}
          isMobile={isMobile}
          onClose={() => setEditTarget(null)}
          onSave={handleSaveEdit}
        />
      )}

      {deleteTarget && (
        <DeleteAdminModal
          admin={deleteTarget}
          colors={colors}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirmed}
        />
      )}

      {addOpen && (
        <AddAdminModal
          colors={colors}
          isMobile={isMobile}
          canAssignSuperAdmin={isSuperAdmin}
          onClose={() => setAddOpen(false)}
          onCreate={handleCreate}
        />
      )}
      </View>
    </AdminLayout>
  );
}

// ---------------------------------------------------------------------------
// Reusable pieces
// ---------------------------------------------------------------------------

function StatCard({
  colors,
  icon,
  label,
  value,
}: {
  colors: any;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  const styles = localStyles(colors);
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function Avatar({ admin, colors, size = 40 }: { admin: Administrator; colors: any; size?: number }) {
  const styles = localStyles(colors);
  return (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarInitials, { fontSize: size * 0.36 }]}>{initialsOf(admin)}</Text>
    </View>
  );
}

function Badge({ colors, bg, fg, text }: { colors: any; bg: string; fg: string; text: string }) {
  return (
    <View style={{ backgroundColor: bg, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, alignSelf: "flex-start" }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: "600" }}>{text}</Text>
    </View>
  );
}

function AdminCard({
  admin,
  colors,
  onView,
  onEdit,
  onDelete,
}: {
  admin: Administrator;
  colors: any;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const styles = localStyles(colors);
  return (
    <View style={styles.mobileCard}>
      <View style={styles.mobileCardTop}>
        <Avatar admin={admin} colors={colors} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.adminName}>
            {admin.firstName} {admin.lastName}
          </Text>
          <Text style={styles.adminUsername}>@{admin.username}</Text>
        </View>
      </View>
      <View style={styles.mobileBadgeRow}>
        <Badge colors={colors} {...roleBadgeColor(colors, admin.role)} text={admin.role} />
        <Badge colors={colors} {...statusColor(colors, admin.status)} text={admin.status} />
      </View>
      <View style={styles.mobileMetaRow}>
        <Text style={styles.tableCellText}>{admin.department || "No dept"}</Text>
        <Text style={styles.tableCellText}>{admin.lastLogin}</Text>
      </View>
      <View style={styles.mobileActionsRow}>
        <Pressable onPress={onView} style={styles.mobileActionButton}>
          <Ionicons name="eye-outline" size={18} color={colors.muted} />
          <Text style={styles.mobileActionText}>View</Text>
        </Pressable>
        <Pressable onPress={onEdit} style={styles.mobileActionButton}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={[styles.mobileActionText, { color: colors.primary }]}>Edit</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={styles.mobileActionButton}>
          <Ionicons name="trash-outline" size={18} color={colors.danger ?? "#D64545"} />
          <Text style={[styles.mobileActionText, { color: colors.danger ?? "#D64545" }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Modal shell
// ---------------------------------------------------------------------------

function ModalShell({
  colors,
  isMobile,
  visible,
  onClose,
  title,
  children,
  maxWidth = 560,
}: {
  colors: any;
  isMobile: boolean;
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  const styles = localStyles(colors);
  return (
    <Modal visible={visible} animationType={isMobile ? "slide" : "fade"} transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.modalCard,
            isMobile ? styles.modalCardMobile : { maxWidth, width: "92%", maxHeight: "88%" },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FieldLabel({ colors, children }: { colors: any; children: React.ReactNode }) {
  return <Text style={localStyles(colors).fieldLabel}>{children}</Text>;
}

function Input({
  colors,
  ...props
}: React.ComponentProps<typeof TextInput> & { colors: any }) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      style={localStyles(colors).input}
      {...props}
    />
  );
}

function InfoRow({ colors, label, value }: { colors: any; label: string; value: string }) {
  const styles = localStyles(colors);
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// View Administrator modal
// ---------------------------------------------------------------------------

function ViewAdminModal({
  admin,
  colors,
  isMobile,
  onClose,
}: {
  admin: Administrator;
  colors: any;
  isMobile: boolean;
  onClose: () => void;
}) {
  const styles = localStyles(colors);
  return (
    <ModalShell colors={colors} isMobile={isMobile} visible title="Administrator Details" onClose={onClose}>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <Avatar admin={admin} colors={colors} size={72} />
        <Text style={[styles.adminName, { fontSize: 18, marginTop: 10 }]}>
          {admin.firstName} {admin.lastName}
        </Text>
        <Text style={styles.adminUsername}>@{admin.username}</Text>
      </View>
      <InfoRow colors={colors} label="Department" value={admin.department || "—"} />
      <InfoRow colors={colors} label="Role" value={admin.role} />
      <InfoRow colors={colors} label="Email" value={admin.email} />
      <InfoRow colors={colors} label="Phone Number" value={admin.phone} />
      <InfoRow
        colors={colors}
        label="Permissions"
        value={admin.permissions.length ? `${admin.permissions.length} granted` : "None"}
      />
      <InfoRow colors={colors} label="Date Created" value={admin.dateCreated} />
      <InfoRow colors={colors} label="Last Login" value={admin.lastLogin} />
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Status</Text>
        <Badge colors={colors} {...statusColor(colors, admin.status)} text={admin.status} />
      </View>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Edit Administrator modal
// ---------------------------------------------------------------------------

function EditAdminModal({
  admin,
  colors,
  isMobile,
  onClose,
  onSave,
}: {
  admin: Administrator;
  colors: any;
  isMobile: boolean;
  onClose: () => void;
  onSave: (updated: Administrator) => void;
}) {
  const styles = localStyles(colors);
  const [form, setForm] = useState<Administrator>({ ...admin });
  const [saving, setSaving] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string }>({});
  const [formError, setFormError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setFieldErrors({});
    setFormError("");
    try {
      await onSave(form);
    } catch (e) {
      const apiErr = e instanceof ApiError ? e : null;
      const errors: { username?: string; email?: string } = {};
      if (apiErr?.errors?.username) errors.username = apiErr.errors.username[0];
      if (apiErr?.errors?.email) errors.email = apiErr.errors.email[0];
      if (errors.username || errors.email) {
        setFieldErrors(errors);
      } else {
        setFormError(apiErr?.message ?? "Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell colors={colors} isMobile={isMobile} visible title="Edit Administrator" onClose={onClose}>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <Avatar admin={form} colors={colors} size={72} />
      </View>

      <FieldLabel colors={colors}>Full Name</FieldLabel>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Input
          colors={colors}
          style={[styles.input, { flex: 1 }]}
          value={form.firstName}
          onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
          placeholder="First name"
        />
        <Input
          colors={colors}
          style={[styles.input, { flex: 1 }]}
          value={form.lastName}
          onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
          placeholder="Last name"
        />
      </View>

      <FieldLabel colors={colors}>Username</FieldLabel>
      <Input
        colors={colors}
        value={form.username}
        onChangeText={(v) => {
          setForm((f) => ({ ...f, username: v }));
          if (fieldErrors.username) setFieldErrors((f) => ({ ...f, username: undefined }));
        }}
      />
      {!!fieldErrors.username && <Text style={styles.errorText}>{fieldErrors.username}</Text>}

      <FieldLabel colors={colors}>Email</FieldLabel>
      <Input
        colors={colors}
        value={form.email}
        onChangeText={(v) => {
          setForm((f) => ({ ...f, email: v }));
          if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {!!fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}

      <FieldLabel colors={colors}>Phone Number</FieldLabel>
      <Input
        colors={colors}
        value={form.phone}
        onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
        keyboardType="phone-pad"
      />

      <FieldLabel colors={colors}>Department</FieldLabel>
      <Dropdown
        colors={colors}
        open={deptOpen}
        setOpen={setDeptOpen}
        value={form.department || "Select Department"}
        options={DEPARTMENTS}
        onSelect={(v) => setForm((f) => ({ ...f, department: v }))}
      />

      <FieldLabel colors={colors}>Role</FieldLabel>
      <Dropdown
        colors={colors}
        open={roleOpen}
        setOpen={setRoleOpen}
        value={form.role}
        options={ROLES}
        onSelect={(v) => setForm((f) => ({ ...f, role: v as Role }))}
      />

      <FieldLabel colors={colors}>Status</FieldLabel>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
        {(["Active", "Inactive"] as Status[]).map((s) => (
          <Pressable
            key={s}
            onPress={() => setForm((f) => ({ ...f, status: s }))}
            style={[
              styles.statusChip,
              form.status === s && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Text style={[styles.statusChipText, form.status === s && { color: "#FFFFFF" }]}>
              {s}
            </Text>
          </Pressable>
        ))}
      </View>

      {!!formError && <Text style={styles.errorText}>{formError}</Text>}

      <View style={styles.modalFooterRow}>
        <Pressable style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={"#FFFFFF"} size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>Save Changes</Text>
          )}
        </Pressable>
      </View>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Simple dropdown used across modals
// ---------------------------------------------------------------------------

function Dropdown({
  colors,
  open,
  setOpen,
  value,
  options,
  onSelect,
}: {
  colors: any;
  open: boolean;
  setOpen: (v: boolean) => void;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const styles = localStyles(colors);
  return (
    <View style={{ marginBottom: 8 }}>
      <Pressable style={styles.dropdownField} onPress={() => setOpen(!open)}>
        <Text style={styles.dropdownFieldText}>{value}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.text} />
      </Pressable>
      {open && (
        <View style={styles.dropdownList}>
          {options.map((opt) => (
            <Pressable
              key={opt}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(opt);
                setOpen(false);
              }}
            >
              <Text style={[styles.dropdownItemText, opt === value && { color: colors.primary, fontWeight: "600" }]}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Delete Administrator modal
// ---------------------------------------------------------------------------

function DeleteAdminModal({
  admin,
  colors,
  onClose,
  onConfirm,
}: {
  admin: Administrator;
  colors: any;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  const styles = localStyles(colors);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setChecking(true);
    setError("");
    try {
      const ok = await adminService.confirmPassword(password);
      if (!ok) {
        setError("Incorrect password. Please try again.");
        setChecking(false);
        return;
      }
      await onConfirm(admin.id);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { width: "90%", maxWidth: 440 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Delete Administrator</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={{ padding: 20 }}>
            <View style={styles.deleteAdminPreview}>
              <Avatar admin={admin} colors={colors} size={44} />
              <View>
                <Text style={styles.adminName}>
                  {admin.firstName} {admin.lastName}
                </Text>
                <Text style={styles.adminUsername}>@{admin.username}</Text>
              </View>
            </View>
            <Text style={styles.deleteWarning}>
              This action cannot be undone. This will permanently remove this administrator's access.
            </Text>

            <FieldLabel colors={colors}>Enter your password to confirm deletion</FieldLabel>
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError("");
                }}
                secureTextEntry={!showPassword}
                placeholder="Password"
                placeholderTextColor={colors.muted}
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
              </Pressable>
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <View style={styles.modalFooterRow}>
              <Pressable style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.dangerButton,
                  (!password || checking) && { opacity: 0.5 },
                ]}
                disabled={!password || checking}
                onPress={handleDelete}
              >
                {checking ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.dangerButtonText}>Delete Administrator</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Add Administrator modal — multi-step wizard
// ---------------------------------------------------------------------------

const STEP_LABELS = ["Personal Info", "Department", "Role", "Permissions", "Review"];

function AddAdminModal({
  colors,
  isMobile,
  canAssignSuperAdmin,
  onClose,
  onCreate,
}: {
  colors: any;
  isMobile: boolean;
  canAssignSuperAdmin: boolean;
  onClose: () => void;
  onCreate: (payload: Partial<Administrator> & { password: string }) => void;
}) {
  const styles = localStyles(colors);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [deptOpen, setDeptOpen] = useState(false);

  const [role, setRole] = useState<Role>("Administrator");
  const [roleOpen, setRoleOpen] = useState(false);

  const [permissions, setPermissions] = useState<Set<string>>(new Set());

  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string }>({});
  const [submitError, setSubmitError] = useState("");
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const togglePermission = (key: string) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const canGoNextFromPersonal =
    firstName.trim() && lastName.trim() && username.trim() && email.trim() && password.trim().length >= 8;

  const handleNextFromPersonal = async () => {
    setFieldErrors({});
    setCheckingAvailability(true);
    try {
      const result = await adminService.checkAvailability(username, email);
      const errors: { username?: string; email?: string } = {};
      if (result.usernameTaken) errors.username = "This username is already taken.";
      if (result.emailTaken) errors.email = "This email is already in use.";
      if (errors.username || errors.email) {
        setFieldErrors(errors);
        return;
      }
      setStep((s) => s + 1);
    } catch {
      // Don't block navigation on a network hiccup — final submit still
      // catches a real duplicate via the backend's unique validation.
      setStep((s) => s + 1);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFieldErrors({});
    setSubmitError("");
    try {
      await onCreate({
        firstName,
        lastName,
        username,
        email,
        phone,
        department,
        role,
        permissions: Array.from(permissions),
        password,
      });
    } catch (e) {
      const apiErr = e instanceof ApiError ? e : null;
      const errors: { username?: string; email?: string } = {};
      if (apiErr?.errors?.username) errors.username = apiErr.errors.username[0];
      if (apiErr?.errors?.email) errors.email = apiErr.errors.email[0];
      if (errors.username || errors.email) {
        setFieldErrors(errors);
        setStep(0);
      } else {
        setSubmitError(apiErr?.message ?? "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const tempAdmin: Administrator = {
    id: "",
    firstName,
    lastName,
    username,
    email,
    phone,
    department,
    role,
    status: "Active",
    lastLogin: "",
    dateCreated: "",
    permissions: Array.from(permissions),
  };

  return (
    <ModalShell colors={colors} isMobile={isMobile} visible title="Add Administrator" onClose={onClose} maxWidth={640}>
      <View style={styles.stepRow}>
        {STEP_LABELS.map((label, idx) => (
          <View key={label} style={{ alignItems: "center", flex: 1 }}>
            <View style={[styles.stepDot, idx <= step && { backgroundColor: colors.primary }]}>
              {idx < step ? (
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              ) : (
                <Text style={[styles.stepDotText, idx <= step && { color: "#FFFFFF" }]}>{idx + 1}</Text>
              )}
            </View>
            {!isMobile && <Text style={styles.stepLabel}>{label}</Text>}
          </View>
        ))}
      </View>

      {/* Step 1: Personal Info */}
      {step === 0 && (
        <View>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Avatar admin={tempAdmin} colors={colors} size={84} />
          </View>

          <View style={isMobile ? undefined : { flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel colors={colors}>First Name</FieldLabel>
              <Input colors={colors} value={firstName} onChangeText={setFirstName} placeholder="e.g. John" />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel colors={colors}>Last Name</FieldLabel>
              <Input colors={colors} value={lastName} onChangeText={setLastName} placeholder="e.g. Peter" />
            </View>
          </View>

          <FieldLabel colors={colors}>Username</FieldLabel>
          <Input
            colors={colors}
            value={username}
            onChangeText={(v) => {
              setUsername(v);
              if (fieldErrors.username) setFieldErrors((f) => ({ ...f, username: undefined }));
            }}
            placeholder="e.g. jpeter"
            autoCapitalize="none"
          />
          {!!fieldErrors.username && <Text style={styles.errorText}>{fieldErrors.username}</Text>}

          <FieldLabel colors={colors}>Email</FieldLabel>
          <Input
            colors={colors}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
            }}
            placeholder="name@kayora.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {!!fieldErrors.email && <Text style={styles.errorText}>{fieldErrors.email}</Text>}

          <FieldLabel colors={colors}>Phone Number</FieldLabel>
          <Input colors={colors} value={phone} onChangeText={setPhone} placeholder="+234 800 000 0000" keyboardType="phone-pad" />

          <FieldLabel colors={colors}>Temporary Password</FieldLabel>
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="At least 8 characters"
              placeholderTextColor={colors.muted}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
            </Pressable>
          </View>
          <Text style={styles.helperText}>
            The new administrator can change this after their first login.
          </Text>
        </View>
      )}

      {/* Step 2: Department */}
      {step === 1 && (
        <View>
          <FieldLabel colors={colors}>Department</FieldLabel>
          <Dropdown
            colors={colors}
            open={deptOpen}
            setOpen={setDeptOpen}
            value={department}
            options={DEPARTMENTS}
            onSelect={setDepartment}
          />
          <Text style={styles.helperText}>
            Select the organizational department this administrator belongs to.
          </Text>
        </View>
      )}

      {/* Step 3: Role */}
      {step === 2 && (
        <View>
          <FieldLabel colors={colors}>Role</FieldLabel>
          <Dropdown
            colors={colors}
            open={roleOpen}
            setOpen={setRoleOpen}
            value={role}
            options={canAssignSuperAdmin ? ROLES : ROLES.filter((r) => r !== "Super Administrator")}
            onSelect={(v) => setRole(v as Role)}
          />
          {!canAssignSuperAdmin && (
            <Text style={styles.helperText}>
              Only a Super Administrator can assign another Super Administrator.
            </Text>
          )}
        </View>
      )}

      {/* Step 4: Permissions */}
      {step === 3 && (
        <View>
          {role === "Super Administrator" ? (
            PERMISSION_GROUPS.map((group) => (
              <View key={group.key} style={{ marginBottom: 14 }}>
                <Text style={styles.permissionGroupTitle}>{group.label}</Text>
                {group.permissions.map((perm) => {
                  const checked = permissions.has(perm.key);
                  return (
                    <Pressable
                      key={perm.key}
                      style={styles.checkboxRow}
                      onPress={() => togglePermission(perm.key)}
                    >
                      <View style={[styles.checkbox, checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                        {checked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                      </View>
                      <Text style={styles.checkboxLabel}>{perm.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))
          ) : (
            <Text style={styles.helperText}>
              Detailed permission selection is only available for the Super Administrator role.
              Standard role-based permissions will apply automatically.
            </Text>
          )}
        </View>
      )}

      {/* Step 5: Review */}
      {step === 4 && (
        <View>
          <InfoRow colors={colors} label="Name" value={`${firstName} ${lastName}`} />
          <InfoRow colors={colors} label="Username" value={`@${username}`} />
          <InfoRow colors={colors} label="Email" value={email} />
          <InfoRow colors={colors} label="Phone Number" value={phone || "—"} />
          <InfoRow colors={colors} label="Department" value={department} />
          <InfoRow colors={colors} label="Role" value={role} />
          <InfoRow
            colors={colors}
            label="Permissions"
            value={role === "Super Administrator" ? `${permissions.size} selected` : "Role default"}
          />
          {!!submitError && <Text style={styles.errorText}>{submitError}</Text>}
        </View>
      )}

      <View style={styles.modalFooterRow}>
        {step > 0 ? (
          <Pressable style={styles.secondaryButton} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        )}

        {step < 4 ? (
          <Pressable
            style={[styles.primaryButton, step === 0 && !canGoNextFromPersonal && { opacity: 0.5 }]}
            disabled={(step === 0 && !canGoNextFromPersonal) || checkingAvailability}
            onPress={() => (step === 0 ? handleNextFromPersonal() : setStep((s) => s + 1))}
          >
            {checkingAvailability ? (
              <ActivityIndicator color={"#FFFFFF"} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Next</Text>
            )}
          </Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={"#FFFFFF"} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Create Administrator</Text>
            )}
          </Pressable>
        )}
      </View>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function localStyles(colors: any) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background ?? "#F5F7FA" },
    scrollContent: { padding: 20, paddingBottom: 40, gap: 16 },

    headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 16 },
    headerRowMobile: { flexDirection: "column" },
    pageTitle: { fontSize: 22, fontWeight: "700", color: colors.text ?? "#101828" },
    pageSubtitle: { fontSize: 13, color: colors.muted, marginTop: 4 },

    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary ?? "#0D4A8C",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      justifyContent: "center",
    },
    primaryButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
    fullWidthButton: { width: "100%" },

    secondaryButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryButtonText: { color: colors.text ?? "#101828", fontWeight: "600", fontSize: 14 },

    dangerButton: {
      backgroundColor: colors.danger ?? "#D64545",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    dangerButtonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },

    statsRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
    statsRowMobile: { flexDirection: "column" },
    statCard: {
      flex: 1,
      minWidth: 160,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
    },
    statIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primary + "1A",
      alignItems: "center",
      justifyContent: "center",
    },
    statValue: { fontSize: 20, fontWeight: "700", color: colors.text ?? "#101828" },
    statLabel: { fontSize: 12, color: colors.muted },

    toolbarRow: { flexDirection: "row", gap: 12, zIndex: 10 },
    toolbarRowMobile: { flexDirection: "column" },
    searchBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      paddingHorizontal: 12,
      height: 44,
    },
    searchInput: { flex: 1, color: colors.text ?? "#101828", fontSize: 14 },

    filterButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 44,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      backgroundColor: colors.card,
    },
    filterButtonText: { color: colors.text ?? "#101828", fontSize: 14, fontWeight: "500" },
    filterDropdown: {
      position: "absolute",
      top: 48,
      right: 0,
      minWidth: 200,
      backgroundColor: colors.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      paddingVertical: 6,
      zIndex: 20,
      elevation: 6,
    },
    filterOption: { paddingVertical: 10, paddingHorizontal: 14 },
    filterOptionText: { fontSize: 13, color: colors.text ?? "#101828" },

    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      overflow: "hidden",
    },
    tableHeaderRow: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.border + "40",
      borderBottomWidth: 1,
      borderBottomColor: colors.border ?? "#E2E5EA",
    },
    tableHeaderCell: { fontSize: 12, fontWeight: "600", color: colors.muted },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border ?? "#EEF0F3",
    },
    adminCell: { flexDirection: "row", alignItems: "center", gap: 10 },
    adminName: { fontSize: 14, fontWeight: "600", color: colors.text ?? "#101828" },
    adminUsername: { fontSize: 12, color: colors.muted },
    tableCellText: { fontSize: 13, color: colors.text ?? "#101828" },
    actionsCell: { flexDirection: "row", justifyContent: "flex-end", gap: 4 },
    iconButton: { padding: 6 },

    skeletonRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border ?? "#EEF0F3" },

    emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 56, gap: 8 },
    emptyTitle: { fontSize: 15, fontWeight: "600", color: colors.text ?? "#101828" },
    emptySubtitle: { fontSize: 13, color: colors.muted },

    mobileCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      padding: 14,
      gap: 10,
    },
    mobileCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    mobileBadgeRow: { flexDirection: "row", gap: 8 },
    mobileMetaRow: { flexDirection: "row", justifyContent: "space-between" },
    mobileActionsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      borderTopWidth: 1,
      borderTopColor: colors.border ?? "#EEF0F3",
      paddingTop: 10,
    },
    mobileActionButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 10 },
    mobileActionText: { fontSize: 13, color: colors.muted, fontWeight: "600" },

    avatarFallback: {
      backgroundColor: colors.primary + "1A",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitials: { color: colors.primary ?? "#0D4A8C", fontWeight: "700" },

    modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", alignItems: "center", justifyContent: "center" },
    modalCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      overflow: "hidden",
    },
    modalCardMobile: { width: "100%", height: "100%", borderRadius: 0 },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border ?? "#E2E5EA",
    },
    modalTitle: { fontSize: 16, fontWeight: "700", color: colors.text ?? "#101828" },
    modalFooterRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 },

    fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.text ?? "#101828", marginBottom: 6, marginTop: 10 },
    input: {
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text ?? "#101828",
      marginBottom: 4,
      backgroundColor: colors.background ?? "#FAFBFC",
    },

    dropdownField: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.background ?? "#FAFBFC",
    },
    dropdownFieldText: { fontSize: 14, color: colors.text ?? "#101828" },
    dropdownList: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      borderRadius: 10,
      backgroundColor: colors.card,
      maxHeight: 220,
    },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: 14 },
    dropdownItemText: { fontSize: 14, color: colors.text ?? "#101828" },

    statusChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
    },
    statusChipText: { fontSize: 13, color: colors.text ?? "#101828", fontWeight: "500" },

    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border ?? "#EEF0F3",
    },
    infoLabel: { fontSize: 13, color: colors.muted },
    infoValue: { fontSize: 13, color: colors.text ?? "#101828", fontWeight: "600" },

    deleteAdminPreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.border + "40",
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    deleteWarning: { fontSize: 13, color: colors.muted, marginBottom: 14, lineHeight: 18 },
    passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    eyeButton: { padding: 8 },
    errorText: { color: colors.danger ?? "#D64545", fontSize: 12, marginTop: 4 },

    stepRow: { flexDirection: "row", marginBottom: 18 },
    stepDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.border ?? "#E2E5EA",
      alignItems: "center",
      justifyContent: "center",
    },
    stepDotText: { fontSize: 12, fontWeight: "700", color: colors.muted },
    stepLabel: { fontSize: 10, color: colors.muted, marginTop: 4, textAlign: "center" },

    permissionGroupTitle: { fontSize: 13, fontWeight: "700", color: colors.text ?? "#101828", marginBottom: 8 },
    checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: colors.border ?? "#C5CAD3",
      alignItems: "center",
      justifyContent: "center",
    },
    checkboxLabel: { fontSize: 13, color: colors.text ?? "#101828" },
    helperText: { fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 17 },

    centerFill: { flex: 1, alignItems: "center", justifyContent: "center" },
    lockCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: colors.primary + "1A",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },
    deniedTitle: { fontSize: 20, fontWeight: "700", color: colors.text ?? "#101828", marginBottom: 6 },
    deniedSubtitle: { fontSize: 14, color: colors.muted, marginBottom: 24, textAlign: "center" },

    toast: {
      position: "absolute",
      top: 16,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      elevation: 6,
    },
    toastText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  });
}