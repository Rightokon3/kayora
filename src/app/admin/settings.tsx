import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Switch,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { useTheme, ThemeMode } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { AdminSettingsService } from "../../services/adminSettingsDemo";
import {
  AdminProfile,
  NotificationPreferences,
  SystemInfo,
} from "../../types/AdminSettings";
import { ImageUploader } from "../../components/products/ImageUploader";
import { Toast, ToastState } from "../../components/products/Toast";

/* ============================================================
   HELPERS
============================================================ */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function roleLabel(role: "super_admin" | "admin") {
  return role === "super_admin" ? "Super Administrator" : "Administrator";
}

function passwordStrength(password: string): { score: number; label: string; color: "danger" | "warning" | "success" } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "danger" };
  if (score <= 3) return { score: 2, label: "Medium", color: "warning" };
  return { score: 3, label: "Strong", color: "success" };
}

/* ============================================================
   SECTION CARD — matches the card language used across every
   other admin page (chartCard/listCard/sectionCard patterns)
============================================================ */
function SettingsCard({
  palette,
  title,
  subtitle,
  delay = 0,
  children,
}: {
  palette: any;
  title: string;
  subtitle?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(delay)}
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      <Text style={[styles.cardTitle, { color: palette.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.cardSubtitle, { color: palette.muted }]}>{subtitle}</Text>}
      <View style={{ marginTop: 18 }}>{children}</View>
    </Animated.View>
  );
}

function InfoRow({ label, value, palette, isLast }: { label: string; value: string; palette: any; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
      <Text style={[styles.infoLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: palette.text }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function ToggleRow({
  palette,
  title,
  subtitle,
  value,
  onChange,
  isLast,
}: {
  palette: any;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.toggleRow, !isLast && { borderBottomWidth: 1, borderBottomColor: palette.border }]}>
      <View style={{ flex: 1, marginRight: 14 }}>
        <Text style={[styles.toggleTitle, { color: palette.text }]}>{title}</Text>
        <Text style={[styles.toggleSubtitle, { color: palette.muted }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: palette.border, true: palette.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function ModalField({ label, palette, error, children }: { label: string; palette: any; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
      {children}
      {error && <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>}
    </View>
  );
}

/* ============================================================
   EDIT PROFILE MODAL
============================================================ */
function EditProfileModal({
  visible,
  palette,
  profile,
  onClose,
  onSaved,
}: {
  visible: boolean;
  palette: any;
  profile: AdminProfile | null;
  onClose: () => void;
  onSaved: (updated: AdminProfile) => void;
}) {
  const [picture, setPicture] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && profile) {
      setPicture(profile.profilePicture);
      setUsername(profile.username);
      setFullName(profile.fullName);
      setEmail(profile.email);
      setPhone(profile.phone);
    }
  }, [visible, profile]);

  if (!visible) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await AdminSettingsService.updateProfile({
        profilePicture: picture,
        username,
        fullName,
        email,
        phone,
      });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={styles.absoluteFill}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View entering={ZoomIn.duration(240)} style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Edit Profile</Text>
              <Pressable onPress={onClose} hitSlop={10} style={[styles.closeButton, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="close" size={18} color={palette.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <ModalField label="Profile Picture" palette={palette}>
                <ImageUploader palette={palette} imageUri={picture} onChange={setPicture} />
              </ModalField>

              <ModalField label="Username" palette={palette}>
                <TextInput
                  style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholderTextColor={palette.muted}
                />
              </ModalField>

              <ModalField label="Full Name" palette={palette}>
                <TextInput
                  style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholderTextColor={palette.muted}
                />
              </ModalField>

              <ModalField label="Email" palette={palette}>
                <TextInput
                  style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={palette.muted}
                />
              </ModalField>

              <ModalField label="Phone" palette={palette}>
                <TextInput
                  style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor={palette.muted}
                />
              </ModalField>

              <View style={styles.modalButtonsRow}>
                <Pressable onPress={onClose} disabled={saving} style={[styles.cancelButton, { borderColor: palette.border }]}>
                  <Text style={[styles.cancelButtonText, { color: palette.text }]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSave} disabled={saving} style={[styles.saveButton, { backgroundColor: palette.primary }]}>
                  {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

/* ============================================================
   CHANGE PASSWORD MODAL
============================================================ */
function ChangePasswordModal({
  visible,
  palette,
  onClose,
  onSaved,
}: {
  visible: boolean;
  palette: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
    }
  }, [visible]);

  if (!visible) return null;

  const strength = newPassword ? passwordStrength(newPassword) : null;

  const handleSave = async () => {
    setError(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in every field.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await AdminSettingsService.updatePassword({ currentPassword, newPassword, confirmPassword });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={styles.absoluteFill}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View entering={ZoomIn.duration(240)} style={[styles.modalCard, styles.modalCardNarrow, { backgroundColor: palette.card }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Change Password</Text>
              <Pressable onPress={onClose} hitSlop={10} style={[styles.closeButton, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="close" size={18} color={palette.text} />
              </Pressable>
            </View>

            <ModalField label="Current Password" palette={palette}>
              <TextInput
                style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor={palette.muted}
              />
            </ModalField>

            <ModalField label="New Password" palette={palette}>
              <TextInput
                style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor={palette.muted}
              />
              {strength && (
                <View style={styles.strengthWrap}>
                  <View style={[styles.strengthTrack, { backgroundColor: palette.border }]}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${(strength.score / 3) * 100}%`,
                          backgroundColor: palette[strength.color],
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: palette[strength.color] }]}>{strength.label}</Text>
                </View>
              )}
            </ModalField>

            <ModalField label="Confirm New Password" palette={palette} error={error ?? undefined}>
              <TextInput
                style={[
                  styles.input,
                  { color: palette.text, borderColor: error ? palette.danger : palette.border, backgroundColor: palette.background },
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor={palette.muted}
              />
            </ModalField>

            <View style={styles.modalButtonsRow}>
              <Pressable onPress={onClose} disabled={saving} style={[styles.cancelButton, { borderColor: palette.border }]}>
                <Text style={[styles.cancelButtonText, { color: palette.text }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} style={[styles.saveButton, { backgroundColor: palette.primary }]}>
                {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveButtonText}>Save Password</Text>}
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

/* ============================================================
   CHANGE USERNAME MODAL
============================================================ */
function ChangeUsernameModal({
  visible,
  palette,
  currentUsername,
  onClose,
  onSaved,
}: {
  visible: boolean;
  palette: any;
  currentUsername: string;
  onClose: () => void;
  onSaved: (updated: AdminProfile) => void;
}) {
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setNewUsername("");
      setCurrentPassword("");
      setError(null);
    }
  }, [visible]);

  if (!visible) return null;

  const handleSave = async () => {
    setError(null);
    if (!newUsername.trim()) {
      setError("Please enter a new username.");
      return;
    }
    if (!currentPassword) {
      setError("Please confirm your current password.");
      return;
    }
    setSaving(true);
    try {
      const updated = await AdminSettingsService.updateUsername({ newUsername: newUsername.trim(), currentPassword });
      onSaved(updated);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={styles.absoluteFill}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View entering={ZoomIn.duration(240)} style={[styles.modalCard, styles.modalCardNarrow, { backgroundColor: palette.card }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Change Username</Text>
              <Pressable onPress={onClose} hitSlop={10} style={[styles.closeButton, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="close" size={18} color={palette.text} />
              </Pressable>
            </View>

            <Text style={[styles.currentValueText, { color: palette.muted }]}>Current username: {currentUsername}</Text>

            <ModalField label="New Username" palette={palette}>
              <TextInput
                style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                value={newUsername}
                onChangeText={setNewUsername}
                autoCapitalize="none"
                placeholderTextColor={palette.muted}
              />
            </ModalField>

            <ModalField label="Confirm Current Password" palette={palette} error={error ?? undefined}>
              <TextInput
                style={[
                  styles.input,
                  { color: palette.text, borderColor: error ? palette.danger : palette.border, backgroundColor: palette.background },
                ]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
                placeholderTextColor={palette.muted}
              />
            </ModalField>

            <View style={styles.modalButtonsRow}>
              <Pressable onPress={onClose} disabled={saving} style={[styles.cancelButton, { borderColor: palette.border }]}>
                <Text style={[styles.cancelButtonText, { color: palette.text }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={handleSave} disabled={saving} style={[styles.saveButton, { backgroundColor: palette.primary }]}>
                {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveButtonText}>Save Username</Text>}
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

/* ============================================================
   SIGN OUT CONFIRM MODAL
============================================================ */
function SignOutConfirmModal({
  visible,
  palette,
  loading,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  palette: any;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onCancel}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={styles.absoluteFill}>
        <View style={styles.overlay}>
          <Animated.View entering={ZoomIn.duration(220)} style={[styles.confirmCard, { backgroundColor: palette.card }]}>
            <View style={[styles.confirmIconCircle, { backgroundColor: palette.danger + "1A" }]}>
              <Ionicons name="log-out-outline" size={26} color={palette.danger} />
            </View>
            <Text style={[styles.modalTitle, { color: palette.text, textAlign: "center" }]}>Sign Out</Text>
            <Text style={[styles.confirmMessage, { color: palette.muted }]}>Are you sure you want to sign out?</Text>
            <View style={styles.modalButtonsRow}>
              <Pressable onPress={onCancel} disabled={loading} style={[styles.cancelButton, { borderColor: palette.border }]}>
                <Text style={[styles.cancelButtonText, { color: palette.text }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onConfirm} disabled={loading} style={[styles.saveButton, { backgroundColor: palette.danger }]}>
                {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveButtonText}>Sign Out</Text>}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </BlurView>
    </Modal>
  );
}

/* ============================================================
   MAIN SETTINGS SCREEN
============================================================ */
export default function SettingsScreen() {
  const { palette, themeMode, setThemeMode } = useTheme() as {
    palette: any;
    themeMode: ThemeMode;
    setThemeMode: (mode: ThemeMode) => void;
  };
  const { isDesktop, isTablet } = useResponsive();
  const twoColumn = isDesktop || isTablet;
  const { signOut } = useAdminAuth();

  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [changeUsernameVisible, setChangeUsernameVisible] = useState(false);
  const [signOutVisible, setSignOutVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, variant: "success" | "error" = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, variant });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [profileData, notifData, sysData] = await Promise.all([
        AdminSettingsService.getProfile(),
        AdminSettingsService.getNotificationPreferences(),
        AdminSettingsService.getSystemInfo(),
      ]);
      setProfile(profileData);
      setNotifications(notifData);
      setSystemInfo(sysData);
      setLoading(false);
    })();
  }, []);

  const handleNotificationToggle = useCallback(
    async (key: keyof NotificationPreferences, value: boolean) => {
      setNotifications((prev) => (prev ? { ...prev, [key]: value } : prev));
      try {
        await AdminSettingsService.updateNotificationPreference(key, value);
      } catch (e) {
        // Revert on failure
        setNotifications((prev) => (prev ? { ...prev, [key]: !value } : prev));
        showToast("Could not update notification preference.", "error");
      }
    },
    [showToast]
  );

  const handleThemeSelect = useCallback(
    (mode: ThemeMode) => {
      if (typeof setThemeMode === "function") {
        setThemeMode(mode);
      }
    },
    [setThemeMode]
  );

  const handleSignOutConfirm = useCallback(async () => {
    setSigningOut(true);
    try {
      await signOut();
      // AdminLayout's own guard (reading AdminAuthContext.status) handles
      // the redirect back to /admin/login the moment status flips to
      // "guest" — no manual navigation needed here.
    } finally {
      setSigningOut(false);
      setSignOutVisible(false);
    }
  }, [signOut]);

  if (loading || !profile || !notifications || !systemInfo) {
    return (
      <AdminLayout title="Settings">
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={palette.primary} />
        </View>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings">
      <Text style={[styles.pageTitle, { color: palette.text }]}>Settings</Text>
      <Text style={[styles.pageSubtitle, { color: palette.muted }]}>
        Manage your administrator account and application preferences
      </Text>

      {/* ---------- SECTION 1: PROFILE ---------- */}
      <SettingsCard palette={palette} title="Profile Information" subtitle="Manage your administrator account." delay={0}>
        <View style={styles.profileTopRow}>
          {profile.profilePicture ? (
            <Animated.Image source={{ uri: profile.profilePicture }} style={[styles.avatar, { borderColor: palette.border }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: palette.primary, borderColor: palette.border }]}>
              <Text style={styles.avatarFallbackText}>{profile.fullName.trim().charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={[styles.profileName, { color: palette.text }]}>{profile.fullName}</Text>
            <Text style={[styles.profileUsername, { color: palette.muted }]}>@{profile.username}</Text>
            <View style={[styles.roleBadge, { backgroundColor: palette.primary + "1A" }]}>
              <Text style={[styles.roleBadgeText, { color: palette.primary }]}>{roleLabel(profile.role)}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <InfoRow label="Email" value={profile.email} palette={palette} />
          <InfoRow label="Phone Number" value={profile.phone} palette={palette} />
          <InfoRow label="Administrator Role" value={roleLabel(profile.role)} palette={palette} />
          <InfoRow label="Date Account Created" value={formatDate(profile.createdAt)} palette={palette} isLast />
        </View>

        <Pressable
          onPress={() => setEditProfileVisible(true)}
          style={[styles.editProfileButton, { borderColor: palette.border }]}
        >
          <Ionicons name="create-outline" size={16} color={palette.text} />
          <Text style={[styles.editProfileButtonText, { color: palette.text }]}>Edit Profile</Text>
        </Pressable>
      </SettingsCard>

      {/* ---------- SECTION 2 & 3: SECURITY + APPEARANCE (two-column on desktop) ---------- */}
      <View style={[styles.twoColRow, !twoColumn && { flexDirection: "column" }]}>
        <View style={{ flex: 1 }}>
          <SettingsCard palette={palette} title="Security Options" delay={60}>
            <Pressable
              onPress={() => setChangeUsernameVisible(true)}
              style={[styles.securityRow, { borderBottomWidth: 1, borderBottomColor: palette.border }]}
            >
              <View style={[styles.securityIconWrap, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="at-outline" size={17} color={palette.primary} />
              </View>
              <Text style={[styles.securityLabel, { color: palette.text }]}>Change Username</Text>
              <Ionicons name="chevron-forward" size={16} color={palette.muted} />
            </Pressable>
            <Pressable onPress={() => setChangePasswordVisible(true)} style={styles.securityRow}>
              <View style={[styles.securityIconWrap, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="lock-closed-outline" size={17} color={palette.primary} />
              </View>
              <Text style={[styles.securityLabel, { color: palette.text }]}>Change Password</Text>
              <Ionicons name="chevron-forward" size={16} color={palette.muted} />
            </Pressable>
          </SettingsCard>
        </View>

        <View style={{ flex: 1 }}>
          <SettingsCard palette={palette} title="Appearance" subtitle="Customize the administrator interface." delay={100}>
            <View style={[styles.themeSelectorWrap, { backgroundColor: palette.pillBg }]}>
              {(["light", "dark", "system"] as ThemeMode[]).map((mode) => {
                const isActive = mode === themeMode;
                const label = mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System (Default)";
                const icon = mode === "light" ? "sunny-outline" : mode === "dark" ? "moon-outline" : "phone-portrait-outline";
                return (
                  <Pressable
                    key={mode}
                    onPress={() => handleThemeSelect(mode)}
                    style={[styles.themeOption, isActive && { backgroundColor: palette.card }]}
                  >
                    <Ionicons name={icon as any} size={16} color={isActive ? palette.primary : palette.muted} />
                    <Text style={[styles.themeOptionText, { color: isActive ? palette.text : palette.muted, fontWeight: isActive ? "800" : "600" }]}>
                      {label}
                    </Text>
                    {isActive && <Ionicons name="checkmark-circle" size={16} color={palette.primary} />}
                  </Pressable>
                );
              })}
            </View>
          </SettingsCard>
        </View>
      </View>

      {/* ---------- SECTION 4: NOTIFICATIONS ---------- */}
      <SettingsCard palette={palette} title="Notifications" delay={140}>
        <ToggleRow
          palette={palette}
          title="Receive System Notifications"
          subtitle="General platform alerts and updates."
          value={notifications.systemNotifications}
          onChange={(v) => handleNotificationToggle("systemNotifications", v)}
        />
        <ToggleRow
          palette={palette}
          title="Receive New Order Notifications"
          subtitle="Get notified the moment a customer places an order."
          value={notifications.newOrderNotifications}
          onChange={(v) => handleNotificationToggle("newOrderNotifications", v)}
        />
        <ToggleRow
          palette={palette}
          title="Receive Driver Alerts"
          subtitle="Driver status changes, delays, and issues."
          value={notifications.driverAlerts}
          onChange={(v) => handleNotificationToggle("driverAlerts", v)}
        />
        <ToggleRow
          palette={palette}
          title="Receive Customer Reports"
          subtitle="Weekly summaries of customer activity."
          value={notifications.customerReports}
          onChange={(v) => handleNotificationToggle("customerReports", v)}
          isLast
        />
      </SettingsCard>

      {/* ---------- SECTION 5: ABOUT ---------- */}
      <SettingsCard palette={palette} title="About" delay={180}>
        <InfoRow label="App Version" value={systemInfo.appVersion} palette={palette} />
        <InfoRow label="Build Number" value={systemInfo.buildNumber} palette={palette} />
        <InfoRow label="Laravel API Status" value={systemInfo.apiStatus} palette={palette} />
        <InfoRow label="Database Connection" value={systemInfo.databaseStatus} palette={palette} />
        <InfoRow label="Last Sync Time" value={formatDateTime(systemInfo.lastSyncTime)} palette={palette} />
        <InfoRow label="Company Name" value={systemInfo.companyName} palette={palette} />
        <InfoRow label="Copyright" value={`© ${systemInfo.copyrightYear} ${systemInfo.companyName}`} palette={palette} isLast />
      </SettingsCard>

      {/* ---------- SECTION 6: DANGER ZONE ---------- */}
      <Animated.View
        entering={FadeInDown.duration(420).delay(220)}
        style={[styles.dangerCard, { backgroundColor: palette.danger + "0D", borderColor: palette.danger + "33" }]}
      >
        <Text style={[styles.cardTitle, { color: palette.text }]}>Danger Zone</Text>
        <Text style={[styles.cardSubtitle, { color: palette.muted }]}>Use these actions carefully.</Text>
        <Pressable
          onPress={() => setSignOutVisible(true)}
          style={[styles.signOutButton, { backgroundColor: palette.danger }]}
        >
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </Pressable>
      </Animated.View>

      <View style={{ height: 24 }} />

      <EditProfileModal
        visible={editProfileVisible}
        palette={palette}
        profile={profile}
        onClose={() => setEditProfileVisible(false)}
        onSaved={(updated) => {
          setProfile(updated);
          setEditProfileVisible(false);
          showToast("Profile updated successfully", "success");
        }}
      />

      <ChangePasswordModal
        visible={changePasswordVisible}
        palette={palette}
        onClose={() => setChangePasswordVisible(false)}
        onSaved={() => {
          setChangePasswordVisible(false);
          showToast("Password updated successfully", "success");
        }}
      />

      <ChangeUsernameModal
        visible={changeUsernameVisible}
        palette={palette}
        currentUsername={profile.username}
        onClose={() => setChangeUsernameVisible(false)}
        onSaved={(updated) => {
          setProfile(updated);
          setChangeUsernameVisible(false);
          showToast("Username updated successfully", "success");
        }}
      />

      <SignOutConfirmModal
        visible={signOutVisible}
        palette={palette}
        loading={signingOut}
        onCancel={() => setSignOutVisible(false)}
        onConfirm={handleSignOutConfirm}
      />

      <Toast toast={toast} palette={palette} />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 100, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 26, fontWeight: "800" },
  pageSubtitle: { fontSize: 13.5, marginTop: 6, marginBottom: 22 },

  card: { borderWidth: 1, borderRadius: 20, padding: 22, marginBottom: 18 },
  cardTitle: { fontSize: 17, fontWeight: "800" },
  cardSubtitle: { fontSize: 12.5, marginTop: 4 },

  twoColRow: { flexDirection: "row", gap: 18 },

  /* Profile */
  profileTopRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 1 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { color: "#FFFFFF", fontSize: 32, fontWeight: "800" },
  profileName: { fontSize: 18, fontWeight: "800" },
  profileUsername: { fontSize: 13, marginTop: 3 },
  roleBadge: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  roleBadgeText: { fontSize: 11, fontWeight: "800" },

  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, gap: 12 },
  infoLabel: { fontSize: 12.5, fontWeight: "600" },
  infoValue: { fontSize: 13, fontWeight: "700", flexShrink: 1, textAlign: "right" },

  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
  },
  editProfileButtonText: { fontSize: 13.5, fontWeight: "700" },

  /* Security */
  securityRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 12 },
  securityIconWrap: { width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  securityLabel: { flex: 1, fontSize: 13.5, fontWeight: "700" },

  /* Appearance */
  themeSelectorWrap: { borderRadius: 14, padding: 6, gap: 4 },
  themeOption: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10 },
  themeOptionText: { flex: 1, fontSize: 13.5 },

  /* Notifications */
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 14 },
  toggleTitle: { fontSize: 14, fontWeight: "700" },
  toggleSubtitle: { fontSize: 12, marginTop: 3, lineHeight: 16 },

  /* Danger Zone */
  dangerCard: { borderWidth: 1, borderRadius: 20, padding: 22, marginBottom: 16 },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
    marginTop: 18,
  },
  signOutButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },

  /* Modals (shared) */
  absoluteFill: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  modalCard: { width: "100%", maxWidth: 480, maxHeight: "88%", borderRadius: 24, padding: 22 },
  modalCardNarrow: { maxWidth: 420 },
  modalHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  fieldLabel: { fontSize: 12.5, fontWeight: "700", marginBottom: 8 },
  errorText: { fontSize: 11.5, fontWeight: "600", marginTop: 6 },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 14 },
  currentValueText: { fontSize: 12.5, marginBottom: 16 },

  strengthWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  strengthTrack: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  strengthFill: { height: "100%", borderRadius: 3 },
  strengthLabel: { fontSize: 11.5, fontWeight: "800" },

  modalButtonsRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cancelButtonText: { fontSize: 14, fontWeight: "700" },
  saveButton: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  confirmCard: { width: "100%", maxWidth: 360, borderRadius: 22, padding: 24, alignItems: "center" },
  confirmIconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  confirmMessage: { fontSize: 13.5, textAlign: "center", lineHeight: 19, marginBottom: 22, marginTop: 8 },
});