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
  month: string; // "Jan" ... "Dec"
  revenue: number;
}

export interface WeeklyOrders {
  day: string; // "Mon" ... "Sun"
  orders: number;
}

export interface OrderCategory {
  label: string; // bottle size, e.g. "50cl"
  value: number; // percentage share
  color: string;
}

export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Assigned"
  | "In Transit"
  | "Delivered"
  | "Cancelled";

export interface RecentOrder {
  id: string; // e.g. "#KYA-809762"
  customerName: string;
  bottleName: string;
  quantity: number;
  amount: number;
  status: OrderStatus;
  driverName: string | null;
  createdAt: string; // ISO timestamp
}