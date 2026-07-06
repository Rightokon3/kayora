import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

function ProductsEmptyStateBase({ palette, isSearch }: { palette: Palette; isSearch: boolean }) {
  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: palette.pillBg }]}>
        <Ionicons name={isSearch ? "search-outline" : "water-outline"} size={40} color={palette.muted} />
      </View>
      <Text style={[styles.title, { color: palette.text }]}>
        {isSearch ? "No products match your search" : "No products yet"}
      </Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>
        {isSearch
          ? "Try a different name, size or status."
          : "Products you add will appear here."}
      </Text>
    </Animated.View>
  );
}

export const ProductsEmptyState = memo(ProductsEmptyStateBase);

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", paddingVertical: 56 },
  iconCircle: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { fontSize: 15.5, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: "center", maxWidth: 260 },
});