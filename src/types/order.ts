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
export type OrderPriority = "Normal" | "High" | "Urgent";
export type OrderTab = "all" | "pending" | "in_progress" | "completed";

export const IN_PROGRESS_STATUSES: OrderStatus[] = ["Accepted", "Assigned", "Preparing", "Out For Delivery"];
export const COMPLETED_STATUSES: OrderStatus[] = ["Delivered"];

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

export interface OrderProductLine {
  bottleName: string;
  size: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  email: string;
  deliveryAddress: string;
  nearestLandmark: string;
  latitude: number;
  longitude: number;
  profilePicture: string | null;
}

export interface OrderDelivery {
  driverId: string | null;
  driverName: string | null;
  vehicle: string | null;
  estimatedDeliveryTime: string | null;
  distanceKm: number | null;
}

export interface TimelineEvent {
  label: string;
  completed: boolean;
  timestamp: string | null;
}

export interface Order {
  id: string;
  customer: OrderCustomer;
  products: OrderProductLine[];
  amount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  transactionId: string;
  deliveryType: "Instant" | "Scheduled";
  scheduledDate: string | null;
  scheduledTime: string | null;
  priority: OrderPriority;
  specialInstructions: string;
  orderDate: string;
  delivery: OrderDelivery;
  timeline: TimelineEvent[];
}

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

export interface AvailableDriver {
  id: string;
  driverId: string;
  name: string;
  profileImage: string | null;
  status: "active" | "delivering";
  phone: string;
  vehicle: string;
  distanceKm: number;
  assignedDeliveries: number;
}