import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

export interface ToastState {
  message: string;
  variant: "success" | "error";
}

export function Toast({ toast, palette }: { toast: ToastState | null; palette: Palette }) {
  if (!toast) return null;
  const color = toast.variant === "success" ? palette.success : palette.danger;

  return (
    <Animated.View
      entering={FadeInDown.duration(260)}
      exiting={FadeOut.duration(220)}
      style={styles.wrap}
      pointerEvents="none"
    >
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: color }]}>
        <View style={[styles.iconCircle, { backgroundColor: color }]}>
          <Ionicons name={toast.variant === "success" ? "checkmark" : "close"} size={14} color="#FFFFFF" />
        </View>
        <Text style={[styles.text, { color: palette.text }]}>{toast.message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    bottom: 32,
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 100,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 420,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  iconCircle: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 13, fontWeight: "700", flexShrink: 1 },
});