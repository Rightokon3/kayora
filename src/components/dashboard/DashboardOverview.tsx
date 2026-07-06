import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";
import { DashboardService } from "../../services/DashboardServices";
import {
  DashboardStats,
  MonthlyRevenue,
  WeeklyOrders,
  OrderCategory,
  RecentOrder,
} from "../../types/dashboard";
import { StatCard } from "../cards/StatCard";
import { RevenueBarChart } from "../charts/RevenueBarChart";
import { OrdersLineChart } from "../charts/OrdersLineChart";
import { CategoryPieChart } from "../charts/CategoryPieChart";
import { RecentOrdersTable } from "../table/RecentOrdersTable";
import { formatNaira, formatCompactNumber } from "../../utils/formatters";

interface DashboardData {
  stats: DashboardStats;
  monthlyRevenue: MonthlyRevenue[];
  weeklyOrders: WeeklyOrders[];
  orderCategories: OrderCategory[];
  recentOrders: RecentOrder[];
}

export function DashboardOverview() {
  const { palette } = useTheme();
  const { isDesktop, isTablet } = useResponsive();
  const twoColumn = isDesktop || isTablet;

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const [stats, monthlyRevenue, weeklyOrders, orderCategories, recentOrders] = await Promise.all([
      DashboardService.getStats(),
      DashboardService.getMonthlyRevenue(),
      DashboardService.getWeeklyOrders(),
      DashboardService.getOrderCategories(),
      DashboardService.getRecentOrders(),
    ]);
    setData({ stats, monthlyRevenue, weeklyOrders, orderCategories, recentOrders });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading || !data) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  return (
    <View>
      <Text style={[styles.title, { color: palette.text }]}>Dashboard Overview</Text>

      {/* ---------- STAT CARDS ---------- */}
      <View style={[styles.statsRow, !twoColumn && { flexDirection: "column" }]}>
        <StatCard
          palette={palette}
          title="Total Customers"
          value={formatCompactNumber(data.stats.totalCustomers)}
          changePct={data.stats.totalCustomersChangePct}
          delay={0}
        />
        <StatCard
          palette={palette}
          title="Active Drivers"
          value={formatCompactNumber(data.stats.activeDrivers)}
          changePct={data.stats.activeDriversChangePct}
          delay={60}
        />
        <StatCard
          palette={palette}
          title="Total Orders"
          value={formatCompactNumber(data.stats.totalOrders)}
          changePct={data.stats.totalOrdersChangePct}
          delay={120}
        />
        <StatCard
          palette={palette}
          title="Revenue"
          value={formatNaira(data.stats.revenue)}
          changePct={data.stats.revenueChangePct}
          delay={180}
        />
      </View>

      {/* ---------- REVENUE + ORDERS TREND ---------- */}
      <View style={[styles.chartsRow, !twoColumn && { flexDirection: "column" }]}>
        <Animated.View
          entering={FadeInDown.duration(450).delay(220)}
          style={[styles.chartCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.cardTitle, { color: palette.text }]}>Revenue Overview</Text>
          <Text style={[styles.cardSubtitle, { color: palette.muted }]}>Monthly revenue for the current year</Text>
          <View style={{ marginTop: 18 }}>
            <RevenueBarChart palette={palette} data={data.monthlyRevenue} />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(450).delay(260)}
          style={[styles.chartCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.cardTitle, { color: palette.text }]}>Orders Trend</Text>
          <Text style={[styles.cardSubtitle, { color: palette.muted }]}>Daily orders for the current week</Text>
          <View style={{ marginTop: 18 }}>
            <OrdersLineChart palette={palette} data={data.weeklyOrders} />
          </View>
        </Animated.View>
      </View>

      {/* ---------- CATEGORIES + RECENT ORDERS ---------- */}
      <View style={[styles.chartsRow, !twoColumn && { flexDirection: "column" }]}>
        <Animated.View
          entering={FadeInDown.duration(450).delay(300)}
          style={[styles.chartCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.cardTitle, { color: palette.text }]}>Order Categories</Text>
          <Text style={[styles.cardSubtitle, { color: palette.muted }]}>Distribution of orders by bottle size</Text>
          <View style={{ marginTop: 18 }}>
            <CategoryPieChart palette={palette} data={data.orderCategories} />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.duration(450).delay(340)}
          style={[styles.chartCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.cardTitle, { color: palette.text }]}>Recent Orders</Text>
          <Text style={[styles.cardSubtitle, { color: palette.muted }]}>Latest orders from customers</Text>
          <View style={{ marginTop: 18 }}>
            <RecentOrdersTable palette={palette} data={data.recentOrders} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 80, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 20 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 20 },
  chartsRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 20 },
  chartCard: { flex: 1, minWidth: 320, borderWidth: 1, borderRadius: 18, padding: 20 },
  cardTitle: { fontSize: 17, fontWeight: "800" },
  cardSubtitle: { fontSize: 12.5, marginTop: 4 },
});