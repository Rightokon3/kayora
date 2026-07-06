import {
  DashboardStats,
  MonthlyRevenue,
  WeeklyOrders,
  OrderCategory,
  RecentOrder,
} from "../types/dashboard";



export const DEMO_DASHBOARD_STATS: DashboardStats = {
  totalCustomers: 12590,
  totalCustomersChangePct: 12,
  activeDrivers: 145,
  activeDriversChangePct: 8,
  totalOrders: 1285,
  totalOrdersChangePct: 24,
  revenue: 4850000,
  revenueChangePct: 18,
};

export const DEMO_MONTHLY_REVENUE: MonthlyRevenue[] = [
  { month: "Jan", revenue: 2100000 },
  { month: "Feb", revenue: 2450000 },
  { month: "Mar", revenue: 2300000 },
  { month: "Apr", revenue: 2900000 },
  { month: "May", revenue: 2600000 },
  { month: "Jun", revenue: 3100000 },
  { month: "Jul", revenue: 3400000 },
  { month: "Aug", revenue: 3250000 },
  { month: "Sep", revenue: 3900000 },
  { month: "Oct", revenue: 4400000 },
  { month: "Nov", revenue: 4150000 },
  { month: "Dec", revenue: 4850000 },
];

export const DEMO_WEEKLY_ORDERS: WeeklyOrders[] = [
  { day: "Mon", orders: 24 },
  { day: "Tue", orders: 19 },
  { day: "Wed", orders: 32 },
  { day: "Thu", orders: 28 },
  { day: "Fri", orders: 45 },
  { day: "Sat", orders: 52 },
  { day: "Sun", orders: 41 },
];

export const DEMO_ORDER_CATEGORIES: OrderCategory[] = [
  { label: "50cl", value: 38, color: "#0D4A8C" },
  { label: "75cl", value: 22, color: "#1565C0" },
  { label: "1L", value: 16, color: "#4FC3F7" },
  { label: "1.5L", value: 10, color: "#22C55E" },
  { label: "5L", value: 7, color: "#F59E0B" },
  { label: "10L", value: 4, color: "#D4A64A" },
  { label: "18.9L", value: 3, color: "#EF4444" },
];

export const DEMO_RECENT_ORDERS: RecentOrder[] = [
  {
    id: "#KYA-809762",
    customerName: "Amaka Obi",
    bottleName: "50cl Sharp-Sharp",
    quantity: 20,
    amount: 24500,
    status: "Delivered",
    driverName: "John Sunday",
    createdAt: new Date().toISOString(),
  },
  {
    id: "#KYA-809741",
    customerName: "Tunde Bakare",
    bottleName: "75cl Sharp-Sharp",
    quantity: 8,
    amount: 12300,
    status: "In Transit",
    driverName: "Michael Osaro",
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: "#KYA-809733",
    customerName: "Grace Idahosa",
    bottleName: "1L Kayora Table Water",
    quantity: 12,
    amount: 15800,
    status: "Assigned",
    driverName: "Bassey Effiong",
    createdAt: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
  },
  {
    id: "#KYA-809720",
    customerName: "Ifeoma Chukwu",
    bottleName: "5L Kayora Table Water",
    quantity: 5,
    amount: 19750,
    status: "Preparing",
    driverName: null,
    createdAt: new Date(Date.now() - 78 * 60 * 1000).toISOString(),
  },
  {
    id: "#KYA-809705",
    customerName: "Chidinma Eze",
    bottleName: "10L Kayora Table Water",
    quantity: 3,
    amount: 36000,
    status: "Pending",
    driverName: null,
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
  },
  {
    id: "#KYA-809688",
    customerName: "Emeka Nwosu",
    bottleName: "18.9L Kayora Table Water",
    quantity: 1,
    amount: 14200,
    status: "Cancelled",
    driverName: null,
    createdAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
  },
];