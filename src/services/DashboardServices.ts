import {
  DashboardStats,
  MonthlyRevenue,
  WeeklyOrders,
  OrderCategory,
  RecentOrder,
} from "../types/dashboard";
import {
  DEMO_DASHBOARD_STATS,
  DEMO_MONTHLY_REVENUE,
  DEMO_WEEKLY_ORDERS,
  DEMO_ORDER_CATEGORIES,
  DEMO_RECENT_ORDERS,
} from "../demo/dashboradDemoData";

/* ============================================================
   DASHBOARD SERVICE
   ------------------------------------------------------------
   Acts as the repository boundary for the Dashboard screen.
   Every method currently resolves from local demo data behind
   a small artificial delay (to exercise loading states the same
   way a real network call would). When the Laravel API is
   ready, only the function bodies below change — e.g.:

     const res = await api.get<DashboardStats>("/admin/dashboard/stats");
     return res.data;

   No component or type importing from this file needs to change.
============================================================ */

function simulateLatency<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const DashboardService = {
  async getStats(): Promise<DashboardStats> {
    return simulateLatency(DEMO_DASHBOARD_STATS);
  },

  async getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
    return simulateLatency(DEMO_MONTHLY_REVENUE);
  },

  async getWeeklyOrders(): Promise<WeeklyOrders[]> {
    return simulateLatency(DEMO_WEEKLY_ORDERS);
  },

  async getOrderCategories(): Promise<OrderCategory[]> {
    return simulateLatency(DEMO_ORDER_CATEGORIES);
  },

  async getRecentOrders(): Promise<RecentOrder[]> {
    return simulateLatency(DEMO_RECENT_ORDERS);
  },
};