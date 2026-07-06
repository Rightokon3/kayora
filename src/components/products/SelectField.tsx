import React, { useState } from "react";
import { View, Text, Pressable, Modal, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

export function SelectField({
  palette,
  label,
  value,
  options,
  onSelect,
}: {
  palette: Palette;
  label: string;
  value: string;
  options: readonly string[];
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, { backgroundColor: palette.background, borderColor: palette.border }]}
      >
        <Text style={[styles.fieldText, { color: value ? palette.text : palette.muted }]}>
          {value || `Select ${label.toLowerCase()}`}
        </Text>
        <Ionicons name="chevron-down" size={16} color={palette.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Animated.View entering={FadeIn.duration(180)} style={[styles.sheet, { backgroundColor: palette.card }]}>
            <Text style={[styles.sheetTitle, { color: palette.text }]}>{label}</Text>
            {options.map((option) => (
              <Pressable
                key={option}
                onPress={() => {
                  onSelect(option);
                  setOpen(false);
                }}
                style={[
                  styles.optionRow,
                  option === value && { backgroundColor: palette.pillBg, borderRadius: 10 },
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: option === value ? palette.primary : palette.text, fontWeight: option === value ? "800" : "500" },
                  ]}
                >
                  {option}
                </Text>
                {option === value && <Ionicons name="checkmark" size={16} color={palette.primary} />}
              </Pressable>
            ))}
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
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  fieldText: { fontSize: 14 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34 },
  sheetTitle: { fontSize: 15, fontWeight: "800", marginBottom: 12 },
  optionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, paddingHorizontal: 10 },
  optionText: { fontSize: 14.5 },
});