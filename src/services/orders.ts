import { Order, OrderEditInput, OrderStatus, AvailableDriver } from "../types/order";
import { DEMO_ORDERS } from "../demo/ordersDemoData";
import { DriversService } from "./drivers";

/* ============================================================
   ORDERS SERVICE
   ------------------------------------------------------------
   Repository boundary for the Orders screen. Holds an in-memory
   copy of the demo order book, and reuses DriversService as the
   source of truth for "available drivers" in the assign flow —
   so a driver assigned here shows up busy/delivering in the
   Drivers screen too, the same way it would once both are
   backed by the same Laravel API.

     getOrders()            -> GET    /orders
     getOrderById()         -> GET    /orders/{id}
     searchOrders()         -> GET    /orders/search?q=
     filterOrders()         -> GET    /orders/filter
     updateOrder()          -> PUT    /orders/{id}
     deleteOrder()          -> DELETE /orders/{id}
     getAvailableDrivers()  -> GET    /drivers/available
     assignDriver()         -> POST   /orders/{id}/assign-driver
============================================================ */

let store: Order[] = [...DEMO_ORDERS];

function simulateLatency<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const OrdersService = {
  async getOrders(): Promise<Order[]> {
    return simulateLatency([...store]);
  },

  async getOrderById(id: string): Promise<Order | null> {
    return simulateLatency(store.find((o) => o.id === id) ?? null, 200);
  },

  async searchOrders(query: string): Promise<Order[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return simulateLatency([...store], 150);
    const filtered = store.filter(
      (o) =>
        o.id.toLowerCase().includes(normalized) ||
        o.customer.name.toLowerCase().includes(normalized) ||
        o.customer.phone.toLowerCase().includes(normalized) ||
        o.customer.deliveryAddress.toLowerCase().includes(normalized) ||
        o.products.some(
          (p) => p.bottleName.toLowerCase().includes(normalized) || p.size.toLowerCase().includes(normalized)
        )
    );
    return simulateLatency(filtered, 200);
  },

  async filterOrders(status: OrderStatus | "all"): Promise<Order[]> {
    if (status === "all") return simulateLatency([...store], 150);
    return simulateLatency(
      store.filter((o) => o.status === status),
      150
    );
  },

  async updateOrder(id: string, input: OrderEditInput): Promise<Order> {
    let updated: Order | null = null;
    store = store.map((o) => {
      if (o.id === id) {
        updated = {
          ...o,
          customer: { ...o.customer, deliveryAddress: input.deliveryAddress },
          scheduledDate: input.deliveryDate || o.scheduledDate,
          scheduledTime: input.deliveryTime || o.scheduledTime,
          paymentStatus: input.paymentStatus,
          status: input.status,
          priority: input.priority,
          specialInstructions: input.specialInstructions,
        };
        return updated;
      }
      return o;
    });
    if (!updated) throw new Error("Order not found");
    return simulateLatency(updated, 700);
  },

  async deleteOrder(id: string): Promise<void> {
    store = store.filter((o) => o.id !== id);
    return simulateLatency(undefined, 500);
  },

  async getAvailableDrivers(orderId: string): Promise<AvailableDriver[]> {
    const order = store.find((o) => o.id === orderId);
    const drivers = await DriversService.getDrivers();

    const available = drivers.filter((d) => d.status === "active" || d.status === "delivering");

    return simulateLatency(
      available.map((d) => ({
        id: d.id,
        driverId: d.driverId,
        name: `${d.firstName} ${d.lastName}`,
        phone: d.phone,
        profileImage: d.profileImage,
        status: d.status as "active" | "delivering",
        assignedDeliveries: d.status === "delivering" ? 1 : 0,
        vehicle: `${d.vehicle.brand} ${d.vehicle.model} · ${d.vehicle.plateNumber}`,
        latitude: d.location.latitude,
        longitude: d.location.longitude,
        distanceKm: order
          ? Number(haversineKm(d.location.latitude, d.location.longitude, order.customer.latitude, order.customer.longitude).toFixed(1))
          : 0,
      })),
      400
    );
  },

  async assignDriver(orderId: string, driverId: string): Promise<Order> {
    const drivers = await DriversService.getDrivers();
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) throw new Error("Driver not found");

    let updated: Order | null = null;
    store = store.map((o) => {
      if (o.id === orderId) {
        const now = new Date().toISOString();
        updated = {
          ...o,
          status: "Assigned",
          delivery: {
            driverId: driver.id,
            driverName: `${driver.firstName} ${driver.lastName}`,
            vehicle: `${driver.vehicle.brand} ${driver.vehicle.model} · ${driver.vehicle.plateNumber}`,
            estimatedDeliveryTime: "30 min",
            distanceKm: Number(
              haversineKm(driver.location.latitude, driver.location.longitude, o.customer.latitude, o.customer.longitude).toFixed(1)
            ),
          },
          timeline: o.timeline.map((event) =>
            event.label === "Driver Assigned" ? { ...event, completed: true, timestamp: now } : event
          ),
        };
        return updated;
      }
      return o;
    });
    if (!updated) throw new Error("Order not found");
    return simulateLatency(updated, 700);
  },
};