import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Palette } from "../../../contexts/ThemeContext";
import { DriverRoadInfo } from "../../../types/driver";
import { FormField } from "./FormField";
import { DateField } from "./DateField";
import { ImageUploader } from "../../products/ImageUploader";

export function RoadInfoStep({
  palette,
  value,
  errors,
  onChange,
}: {
  palette: Palette;
  value: DriverRoadInfo;
  errors: Record<string, string>;
  onChange: <K extends keyof DriverRoadInfo>(key: K, val: DriverRoadInfo[K]) => void;
}) {
  return (
    <View style={{ gap: 16 }}>
      <View style={styles.row}>
        <FormField palette={palette} label="Driver License Number" value={value.licenseNumber} onChangeText={(t) => onChange("licenseNumber", t)} error={errors.licenseNumber} style={{ flex: 1 }} />
        <DateField palette={palette} label="License Expiry Date" value={value.licenseExpiry} onChangeText={(t) => onChange("licenseExpiry", t)} error={errors.licenseExpiry} style={{ flex: 1 }} />
      </View>

      <View>
        <Text style={[styles.fieldLabel, { color: palette.text }]}>License Front Image</Text>
        <ImageUploader palette={palette} imageUri={value.licenseFrontImage} onChange={(uri) => onChange("licenseFrontImage", uri)} />
      </View>
      <View>
        <Text style={[styles.fieldLabel, { color: palette.text }]}>License Back Image</Text>
        <ImageUploader palette={palette} imageUri={value.licenseBackImage} onChange={(uri) => onChange("licenseBackImage", uri)} />
      </View>

      <FormField palette={palette} label="National ID Number" value={value.nationalIdNumber} onChangeText={(t) => onChange("nationalIdNumber", t)} error={errors.nationalIdNumber} />

      <View>
        <Text style={[styles.fieldLabel, { color: palette.text }]}>National ID Image</Text>
        <ImageUploader palette={palette} imageUri={value.nationalIdImage} onChange={(uri) => onChange("nationalIdImage", uri)} />
      </View>

      <View style={styles.row}>
        <FormField palette={palette} label="Years of Driving Experience" value={value.yearsOfExperience} onChangeText={(t) => onChange("yearsOfExperience", t)} keyboardType="numeric" style={{ flex: 1 }} />
        <FormField palette={palette} label="Previous Employer (Optional)" value={value.previousEmployer} onChangeText={(t) => onChange("previousEmployer", t)} style={{ flex: 1 }} />
      </View>

      <FormField palette={palette} label="Additional Notes" value={value.additionalNotes} onChangeText={(t) => onChange("additionalNotes", t)} multiline />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { fontSize: 12.5, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", gap: 12 },
});