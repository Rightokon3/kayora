import { memo, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { Palette } from "../../contexts/ThemeContext";
import { WeeklyOrders } from "../../types/dashboard";

function OrdersLineChartBase({
  palette,
  data,
}: {
  palette: Palette;
  data: WeeklyOrders[];
}) {
  const lineData = data.map((point) => ({
    value: point.orders,
    label: point.day,
    dataPointText: String(point.orders),
  }));

  const [selectedPointIndex, setSelectedPointIndex] = useState(
    Math.max(lineData.length - 1, 0),
  );

  const chartPoints = useMemo(() => {
    const values = lineData.map((point) => point.value);
    // Ensure the chart always includes 0..50 range for clearer comparisons on web.
    // If data exceeds 50, expand to fit the actual max value.
    const FIXED_MAX = 50;
    const maxValue = Math.max(Math.max(...values), FIXED_MAX);
    const minValue = 0;
    const range = maxValue - minValue || 1;
    const width = 320;
    const height = 220;
    const padding = 24;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    return lineData.map((point, index) => {
      const x =
        padding + (innerWidth / Math.max(lineData.length - 1, 1)) * index;
      const normalized = (point.value - minValue) / range;
      const y = padding + innerHeight - normalized * innerHeight;

      return { ...point, x, y };
    });
  }, [lineData]);

  const chartWidth = 320;
  const chartHeight = 220;
  const padding = 24;
  const lastPoint = chartPoints[chartPoints.length - 1];
  const firstPoint = chartPoints[0];
  const selectedPoint = chartPoints[selectedPointIndex] ?? chartPoints[0];

  const linePath = chartPoints
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(" ");
  const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)} ${(chartHeight - padding).toFixed(2)} L ${firstPoint.x.toFixed(2)} ${(chartHeight - padding).toFixed(2)} Z`;

  if (Platform.OS === "web") {
    return (
      <View>
        <View style={styles.webChartFrame}>
          <Svg
            width="100%"
            height={220}
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          >
            <Defs>
              <LinearGradient id="ordersFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop
                  offset="0%"
                  stopColor={palette.secondary}
                  stopOpacity="0.28"
                />
                <Stop
                  offset="100%"
                  stopColor={palette.background}
                  stopOpacity="0.02"
                />
              </LinearGradient>
            </Defs>

            <Path d={areaPath} fill="url(#ordersFill)" />
            <Path
              d={linePath}
              fill="none"
              stroke={palette.secondary}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <Line
              x1={padding}
              y1={chartHeight - padding}
              x2={chartWidth - padding}
              y2={chartHeight - padding}
              stroke={palette.border}
              strokeDasharray="4 3"
            />

            {chartPoints.map((point, index) => (
              <G
                key={`${point.label}-${index}`}
                onPress={() => setSelectedPointIndex(index)}
              >
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={selectedPointIndex === index ? 6.5 : 4.5}
                  fill={palette.secondary}
                />
              </G>
            ))}

            {chartPoints.map((point, index) => (
              <SvgText
                key={`${point.label}-label-${index}`}
                x={point.x}
                y={chartHeight - 6}
                textAnchor="middle"
                fontSize="10"
                fill={palette.muted}
              >
                {point.label}
              </SvgText>
            ))}
          </Svg>

          {selectedPoint ? (
            <View
              style={[
                styles.webTooltip,
                {
                  backgroundColor: palette.card,
                  borderColor: palette.border,
                },
              ]}
            >
              <Text style={[styles.webTooltipTitle, { color: palette.muted }]}>
                {selectedPoint.label}
              </Text>
              <Text
                style={[styles.webTooltipValue, { color: palette.secondary }]}
              >
                orders : {selectedPoint.value}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.legendRow}>
          <View
            style={[styles.legendDot, { backgroundColor: palette.secondary }]}
          />
          <Text style={[styles.legendText, { color: palette.muted }]}>
            orders
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View>
      <LineChart
        data={lineData}
        curved
        color={palette.secondary}
        thickness={2.5}
        dataPointsColor={palette.secondary}
        dataPointsRadius={4}
        startFillColor={palette.secondary}
        endFillColor={palette.background}
        startOpacity={0.25}
        endOpacity={0.02}
        areaChart
        hideRules={false}
        rulesType="dashed"
        rulesColor={palette.border}
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: palette.muted, fontSize: 10 }}
        xAxisLabelTextStyle={{ color: palette.muted, fontSize: 10 }}
        noOfSections={4}
        isAnimated
        animationDuration={700}
        height={220}
        initialSpacing={16}
        spacing={44}
        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: palette.border,
          pointerStripWidth: 1,
          pointerColor: palette.secondary,
          radius: 5,
          pointerLabelWidth: 110,
          pointerLabelHeight: 60,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (
            items: { value: number; label?: string }[],
          ) => (
            <View
              style={[
                styles.tooltip,
                { backgroundColor: palette.card, borderColor: palette.border },
              ]}
            >
              <Text style={[styles.tooltipTitle, { color: palette.muted }]}>
                {items[0]?.label}
              </Text>
              <Text style={[styles.tooltipValue, { color: palette.secondary }]}>
                orders : {items[0]?.value}
              </Text>
            </View>
          ),
        }}
      />

      <View style={styles.legendRow}>
        <View
          style={[styles.legendDot, { backgroundColor: palette.secondary }]}
        />
        <Text style={[styles.legendText, { color: palette.muted }]}>
          orders
        </Text>
      </View>
    </View>
  );
}

export const OrdersLineChart = memo(OrdersLineChartBase);

const styles = StyleSheet.create({
  tooltip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tooltipTitle: { fontSize: 10.5, fontWeight: "600" },
  tooltipValue: { fontSize: 12.5, fontWeight: "800", marginTop: 2 },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: "600" },
  webChartFrame: {
    borderRadius: 16,
    overflow: "hidden",
    paddingTop: 4,
    position: "relative",
  },
  webTooltip: {
    position: "absolute",
    top: 10,
    right: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  webTooltipTitle: { fontSize: 10.5, fontWeight: "600" },
  webTooltipValue: { fontSize: 12.5, fontWeight: "800", marginTop: 2 },
});
