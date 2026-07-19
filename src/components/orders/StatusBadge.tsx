import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Palette } from "../../contexts/ThemeContext";
import { OrderStatus } from "../../types/order";

function statusColor(status: OrderStatus, palette: Palette): string {
  switch (status) {
    case "Delivered":
      return palette.success;
    case "Out For Delivery":
      return palette.accent;
    case "Assigned":
    case "Preparing":
      return palette.secondary;
    case "Scheduled":
      return "#D4A64A";
    case "Accepted":
      return palette.primary;
    case "Cancelled":
      return palette.danger;
    case "Pending":
    default:
      return palette.warning;
  }
}

function OrderStatusBadgeBase({ status, palette }: { status: OrderStatus; palette: Palette }) {
  const color = statusColor(status, palette);
  return (
    <View style={[styles.badge, { backgroundColor: color + "1A" }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

export const OrderStatusBadge = memo(OrderStatusBadgeBase);

const styles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { fontSize: 11, fontWeight: "800" },
});