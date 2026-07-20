import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Palette } from "../../../contexts/ThemeContext";
import { DriverPersonalInfo, GENDERS, MARITAL_STATUSES } from "../../../types/driver";
import { FormField } from "./FormField";
import { DateField } from "./DateField";
import { SelectField } from "../../products/SelectField";
import { ImageUploader } from "../../products/ImageUploader";

export function PersonalInfoStep({
  palette,
  value,
  errors,
  onChange,
}: {
  palette: Palette;
  value: DriverPersonalInfo;
  errors: Record<string, string>;
  onChange: <K extends keyof DriverPersonalInfo>(key: K, val: DriverPersonalInfo[K]) => void;
}) {
  return (
    <View style={{ gap: 16 }}>
      <Text style={[styles.sectionLabel, { color: palette.text }]}>Profile Picture</Text>
      <ImageUploader palette={palette} imageUri={value.profileImage} onChange={(uri) => onChange("profileImage", uri)} />

      <View style={styles.row}>
        <FormField palette={palette} label="First Name" value={value.firstName} onChangeText={(t) => onChange("firstName", t)} error={errors.firstName} style={{ flex: 1 }} />
        <FormField palette={palette} label="Last Name" value={value.lastName} onChangeText={(t) => onChange("lastName", t)} error={errors.lastName} style={{ flex: 1 }} />
      </View>
      <FormField palette={palette} label="Middle Name" value={value.middleName} onChangeText={(t) => onChange("middleName", t)} />

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.fieldLabel, { color: palette.text }]}>Gender</Text>
          <SelectField palette={palette} label="Gender" value={value.gender} options={GENDERS} onSelect={(v) => onChange("gender", v as any)} />
        </View>
        <DateField palette={palette} label="Date of Birth" value={value.dateOfBirth} onChangeText={(t) => onChange("dateOfBirth", t)} error={errors.dateOfBirth} style={{ flex: 1 }} />
      </View>

      <View>
        <Text style={[styles.fieldLabel, { color: palette.text }]}>Marital Status</Text>
        <SelectField palette={palette} label="Marital Status" value={value.maritalStatus} options={MARITAL_STATUSES} onSelect={(v) => onChange("maritalStatus", v as any)} />
      </View>

      <FormField palette={palette} label="Email Address" value={value.email} onChangeText={(t) => onChange("email", t)} keyboardType="email-address" error={errors.email} />

      <View style={styles.row}>
        <FormField palette={palette} label="Phone Number" value={value.phone} onChangeText={(t) => onChange("phone", t)} keyboardType="phone-pad" error={errors.phone} style={{ flex: 1 }} />
        <FormField palette={palette} label="Alternative Phone" value={value.alternativePhone} onChangeText={(t) => onChange("alternativePhone", t)} keyboardType="phone-pad" style={{ flex: 1 }} />
      </View>

      <FormField palette={palette} label="Home Address" value={value.homeAddress} onChangeText={(t) => onChange("homeAddress", t)} error={errors.homeAddress} />

      <View style={styles.row}>
        <FormField palette={palette} label="City" value={value.city} onChangeText={(t) => onChange("city", t)} style={{ flex: 1 }} />
        <FormField palette={palette} label="State" value={value.state} onChangeText={(t) => onChange("state", t)} style={{ flex: 1 }} />
      </View>

      <View style={styles.row}>
        <FormField palette={palette} label="Emergency Contact Name" value={value.emergencyContactName} onChangeText={(t) => onChange("emergencyContactName", t)} style={{ flex: 1 }} />
        <FormField palette={palette} label="Emergency Contact Phone" value={value.emergencyContactPhone} onChangeText={(t) => onChange("emergencyContactPhone", t)} keyboardType="phone-pad" style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 12.5, fontWeight: "700" },
  fieldLabel: { fontSize: 12.5, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", gap: 12 },
});