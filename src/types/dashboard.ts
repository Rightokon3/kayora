/* ============================================================
   DASHBOARD TYPES
   ------------------------------------------------------------
   Shapes here are derived directly from how each chart component
   actually reads its `data` prop:
     - MonthlyRevenue: RevenueBarChart reads point.revenue, point.month
     - WeeklyOrders:   OrdersLineChart reads point.orders, point.day
     - OrderCategory:  CategoryPieChart reads slice.value, slice.color,
                       slice.label — color is assigned client-side in
                       DashboardServices.ts since the backend only
                       returns size + percentage, not a color.
     - DashboardStats: matches DashboardController::stats()'s JSON
                       response key-for-key, no mapping needed.
     - RecentOrder:    Confirmed against RecentOrdersTable.tsx's actual
                       prop usage — id (not orderId), customerName,
                       bottleName, driverName (nullable — "Unassigned"
                       when null), status, amount, quantity, createdAt.
============================================================ */

export interface DashboardStats {
  totalCustomers: number;
  totalCustomersChangePct: number;
  activeDrivers: number;
  activeDriversChangePct: number;
  totalOrders: number;
  totalOrdersChangePct: number;
  revenue: number;
  revenueChangePct: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface WeeklyOrders {
  day: string;
  orders: number;
}

export interface OrderCategory {
  label: string;
  value: number; // percentage, e.g. 38 for "38%"
  color: string;
}

export interface RecentOrder {
  id: string;
  customerName: string;
  bottleName: string;
  quantity: number;
  amount: number;
  status: string;
  driverName: string | null;
  createdAt: string;
}