import { adminApiFetch } from "./adminApi";
import { Order, OrderEditInput, AvailableDriver, OrderStatus } from "../types/order";

export interface OrderFilters {
  search?: string;
  status?: OrderStatus | "all";
  /** 'asap' or 'scheduled' — matches orders.delivery_type (case-insensitive on the backend) */
  deliveryType?: "asap" | "scheduled";
  /** YYYY-MM-DD — filters by scheduled_date, powers the calendar filter */
  date?: string;
}

function buildQuery(filters: OrderFilters): string {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.deliveryType) params.set("deliveryType", filters.deliveryType);
  if (filters.date) params.set("date", filters.date);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const OrdersService = {
  async getOrders(filters: OrderFilters = {}): Promise<Order[]> {
    return adminApiFetch<Order[]>(`/admin/orders${buildQuery(filters)}`);
  },

  async updateOrder(id: string, input: OrderEditInput): Promise<Order> {
    return adminApiFetch<Order>(`/admin/orders/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  async deleteOrder(id: string): Promise<void> {
    await adminApiFetch(`/admin/orders/${encodeURIComponent(id)}`, { method: "DELETE" });
  },

  async getAvailableDrivers(orderId: string): Promise<AvailableDriver[]> {
    return adminApiFetch<AvailableDriver[]>(`/admin/orders/${encodeURIComponent(orderId)}/available-drivers`);
  },

  async assignDriver(orderId: string, driverId: string): Promise<Order> {
    return adminApiFetch<Order>(`/admin/orders/${encodeURIComponent(orderId)}/assign`, {
      method: "POST",
      body: JSON.stringify({ driverId }),
    });
  },
};