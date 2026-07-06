import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Palette, ThemeMode } from "../../contexts/ThemeContext";
import { AdminUser } from "../sidebar/sidebar";

export function TopHeader({
  palette,
  title,
  isPhone,
  themeMode,
  user,
  onMenuPress,
  onCycleTheme,
}: {
  palette: Palette;
  title: string;
  isPhone: boolean;
  themeMode: ThemeMode;
  user: AdminUser;
  onMenuPress: () => void;
  onCycleTheme: () => void;
}) {
  const themeIcon =
    themeMode === "light" ? "sunny-outline" : themeMode === "dark" ? "moon-outline" : "contrast-outline";

  return (
    <View style={[styles.container, { backgroundColor: palette.background, borderBottomColor: palette.border }]}>
      <View style={styles.left}>
        {isPhone ? (
          <>
            <Pressable onPress={onMenuPress} hitSlop={10} style={styles.hamburger}>
              <Ionicons name="menu-outline" size={24} color={palette.text} />
            </Pressable>
            <Text style={[styles.mobileBrand, { color: palette.text }]}>
              Kayora <Text style={{ color: palette.primary, fontWeight: "800" }}>Admin</Text>
            </Text>
          </>
        ) : (
          <Text style={[styles.pageTitle, { color: palette.text }]}>{title}</Text>
        )}
      </View>

      <View style={styles.right}>
        <Pressable onPress={onCycleTheme} hitSlop={10} style={[styles.iconButton, { backgroundColor: palette.pillBg }]}>
          <Ionicons name={themeIcon as any} size={17} color={palette.text} />
        </Pressable>

        {user.profilePicture ? (
          <View style={[styles.avatar, { backgroundColor: palette.primary }]} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: palette.pillBg }]}>
            <Text style={[styles.avatarInitial, { color: palette.text }]}>
              {user.name.trim().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    height: 64,
    borderBottomWidth: 1,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  hamburger: { padding: 2 },
  mobileBrand: { fontSize: 16, fontWeight: "600" },
  pageTitle: { fontSize: 15, fontWeight: "600" },
  right: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 13.5, fontWeight: "800" },
});