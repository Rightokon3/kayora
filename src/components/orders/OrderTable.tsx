import React, { memo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Palette } from "../../contexts/ThemeContext";
import { Order } from "../../types/order";
import { OrderStatusBadge } from "./StatusBadge";

const COLUMN_WIDTHS = {
  id: 130,
  customer: 200,
  bottle: 180,
  amount: 100,
  date: 140,
  status: 140,
  actions: 120,
};

function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

function OrderTableBase({
  palette,
  orders,
  onMoreInfo,
  onEdit,
  onDelete,
}: {
  palette: Palette;
  orders: Order[];
  onMoreInfo: (order: Order) => void;
  onEdit: (order: Order) => void;
  onDelete: (order: Order) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[styles.headerRow, { borderBottomColor: palette.border }]}>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.id, color: palette.muted }]}>Order ID</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.customer, color: palette.muted }]}>Customer</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.bottle, color: palette.muted }]}>Bottle Name / Size</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.amount, color: palette.muted }]}>Amount</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.date, color: palette.muted }]}>Date</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.status, color: palette.muted }]}>Status</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.actions, color: palette.muted }]}>Actions</Text>
        </View>

        {orders.map((order, index) => {
          const initial = order.customer.name.trim().charAt(0).toUpperCase();
          const firstProduct = order.products[0];
          return (
            <View
              key={order.id}
              style={[styles.row, index !== orders.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.border }]}
            >
              <Text style={[styles.cell, { width: COLUMN_WIDTHS.id, color: palette.text, fontWeight: "700" }]}>#{order.id}</Text>

              <View style={[styles.customerCell, { width: COLUMN_WIDTHS.customer }]}>
                <View style={[styles.avatar, { backgroundColor: palette.primary }]}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <Text style={[styles.cell, { color: palette.text, marginLeft: 10 }]} numberOfLines={1}>
                  {order.customer.name}
                </Text>
              </View>

              <View style={{ width: COLUMN_WIDTHS.bottle }}>
                <Text style={[styles.cell, { color: palette.text }]} numberOfLines={1}>
                  {firstProduct?.bottleName}
                </Text>
                <Text style={[styles.cellSecondary, { color: palette.muted }]}>
                  {firstProduct?.size}
                  {order.products.length > 1 ? ` +${order.products.length - 1} more` : ""}
                </Text>
              </View>

              <Text style={[styles.cell, { width: COLUMN_WIDTHS.amount, color: palette.text, fontWeight: "700" }]}>
                {formatNaira(order.amount)}
              </Text>
              <Text style={[styles.cell, { width: COLUMN_WIDTHS.date, color: palette.muted }]}>{formatDate(order.orderDate)}</Text>

              <View style={{ width: COLUMN_WIDTHS.status }}>
                <OrderStatusBadge status={order.status} palette={palette} />
              </View>

              <View style={[styles.actionsCell, { width: COLUMN_WIDTHS.actions }]}>
                <Pressable onPress={() => onMoreInfo(order)} style={[styles.actionButton, { borderColor: palette.border }]}>
                  <Ionicons name="eye-outline" size={15} color={palette.secondary} />
                </Pressable>
                <Pressable onPress={() => onEdit(order)} style={[styles.actionButton, { borderColor: palette.border }]}>
                  <Ionicons name="create-outline" size={15} color={palette.text} />
                </Pressable>
                <Pressable onPress={() => onDelete(order)} style={[styles.actionButton, { borderColor: palette.danger + "40" }]}>
                  <Ionicons name="trash-outline" size={15} color={palette.danger} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export const OrderTable = memo(OrderTableBase);

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", borderBottomWidth: 1, paddingBottom: 12, marginBottom: 4, gap: 8 },
  headerCell: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 15, gap: 8 },
  cell: { fontSize: 13, paddingRight: 8 },
  cellSecondary: { fontSize: 11.5, marginTop: 2 },
  customerCell: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "800" },
  actionsCell: { flexDirection: "row", gap: 8 },
  actionButton: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});