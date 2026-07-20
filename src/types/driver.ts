export type DriverStatus = "active" | "offline" | "break" | "delivering";

/**
 * "break" has no backing data anywhere in the schema (drivers.duty_status
 * is only ever on_duty/off_duty) — the backend never emits it. It stays
 * in this union only because StatusBadge.tsx already has a color/label
 * defined for it.
 */

export const GENDERS = ["Male", "Female"] as const;
export const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed"] as const;

export interface DriverLocation {
  latitude: number;
  longitude: number;
  speed: number;
  updatedAt: string;
}

export interface DriverVehicleSummary {
  vehicleId: string;
  brand: string;
  model: string;
  plateNumber: string;
}

/** Pre-fills the edit form — absent (undefined) for a driver with no driver_profiles row yet. */
export interface DriverProfileDetails {
  middleName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  alternativePhone: string;
  homeAddress: string;
  city: string;
  state: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface DriverRoadDetails {
  licenseNumber: string;
  licenseExpiry: string;
  licenseFrontImage: string | null;
  licenseBackImage: string | null;
  nationalIdNumber: string;
  nationalIdImage: string | null;
  yearsOfExperience: string;
  previousEmployer: string;
  additionalNotes: string;
}

export interface Driver {
  id: string;
  driverId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage: string | null;
  status: DriverStatus;
  vehicle: DriverVehicleSummary;
  location: DriverLocation | null;
  profileDetails?: DriverProfileDetails;
  roadDetails?: DriverRoadDetails;
}

/* ============================================================
   FORM INPUT — shape sent to POST/PUT /admin/drivers
============================================================ */
export interface DriverPersonalInfo {
  firstName: string;
  lastName: string;
  middleName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  email: string;
  phone: string;
  alternativePhone: string;
  homeAddress: string;
  city: string;
  state: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  profileImage: string | null;
}

export interface DriverVehicleSelection {
  vehicleId: string;
}

export interface DriverRoadInfo {
  licenseNumber: string;
  licenseExpiry: string;
  licenseFrontImage: string | null;
  licenseBackImage: string | null;
  nationalIdNumber: string;
  nationalIdImage: string | null;
  yearsOfExperience: string;
  previousEmployer: string;
  additionalNotes: string;
}

export interface DriverFormInput {
  personal: DriverPersonalInfo;
  vehicle: DriverVehicleSelection;
  road: DriverRoadInfo;
}

export const EMPTY_DRIVER_FORM: DriverFormInput = {
  personal: {
    firstName: "",
    lastName: "",
    middleName: "",
    gender: "",
    dateOfBirth: "",
    maritalStatus: "",
    email: "",
    phone: "",
    alternativePhone: "",
    homeAddress: "",
    city: "",
    state: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    profileImage: null,
  },
  vehicle: { vehicleId: "" },
  road: {
    licenseNumber: "",
    licenseExpiry: "",
    licenseFrontImage: null,
    licenseBackImage: null,
    nationalIdNumber: "",
    nationalIdImage: null,
    yearsOfExperience: "",
    previousEmployer: "",
    additionalNotes: "",
  },
};