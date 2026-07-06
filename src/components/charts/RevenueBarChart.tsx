import React, { memo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { Palette } from "../../contexts/ThemeContext";
import { MonthlyRevenue } from "../../types/dashboard";
import { formatNaira } from "../../utils/formatters";

function RevenueBarChartBase({
  palette,
  data,
}: {
  palette: Palette;
  data: MonthlyRevenue[];
}) {
  const [tooltip, setTooltip] = useState<{ month: string; revenue: number } | null>(null);

  const barData = data.map((point) => ({
    value: point.revenue,
    label: point.month,
    frontColor: palette.primary,
    onPress: () => setTooltip({ month: point.month, revenue: point.revenue }),
  }));

  return (
    <View>
      {tooltip && (
        <View style={[styles.tooltip, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Text style={[styles.tooltipTitle, { color: palette.muted }]}>{tooltip.month}</Text>
          <Text style={[styles.tooltipValue, { color: palette.primary }]}>
            Revenue: {formatNaira(tooltip.revenue)}
          </Text>
        </View>
      )}

      <BarChart
        data={barData}
        barWidth={18}
        spacing={14}
        roundedTop
        hideRules={false}
        rulesType="dashed"
        rulesColor={palette.border}
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: palette.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: palette.muted, fontSize: 10 }}
        noOfSections={4}
        isAnimated
        animationDuration={600}
        height={220}
        initialSpacing={12}
      />

      <View style={styles.legendRow}>
        <View style={[styles.legendSwatch, { backgroundColor: palette.primary }]} />
        <Text style={[styles.legendText, { color: palette.muted }]}>revenue</Text>
      </View>
    </View>
  );
}

export const RevenueBarChart = memo(RevenueBarChartBase);

const styles = StyleSheet.create({
  tooltip: {
    position: "absolute",
    top: 8,
    left: 40,
    zIndex: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tooltipTitle: { fontSize: 11, fontWeight: "600" },
  tooltipValue: { fontSize: 13, fontWeight: "800", marginTop: 2 },
  legendRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 12, fontWeight: "600" },
});