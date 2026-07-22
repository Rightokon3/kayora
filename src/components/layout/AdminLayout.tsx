import React, { useState, useCallback, useEffect } from "react";
import { View, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useAdminAlerts } from "../../hooks/useAdminAlerts";
import { Sidebar, AdminUser } from "../sidebar/sidebar";
import { MobileDrawer } from "../sidebar/mobileDrawer";
import { TopHeader } from "./TopHeader";

export function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { palette, themeMode, cycleTheme } = useTheme();
  const { isPhone, isDesktop } = useResponsive();
  const { status, admin } = useAdminAuth();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Runs continuously across every admin page (not just Settings) — polls
  // for new orders/driver updates and fires real browser notifications
  // per the admin's toggles. Called unconditionally here (before the
  // early-return guard below) per the Rules of Hooks; it'll silently no-op
  // on any request that fires before the admin is actually authenticated.
  useAdminAlerts();

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // The actual "nobody sees the dashboard without logging in" guard.
  // AdminLayout wraps every admin screen (dashboard.tsx and presumably
  // every other admin page), so putting it here means it's enforced
  // everywhere at once rather than needing to be repeated per-screen.
  useEffect(() => {
    if (status === "guest") {
      router.replace("/admin/login" as any);
    }
  }, [status]);

  if (status === "checking" || status === "guest" || !admin) {
    // "guest" still renders this briefly while the redirect above fires —
    // showing a spinner here (instead of the real page) means the
    // protected content never actually flashes on screen even for a frame.
    return (
      <SafeAreaView style={[styles.root, styles.loadingRoot, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </SafeAreaView>
    );
  }

  const currentAdmin: AdminUser = {
    name: admin.name,
    role: admin.role,
    profilePicture: admin.profilePicture,
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={["top"]}>
      <View style={styles.body}>
        {!isPhone && <Sidebar palette={palette} user={currentAdmin} />}

        <View style={{ flex: 1 }}>
          <TopHeader
            palette={palette}
            title={title}
            isPhone={isPhone}
            themeMode={themeMode}
            user={currentAdmin}
            onMenuPress={openDrawer}
            onCycleTheme={cycleTheme}
          />

          <ScrollView
            style={{ flex: 1, backgroundColor: palette.background }}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: isDesktop ? 32 : 16 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {isPhone && (
              <View style={{ marginBottom: 12 }}>
                {/* Mobile page title mirrors the desktop header title inline in content */}
              </View>
            )}
            {children}
          </ScrollView>
        </View>
      </View>

      {isPhone && (
        <MobileDrawer visible={drawerOpen} palette={palette} user={currentAdmin} onClose={closeDrawer} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingRoot: { alignItems: "center", justifyContent: "center" },
  body: { flex: 1, flexDirection: "row" },
  scrollContent: { paddingTop: 24, paddingBottom: 40 },
});