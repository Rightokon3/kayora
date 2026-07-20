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
import { SetDriverPasswordModal } from "../../components/drivers/SetDriverPasswordModal";
import { DriversSkeleton } from "../../components/drivers/DriversSkeleton";
import { DriversEmptyState } from "../../components/drivers/EmptyState";

const SEARCH_DEBOUNCE_MS = 350;

export default function DriversScreen() {
  const { palette } = useTheme();
  const { isPhone } = useResponsive();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [activeDriver, setActiveDriver] = useState<Driver | null>(null);

  const [trackingDriver, setTrackingDriver] = useState<Driver | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);

  // The "set password" step shown right after a driver is created.
  const [passwordDriver, setPasswordDriver] = useState<{ id: string; name: string } | null>(null);

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
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const loadDrivers = useCallback(async (search: string) => {
    setLoading(true);
    try {
      const data = await DriversService.getDrivers(search);
      setDrivers(data);
    } catch (e) {
      showToast("Could not load drivers. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDrivers("");
  }, []);

  // Real backend search, debounced — replaces the old client-side filter.
  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = setTimeout(() => {
        loadDrivers(text);
      }, SEARCH_DEBOUNCE_MS);
    },
    [loadDrivers]
  );

  const activeCount = useMemo(
    () => drivers.filter((d) => d.status === "active" || d.status === "delivering").length,
    [drivers]
  );

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
          const created = await DriversService.createDriver(input);
          showToast("Driver created successfully.", "success");
          setFormVisible(false);
          // Open the password step right after — driver isn't usable until
          // a real password replaces the random one set at creation.
          setPasswordDriver({ id: created.id, name: `${created.firstName} ${created.lastName}`.trim() || created.driverId });
        } else if (activeDriver) {
          await DriversService.updateDriver(activeDriver.id, input);
          showToast("Driver updated successfully.", "success");
          setFormVisible(false);
        }
        await loadDrivers(searchQuery);
      } catch (e) {
        showToast("Something went wrong. Please try again.", "error");
      }
    },
    [formMode, activeDriver, loadDrivers, searchQuery, showToast]
  );

  const handleSetPassword = useCallback(
    async (password: string, confirmPassword: string): Promise<boolean> => {
      if (!passwordDriver) return false;
      try {
        await DriversService.setPassword(passwordDriver.id, password, confirmPassword);
        showToast("Driver password set successfully.", "success");
        setPasswordDriver(null);
        return true;
      } catch (e) {
        return false;
      }
    },
    [passwordDriver, showToast]
  );

  const handleTrack = useCallback((driver: Driver) => {
    if (driver.status === "offline") return; // Track button is disabled for offline drivers, this is a backstop
    setTrackingDriver(driver);
  }, []);

  const handleRequestDelete = useCallback((driver: Driver) => setDeleteTarget(driver), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await DriversService.deleteDriver(deleteTarget.id);
      showToast("Driver deleted successfully", "success");
      setDeleteTarget(null);
      await loadDrivers(searchQuery);
    } catch (e) {
      showToast("Could not delete driver. Please try again.", "error");
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, loadDrivers, searchQuery, showToast]);

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
              <SearchBar palette={palette} value={searchQuery} onChangeText={handleSearchChange} placeholder="Search drivers..." />
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
            ) : drivers.length === 0 ? (
              <DriversEmptyState palette={palette} isSearch={searchQuery.trim().length > 0} />
            ) : isPhone ? (
              <View style={{ gap: 14 }}>
                {drivers.map((driver, index) => (
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
                drivers={drivers}
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

      <SetDriverPasswordModal
        visible={!!passwordDriver}
        palette={palette}
        driverName={passwordDriver?.name ?? ""}
        onSubmit={handleSetPassword}
        onSkip={() => setPasswordDriver(null)}
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