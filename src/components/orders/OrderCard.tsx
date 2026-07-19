import React, { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";
import { Order } from "../../types/order";
import { OrderStatusBadge } from "./StatusBadge";

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function OrderCardBase({
  palette,
  order,
  delay = 0,
  onMoreInfo,
  onEdit,
  onDelete,
}: {
  palette: Palette;
  order: Order;
  delay?: number;
  onMoreInfo: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}) {
  const initial = order.customer.name.trim().charAt(0).toUpperCase();
  const firstProduct = order.products[0];

  return (
    <Animated.View
      entering={FadeInDown.duration(380).delay(delay)}
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.orderId, { color: palette.text }]}>#{order.id}</Text>
        <OrderStatusBadge status={order.status} palette={palette} />
      </View>

      <View style={styles.customerRow}>
        <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={[styles.customerName, { color: palette.text }]} numberOfLines={1}>
            {order.customer.name}
          </Text>
          <Text style={[styles.customerPhone, { color: palette.muted }]}>{order.customer.phone}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <View style={styles.metaRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.metaLabel, { color: palette.muted }]}>Bottle</Text>
          <Text style={[styles.metaValue, { color: palette.text }]} numberOfLines={1}>
            {firstProduct?.bottleName} · {firstProduct?.size}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.metaLabel, { color: palette.muted }]}>Amount</Text>
          <Text style={[styles.metaValue, { color: palette.text }]}>{formatNaira(order.amount)}</Text>
        </View>
      </View>

      <Text style={[styles.dateText, { color: palette.muted }]}>{formatDate(order.orderDate)}</Text>

      <View style={styles.actionsRow}>
        <Pressable onPress={() => onMoreInfo(order)} style={[styles.actionButton, { borderColor: palette.border }]}>
          <Ionicons name="eye-outline" size={15} color={palette.secondary} />
          <Text style={[styles.actionText, { color: palette.secondary }]}>Info</Text>
        </Pressable>
        <Pressable onPress={() => onEdit(order)} style={[styles.actionButton, { borderColor: palette.border }]}>
          <Ionicons name="create-outline" size={15} color={palette.text} />
          <Text style={[styles.actionText, { color: palette.text }]}>Edit</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(order)} style={[styles.actionButton, { borderColor: palette.danger + "40" }]}>
          <Ionicons name="trash-outline" size={15} color={palette.danger} />
          <Text style={[styles.actionText, { color: palette.danger }]}>Delete</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export const OrderCard = memo(OrderCardBase);

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 16 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  orderId: { fontSize: 15, fontWeight: "800" },
  customerRow: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  customerName: { fontSize: 14, fontWeight: "700" },
  customerPhone: { fontSize: 11.5, marginTop: 2 },
  divider: { height: 1, marginVertical: 14 },
  metaRow: { flexDirection: "row", marginBottom: 10 },
  metaLabel: { fontSize: 11, fontWeight: "600" },
  metaValue: { fontSize: 13, fontWeight: "700", marginTop: 3 },
  dateText: { fontSize: 11.5, marginBottom: 14 },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionButton: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, height: 40, borderRadius: 10, borderWidth: 1 },
  actionText: { fontSize: 11.5, fontWeight: "700" },
});