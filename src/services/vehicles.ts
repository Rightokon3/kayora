import { adminApiFetch } from "./adminApi";
import { Vehicle } from "../types/vehicle";

export const VehiclesService = {
  /**
   * Vehicles with assigned_driver_id null/0, plus (when editing) whatever
   * vehicle is currently assigned to currentDriverId, so it doesn't
   * disappear from the list while editing that same driver.
   */
  async getAssignableVehicles(currentDriverId?: string): Promise<Vehicle[]> {
    const query = currentDriverId ? `?currentDriverId=${encodeURIComponent(currentDriverId)}` : "";
    return adminApiFetch<Vehicle[]>(`/admin/vehicles/assignable${query}`);
  },

  async getVehicleById(id: string): Promise<Vehicle | null> {
    if (!id) return null;
    try {
      return await adminApiFetch<Vehicle>(`/admin/vehicles/${id}`);
    } catch {
      return null;
    }
  },
};