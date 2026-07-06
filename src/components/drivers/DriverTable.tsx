import React, { memo } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Palette } from "../../contexts/ThemeContext";
import { Driver } from "../../types/driver";
import { DriverAvatar } from "./DriverAvatar";
import { DriverStatusBadge } from "./StatusBadge";

const COLUMN_WIDTHS = {
  driver: 220,
  contact: 210,
  status: 120,
  vehicle: 190,
  actions: 130,
};

function DriverTableBase({
  palette,
  drivers,
  onTrack,
  onEdit,
  onDelete,
}: {
  palette: Palette;
  drivers: Driver[];
  onTrack: (driver: Driver) => void;
  onEdit: (driver: Driver) => void;
  onDelete: (driver: Driver) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[styles.headerRow, { borderBottomColor: palette.border }]}>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.driver, color: palette.muted }]}>Driver</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.contact, color: palette.muted }]}>Contact</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.status, color: palette.muted }]}>Status</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.vehicle, color: palette.muted }]}>Vehicle</Text>
          <Text style={[styles.headerCell, { width: COLUMN_WIDTHS.actions, color: palette.muted }]}>Actions</Text>
        </View>

        {drivers.map((driver, index) => {
          const fullName = `${driver.firstName} ${driver.lastName}`;
          return (
            <View
              key={driver.id}
              style={[
                styles.row,
                index !== drivers.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.border },
              ]}
            >
              <View style={[styles.driverCell, { width: COLUMN_WIDTHS.driver }]}>
                <DriverAvatar palette={palette} name={fullName} profileImage={driver.profileImage} size={40} />
                <View style={{ marginLeft: 12, flexShrink: 1 }}>
                  <Text style={[styles.driverName, { color: palette.text }]} numberOfLines={1}>
                    {fullName}
                  </Text>
                  <Text style={[styles.driverId, { color: palette.muted }]}>{driver.driverId}</Text>
                </View>
              </View>

              <View style={{ width: COLUMN_WIDTHS.contact }}>
                <Text style={[styles.cellPrimary, { color: palette.text }]} numberOfLines={1}>
                  {driver.phone}
                </Text>
                <Text style={[styles.cellSecondary, { color: palette.muted }]} numberOfLines={1}>
                  {driver.email}
                </Text>
              </View>

              <View style={{ width: COLUMN_WIDTHS.status }}>
                <DriverStatusBadge status={driver.status} palette={palette} />
              </View>

              <View style={{ width: COLUMN_WIDTHS.vehicle }}>
                <Text style={[styles.cellPrimary, { color: palette.text }]} numberOfLines={1}>
                  {driver.vehicle.brand} {driver.vehicle.model}
                </Text>
                <Text style={[styles.cellSecondary, { color: palette.muted }]}>{driver.vehicle.plateNumber}</Text>
              </View>

              <View style={[styles.actionsCell, { width: COLUMN_WIDTHS.actions }]}>
                <Pressable onPress={() => onTrack(driver)} style={[styles.actionButton, { borderColor: palette.border }]}>
                  <Ionicons name="location-outline" size={16} color={palette.secondary} />
                </Pressable>
                <Pressable onPress={() => onEdit(driver)} style={[styles.actionButton, { borderColor: palette.border }]}>
                  <Ionicons name="create-outline" size={16} color={palette.text} />
                </Pressable>
                <Pressable onPress={() => onDelete(driver)} style={[styles.actionButton, { borderColor: palette.danger + "40" }]}>
                  <Ionicons name="trash-outline" size={16} color={palette.danger} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

export const DriverTable = memo(DriverTableBase);

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", borderBottomWidth: 1, paddingBottom: 12, marginBottom: 4, gap: 8 },
  headerCell: { fontSize: 11.5, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 8 },
  driverCell: { flexDirection: "row", alignItems: "center" },
  driverName: { fontSize: 14, fontWeight: "700" },
  driverId: { fontSize: 11.5, marginTop: 2 },
  cellPrimary: { fontSize: 13.5 },
  cellSecondary: { fontSize: 12, marginTop: 2 },
  actionsCell: { flexDirection: "row", gap: 8 },
  actionButton: { width: 34, height: 34, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});