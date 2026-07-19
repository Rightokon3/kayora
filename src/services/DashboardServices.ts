import { adminApiFetch } from "./adminApi";
import {
  DashboardStats,
  MonthlyRevenue,
  WeeklyOrders,
  OrderCategory,
  RecentOrder,
} from "../types/dashboard";

/* ============================================================
   DASHBOARD SERVICE
   ------------------------------------------------------------
   Talks to:
     GET  /admin/dashboard/stats
     GET  /admin/dashboard/revenue-monthly
     GET  /admin/dashboard/orders-weekly
     GET  /admin/dashboard/order-categories
     GET  /admin/dashboard/recent-orders
     POST /admin/dashboard/revenue

   Only getOrderCategories() needs real mapping — the backend
   returns { size, quantity, percentage } (no color, since color
   is a presentation concern, not data), so this is the one place
   that assigns a color per slice. Order is stable because the
   backend sorts by quantity descending, so the largest slice
   always gets the same first color.
============================================================ */

const CATEGORY_COLORS = [
  "#2E6BE6", // primary blue
  "#38BDF8", // sky
  "#22C55E", // green
  "#F59E0B", // amber
  "#A855F7", // purple
  "#EF4444", // red
  "#10B981", // teal
  "#EAB308", // yellow
];

interface RawOrderCategory {
  size: string;
  quantity: number;
  percentage: number;
}

interface RawRecentOrder {
  id: string;
  customerName: string;
  bottleName: string;
  quantity: number;
  amount: number;
  status: string;
  driverName: string | null;
  createdAt: string;
}

export const DashboardService = {
  async getStats(): Promise<DashboardStats> {
    return adminApiFetch<DashboardStats>("/admin/dashboard/stats");
  },

  async getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
    return adminApiFetch<MonthlyRevenue[]>("/admin/dashboard/revenue-monthly");
  },

  async getWeeklyOrders(): Promise<WeeklyOrders[]> {
    return adminApiFetch<WeeklyOrders[]>("/admin/dashboard/orders-weekly");
  },

  async getOrderCategories(): Promise<OrderCategory[]> {
    const raw = await adminApiFetch<RawOrderCategory[]>("/admin/dashboard/order-categories");
    return raw.map((row, index) => ({
      label: row.size,
      value: row.percentage,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  },

  async getRecentOrders(limit: number = 6): Promise<RecentOrder[]> {
    // Backend already returns the exact shape RecentOrdersTable expects
    // (id, customerName, bottleName, driverName, etc.) — no remapping
    // needed here, unlike getOrderCategories() above.
    return adminApiFetch<RawRecentOrder[]>(`/admin/dashboard/recent-orders?limit=${limit}`);
  },

  /**
   * Lets an admin log a day's revenue — this is what the Revenue Overview
   * chart and stat card both read from. entryDate should be "YYYY-MM-DD".
   */
  async logRevenue(entryDate: string, amount: number, note?: string): Promise<void> {
    await adminApiFetch("/admin/dashboard/revenue", {
      method: "POST",
      body: JSON.stringify({ entry_date: entryDate, amount, note }),
    });
  },
};