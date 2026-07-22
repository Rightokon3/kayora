/* ============================================================
   CUSTOMER TYPES
   ------------------------------------------------------------
   Shape matches CustomerCard.tsx / CustomerTable.tsx's actual
   prop usage: customer.id, .name, .email, .phone, .profilePicture,
   .address.{street,city,state}, .joinedAt.

   IMPORTANT: `id` here is a DISPLAY id ("CUS-1001", derived from
   the real numeric users.id — 1000 + id) for on-screen use only.
   `userId` is the real numeric primary key and is what every
   backend call (delete, etc.) must use instead.

   The `addresses` table only stores one combined string per
   address (no separate street/city/state columns), so the backend
   does a best-effort comma split. If a customer's address doesn't
   follow "street, city, state" order, the split may not line up
   perfectly — the full string is never lost, just possibly
   distributed across the wrong field.
============================================================ */

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
}

export interface Customer {
  id: string;
  userId: number;
  name: string;
  email: string;
  phone: string;
  profilePicture: string | null;
  address: CustomerAddress;
  joinedAt: string;
}

/**
 * Mirrors account_inactivation_requests columns exactly (no renaming),
 * since the request was to show those exact DB column names in the modal.
 */
export interface AccountInactivationRequest {
  id: number;
  user_id: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  account_type: "customer" | "distributor";
  created_at: string | null;
  updated_at: string | null;
}
export interface Customer {
  id: string;
  userId: number;
  name: string;
  email: string;
  phone: string;
  profilePicture: string | null;
  address: CustomerAddress;
  joinedAt: string;
  isDistributor: boolean;
  distributorApplication: DistributorApplication | null;
}

/**
 * Mirrors distributor_applications columns (camelCased on the way out
 * of CustomerController::index and DistributorApplicationController::show).
 * `status` flips to "approved"/"rejected" once an admin acts on it; the
 * user's own `isDistributor` flag only becomes true on approval.
 */
export interface DistributorApplication {
  id: number;
  status: "pending" | "approved" | "rejected";
  businessName: string;
  fullName?: string;
  businessType?: string;
  city?: string;
  lga?: string;
  state?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  estimatedMonthlyVolume?: string;
  yearsInBusiness?: string;
  additionalInfo?: string;
  submittedAt?: string;
}