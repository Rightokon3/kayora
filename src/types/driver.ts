

export type DriverStatus = "active" | "offline" | "break" | "delivering";
export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed";
export type Gender = "Male" | "Female";

export interface Driver {
  id: string;
  driverId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string;
  status: DriverStatus;
  vehicle: {
    vehicleId: string; // reference back into the Vehicle catalog
    brand: string;
    model: string;
    plateNumber: string;
    engineNumber: string;
    chassisNumber: string;
    image?: string;
  };
  location: {
    latitude: number;
    longitude: number;
    speed: number;
    updatedAt: string;
  };
}

/* ============================================================
   ADD / EDIT WIZARD FORM SHAPE
============================================================ */
export interface DriverPersonalInfo {
  firstName: string;
  lastName: string;
  middleName: string;
  gender: Gender | "";
  dateOfBirth: string;
  maritalStatus: MaritalStatus | "";
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

export interface DriverVehicleAssignment {
  vehicleId: string; // id of the selected Vehicle from the catalog, "" if none chosen yet
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
  vehicle: DriverVehicleAssignment;
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
  vehicle: {
    vehicleId: "",
  },
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

export const GENDERS: Gender[] = ["Male", "Female"];
export const MARITAL_STATUSES: MaritalStatus[] = ["Single", "Married", "Divorced", "Widowed"];