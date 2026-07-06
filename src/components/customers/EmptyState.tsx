import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

function CustomersEmptyStateBase({ palette, isSearch }: { palette: Palette; isSearch: boolean }) {
  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: palette.pillBg }]}>
        <Ionicons name={isSearch ? "search-outline" : "people-outline"} size={38} color={palette.muted} />
      </View>
      <Text style={[styles.title, { color: palette.text }]}>
        {isSearch ? "No customers match your search" : "No customers found"}
      </Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>
        {isSearch ? "Try a different name, phone or email." : "Registered customers will appear here."}
      </Text>
    </Animated.View>
  );
}

export const CustomersEmptyState = memo(CustomersEmptyStateBase);

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 15, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: "center", maxWidth: 260 },
});