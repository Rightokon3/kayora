import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { useTheme } from "../../contexts/ThemeContext";
import { useResponsive } from "../../hooks/useResponsive";
import { DriversService } from "../../services/drivers";
import { Driver, DriverFormInput } from "../../types/driver";
import { SearchBar } from "../../components/products/SearchBar";
import { Toast, ToastState } from "../../components/products/Toast";
import { DriversStatsCards } from "../../components/drivers/StatsCards";
import { DriverTable } from "../../components/drivers/DriverTable";
import { DriverCard } from "../../components/drivers/DriverCard";
import { TrackDriverModal } from "../../components/drivers/TrackDriverModal";
import { DeleteDriverModal } from "../../components/drivers/DeleteDriverModal";
import { DriverFormModal } from "../../components/drivers/form/DriverFormModal";
import { DriversSkeleton } from "../../components/drivers/DriversSkeleton";
import { DriversEmptyState } from "../../components/drivers/EmptyState";

export default function DriversScreen() {
  const { palette } = useTheme();
  const { isPhone } = useResponsive();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [activeDriver, setActiveDriver] = useState<Driver | null>(null);

  const [trackingDriver, setTrackingDriver] = useState<Driver | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
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

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    const data = await DriversService.getDrivers();
    setDrivers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const filteredDrivers = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return drivers;
    return drivers.filter(
      (d) =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(normalized) ||
        d.driverId.toLowerCase().includes(normalized) ||
        d.phone.toLowerCase().includes(normalized) ||
        d.vehicle.plateNumber.toLowerCase().includes(normalized)
    );
  }, [drivers, searchQuery]);

  const activeCount = useMemo(() => drivers.filter((d) => d.status === "active" || d.status === "delivering").length, [drivers]);

  const handleOpenAdd = useCallback(() => {
    setFormMode("add");
    setActiveDriver(null);
    setFormVisible(true);
  }, []);

  const handleOpenEdit = useCallback((driver: Driver) => {
    setFormMode("edit");
    setActiveDriver(driver);
    setFormVisible(true);
  }, []);

  const handleSubmitForm = useCallback(
    async (input: DriverFormInput) => {
      try {
        if (formMode === "add") {
          await DriversService.createDriver(input);
          showToast("Driver created successfully.", "success");
        } else if (activeDriver) {
          await DriversService.updateDriver(activeDriver.id, input);
          showToast("Driver updated successfully.", "success");
        }
        setFormVisible(false);
        await loadDrivers();
      } catch (e) {
        showToast("Something went wrong. Please try again.", "error");
      }
    },
    [formMode, activeDriver, loadDrivers, showToast]
  );

  const handleTrack = useCallback((driver: Driver) => setTrackingDriver(driver), []);

  const handleRequestDelete = useCallback((driver: Driver) => setDeleteTarget(driver), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await DriversService.deleteDriver(deleteTarget.id);
      showToast("Driver deleted successfully", "success");
      setDeleteTarget(null);
      await loadDrivers();
    } catch (e) {
      showToast("Could not delete driver. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, loadDrivers, showToast]);

  return (
    <AdminLayout title="Drivers">
      <View>
        <View style={[styles.headerRow, isPhone && { flexDirection: "column", alignItems: "flex-start" }]}>
          <View>
            <Text style={[styles.pageTitle, { color: palette.text }]}>Drivers</Text>
            <Text style={[styles.pageSubtitle, { color: palette.muted }]}>Manage and view company drivers</Text>
          </View>
          <View style={[styles.headerActions, isPhone && { width: "100%", marginTop: 16, flexDirection: "column", alignItems: "stretch" }]}>
            <View style={[styles.searchWrap, isPhone && { width: "100%" }]}>
              <SearchBar palette={palette} value={searchQuery} onChangeText={setSearchQuery} placeholder="Search drivers..." />
            </View>
            <Pressable
              onPress={handleOpenAdd}
              style={[styles.addButton, { backgroundColor: palette.primary }, isPhone && { marginTop: 12 }]}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add Driver</Text>
            </Pressable>
          </View>
        </View>

        <DriversStatsCards palette={palette} totalDrivers={drivers.length} activeDrivers={activeCount} />

        <Animated.View
          entering={FadeInDown.duration(400)}
          style={[styles.listCard, { backgroundColor: palette.card, borderColor: palette.border }]}
        >
          <Text style={[styles.listTitle, { color: palette.text }]}>All Drivers</Text>
          <Text style={[styles.listSubtitle, { color: palette.muted }]}>Total drivers: {drivers.length}</Text>

          <View style={{ marginTop: 18 }}>
            {loading ? (
              <DriversSkeleton palette={palette} rows={4} />
            ) : filteredDrivers.length === 0 ? (
              <DriversEmptyState palette={palette} isSearch={searchQuery.trim().length > 0} />
            ) : isPhone ? (
              <View style={{ gap: 14 }}>
                {filteredDrivers.map((driver, index) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    palette={palette}
                    delay={index * 40}
                    onTrack={handleTrack}
                    onEdit={handleOpenEdit}
                    onDelete={handleRequestDelete}
                  />
                ))}
              </View>
            ) : (
              <DriverTable
                palette={palette}
                drivers={filteredDrivers}
                onTrack={handleTrack}
                onEdit={handleOpenEdit}
                onDelete={handleRequestDelete}
              />
            )}
          </View>
        </Animated.View>
      </View>

      <DriverFormModal
        visible={formVisible}
        palette={palette}
        mode={formMode}
        initialDriver={activeDriver}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSubmitForm}
      />

      <TrackDriverModal visible={!!trackingDriver} palette={palette} driver={trackingDriver} onClose={() => setTrackingDriver(null)} />

      <DeleteDriverModal
        visible={!!deleteTarget}
        palette={palette}
        driverName={deleteTarget ? `${deleteTarget.firstName} ${deleteTarget.lastName}` : ""}
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  searchWrap: { width: 260 },
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, paddingHorizontal: 18, borderRadius: 12 },
  addButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  listCard: { borderWidth: 1, borderRadius: 20, padding: 20 },
  listTitle: { fontSize: 18, fontWeight: "800" },
  listSubtitle: { fontSize: 12.5, marginTop: 4 },
});