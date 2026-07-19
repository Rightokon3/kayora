import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Palette } from "../../contexts/ThemeContext";
import { OrderTab } from "../../types/order";

const TABS: { key: OrderTab; label: string }[] = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
];

export function OrdersTabsBar({
  palette,
  active,
  onChange,
}: {
  palette: Palette;
  active: OrderTab;
  onChange: (tab: OrderTab) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
      <View style={[styles.wrap, { backgroundColor: palette.pillBg }]}>
        {TABS.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              style={[styles.tab, isActive && { backgroundColor: palette.card }]}
            >
              <Text style={[styles.tabText, { color: isActive ? palette.text : palette.muted, fontWeight: isActive ? "800" : "600" }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 2 },
  tab: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9 },
  tabText: { fontSize: 13 },
});