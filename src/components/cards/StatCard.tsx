import React, { memo, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

interface StatCardProps {
  palette: Palette;
  title: string;
  value: string;
  changePct: number;
  delay?: number;
  compact?: boolean; // when true, value is de-emphasized (matches "Total Customers" style with no big number)
}

function StatCardBase({ palette, title, value, changePct, delay = 0, compact }: StatCardProps) {
  const isPositive = changePct >= 0;

  return (
    <Animated.View
      entering={FadeInDown.duration(420).delay(delay)}
      style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}
    >
      <Text style={[styles.title, { color: palette.muted }]}>{title}</Text>
      {!compact && <Text style={[styles.value, { color: palette.text }]}>{value}</Text>}
      <View style={styles.changeRow}>
        <Ionicons
          name={isPositive ? "arrow-up" : "arrow-down"}
          size={12}
          color={isPositive ? palette.success : palette.danger}
        />
        <Text style={[styles.changeText, { color: isPositive ? palette.success : palette.danger }]}>
          {Math.abs(changePct)}% this month
        </Text>
      </View>
    </Animated.View>
  );
}

export const StatCard = memo(StatCardBase);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 160,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  title: { fontSize: 13, fontWeight: "500" },
  value: { fontSize: 24, fontWeight: "800", marginTop: 10 },
  changeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  changeText: { fontSize: 12, fontWeight: "600" },
});