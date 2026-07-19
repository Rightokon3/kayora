import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

function OrdersEmptyStateBase({ palette, isFiltered }: { palette: Palette; isFiltered: boolean }) {
  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: palette.pillBg }]}>
        <Ionicons name={isFiltered ? "filter-outline" : "receipt-outline"} size={38} color={palette.muted} />
      </View>
      <Text style={[styles.title, { color: palette.text }]}>No Orders Found</Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>
        {isFiltered
          ? "No orders match your current search or filter."
          : "Orders will appear here once customers begin placing orders."}
      </Text>
    </Animated.View>
  );
}

export const OrdersEmptyState = memo(OrdersEmptyStateBase);

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", paddingVertical: 56 },
  iconCircle: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { fontSize: 15.5, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: "center", maxWidth: 300 },
});