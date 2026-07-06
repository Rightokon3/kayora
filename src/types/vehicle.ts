/* ============================================================
   VEHICLE DOMAIN TYPES
   ------------------------------------------------------------
   Vehicles are a separate catalog managed independently of
   drivers (e.g. a future Fleet/Vehicles admin page). The Driver
   wizard's "Assign Vehicle" step only ever *selects* an existing
   Vehicle record — it never creates one. Assigning a vehicle to
   a driver flips its status to "Assigned" and removes it from
   the available pool; deleting a driver or reassigning them to
   a different vehicle frees the old one back to "Available".
============================================================ */

export type VehicleStatus = "Available" | "Assigned" | "Maintenance";

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  vehicleType: string;
  plateNumber: string;
  engineNumber: string;
  chassisNumber: string;
  color: string;
  image: string | null;
  registrationImage: string | null;
  status: VehicleStatus;
  assignedDriverId: string | null;
}

export const VEHICLE_TYPES = ["Van", "Truck", "Mini Truck", "Pickup", "Motorcycle"] as const;
export const VEHICLE_STATUSES: VehicleStatus[] = ["Available", "Assigned", "Maintenance"];