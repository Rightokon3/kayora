import { Driver, DriverFormInput } from "../types/driver";
import { DEMO_DRIVERS } from "../demo/driversDemoData";


let store: Driver[] = [...DEMO_DRIVERS];

function simulateLatency<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function generateDriverId(): string {
  const numeric = Math.floor(10000 + Math.random() * 89999);
  return `DRV-${numeric}`;
}

function toDriver(id: string, driverId: string, input: DriverFormInput, previous?: Driver): Driver {
  return {
    id,
    driverId,
    firstName: input.personal.firstName,
    lastName: input.personal.lastName,
    email: input.personal.email,
    phone: input.personal.phone,
    profileImage: input.personal.profileImage ?? undefined,
    status: previous?.status ?? "offline",
    vehicle: {
      brand: input.vehicle.brand,
      model: input.vehicle.model,
      plateNumber: input.vehicle.plateNumber,
      engineNumber: input.vehicle.engineNumber,
      chassisNumber: input.vehicle.chassisNumber,
      image: input.vehicle.image ?? undefined,
    },
    location:
      previous?.location ?? {
        latitude: 6.335,
        longitude: 5.6037,
        speed: 0,
        updatedAt: new Date().toISOString(),
      },
  };
}

export const DriversService = {
  async getDrivers(): Promise<Driver[]> {
    return simulateLatency([...store]);
  },

  async searchDrivers(query: string): Promise<Driver[]> {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return simulateLatency([...store], 150);
    const filtered = store.filter(
      (d) =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(normalized) ||
        d.driverId.toLowerCase().includes(normalized) ||
        d.phone.toLowerCase().includes(normalized) ||
        d.vehicle.plateNumber.toLowerCase().includes(normalized)
    );
    return simulateLatency(filtered, 150);
  },

  async createDriver(input: DriverFormInput): Promise<Driver> {
    const driver = toDriver(`${Date.now()}`, generateDriverId(), input);
    store = [driver, ...store];
    return simulateLatency(driver, 800);
  },

  async updateDriver(id: string, input: DriverFormInput): Promise<Driver> {
    let updated: Driver | null = null;
    store = store.map((d) => {
      if (d.id === id) {
        updated = toDriver(d.id, d.driverId, input, d);
        return updated;
      }
      return d;
    });
    if (!updated) throw new Error("Driver not found");
    return simulateLatency(updated, 800);
  },

  async deleteDriver(id: string): Promise<void> {
    store = store.filter((d) => d.id !== id);
    return simulateLatency(undefined, 500);
  },

  async trackDriver(id: string): Promise<Driver["location"]> {
    const driver = store.find((d) => d.id === id);
    if (!driver) throw new Error("Driver not found");

    // Simulated live movement — replace with a WebSocket subscription later.
    const jitteredLocation = {
      latitude: driver.location.latitude + (Math.random() - 0.5) * 0.0015,
      longitude: driver.location.longitude + (Math.random() - 0.5) * 0.0015,
      speed: Math.max(0, Math.round(driver.location.speed + (Math.random() - 0.5) * 8)),
      updatedAt: new Date().toISOString(),
    };
    store = store.map((d) => (d.id === id ? { ...d, location: jitteredLocation } : d));
    return simulateLatency(jitteredLocation, 400);
  },
};