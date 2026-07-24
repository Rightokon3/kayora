import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Appearance,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Animated, {
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn,
} from "react-native-reanimated";
import { adminApiFetch, ApiError, saveAdminSession } from "../../services/adminApi";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { AdminRole, PERMISSIONS, Permission, hasPermission } from "../../types/adminRoles";

const memoryStore = new Map<string, string>();

async function safeGetItem(key: string) {
  try {
    if (typeof SecureStore.getItemAsync !== "function") {
      return memoryStore.get(key) ?? null;
    }
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

async function safeSetItem(key: string, value: string) {
  try {
    if (typeof SecureStore.setItemAsync !== "function") {
      memoryStore.set(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

/* ============================================================
   BRAND COLORS
============================================================ */
const BRAND = {
  primary: "#0D4A8C",
  secondary: "#1E5FAF",
  gold: "#D4A64A",
  white: "#FFFFFF",
  backgroundDark: "#0B1220",
  cardDark: "#141E30",
  borderDark: "rgba(255,255,255,0.08)",
  textDark: "#F9FAFB",
  subtitleDark: "#9CA3AF",
  backgroundLight: "#FFFFFF",
  cardLight: "#F8FAFC",
  borderLight: "#E5E7EB",
  textLight: "#1F2937",
  subtitleLight: "#6B7280",
  danger: "#EF4444",
  success: "#22C55E",
};

type ThemeMode = "light" | "dark" | "system";
type Scheme = "light" | "dark";

function getPalette(scheme: Scheme) {
  const isDark = scheme === "dark";
  return {
    scheme,
    background: isDark ? BRAND.backgroundDark : BRAND.backgroundLight,
    card: isDark ? BRAND.cardDark : BRAND.cardLight,
    border: isDark ? BRAND.borderDark : BRAND.borderLight,
    text: isDark ? BRAND.textDark : BRAND.textLight,
    subtitle: isDark ? BRAND.subtitleDark : BRAND.subtitleLight,
    primary: BRAND.primary,
    secondary: BRAND.secondary,
    gold: BRAND.gold,
    danger: BRAND.danger,
    success: BRAND.success,
    inputBg: isDark ? "#0F1B30" : "#FFFFFF",
    pillBg: isDark ? "#1B2942" : "#EEF3FA",
  };
}

const THEME_STORAGE_KEY = "kayora_admin_theme_mode";

/* ============================================================
   ROLE & PERMISSION ARCHITECTURE
   ------------------------------------------------------------
   Moved to ../../types/adminRoles.ts (needed there to avoid a
   circular import with AdminAuthContext.tsx). Re-exported here so
   any existing file already importing { AdminRole, PERMISSIONS,
   hasPermission } from "./login" doesn't break.
============================================================ */
export type { AdminRole, Permission } from "../../types/adminRoles";
export { PERMISSIONS, hasPermission } from "../../types/adminRoles";

/* ============================================================
   MAIN COMPONENT
============================================================ */
export default function AdminLoginScreen() {
  const router = useRouter();
  const adminAuth = useAdminAuth();

  /* Theme */
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [systemScheme, setSystemScheme] = useState<Scheme>(
    (Appearance.getColorScheme() as Scheme) || "dark",
  );

  useEffect(() => {
    (async () => {
      try {
        const saved = await safeGetItem(THEME_STORAGE_KEY);
        if (saved === "light" || saved === "dark" || saved === "system")
          setThemeMode(saved);
      } catch (e) {
        // default remains "dark"
      }
    })();
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme((colorScheme as Scheme) || "dark");
    });
    return () => subscription.remove();
  }, []);

  const activeScheme: Scheme =
    themeMode === "system" ? systemScheme : themeMode;
  const palette = useMemo(() => getPalette(activeScheme), [activeScheme]);

  const handleCycleTheme = useCallback(async () => {
    const order: ThemeMode[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(themeMode) + 1) % order.length];
    setThemeMode(next);
    try {
      await safeSetItem(THEME_STORAGE_KEY, next);
    } catch (e) {
      // ignore persistence failure
    }
  }, [themeMode]);

  const themeIcon =
    themeMode === "light"
      ? "sunny-outline"
      : themeMode === "dark"
        ? "moon-outline"
        : "contrast-outline";

  /* Form State */
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [demoCredentialsOpen, setDemoCredentialsOpen] = useState(false);

  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Auth check on mount — reads from AdminAuthContext (which itself
     verified the stored token isn't expired), not raw storage keys
     directly. This avoids the exact stale-cache redirect-loop bug
     already hit and fixed once on the driver side. */
  useEffect(() => {
    if (adminAuth.status === "authed") {
      router.replace("/admin/dashboard" as any);
    }
  }, [adminAuth.status]);

  /* Entrance Animations */
  const logoOpacity = useSharedValue(0);
  const cardTranslate = useSharedValue(30);
  const cardOpacity = useSharedValue(0);
  const inputsOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.quad),
    });
    cardOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
    cardTranslate.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.quad),
    });
    inputsOpacity.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.quad),
    });
  }, []);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslate.value }],
  }));
  const inputsStyle = useAnimatedStyle(() => ({
    opacity: inputsOpacity.value,
  }));

  /* Shake Animation */
  const shakeX = useSharedValue(0);
  const borderProgress = useSharedValue(0);

  const triggerShake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 60 }),
      withTiming(10, { duration: 60 }),
      withTiming(-8, { duration: 60 }),
      withTiming(8, { duration: 60 }),
      withTiming(0, { duration: 60 }),
    );
    borderProgress.value = withTiming(1, { duration: 150 });
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));
  const inputBorderStyle = useAnimatedStyle(() => ({
    borderColor: borderProgress.value === 1 ? BRAND.danger : palette.border,
  }));

  /* Button Scale */
  const buttonScale = useSharedValue(1);
  const handlePressIn = () =>
    (buttonScale.value = withTiming(0.97, { duration: 100 }));
  const handlePressOut = () =>
    (buttonScale.value = withSpring(1, { damping: 12 }));
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const resetErrorAfterDelay = () => {
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => {
      setShowError(false);
      borderProgress.value = withTiming(0, { duration: 200 });
    }, 2600);
  };

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const [errorMessage, setErrorMessage] = useState("Invalid administrator credentials.");

  const handleSignIn = useCallback(async () => {
    if (loading) return;
    setShowError(false);

    if (!identifier.trim() || !password.trim()) {
      triggerShake();
      setErrorMessage("Please enter your Employee ID/Email and password.");
      setShowError(true);
      resetErrorAfterDelay();
      return;
    }

    setLoading(true);
    try {
      const response = await adminApiFetch<{
        success: true;
        token: string;
        expiresAt: string;
        admin: { employeeId: string; email: string; name: string; role: AdminRole; profilePicture: string | null };
      }>("/admin/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          remember: rememberMe,
        }),
      });

      await saveAdminSession(response.token, response.expiresAt, response.admin);
      // Updates AdminAuthContext synchronously — the route guard reading
      // adminAuth.status re-renders and redirects on its own, same
      // pattern as the driver app's signIn()/DriverGuard combo.
      adminAuth.signIn(response.admin);
      router.replace("/admin/dashboard" as any);
    } catch (err) {
      triggerShake();
      setErrorMessage(
        err instanceof ApiError ? err.message : "Unable to reach the server. Check your connection."
      );
      setShowError(true);
      resetErrorAfterDelay();
    } finally {
      setLoading(false);
    }
  }, [identifier, password, rememberMe, loading, adminAuth]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: palette.background }]}
    >
      <Pressable
        onPress={handleCycleTheme}
        hitSlop={10}
        style={[styles.themeToggle, { backgroundColor: palette.pillBg }]}
      >
        <Ionicons name={themeIcon as any} size={18} color={palette.text} />
      </Pressable>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* ---------- HEADER ---------- */}
            <Animated.View style={[styles.brandingBlock, logoStyle]}>
              <View
                style={[
                  styles.logoCircle,
                  { backgroundColor: palette.primary },
                ]}
              >
                <Text style={styles.logoLetter}>K</Text>
              </View>
              <Text style={[styles.kayoraTitle, { color: palette.text }]}>
                KAYORA
              </Text>
              <Text
                style={[styles.adminPanelTitle, { color: palette.primary }]}
              >
                ADMIN PANEL
              </Text>
              <Text style={[styles.brandSubtitle, { color: palette.subtitle }]}>
                Secure Management Portal
              </Text>
            </Animated.View>

            {/* ---------- LOGIN CARD ---------- */}
            <Animated.View
              style={[
                styles.card,
                { backgroundColor: palette.card, borderColor: palette.border },
                cardStyle,
              ]}
            >
              <Text style={[styles.cardTitle, { color: palette.text }]}>
                Administrator Login
              </Text>
              <Text style={[styles.cardSubtitle, { color: palette.subtitle }]}>
                Only authorized personnel can access this system.
              </Text>

              <Animated.View
                style={[shakeStyle, inputsStyle, { marginTop: 22 }]}
              >
                {/* Employee ID / Email */}
                <Text style={[styles.label, { color: palette.text }]}>
                  Employee ID or Email Address
                </Text>
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: palette.inputBg,
                      borderColor: palette.border,
                    },
                    inputBorderStyle,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color={palette.subtitle}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: palette.text }]}
                    placeholder="Enter your email"
                    placeholderTextColor={palette.subtitle}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={identifier}
                    onChangeText={setIdentifier}
                    editable={!loading}
                  />
                </Animated.View>

                {/* Password */}
                <Text
                  style={[styles.label, { color: palette.text, marginTop: 18 }]}
                >
                  Password
                </Text>
                <Animated.View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: palette.inputBg,
                      borderColor: palette.border,
                    },
                    inputBorderStyle,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color={palette.subtitle}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: palette.text }]}
                    placeholder="Enter your password"
                    placeholderTextColor={palette.subtitle}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={19}
                      color={palette.subtitle}
                    />
                  </Pressable>
                </Animated.View>

                {/* Error Message */}
                {showError && (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    style={styles.errorBanner}
                  >
                    <Ionicons
                      name="alert-circle"
                      size={16}
                      color={BRAND.danger}
                    />
                    <Text style={styles.errorText}>
                      {errorMessage}
                    </Text>
                  </Animated.View>
                )}

                {/* Remember Me + Forgot Password */}
                <View style={styles.rowBetween}>
                  <Pressable
                    style={styles.rememberRow}
                    onPress={() => setRememberMe((v) => !v)}
                    hitSlop={8}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: palette.border,
                          backgroundColor: palette.inputBg,
                        },
                        rememberMe && {
                          backgroundColor: palette.primary,
                          borderColor: palette.primary,
                        },
                      ]}
                    >
                      {rememberMe && (
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <Text
                      style={[styles.rememberText, { color: palette.text }]}
                    >
                      Remember Me
                    </Text>
                  </Pressable>

                  <Pressable onPress={() => setForgotVisible(true)} hitSlop={8}>
                    <Text
                      style={[styles.forgotText, { color: palette.secondary }]}
                    >
                      Forgot Password?
                    </Text>
                  </Pressable>
                </View>

                {/* Sign In Button */}
                <Animated.View style={buttonAnimatedStyle}>
                  <Pressable
                    style={[
                      styles.signInButton,
                      { backgroundColor: palette.primary },
                      loading && { opacity: 0.75 },
                    ]}
                    onPress={handleSignIn}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.signInButtonText}>Sign In</Text>
                    )}
                  </Pressable>
                </Animated.View>

                {/* Security Notice */}
                <View style={styles.securityNoticeRow}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={14}
                    color={palette.subtitle}
                  />
                  <Text
                    style={[
                      styles.securityNoticeText,
                      { color: palette.subtitle },
                    ]}
                  >
                    This system is monitored. Unauthorized access is prohibited.
                  </Text>
                </View>
              </Animated.View>
            </Animated.View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ---------- FORGOT PASSWORD MODAL ---------- */}
      <Modal
        visible={forgotVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={ZoomIn.duration(240)}
            style={[styles.modalCard, { backgroundColor: palette.card }]}
          >
            <View
              style={[
                styles.modalIconCircle,
                { backgroundColor: palette.pillBg },
              ]}
            >
              <Ionicons name="key-outline" size={26} color={palette.primary} />
            </View>
            <Text style={[styles.modalTitle, { color: palette.text }]}>
              Forgot Password?
            </Text>
            <Text style={[styles.modalMessage, { color: palette.subtitle }]}>
              This feature will be available after the Laravel backend
              integration. Please contact your Super Administrator.
            </Text>

            <Pressable
              style={[
                styles.modalDismissButton,
                { backgroundColor: palette.primary },
              ]}
              onPress={() => setForgotVisible(false)}
            >
              <Text style={styles.modalDismissButtonText}>Dismiss</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ============================================================
   DEMO ACCOUNT BLOCK
============================================================ */
function DemoAccountBlock({
  palette,
  roleLabel,
  employeeId,
  email,
  password,
}: {
  palette: ReturnType<typeof getPalette>;
  roleLabel: string;
  employeeId: string;
  email: string;
  password: string;
}) {
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={[styles.demoRoleLabel, { color: palette.gold }]}>
        {roleLabel}
      </Text>
      <View style={styles.demoRow}>
        <Text style={[styles.demoRowLabel, { color: palette.subtitle }]}>
          Employee ID
        </Text>
        <Text style={[styles.demoRowValue, { color: palette.text }]}>
          {employeeId}
        </Text>
      </View>
      <View style={styles.demoRow}>
        <Text style={[styles.demoRowLabel, { color: palette.subtitle }]}>
          Email
        </Text>
        <Text style={[styles.demoRowValue, { color: palette.text }]}>
          {email}
        </Text>
      </View>
      <View style={styles.demoRow}>
        <Text style={[styles.demoRowLabel, { color: palette.subtitle }]}>
          Password
        </Text>
        <Text style={[styles.demoRowValue, { color: palette.text }]}>
          {password}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  themeToggle: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 22,
    right: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  container: { width: "100%", maxWidth: 440, alignSelf: "center" },

  /* Branding */
  brandingBlock: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#0D4A8C",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  logoLetter: { fontSize: 32, fontWeight: "800", color: "#FFFFFF" },
  kayoraTitle: { fontSize: 24, fontWeight: "800", letterSpacing: 2 },
  adminPanelTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 3,
    marginTop: 4,
  },
  brandSubtitle: { fontSize: 12.5, marginTop: 8 },

  /* Card */
  card: { borderRadius: 24, borderWidth: 1, padding: 24 },
  cardTitle: { fontSize: 19, fontWeight: "800" },
  cardSubtitle: { fontSize: 12.5, marginTop: 6, lineHeight: 18 },

  label: { fontSize: 12.5, fontWeight: "700", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14.5, height: "100%" },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
    gap: 8,
  },
  errorText: { color: BRAND.danger, fontSize: 12.5, fontWeight: "700" },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  rememberRow: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  rememberText: { fontSize: 12.5, fontWeight: "600" },
  forgotText: { fontSize: 12.5, fontWeight: "700" },

  signInButton: {
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0D4A8C",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  securityNoticeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 20,
  },
  securityNoticeText: { fontSize: 11, fontWeight: "500", textAlign: "center" },

  /* Demo Credentials */
  demoCard: { borderRadius: 20, borderWidth: 1, padding: 18, marginTop: 20 },
  demoHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  demoHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  demoHeaderText: { fontSize: 13.5, fontWeight: "800" },
  demoDivider: { height: 1, marginVertical: 14 },
  demoRoleLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  demoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  demoRowLabel: { fontSize: 11.5, fontWeight: "600" },
  demoRowValue: { fontSize: 11.5, fontWeight: "700" },

  /* Forgot Password Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    padding: 26,
    alignItems: "center",
  },
  modalIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  modalMessage: {
    fontSize: 13.5,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
  },
  modalDismissButton: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDismissButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
});