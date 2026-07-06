import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Palette } from "../../../contexts/ThemeContext";
import { DriverFormInput } from "../../../types/driver";
import { Vehicle } from "../../../types/vehicle";

function ReviewRow({ label, value, palette }: { label: string; value: string; palette: Palette }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: palette.text }]}>{value || "—"}</Text>
    </View>
  );
}

function ReviewSection({ title, palette, children }: { title: string; palette: Palette; children: React.ReactNode }) {
  return (
    <View style={[styles.section, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      {children}
    </View>
  );
}

export function ReviewStep({
  palette,
  value,
  selectedVehicle,
}: {
  palette: Palette;
  value: DriverFormInput;
  selectedVehicle: Vehicle | null;
}) {
  const images = [
    { label: "Profile Picture", uri: value.personal.profileImage },
    { label: "License Front", uri: value.road.licenseFrontImage },
    { label: "License Back", uri: value.road.licenseBackImage },
    { label: "National ID", uri: value.road.nationalIdImage },
  ].filter((img) => img.uri);

  return (
    <View style={{ gap: 14 }}>
      <ReviewSection title="Personal Information" palette={palette}>
        <ReviewRow label="Full Name" value={`${value.personal.firstName} ${value.personal.middleName} ${value.personal.lastName}`.trim()} palette={palette} />
        <ReviewRow label="Gender" value={value.personal.gender} palette={palette} />
        <ReviewRow label="Date of Birth" value={value.personal.dateOfBirth} palette={palette} />
        <ReviewRow label="Marital Status" value={value.personal.maritalStatus} palette={palette} />
        <ReviewRow label="Email" value={value.personal.email} palette={palette} />
        <ReviewRow label="Phone" value={value.personal.phone} palette={palette} />
        <ReviewRow label="Home Address" value={`${value.personal.homeAddress}, ${value.personal.city}, ${value.personal.state}`} palette={palette} />
        <ReviewRow label="Emergency Contact" value={`${value.personal.emergencyContactName} (${value.personal.emergencyContactPhone})`} palette={palette} />
      </ReviewSection>

      <ReviewSection title="Assigned Vehicle" palette={palette}>
        {selectedVehicle ? (
          <>
            <View style={styles.vehiclePreviewRow}>
              {selectedVehicle.image ? (
                <Image source={{ uri: selectedVehicle.image }} style={styles.vehicleThumb} />
              ) : (
                <View style={[styles.vehicleThumb, styles.vehicleThumbFallback, { backgroundColor: palette.pillBg }]}>
                  <Ionicons name="car-sport-outline" size={20} color={palette.primary} />
                </View>
              )}
              <Text style={[styles.vehiclePreviewName, { color: palette.text }]}>
                {selectedVehicle.brand} {selectedVehicle.model}
              </Text>
            </View>
            <ReviewRow label="Type" value={selectedVehicle.vehicleType} palette={palette} />
            <ReviewRow label="Plate Number" value={selectedVehicle.plateNumber} palette={palette} />
            <ReviewRow label="Engine / Chassis" value={`${selectedVehicle.engineNumber} / ${selectedVehicle.chassisNumber}`} palette={palette} />
            <ReviewRow label="Color" value={selectedVehicle.color} palette={palette} />
          </>
        ) : (
          <Text style={[styles.value, { color: palette.danger }]}>No vehicle selected yet.</Text>
        )}
      </ReviewSection>

      <ReviewSection title="Road Information" palette={palette}>
        <ReviewRow label="License Number" value={value.road.licenseNumber} palette={palette} />
        <ReviewRow label="License Expiry" value={value.road.licenseExpiry} palette={palette} />
        <ReviewRow label="National ID" value={value.road.nationalIdNumber} palette={palette} />
        <ReviewRow label="Experience" value={`${value.road.yearsOfExperience} years`} palette={palette} />
        <ReviewRow label="Previous Employer" value={value.road.previousEmployer} palette={palette} />
        <ReviewRow label="Notes" value={value.road.additionalNotes} palette={palette} />
      </ReviewSection>

      {images.length > 0 && (
        <ReviewSection title="Uploaded Images" palette={palette}>
          <View style={styles.imagesGrid}>
            {images.map((img) => (
              <View key={img.label} style={styles.imageItem}>
                <Image source={{ uri: img.uri! }} style={styles.imageThumb} />
                <Text style={[styles.imageLabel, { color: palette.muted }]} numberOfLines={1}>
                  {img.label}
                </Text>
              </View>
            ))}
          </View>
        </ReviewSection>
      )}

      <View style={[styles.noticeRow, { backgroundColor: palette.pillBg }]}>
        <Ionicons name="information-circle-outline" size={16} color={palette.primary} />
        <Text style={[styles.noticeText, { color: palette.text }]}>
          Review the details above. You can go back to any step to make changes before submitting.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderWidth: 1, borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 13.5, fontWeight: "800", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, gap: 12 },
  label: { fontSize: 12, fontWeight: "600", flexShrink: 0 },
  value: { fontSize: 12, fontWeight: "700", flexShrink: 1, textAlign: "right" },

  vehiclePreviewRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  vehicleThumb: { width: 40, height: 40, borderRadius: 10 },
  vehicleThumbFallback: { alignItems: "center", justifyContent: "center" },
  vehiclePreviewName: { fontSize: 13.5, fontWeight: "800" },

  imagesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  imageItem: { width: 84 },
  imageThumb: { width: 84, height: 84, borderRadius: 12 },
  imageLabel: { fontSize: 10.5, marginTop: 6, textAlign: "center" },
  noticeRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12 },
  noticeText: { fontSize: 12, flexShrink: 1, lineHeight: 17 },
});