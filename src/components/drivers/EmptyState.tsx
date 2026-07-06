import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

function DriversEmptyStateBase({ palette, isSearch }: { palette: Palette; isSearch: boolean }) {
  return (
    <Animated.View entering={FadeIn.duration(350)} style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: palette.pillBg }]}>
        <Ionicons name={isSearch ? "search-outline" : "car-sport-outline"} size={38} color={palette.muted} />
      </View>
      <Text style={[styles.title, { color: palette.text }]}>
        {isSearch ? "No drivers match your search" : "No drivers found."}
      </Text>
      <Text style={[styles.subtitle, { color: palette.muted }]}>
        {isSearch ? "Try a different name, ID, phone or plate number." : "Drivers added by the administrator will appear here."}
      </Text>
    </Animated.View>
  );
}

export const DriversEmptyState = memo(DriversEmptyStateBase);

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", paddingVertical: 48 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 15, fontWeight: "800", marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: "center", maxWidth: 280 },
});