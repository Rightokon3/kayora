import React from "react";
import { View, Text, TextInput, Platform, StyleSheet } from "react-native";
import { Palette } from "../../../contexts/ThemeContext";

/**
 * On web this renders a genuine <input type="date">, which gets the
 * browser's own native date picker calendar for free — no extra library
 * needed. On iOS/Android there's no equivalent without adding
 * @react-native-community/datetimepicker (not confirmed installed in this
 * project), so native falls back to a plain YYYY-MM-DD text field with a
 * placeholder hint. Value is always a "YYYY-MM-DD" string either way, so
 * it round-trips cleanly with the backend's `date` columns.
 */
export function DateField({
  palette,
  label,
  value,
  onChangeText,
  error,
  style,
}: {
  palette: Palette;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  style?: any;
}) {
  const borderColor = error ? palette.danger : palette.border;

  return (
    <View style={style}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>

      {Platform.OS === "web" ? (
        // @ts-ignore — react-native-web passes unknown DOM props straight
        // through when the tag itself isn't a RN component; rendering a
        // real <input> here is the only way to get the browser's actual
        // date picker UI instead of reimplementing one from scratch.
        <input
          type="date"
          value={value || ""}
          onChange={(e: any) => onChangeText(e.target.value)}
          style={{
            height: 48,
            borderRadius: 12,
            border: `1.5px solid ${borderColor}`,
            paddingLeft: 14,
            paddingRight: 14,
            fontSize: 14,
            color: palette.text,
            backgroundColor: palette.background,
            fontFamily: "inherit",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      ) : (
        <TextInput
          style={[
            styles.input,
            { color: palette.text, borderColor, backgroundColor: palette.background },
          ]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={palette.muted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
        />
      )}

      {error && <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12.5, fontWeight: "700", marginBottom: 8 },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 14 },
  error: { fontSize: 11.5, fontWeight: "600", marginTop: 6 },
});