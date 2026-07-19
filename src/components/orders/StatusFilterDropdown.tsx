import React, { useState } from "react";
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";
import { OrderStatus, STATUS_FILTERS } from "../../types/order";

export function StatusFilterDropdown({
  palette,
  value,
  onChange,
}: {
  palette: Palette;
  value: OrderStatus | "all";
  onChange: (value: OrderStatus | "all") => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = STATUS_FILTERS.find((s) => s.key === value)?.label ?? "All Statuses";

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, { backgroundColor: palette.card, borderColor: palette.border }]}
      >
        <Text style={[styles.fieldText, { color: palette.text }]}>{selectedLabel}</Text>
        <Ionicons name="chevron-down" size={16} color={palette.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Animated.View entering={FadeIn.duration(180)} style={[styles.sheet, { backgroundColor: palette.card }]}>
            <Text style={[styles.sheetTitle, { color: palette.text }]}>Filter by Status</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {STATUS_FILTERS.map((option) => (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    onChange(option.key);
                    setOpen(false);
                  }}
                  style={[styles.optionRow, option.key === value && { backgroundColor: palette.pillBg, borderRadius: 10 }]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: option.key === value ? palette.primary : palette.text, fontWeight: option.key === value ? "800" : "500" },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {option.key === value && <Ionicons name="checkmark" size={16} color={palette.primary} />}
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 46,
    minWidth: 180,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  fieldText: { fontSize: 13.5, fontWeight: "600" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34, maxHeight: "70%" },
  sheetTitle: { fontSize: 15, fontWeight: "800", marginBottom: 12 },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, paddingHorizontal: 10 },
  optionText: { fontSize: 14 },
});