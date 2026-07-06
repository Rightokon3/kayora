import React, { memo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { Palette } from "../../contexts/ThemeContext";
import { OrderCategory } from "../../types/dashboard";

function CategoryPieChartBase({ palette, data }: { palette: Palette; data: OrderCategory[] }) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const pieData = data.map((slice, index) => ({
    value: slice.value,
    color: slice.color,
    text: `${slice.value}%`,
    focused: focusedIndex === index,
    onPress: () => setFocusedIndex(index === focusedIndex ? null : index),
  }));

  return (
    <View style={{ alignItems: "center" }}>
      <PieChart
        data={pieData}
        donut={false}
        radius={110}
        textColor={palette.text}
        textSize={12}
        showText
        isAnimated
        animationDuration={700}
        focusOnPress
        sectionAutoFocus
      />

      <View style={styles.legendWrap}>
        {data.map((slice) => (
          <View key={slice.label} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: slice.color }]} />
            <Text style={[styles.legendText, { color: slice.color }]}>
              {slice.label} {slice.value}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export const CategoryPieChart = memo(CategoryPieChartBase);

const styles = StyleSheet.create({
  legendWrap: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 12.5, fontWeight: "700" },
});