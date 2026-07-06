import React from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { ZoomIn } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

export function DeleteDriverModal({
  visible,
  palette,
  driverName,
  loading,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  palette: Palette;
  driverName: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onCancel}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <View style={styles.overlay}>
          <Animated.View entering={ZoomIn.duration(220)} style={[styles.card, { backgroundColor: palette.card }]}>
            <View style={[styles.iconCircle, { backgroundColor: palette.danger + "1A" }]}>
              <Ionicons name="person-remove-outline" size={26} color={palette.danger} />
            </View>
            <Text style={[styles.title, { color: palette.text }]}>Delete Driver?</Text>
            <Text style={[styles.message, { color: palette.muted }]}>
              This action permanently removes "{driverName}"'s account and all associated data.
            </Text>
            <View style={styles.buttonsRow}>
              <Pressable onPress={onCancel} disabled={loading} style={[styles.cancelButton, { borderColor: palette.border }]}>
                <Text style={[styles.cancelButtonText, { color: palette.text }]}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onConfirm} disabled={loading} style={[styles.deleteButton, { backgroundColor: palette.danger }]}>
                {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.deleteButtonText}>Delete</Text>}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  card: { width: "100%", maxWidth: 360, borderRadius: 22, padding: 24, alignItems: "center" },
  iconCircle: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontSize: 17, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  message: { fontSize: 13.5, textAlign: "center", lineHeight: 19, marginBottom: 22 },
  buttonsRow: { flexDirection: "row", gap: 10, width: "100%" },
  cancelButton: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cancelButtonText: { fontSize: 14, fontWeight: "700" },
  deleteButton: { flex: 1, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  deleteButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});