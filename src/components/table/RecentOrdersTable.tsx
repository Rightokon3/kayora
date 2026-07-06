import React, { memo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Palette } from "../../contexts/ThemeContext";
import { RecentOrder } from "../../types/dashboard";
import { formatNaira, formatDateTime, orderStatusColor } from "../../utils/formatters";

const COLUMN_WIDTHS = {
  id: 130,
  customer: 140,
  bottle: 170,
  quantity: 80,
  amount: 100,
  status: 110,
  driver: 140,
  date: 160,
};

function StatusBadge({ status, palette }: { status: RecentOrder["status"]; palette: Palette }) {
  const color = orderStatusColor(status, palette);
  return (
    <View style={[styles.badge, { backgroundColor: color + "1A" }]}>
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

function RecentOrdersTableBase({ palette, data }: { palette: Palette; data: RecentOrder[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[styles.headerRow, { borderBottomColor: palette.border }]}>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.id, color: palette.muted }]}>Order ID</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.customer, color: palette.muted }]}>Customer</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.bottle, color: palette.muted }]}>Bottle</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.quantity, color: palette.muted }]}>Quantity</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.amount, color: palette.muted }]}>Amount</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.status, color: palette.muted }]}>Status</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.driver, color: palette.muted }]}>Driver</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.date, color: palette.muted }]}>Date</Text>
        </View>

        {data.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={{ color: palette.muted, fontSize: 13 }}>No orders placed today yet.</Text>
          </View>
        ) : (
          data.map((order, index) => (
            <View
              key={order.id}
              style={[
                styles.row,
                index !== data.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.border },
              ]}
            >
              <Text style={[styles.cell, { width: COLUMN_WIDTHS.id, color: palette.text, fontWeight: "700" }]}>
                {order.id}
              </Text>
              <Text style={[styles.cell, { width: COLUMN_WIDTHS.customer, color: palette.text }]} numberOfLines={1}>
                {order.customerName}
              </Text>
              <Text style={[styles.cell, { width: COLUMN_WIDTHS.bottle, color: palette.text }]} numberOfLines={1}>
                {order.bottleName}
              </Text>
              <Text style={[styles.cell, { width: COLUMN_WIDTHS.quantity, color: palette.text }]}>
                {order.quantity}
              </Text>
              <Text style={[styles.cell, { width: COLUMN_WIDTHS.amount, color: palette.text, fontWeight: "700" }]}>
                {formatNaira(order.amount)}
              </Text>
              <View style={{ width: COLUMN_WIDTHS.status }}>
                <StatusBadge status={order.status} palette={palette} />
              </View>
              <Text style={[styles.cell, { width: COLUMN_WIDTHS.driver, color: palette.muted }]} numberOfLines={1}>
                {order.driverName ?? "Unassigned"}
              </Text>
              <Text style={[styles.cell, { width: COLUMN_WIDTHS.date, color: palette.muted }]}>
                {formatDateTime(order.createdAt)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

export const RecentOrdersTable = memo(RecentOrdersTableBase);

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", borderBottomWidth: 1, paddingBottom: 12, marginBottom: 6, gap: 8 },
  headerCell: { fontSize: 11.5, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 8 },
  cell: { fontSize: 13, paddingRight: 8 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  emptyRow: { paddingVertical: 24 },
});