import React, { memo } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Palette } from "../../contexts/ThemeContext";

function SearchBarBase({
  palette,
  value,
  onChangeText,
  placeholder = "Search products...",
}: {
  palette: Palette;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={[styles.wrap, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Ionicons name="search-outline" size={18} color={palette.muted} />
      <TextInput
        style={[styles.input, { color: palette.text }]}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={palette.muted} />
        </Pressable>
      )}
    </View>
  );
}

export const SearchBar = memo(SearchBarBase);

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
  },
  input: { flex: 1, fontSize: 14, height: "100%" },
});