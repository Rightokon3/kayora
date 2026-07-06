import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Image, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Palette } from "../../../contexts/ThemeContext";
import { Vehicle } from "../../../types/vehicle";
import { VehiclesService } from "../../../services/vehicles";

/* ============================================================
   VEHICLE ASSIGNMENT STEP
   ------------------------------------------------------------
   This step never creates a vehicle — it lists vehicles that are
   already registered in the fleet catalog with status
   "Available" (plus, when editing, the vehicle already assigned
   to this driver) and lets the admin pick one. The picked
   vehicle's id is all this step reports back to the wizard;
   DriversService handles flipping that vehicle to "Assigned" —
   and freeing whatever was previously assigned — on submit.
============================================================ */

export function VehicleStep({
  palette,
  selectedVehicleId,
  currentDriverId,
  error,
  onSelect,
}: {
  palette: Palette;
  selectedVehicleId: string;
  currentDriverId?: string;
  error?: string;
  onSelect: (vehicleId: string) => void;
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await VehiclesService.getAssignableVehicles(currentDriverId);
      setVehicles(list);
      setLoading(false);
    })();
  }, [currentDriverId]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (vehicles.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={[styles.emptyIconCircle, { backgroundColor: palette.pillBg }]}>
          <Ionicons name="car-sport-outline" size={32} color={palette.muted} />
        </View>
        <Text style={[styles.emptyTitle, { color: palette.text }]}>No vehicles available</Text>
        <Text style={[styles.emptySubtitle, { color: palette.muted }]}>
          Every vehicle in the fleet is currently assigned or in maintenance. Add a vehicle to the fleet catalog
          before assigning one to this driver.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={[styles.helperText, { color: palette.muted }]}>
        Select a vehicle from the fleet to assign to this driver. Once assigned, it's removed from the available
        list until it's unassigned.
      </Text>
      {error && <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>}

      <View style={{ gap: 12, marginTop: 14 }}>
        {vehicles.map((vehicle, index) => {
          const isSelected = vehicle.id === selectedVehicleId;
          const isCurrentlyAssignedToThisDriver = vehicle.assignedDriverId === currentDriverId && !!currentDriverId;
          return (
            <Animated.View key={vehicle.id} entering={FadeInDown.duration(300).delay(index * 40)}>
              <Pressable
                onPress={() => onSelect(vehicle.id)}
                style={[
                  styles.vehicleCard,
                  { backgroundColor: palette.background, borderColor: isSelected ? palette.primary : palette.border },
                  isSelected && { borderWidth: 2 },
                ]}
              >
                {vehicle.image ? (
                  <Image source={{ uri: vehicle.image }} style={styles.vehicleImage} />
                ) : (
                  <View style={[styles.vehicleImage, styles.vehicleImageFallback, { backgroundColor: palette.pillBg }]}>
                    <Ionicons name="car-sport-outline" size={22} color={palette.primary} />
                  </View>
                )}

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.vehicleName, { color: palette.text }]}>
                    {vehicle.brand} {vehicle.model}
                  </Text>
                  <Text style={[styles.vehicleMeta, { color: palette.muted }]}>
                    {vehicle.vehicleType} · {vehicle.plateNumber} · {vehicle.color}
                  </Text>
                  {isCurrentlyAssignedToThisDriver && (
                    <Text style={[styles.currentTag, { color: palette.secondary }]}>Currently assigned to this driver</Text>
                  )}
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: isSelected ? palette.primary : palette.border },
                  ]}
                >
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: palette.primary }]} />}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingWrap: { paddingVertical: 40, alignItems: "center" },
  emptyWrap: { alignItems: "center", paddingVertical: 40 },
  emptyIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle: { fontSize: 14.5, fontWeight: "800", marginBottom: 6 },
  emptySubtitle: { fontSize: 12.5, textAlign: "center", lineHeight: 18, maxWidth: 320 },

  helperText: { fontSize: 12.5, lineHeight: 18 },
  errorText: { fontSize: 11.5, fontWeight: "600", marginTop: 8 },

  vehicleCard: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderRadius: 14, padding: 12 },
  vehicleImage: { width: 52, height: 52, borderRadius: 10 },
  vehicleImageFallback: { alignItems: "center", justifyContent: "center" },
  vehicleName: { fontSize: 14, fontWeight: "700" },
  vehicleMeta: { fontSize: 11.5, marginTop: 3 },
  currentTag: { fontSize: 10.5, fontWeight: "700", marginTop: 4 },

  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 11, height: 11, borderRadius: 6 },
});