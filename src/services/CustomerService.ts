import { adminApiFetch } from "./adminApi";
import { Customer, AccountInactivationRequest } from "../types/customer";

/* ============================================================
   CUSTOMER SERVICE
   ------------------------------------------------------------
   Talks to:
     GET    /admin/customers?search=
     DELETE /admin/customers/{userId}
     GET    /admin/customers/inactivation-requests
     DELETE /admin/customers/inactivation-requests/{id}
============================================================ */

export const CustomerService = {
  async getCustomers(search: string = ""): Promise<Customer[]> {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    return adminApiFetch<Customer[]>(`/admin/customers${query}`);
  },

  /** Pass customer.userId (the real numeric id), not customer.id ("CUS-1001"). */
  async deleteCustomer(userId: number | string): Promise<void> {
    await adminApiFetch(`/admin/customers/${userId}`, { method: "DELETE" });
  },

  async getInactivationRequests(): Promise<AccountInactivationRequest[]> {
    return adminApiFetch<AccountInactivationRequest[]>("/admin/customers/inactivation-requests");
  },

  /** Deletes the requesting customer's account and clears the request. */
  async resolveInactivationRequest(id: number): Promise<void> {
    await adminApiFetch(`/admin/customers/inactivation-requests/${id}`, { method: "DELETE" });
  },
};