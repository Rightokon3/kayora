import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

function StatCard({ palette, title, value, delay }: { palette: Palette; title: string; value: number; delay: number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(delay)}
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      <Text style={[styles.title, { color: palette.muted }]}>{title}</Text>
      <Text style={[styles.value, { color: palette.text }]}>{value}</Text>
    </Animated.View>
  );
}

function OrdersStatsCardsBase({
  palette,
  total,
  pending,
  active,
  completed,
}: {
  palette: Palette;
  total: number;
  pending: number;
  active: number;
  completed: number;
}) {
  return (
    <View style={styles.row}>
      <StatCard palette={palette} title="Total Orders" value={total} delay={0} />
      <StatCard palette={palette} title="Pending" value={pending} delay={60} />
      <StatCard palette={palette} title="In Progress" value={active} delay={120} />
      <StatCard palette={palette} title="Completed" value={completed} delay={180} />
    </View>
  );
}

export const OrdersStatsCards = memo(OrdersStatsCardsBase);

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 20 },
  card: { flex: 1, minWidth: 160, borderWidth: 1, borderRadius: 16, padding: 18 },
  title: { fontSize: 13, fontWeight: "500" },
  value: { fontSize: 24, fontWeight: "800", marginTop: 10 },
});