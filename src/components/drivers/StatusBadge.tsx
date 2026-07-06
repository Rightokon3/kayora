import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Palette } from "../../contexts/ThemeContext";
import { DriverStatus } from "../../types/driver";

const STATUS_LABEL: Record<DriverStatus, string> = {
  active: "Active",
  offline: "Offline",
  break: "Break",
  delivering: "Delivering",
};

function statusColor(status: DriverStatus, palette: Palette): string {
  switch (status) {
    case "active":
      return palette.success;
    case "delivering":
      return palette.secondary;
    case "break":
      return palette.warning;
    case "offline":
    default:
      return palette.muted;
  }
}

function DriverStatusBadgeBase({ status, palette }: { status: DriverStatus; palette: Palette }) {
  const color = statusColor(status, palette);
  return (
    <View style={[styles.badge, { backgroundColor: color + "1A" }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

export const DriverStatusBadge = memo(DriverStatusBadgeBase);

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 11.5, fontWeight: "800" },
});