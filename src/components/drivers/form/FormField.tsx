import React from "react";
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions } from "react-native";
import { Palette } from "../../../contexts/ThemeContext";

export function FormField({
  palette,
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  multiline,
  style,
}: {
  palette: Palette;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  style?: any;
}) {
  return (
    <View style={style}>
      <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      <TextInput
        style={[
          multiline ? styles.textarea : styles.input,
          { color: palette.text, borderColor: error ? palette.danger : palette.border, backgroundColor: palette.background },
        ]}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : undefined}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {error && <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12.5, fontWeight: "700", marginBottom: 8 },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 14 },
  textarea: { height: 90, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  error: { fontSize: 11.5, fontWeight: "600", marginTop: 6 },
});