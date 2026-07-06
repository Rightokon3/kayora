import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

function StatCard({
  palette,
  title,
  value,
  subtitle,
  delay,
}: {
  palette: Palette;
  title: string;
  value: string;
  subtitle: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(delay)}
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      <Text style={[styles.title, { color: palette.muted }]}>{title}</Text>
      <Text style={[styles.value, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</Text>
    </Animated.View>
  );
}

function DriversStatsCardsBase({
  palette,
  totalDrivers,
  activeDrivers,
}: {
  palette: Palette;
  totalDrivers: number;
  activeDrivers: number;
}) {
  return (
    <View style={styles.row}>
      <StatCard palette={palette} title="Total Drivers" value={String(totalDrivers)} subtitle="Registered company drivers" delay={0} />
      <StatCard
        palette={palette}
        title="Active Drivers"
        value={String(activeDrivers)}
        subtitle="Currently online and sharing live location"
        delay={70}
      />
    </View>
  );
}

export const DriversStatsCards = memo(DriversStatsCardsBase);

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 22 },
  card: { flex: 1, minWidth: 200, borderWidth: 1, borderRadius: 16, padding: 18 },
  title: { fontSize: 13, fontWeight: "500" },
  value: { fontSize: 26, fontWeight: "800", marginTop: 10 },
  subtitle: { fontSize: 11.5, marginTop: 8, lineHeight: 16 },
});