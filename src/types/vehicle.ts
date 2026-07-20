export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  vehicleType: string;
  plateNumber: string;
  engineNumber: string | null;
  chassisNumber: string | null;
  color: string | null;
  image: string | null;
  status: "Available" | "Assigned" | "Maintenance";
  assignedDriverId: string | null;
}