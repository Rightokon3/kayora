import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";
import { CustomerService } from "../../services/CustomerService";
import { Customer } from "../../types/customer";
import { SearchBar } from "../../components/products/SearchBar";
import { Toast, ToastState } from "../../components/products/Toast";
import { CustomerTable } from "../../components/customers/CustomerTable";
import { CustomerCard } from "../../components/customers/CustomerCard";
import { DeleteCustomerModal } from "../../components/customers/DeleteCustomerModal";
import { CustomersSkeleton } from "../../components/customers/CustomersSkeleton";
import { CustomersEmptyState } from "../../components/customers/EmptyState";

export default function CustomersScreen() {
  const { palette } = useTheme();
  const { isPhone } = useResponsive();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, variant: "success" | "error" = "success") => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, variant });
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    const data = await CustomerService.getCustomers();
    setCustomers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Real-time client-side filtering as the admin types. Same query shape
  // CustomerService.searchCustomers already accepts, so switching to a
  // debounced server-side search later only touches this block.
  const filteredCustomers = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(normalized) ||
        c.email.toLowerCase().includes(normalized) ||
        c.phone.toLowerCase().includes(normalized) ||
        c.address.city.toLowerCase().includes(normalized)
    );
  }, [customers, searchQuery]);

  const handleRequestDelete = useCallback((customer: Customer) => setDeleteTarget(customer), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await CustomerService.deleteCustomer(deleteTarget.id);
      showToast("Customer account deleted successfully", "success");
      setDeleteTarget(null);
      await loadCustomers();
    } catch (e) {
      showToast("Could not delete customer. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, loadCustomers, showToast]);

  return (
    <AdminLayout title="Customers">
      <View>
        <View style={[styles.headerRow, isPhone && { flexDirection: "column", alignItems: "flex-start" }]}>
          <View>
            <Text style={[styles.pageTitle, { color: palette.text }]}>Customers</Text>
            <Text style={[styles.pageSubtitle, { color: palette.muted }]}>
              Manage and view customer information
            </Text>
          </View>
          <View style={[styles.searchWrap, isPhone && { width: "100%", marginTop: 16 }]}>
            <SearchBar palette={palette} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search customers..." />
          </View>
        </View>

        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.listCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.listTitle, { color: palette.text }]}>All Customers</Text>
          <Text style={[styles.listSubtitle, { color: palette.muted }]}>
            Total customers: {customers.length}
          </Text>

          <View style={{ marginTop: 18 }}>
            {loading ? (
              <CustomersSkeleton palette={palette} rows={4} />
            ) : filteredCustomers.length === 0 ? (
              <CustomersEmptyState palette={palette} isSearch={searchQuery.trim().length > 0} />
            ) : isPhone ? (
              <View style={{ gap: 14 }}>
                {filteredCustomers.map((customer, index) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    palette={palette}
                    delay={index * 40}
                    onDelete={handleRequestDelete}
                  />
                ))}
              </View>
            ) : (
              <CustomerTable palette={palette} customers={filteredCustomers} onDelete={handleRequestDelete} />
            )}
          </View>
        </Animated.View>
      </View>

      <DeleteCustomerModal
        visible={!!deleteTarget}
        palette={palette}
        customerName={deleteTarget?.name ?? ""}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <Toast toast={toast} palette={palette} />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, gap: 16 },
  pageTitle: { fontSize: 26, fontWeight: "800" },
  pageSubtitle: { fontSize: 13.5, marginTop: 6 },
  searchWrap: { width: 300 },

  listCard: { borderWidth: 1, borderRadius: 20, padding: 20 },
  listTitle: { fontSize: 18, fontWeight: "800" },
  listSubtitle: { fontSize: 12.5, marginTop: 4 },
});