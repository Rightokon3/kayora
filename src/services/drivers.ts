import { adminApiFetch } from "./adminApi";
import { Driver, DriverFormInput, DriverLocation } from "../types/driver";

export const DriversService = {
  async getDrivers(search: string = ""): Promise<Driver[]> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    return adminApiFetch<Driver[]>(`/admin/drivers${query}`);
  },

  async createDriver(input: DriverFormInput): Promise<Driver> {
    return adminApiFetch<Driver>("/admin/drivers", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateDriver(id: string, input: DriverFormInput): Promise<Driver> {
    return adminApiFetch<Driver>(`/admin/drivers/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  async deleteDriver(id: string): Promise<void> {
    await adminApiFetch(`/admin/drivers/${id}`, { method: "DELETE" });
  },

  /** The "set password" step shown right after a driver is created. */
  async setPassword(id: string, password: string, passwordConfirmation: string): Promise<void> {
    await adminApiFetch(`/admin/drivers/${id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ password, password_confirmation: passwordConfirmation }),
    });
  },

  async trackDriver(id: string): Promise<DriverLocation & { onDuty: boolean }> {
    const raw = await adminApiFetch<{
      latitude: number | null;
      longitude: number | null;
      speed: number;
      updatedAt: string | null;
      onDuty: boolean;
    }>(`/admin/drivers/${id}/track`);

    return {
      latitude: raw.latitude ?? 0,
      longitude: raw.longitude ?? 0,
      speed: raw.speed ?? 0,
      updatedAt: raw.updatedAt ?? "",
      onDuty: raw.onDuty,
    };
  },
};