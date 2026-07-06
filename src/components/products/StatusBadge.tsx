import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Palette } from "../../contexts/ThemeContext";
import { ProductStatus } from "././../../types/product";

function statusColor(status: ProductStatus, palette: Palette): string {
  if (status === "Active") return palette.success;
  if (status === "Out of Stock") return palette.danger;
  return palette.muted;
}

function StatusBadgeBase({ status, palette }: { status: ProductStatus; palette: Palette }) {
  const color = statusColor(status, palette);
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
}

export const StatusBadge = memo(StatusBadgeBase);

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: "#FFFFFF", fontSize: 11.5, fontWeight: "800" },
});