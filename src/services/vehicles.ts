import { Vehicle } from "../types/vehicle";
import { DEMO_VEHICLES } from "../demo/vehiclesDemoData";

/* ============================================================
   VEHICLE SERVICE
   ------------------------------------------------------------
   Repository boundary for the fleet catalog. The Driver wizard
   only ever assigns/unassigns against this store — it never
   creates a Vehicle record. When Laravel is wired up:

     getVehicles()          -> GET  /api/vehicles
     getAvailableVehicles() -> GET  /api/vehicles?status=Available
     assignVehicle()        -> POST /api/vehicles/{id}/assign
     unassignVehicle()      -> POST /api/vehicles/{id}/unassign
============================================================ */

let store: Vehicle[] = [...DEMO_VEHICLES];

function simulateLatency<T>(value: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const VehiclesService = {
  async getVehicles(): Promise<Vehicle[]> {
    return simulateLatency([...store]);
  },

  async getVehicleById(id: string): Promise<Vehicle | null> {
    return simulateLatency(store.find((v) => v.id === id) ?? null, 150);
  },

  /**
   * Vehicles selectable in the "Assign Vehicle" wizard step:
   * every currently-Available vehicle, plus — when editing an
   * existing driver — the vehicle already assigned to *that*
   * driver (so it stays selectable/re-selectable even though its
   * status is technically "Assigned").
   */
  async getAssignableVehicles(currentDriverId?: string): Promise<Vehicle[]> {
    const assignable = store.filter(
      (v) => v.status === "Available" || (currentDriverId && v.assignedDriverId === currentDriverId)
    );
    return simulateLatency(assignable, 300);
  },

  async assignVehicle(vehicleId: string, driverId: string): Promise<Vehicle> {
    let assigned: Vehicle | null = null;
    store = store.map((v) => {
      if (v.id === vehicleId) {
        assigned = { ...v, status: "Assigned", assignedDriverId: driverId };
        return assigned;
      }
      return v;
    });
    if (!assigned) throw new Error("Vehicle not found");
    return simulateLatency(assigned, 300);
  },

  async unassignVehicle(vehicleId: string): Promise<void> {
    store = store.map((v) => (v.id === vehicleId ? { ...v, status: "Available", assignedDriverId: null } : v));
    return simulateLatency(undefined, 300);
  },

  /** Convenience for DriversService: free whichever vehicle belongs to a driver. */
  async unassignVehicleByDriverId(driverId: string): Promise<void> {
    store = store.map((v) => (v.assignedDriverId === driverId ? { ...v, status: "Available", assignedDriverId: null } : v));
    return simulateLatency(undefined, 300);
  },
};