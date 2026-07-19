/* ============================================================
   ORDER DOMAIN TYPES
   ------------------------------------------------------------
   Contract between the UI and OrdersService. Shapes are kept
   flat and explicit so they map cleanly onto whatever the
   Laravel API eventually returns from GET /orders, GET
   /orders/{id}, etc. — no component needs to change when the
   mock repository is swapped for real HTTP calls.
============================================================ */

export type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Assigned"
  | "Scheduled"
  | "Preparing"
  | "Out For Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentStatus = "Paid" | "Unpaid" | "Refunded";
export type PaymentMethod = "Card" | "Cash" | "Transfer";
export type DeliveryType = "Instant" | "Scheduled";
export type OrderPriority = "Normal" | "High" | "Urgent";

export type OrderTab = "all" | "pending" | "in_progress" | "completed";

export const STATUS_FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "All Statuses" },
  { key: "Pending", label: "Pending" },
  { key: "Accepted", label: "Accepted" },
  { key: "Assigned", label: "Assigned" },
  { key: "Scheduled", label: "Scheduled" },
  { key: "Preparing", label: "Preparing" },
  { key: "Out For Delivery", label: "Out For Delivery" },
  { key: "Delivered", label: "Delivered" },
  { key: "Cancelled", label: "Cancelled" },
];

// Which statuses count toward each of the 4 tabs / stat cards.
export const IN_PROGRESS_STATUSES: OrderStatus[] = [
  "Accepted",
  "Assigned",
  "Scheduled",
  "Preparing",
  "Out For Delivery",
];
export const COMPLETED_STATUSES: OrderStatus[] = ["Delivered", "Cancelled"];

export interface OrderedProduct {
  bottleName: string;
  size: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface TimelineEvent {
  label: string;
  timestamp: string | null;
  completed: boolean;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
  profilePicture: string | null;
  deliveryAddress: string;
  nearestLandmark: string;
  latitude: number;
  longitude: number;
}

export interface OrderDelivery {
  driverId: string | null;
  driverName: string | null;
  vehicle: string | null;
  estimatedDeliveryTime: string | null;
  distanceKm: number | null;
}

export interface Order {
  id: string;
  orderDate: string; // ISO
  customer: OrderCustomer;
  products: OrderedProduct[];
  amount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId: string;
  deliveryType: DeliveryType;
  scheduledDate: string | null; // ISO date, only if deliveryType === "Scheduled"
  scheduledTime: string | null; // e.g. "2:00 PM"
  priority: OrderPriority;
  delivery: OrderDelivery;
  timeline: TimelineEvent[];
  specialInstructions: string;
}

/* ============================================================
   EDIT ORDER FORM SHAPE
============================================================ */
export interface OrderEditInput {
  deliveryDate: string;
  deliveryTime: string;
  deliveryAddress: string;
  deliveryNotes: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  priority: OrderPriority;
  driverId: string | null;
  specialInstructions: string;
}

/* ============================================================
   AVAILABLE DRIVER (for Assign Driver modal)
============================================================ */
export interface AvailableDriver {
  id: string;
  driverId: string;
  name: string;
  phone: string;
  profileImage?: string;
  status: "active" | "delivering";
  assignedDeliveries: number;
  vehicle: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}