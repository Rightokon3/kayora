import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, { ZoomIn, FadeIn } from "react-native-reanimated";
import { Palette } from "../../../contexts/ThemeContext";
import { Driver, DriverFormInput, EMPTY_DRIVER_FORM } from "../../../types/driver";
import { Vehicle } from "../../../types/vehicle";
import { VehiclesService } from "../../../services/vehicles";
import { ProgressIndicator } from "./ProgressIndicator";
import { PersonalInfoStep } from "./PersonalInfoStep";
import { VehicleStep } from "./VehicleStep";
import { RoadInfoStep } from "./RoadInfoStep";
import { ReviewStep } from "./ReviewStep";

/**
 * IMPORTANT FIX: this used to only map firstName/lastName/email/phone/
 * profileImage/vehicleId into the edit form — every other field
 * (middleName, gender, dob, maritalStatus, alternativePhone, address,
 * emergency contact, and ALL of Road Info) was silently reset to blank
 * every time an existing driver was edited. Since the form always submits
 * every field, saving an edit would have wiped out that driver's real
 * driver_profiles data. Now pulls from driver.profileDetails/roadDetails
 * (populated by DriverController::transform() on the backend) instead.
 */
function driverToForm(driver: Driver): DriverFormInput {
  return {
    personal: {
      ...EMPTY_DRIVER_FORM.personal,
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phone: driver.phone,
      profileImage: driver.profileImage ?? null,
      middleName: driver.profileDetails?.middleName ?? "",
      gender: driver.profileDetails?.gender ?? "",
      dateOfBirth: driver.profileDetails?.dateOfBirth ?? "",
      maritalStatus: driver.profileDetails?.maritalStatus ?? "",
      alternativePhone: driver.profileDetails?.alternativePhone ?? "",
      homeAddress: driver.profileDetails?.homeAddress ?? "",
      city: driver.profileDetails?.city ?? "",
      state: driver.profileDetails?.state ?? "",
      emergencyContactName: driver.profileDetails?.emergencyContactName ?? "",
      emergencyContactPhone: driver.profileDetails?.emergencyContactPhone ?? "",
    },
    vehicle: {
      vehicleId: driver.vehicle.vehicleId,
    },
    road: {
      ...EMPTY_DRIVER_FORM.road,
      licenseNumber: driver.roadDetails?.licenseNumber ?? "",
      licenseExpiry: driver.roadDetails?.licenseExpiry ?? "",
      licenseFrontImage: driver.roadDetails?.licenseFrontImage ?? null,
      licenseBackImage: driver.roadDetails?.licenseBackImage ?? null,
      nationalIdNumber: driver.roadDetails?.nationalIdNumber ?? "",
      nationalIdImage: driver.roadDetails?.nationalIdImage ?? null,
      yearsOfExperience: driver.roadDetails?.yearsOfExperience ?? "",
      previousEmployer: driver.roadDetails?.previousEmployer ?? "",
      additionalNotes: driver.roadDetails?.additionalNotes ?? "",
    },
  };
}

export function DriverFormModal({
  visible,
  palette,
  mode,
  initialDriver,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  palette: Palette;
  mode: "add" | "edit";
  initialDriver: Driver | null;
  onClose: () => void;
  onSubmit: (input: DriverFormInput) => Promise<void>;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DriverFormInput>(EMPTY_DRIVER_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (visible) {
      setStep(0);
      setSelectedVehicle(null);
      setForm(mode === "edit" && initialDriver ? driverToForm(initialDriver) : EMPTY_DRIVER_FORM);
    }
  }, [visible, mode, initialDriver]);

  // Keep the resolved Vehicle object in sync with whatever id is currently
  // selected, so the Review step can show full vehicle details without
  // every component needing its own copy of the fleet catalog.
  useEffect(() => {
    if (!form.vehicle.vehicleId) {
      setSelectedVehicle(null);
      return;
    }
    let cancelled = false;
    VehiclesService.getVehicleById(form.vehicle.vehicleId).then((vehicle) => {
      if (!cancelled) setSelectedVehicle(vehicle);
    });
    return () => {
      cancelled = true;
    };
  }, [form.vehicle.vehicleId]);

  const updatePersonal = useCallback(<K extends keyof DriverFormInput["personal"]>(key: K, val: DriverFormInput["personal"][K]) => {
    setForm((prev) => ({ ...prev, personal: { ...prev.personal, [key]: val } }));
  }, []);
  const handleSelectVehicle = useCallback((vehicleId: string) => {
    setForm((prev) => ({ ...prev, vehicle: { vehicleId } }));
  }, []);
  const updateRoad = useCallback(<K extends keyof DriverFormInput["road"]>(key: K, val: DriverFormInput["road"][K]) => {
    setForm((prev) => ({ ...prev, road: { ...prev.road, [key]: val } }));
  }, []);

  // No field in this form is required — every step can be skipped/left
  // blank and the admin can still move forward and submit.
  const emptyErrors: Record<string, string> = {};

  const handleNext = () => {
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleBack = () => {
    if (step === 0) {
      onClose();
      return;
    }
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View entering={ZoomIn.duration(240)} style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: palette.text }]}>
                  {mode === "add" ? "Add New Driver" : "Edit Driver"}
                </Text>
                <Text style={[styles.subtitle, { color: palette.muted }]}>
                  {mode === "add" ? "Register a new company driver" : "Update driver information"}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={[styles.closeButton, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="close" size={18} color={palette.text} />
              </Pressable>
            </View>

            <View style={{ marginBottom: 18 }}>
              <ProgressIndicator palette={palette} currentStep={step} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <Animated.View key={step} entering={FadeIn.duration(220)}>
                {step === 0 && (
                  <PersonalInfoStep palette={palette} value={form.personal} errors={emptyErrors} onChange={updatePersonal} />
                )}
                {step === 1 && (
                  <VehicleStep
                    palette={palette}
                    selectedVehicleId={form.vehicle.vehicleId}
                    currentDriverId={mode === "edit" ? initialDriver?.id : undefined}
                    onSelect={handleSelectVehicle}
                  />
                )}
                {step === 2 && (
                  <RoadInfoStep palette={palette} value={form.road} errors={emptyErrors} onChange={updateRoad} />
                )}
                {step === 3 && <ReviewStep palette={palette} value={form} selectedVehicle={selectedVehicle} />}
              </Animated.View>

              <View style={styles.footerButtonsRow}>
                <Pressable onPress={handleBack} disabled={submitting} style={[styles.backButton, { borderColor: palette.border }]}>
                  <Text style={[styles.backButtonText, { color: palette.text }]}>{step === 0 ? "Cancel" : "Back"}</Text>
                </Pressable>

                {step < 3 ? (
                  <Pressable onPress={handleNext} style={[styles.nextButton, { backgroundColor: palette.primary }]}>
                    <Text style={styles.nextButtonText}>Next</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </Pressable>
                ) : (
                  <Pressable onPress={handleSubmit} disabled={submitting} style={[styles.nextButton, { backgroundColor: palette.primary }]}>
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.nextButtonText}>{mode === "add" ? "Submit" : "Save Changes"}</Text>
                    )}
                  </Pressable>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 30 },
  modalCard: { width: "100%", maxWidth: 560, maxHeight: "92%", borderRadius: 24, padding: 22 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 12.5, marginTop: 4 },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  footerButtonsRow: { flexDirection: "row", gap: 10, marginTop: 24 },
  backButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  backButtonText: { fontSize: 14, fontWeight: "700" },
  nextButton: { flex: 1, height: 48, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  nextButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});