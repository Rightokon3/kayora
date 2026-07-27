import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Palette } from "../../contexts/ThemeContext";

export interface RepeatableFieldConfig {
  key: string;
  placeholder: string;
  multiline?: boolean;
}

export type RepeatableRow = Record<string, string>;

/**
 * Generic add/remove list of small forms — one row per entry, each row
 * rendering the given `fields` as text inputs. Used for:
 *   - Best Used For   (fields: title, description)
 *   - Specifications   (fields: label, value)
 *   - Regulatory       (fields: label, value, description)
 *
 * Rows are plain string maps so ProductModal can cast them to the
 * right ProductUsedFor/ProductSpec/ProductRegulatory shape on submit.
 */
export function RepeatableFieldList({
  palette,
  rows,
  fields,
  emptyRow,
  addLabel,
  onChange,
}: {
  palette: Palette;
  rows: RepeatableRow[];
  fields: RepeatableFieldConfig[];
  emptyRow: RepeatableRow;
  addLabel: string;
  onChange: (rows: RepeatableRow[]) => void;
}) {
  const updateRow = (index: number, key: string, value: string) => {
    const next = rows.slice();
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const addRow = () => {
    onChange([...rows, { ...emptyRow }]);
  };

  return (
    <View>
      {rows.map((row, index) => (
        <View key={index} style={[styles.rowCard, { borderColor: palette.border, backgroundColor: palette.background }]}>
          <View style={{ flex: 1, gap: 10 }}>
            {fields.map((field) => (
              <TextInput
                key={field.key}
                style={[
                  field.multiline ? styles.textarea : styles.input,
                  { color: palette.text, borderColor: palette.border },
                ]}
                placeholder={field.placeholder}
                placeholderTextColor={palette.muted}
                value={row[field.key] ?? ""}
                onChangeText={(t) => updateRow(index, field.key, t)}
                multiline={field.multiline}
                numberOfLines={field.multiline ? 3 : 1}
                textAlignVertical={field.multiline ? "top" : "center"}
              />
            ))}
          </View>
          <Pressable onPress={() => removeRow(index)} hitSlop={8} style={[styles.removeButton, { backgroundColor: palette.danger + "1A" }]}>
            <Ionicons name="trash-outline" size={16} color={palette.danger} />
          </Pressable>
        </View>
      ))}

      <Pressable onPress={addRow} style={[styles.addRowButton, { borderColor: palette.border }]}>
        <Ionicons name="add" size={16} color={palette.primary} />
        <Text style={[styles.addRowText, { color: palette.primary }]}>{addLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  rowCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  input: { height: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 13.5 },
  textarea: { minHeight: 64, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13.5 },
  removeButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 2 },
  addRowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 2,
  },
  addRowText: { fontSize: 13, fontWeight: "700" },
});