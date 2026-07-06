/* ============================================================
   CUSTOMER DOMAIN TYPES
   ------------------------------------------------------------
   Contract between the UI and CustomerService. The Customers
   screen currently only displays name/picture/phone/email/
   address/joinedAt, but the extra fields below (status, total
   orders, etc.) are kept on the type now so future screens
   (customer detail, orders history) don't need a type migration
   when the Laravel API starts returning them.
============================================================ */

export interface CustomerAddress {
  street: string;
  city: string;
  state: string;
}

export type CustomerStatus = "Active" | "Inactive" | "Suspended";

export interface Customer {
  id: string;
  name: string;
  profilePicture: string | null;
  phone: string;
  email: string;
  address: CustomerAddress;
  joinedAt: string; // ISO date

  // Reserved for future screens — not rendered on this page yet.
  status: CustomerStatus;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
}