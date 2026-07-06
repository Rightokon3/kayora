import React, { useState, useCallback } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";
import { Sidebar, AdminUser } from "../sidebar/sidebar";
import { MobileDrawer } from "../sidebar/mobileDrawer";
import { TopHeader } from "./TopHeader";


const DEMO_ADMIN: AdminUser = {
  name: "Right Uwaifo",
  role: "admin",
  profilePicture: null,
};

export function AdminLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { palette, themeMode, cycleTheme } = useTheme();
  const { isPhone, isDesktop } = useResponsive();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={["top"]}>
      <View style={styles.body}>
        {!isPhone && <Sidebar palette={palette} user={DEMO_ADMIN} />}

        <View style={{ flex: 1 }}>
          <TopHeader
            palette={palette}
            title={title}
            isPhone={isPhone}
            themeMode={themeMode}
            user={DEMO_ADMIN}
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
        <MobileDrawer visible={drawerOpen} palette={palette} user={DEMO_ADMIN} onClose={closeDrawer} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, flexDirection: "row" },
  scrollContent: { paddingTop: 24, paddingBottom: 40 },
});