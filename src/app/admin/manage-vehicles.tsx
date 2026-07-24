import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { useTheme } from "../../contexts/ThemeContext";
import { adminApiFetch, ApiError } from "../../services/adminApi";
import { AdminLayout } from "../../components/layout/AdminLayout";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VehicleStatus = "Available" | "Assigned" | "Maintenance";

interface AssignedDriver {
  id: string;
  driverId: string;
  name: string;
  phone: string;
  email: string;
}

interface VehicleRecord {
  id: string;
  brand: string;
  model: string;
  vehicleType: string;
  plateNumber: string;
  engineNumber: string;
  chassisNumber: string;
  color: string;
  image: string | null;
  registrationImage: string | null;
  status: VehicleStatus;
  assignedDriverId: string | null;
  assignedDriver: AssignedDriver | null;
  dateAdded: string;
}

interface DriverOption {
  id: string;
  driverId: string;
  name: string;
  currentVehiclePlate: string | null;
}

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const VEHICLE_TYPES = ["Van", "Pickup", "Truck", "Bike", "Car"];

const STATUS_TABS: { key: "All" | VehicleStatus; label: string }[] = [
  { key: "All", label: "All Vehicles" },
  { key: "Available", label: "Unassigned" },
  { key: "Assigned", label: "Assigned" },
  { key: "Maintenance", label: "Maintenance" },
];

// ---------------------------------------------------------------------------
// Backend-connected service layer
// ---------------------------------------------------------------------------

const vehicleService = {
  async getVehicles(status: string, search: string): Promise<VehicleRecord[]> {
    const params = new URLSearchParams();
    if (status && status !== "All") params.set("status", status);
    if (search.trim()) params.set("search", search.trim());
    const qs = params.toString();
    return adminApiFetch<VehicleRecord[]>(`/admin/vehicles${qs ? `?${qs}` : ""}`);
  },
  async getVehicle(id: string): Promise<VehicleRecord> {
    return adminApiFetch<VehicleRecord>(`/admin/vehicles/${id}`);
  },
  async createVehicle(payload: Partial<VehicleRecord>): Promise<VehicleRecord> {
    return adminApiFetch<VehicleRecord>("/admin/vehicles", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  async updateVehicle(id: string, payload: Partial<VehicleRecord>): Promise<VehicleRecord> {
    return adminApiFetch<VehicleRecord>(`/admin/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  async deleteVehicle(id: string): Promise<void> {
    await adminApiFetch(`/admin/vehicles/${id}`, { method: "DELETE" });
  },
  async assignVehicle(id: string, driverId: string): Promise<VehicleRecord> {
    return adminApiFetch<VehicleRecord>(`/admin/vehicles/${id}/assign`, {
      method: "POST",
      body: JSON.stringify({ driverId }),
    });
  },
  async unassignVehicle(id: string): Promise<VehicleRecord> {
    return adminApiFetch<VehicleRecord>(`/admin/vehicles/${id}/unassign`, { method: "POST" });
  },
  async getAssignableDrivers(): Promise<DriverOption[]> {
    // Reuses the existing driver list endpoint rather than a dedicated
    // one — DriverController::index() already returns each driver's
    // current vehicle, which is exactly what the picker needs to show
    // ("currently on Toyota Hilux") and reassigning here still works
    // correctly server-side (VehicleController::doAssign frees the
    // driver's old vehicle automatically).
    const drivers = await adminApiFetch<any[]>("/admin/drivers");
    return drivers.map((d) => ({
      id: d.id,
      driverId: d.driverId,
      name: `${d.firstName} ${d.lastName}`.trim(),
      currentVehiclePlate: d.vehicle?.plateNumber && d.vehicle.plateNumber !== "—" ? d.vehicle.plateNumber : null,
    }));
  },
  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    const filename = uri.split("/").pop() || "upload.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1] : "jpg";
    formData.append("file", {
      uri,
      name: filename,
      type: `image/${ext === "jpg" ? "jpeg" : ext}`,
    } as any);
    const result = await adminApiFetch<{ success: boolean; url: string }>("/admin/upload-image", {
      method: "POST",
      body: formData,
    });
    return result.url;
  },
};

// ---------------------------------------------------------------------------
// Toast (identical pattern to manage-admins.tsx)
// ---------------------------------------------------------------------------

function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"success" | "error">("success");
  const anim = useRef(new Animated.Value(0)).current;

  const show = useCallback(
    (msg: string, toneValue: "success" | "error" = "success") => {
      setMessage(msg);
      setTone(toneValue);
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMessage(null));
    },
    [anim]
  );

  return useMemo(() => ({ message, tone, anim, show }), [message, tone, anim, show]);
}

function ToastView({ colors, toast }: { colors: any; toast: ReturnType<typeof useToast> }) {
  if (!toast.message) return null;
  const isSuccess = toast.tone === "success";
  return (
    <Animated.View
      style={[
        localStyles(colors).toast,
        {
          backgroundColor: isSuccess ? colors.success ?? "#1E9E5A" : colors.danger ?? "#D64545",
          opacity: toast.anim,
          transform: [{ translateY: toast.anim.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
        },
      ]}
    >
      <Ionicons name={isSuccess ? "checkmark-circle" : "alert-circle"} size={18} color="#FFFFFF" />
      <Text style={localStyles(colors).toastText}>{toast.message}</Text>
    </Animated.View>
  );
}

function SkeletonBlock({ colors, width, height, style }: { colors: any; width: number | string; height: number; style?: any }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[{ width, height, borderRadius: 8, backgroundColor: colors.border ?? "#E2E5EA", opacity: pulse }, style]} />
  );
}

// ---------------------------------------------------------------------------
// Small shared bits
// ---------------------------------------------------------------------------

function Badge({ colors, bg, fg, text }: { colors: any; bg: string; fg: string; text: string }) {
  return (
    <View style={{ backgroundColor: bg, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, alignSelf: "flex-start" }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: "600" }}>{text}</Text>
    </View>
  );
}

function statusColor(colors: any, status: VehicleStatus) {
  switch (status) {
    case "Available":
      return { bg: colors.success + "1A", fg: colors.success ?? "#1E9E5A" };
    case "Assigned":
      return { bg: colors.primary + "1A", fg: colors.primary ?? "#0D4A8C" };
    case "Maintenance":
      return { bg: colors.warning + "1A", fg: colors.warning ?? "#B7791F" };
  }
}

function StatCard({ colors, icon, label, value }: { colors: any; icon: keyof typeof Ionicons.glyphMap; label: string; value: number }) {
  const styles = localStyles(colors);
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function VehiclePhoto({ vehicle, colors, size = 40 }: { vehicle: VehicleRecord; colors: any; size?: number }) {
  const styles = localStyles(colors);
  if (vehicle.image) {
    return <Image source={{ uri: vehicle.image }} style={{ width: size, height: size, borderRadius: 10 }} />;
  }
  return (
    <View style={[styles.vehiclePhotoFallback, { width: size, height: size, borderRadius: 10 }]}>
      <Ionicons name="car-outline" size={size * 0.5} color={colors.primary} />
    </View>
  );
}

function VehicleCard({
  vehicle,
  colors,
  onView,
  onEdit,
  onDelete,
}: {
  vehicle: VehicleRecord;
  colors: any;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const styles = localStyles(colors);
  return (
    <View style={styles.mobileCard}>
      <View style={styles.mobileCardTop}>
        <VehiclePhoto vehicle={vehicle} colors={colors} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.vehicleName}>
            {vehicle.brand} {vehicle.model}
          </Text>
          <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>
        </View>
      </View>
      <View style={styles.mobileBadgeRow}>
        <Badge colors={colors} {...statusColor(colors, vehicle.status)} text={vehicle.status} />
      </View>
      <View style={styles.mobileMetaRow}>
        <Text style={styles.tableCellText}>{vehicle.vehicleType}</Text>
        <Text style={styles.tableCellText}>{vehicle.assignedDriver?.name ?? "Unassigned"}</Text>
      </View>
      <View style={styles.mobileActionsRow}>
        <Pressable onPress={onView} style={styles.mobileActionButton}>
          <Ionicons name="eye-outline" size={18} color={colors.muted} />
          <Text style={styles.mobileActionText}>View</Text>
        </Pressable>
        <Pressable onPress={onEdit} style={styles.mobileActionButton}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />
          <Text style={[styles.mobileActionText, { color: colors.primary }]}>Edit</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={styles.mobileActionButton}>
          <Ionicons name="trash-outline" size={18} color={colors.danger ?? "#D64545"} />
          <Text style={[styles.mobileActionText, { color: colors.danger ?? "#D64545" }]}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Modal shell + form primitives (identical pattern to manage-admins.tsx)
// ---------------------------------------------------------------------------

function ModalShell({
  colors,
  isMobile,
  visible,
  onClose,
  title,
  children,
  maxWidth = 560,
}: {
  colors: any;
  isMobile: boolean;
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  const styles = localStyles(colors);
  return (
    <Modal visible={visible} animationType={isMobile ? "slide" : "fade"} transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={[styles.modalCard, isMobile ? styles.modalCardMobile : { maxWidth, width: "92%", maxHeight: "88%" }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FieldLabel({ colors, children }: { colors: any; children: React.ReactNode }) {
  return <Text style={localStyles(colors).fieldLabel}>{children}</Text>;
}

function Input({ colors, ...props }: React.ComponentProps<typeof TextInput> & { colors: any }) {
  return <TextInput placeholderTextColor={colors.muted} style={localStyles(colors).input} {...props} />;
}

function InfoRow({ colors, label, value }: { colors: any; label: string; value: string }) {
  const styles = localStyles(colors);
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Dropdown({
  colors,
  open,
  setOpen,
  value,
  options,
  onSelect,
}: {
  colors: any;
  open: boolean;
  setOpen: (v: boolean) => void;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}) {
  const styles = localStyles(colors);
  return (
    <View style={{ marginBottom: 8 }}>
      <Pressable style={styles.dropdownField} onPress={() => setOpen(!open)}>
        <Text style={styles.dropdownFieldText}>{value}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={16} color={colors.text} />
      </Pressable>
      {open && (
        <View style={styles.dropdownList}>
          <ScrollView style={{ maxHeight: 220 }}>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={styles.dropdownItem}
                onPress={() => {
                  onSelect(opt);
                  setOpen(false);
                }}
              >
                <Text style={[styles.dropdownItemText, opt === value && { color: colors.primary, fontWeight: "600" }]}>{opt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/**
 * Handles picking an image, uploading it to Cloudinary via
 * POST /admin/upload-image, and showing a preview. Only ever hands the
 * parent the final hosted URL — matches the contract every
 * ImageUploadController-backed field in this app already relies on
 * (avatarUrl, profileImage, licenseFrontImage, etc.).
 */
function ImagePickerField({
  colors,
  label,
  value,
  onChange,
}: {
  colors: any;
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const styles = localStyles(colors);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handlePick = async () => {
    setError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploading(true);
    try {
      const url = await vehicleService.uploadImage(result.assets[0].uri);
      onChange(url);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={{ marginBottom: 10 }}>
      <FieldLabel colors={colors}>{label}</FieldLabel>
      <Pressable style={styles.imagePickerBox} onPress={handlePick} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator color={colors.primary} />
        ) : value ? (
          <Image source={{ uri: value }} style={styles.imagePickerPreview} />
        ) : (
          <View style={{ alignItems: "center" }}>
            <Ionicons name="camera-outline" size={26} color={colors.muted} />
            <Text style={styles.helperText}>Tap to upload</Text>
          </View>
        )}
      </Pressable>
      {!!value && !uploading && (
        <Pressable onPress={() => onChange(null)} style={{ marginTop: 6 }}>
          <Text style={[styles.helperText, { color: colors.danger ?? "#D64545" }]}>Remove photo</Text>
        </Pressable>
      )}
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ---------------------------------------------------------------------------
// View Vehicle modal — full details + assigned driver + assign/unassign
// ---------------------------------------------------------------------------

function ViewVehicleModal({
  vehicle,
  colors,
  isMobile,
  onClose,
  onAssign,
  onUnassign,
  busy,
}: {
  vehicle: VehicleRecord;
  colors: any;
  isMobile: boolean;
  onClose: () => void;
  onAssign: () => void;
  onUnassign: () => void;
  busy: boolean;
}) {
  const styles = localStyles(colors);
  return (
    <ModalShell colors={colors} isMobile={isMobile} visible title="Vehicle Details" onClose={onClose}>
      <View style={{ alignItems: "center", marginBottom: 16 }}>
        <VehiclePhoto vehicle={vehicle} colors={colors} size={84} />
        <Text style={[styles.vehicleName, { fontSize: 18, marginTop: 10 }]}>
          {vehicle.brand} {vehicle.model}
        </Text>
        <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>
      </View>

      <InfoRow colors={colors} label="Type" value={vehicle.vehicleType} />
      <InfoRow colors={colors} label="Color" value={vehicle.color || "—"} />
      <InfoRow colors={colors} label="Engine Number" value={vehicle.engineNumber || "—"} />
      <InfoRow colors={colors} label="Chassis Number" value={vehicle.chassisNumber || "—"} />
      <InfoRow colors={colors} label="Date Added" value={vehicle.dateAdded} />
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Status</Text>
        <Badge colors={colors} {...statusColor(colors, vehicle.status)} text={vehicle.status} />
      </View>

      {!!vehicle.registrationImage && (
        <View style={{ marginTop: 14 }}>
          <FieldLabel colors={colors}>Registration Document</FieldLabel>
          <Image source={{ uri: vehicle.registrationImage }} style={styles.documentPreview} resizeMode="contain" />
        </View>
      )}

      <View style={{ marginTop: 18 }}>
        <FieldLabel colors={colors}>Assigned Driver</FieldLabel>
        {vehicle.assignedDriver ? (
          <View style={styles.assignedDriverCard}>
            <View style={styles.assignedDriverAvatar}>
              <Text style={styles.avatarInitials}>{vehicle.assignedDriver.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.adminName}>{vehicle.assignedDriver.name}</Text>
              <Text style={styles.adminUsername}>{vehicle.assignedDriver.driverId}</Text>
              <Text style={styles.helperText}>{vehicle.assignedDriver.phone || vehicle.assignedDriver.email}</Text>
            </View>
            <Pressable style={styles.secondaryButton} onPress={onUnassign} disabled={busy}>
              {busy ? <ActivityIndicator size="small" color={colors.text} /> : <Text style={styles.secondaryButtonText}>Unassign</Text>}
            </Pressable>
          </View>
        ) : (
          <View style={styles.unassignedRow}>
            <Text style={styles.helperText}>No driver currently assigned to this vehicle.</Text>
            <Pressable style={styles.primaryButton} onPress={onAssign} disabled={busy}>
              {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Assign Driver</Text>}
            </Pressable>
          </View>
        )}
      </View>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Assign Driver modal
// ---------------------------------------------------------------------------

function AssignDriverModal({
  colors,
  isMobile,
  onClose,
  onConfirm,
}: {
  colors: any;
  isMobile: boolean;
  onClose: () => void;
  onConfirm: (driverId: string) => Promise<void>;
}) {
  const styles = localStyles(colors);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    vehicleService
      .getAssignableDrivers()
      .then((res) => {
        if (mounted) setDrivers(res);
      })
      .catch(() => {
        if (mounted) setError("Could not load drivers. Please try again.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    setError("");
    try {
      await onConfirm(selected);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not assign this driver. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <ModalShell colors={colors} isMobile={isMobile} visible title="Assign Driver" onClose={onClose}>
      {loading ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : drivers.length === 0 ? (
        <Text style={styles.helperText}>No drivers found.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {drivers.map((d) => (
            <Pressable
              key={d.id}
              style={[styles.driverOptionRow, selected === d.id && { borderColor: colors.primary }]}
              onPress={() => setSelected(d.id)}
            >
              <View style={styles.checkbox}>
                {selected === d.id && <Ionicons name="checkmark" size={13} color={colors.primary} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminName}>{d.name}</Text>
                <Text style={styles.helperText}>
                  {d.driverId}
                  {d.currentVehiclePlate ? ` · Currently on ${d.currentVehiclePlate}` : ""}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.modalFooterRow}>
        <Pressable style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.primaryButton, (!selected || submitting) && { opacity: 0.5 }]}
          disabled={!selected || submitting}
          onPress={handleConfirm}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.primaryButtonText}>Confirm Assignment</Text>}
        </Pressable>
      </View>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Delete Vehicle modal
// ---------------------------------------------------------------------------

function DeleteVehicleModal({
  vehicle,
  colors,
  onClose,
  onConfirm,
}: {
  vehicle: VehicleRecord;
  colors: any;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}) {
  const styles = localStyles(colors);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await onConfirm(vehicle.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
      setDeleting(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { width: "90%", maxWidth: 440 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Delete Vehicle</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <View style={{ padding: 20 }}>
            <View style={styles.deleteAdminPreview}>
              <VehiclePhoto vehicle={vehicle} colors={colors} size={44} />
              <View>
                <Text style={styles.adminName}>
                  {vehicle.brand} {vehicle.model}
                </Text>
                <Text style={styles.adminUsername}>{vehicle.plateNumber}</Text>
              </View>
            </View>
            <Text style={styles.deleteWarning}>
              This action cannot be undone. This will permanently remove this vehicle
              {vehicle.assignedDriver ? ` and unassign it from ${vehicle.assignedDriver.name}` : ""}.
            </Text>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.modalFooterRow}>
              <Pressable style={styles.secondaryButton} onPress={onClose}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.dangerButton, deleting && { opacity: 0.5 }]} disabled={deleting} onPress={handleDelete}>
                {deleting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.dangerButtonText}>Delete Vehicle</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Edit Vehicle modal — single page
// ---------------------------------------------------------------------------

function EditVehicleModal({
  vehicle,
  colors,
  isMobile,
  onClose,
  onSave,
}: {
  vehicle: VehicleRecord;
  colors: any;
  isMobile: boolean;
  onClose: () => void;
  onSave: (updated: VehicleRecord) => Promise<void>;
}) {
  const styles = localStyles(colors);
  const [form, setForm] = useState<VehicleRecord>({ ...vehicle });
  const [typeOpen, setTypeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ plateNumber?: string }>({});
  const [formError, setFormError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setFieldErrors({});
    setFormError("");
    try {
      await onSave(form);
    } catch (e) {
      const apiErr = e instanceof ApiError ? e : null;
      if (apiErr?.errors?.plateNumber) {
        setFieldErrors({ plateNumber: apiErr.errors.plateNumber[0] });
      } else {
        setFormError(apiErr?.message ?? "Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell colors={colors} isMobile={isMobile} visible title="Edit Vehicle" onClose={onClose}>
      <ImagePickerField colors={colors} label="Vehicle Photo" value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} />

      <FieldLabel colors={colors}>Brand</FieldLabel>
      <Input colors={colors} value={form.brand} onChangeText={(v) => setForm((f) => ({ ...f, brand: v }))} placeholder="e.g. Toyota" />

      <FieldLabel colors={colors}>Model</FieldLabel>
      <Input colors={colors} value={form.model} onChangeText={(v) => setForm((f) => ({ ...f, model: v }))} placeholder="e.g. Hiace" />

      <FieldLabel colors={colors}>Vehicle Type</FieldLabel>
      <Dropdown colors={colors} open={typeOpen} setOpen={setTypeOpen} value={form.vehicleType} options={VEHICLE_TYPES} onSelect={(v) => setForm((f) => ({ ...f, vehicleType: v }))} />

      <FieldLabel colors={colors}>Plate Number</FieldLabel>
      <Input
        colors={colors}
        value={form.plateNumber}
        onChangeText={(v) => {
          setForm((f) => ({ ...f, plateNumber: v }));
          if (fieldErrors.plateNumber) setFieldErrors({});
        }}
        placeholder="e.g. EDS-101-KY"
        autoCapitalize="characters"
      />
      {!!fieldErrors.plateNumber && <Text style={styles.errorText}>{fieldErrors.plateNumber}</Text>}

      <FieldLabel colors={colors}>Color</FieldLabel>
      <Input colors={colors} value={form.color} onChangeText={(v) => setForm((f) => ({ ...f, color: v }))} placeholder="e.g. Kayora Blue" />

      <FieldLabel colors={colors}>Engine Number</FieldLabel>
      <Input colors={colors} value={form.engineNumber} onChangeText={(v) => setForm((f) => ({ ...f, engineNumber: v }))} />

      <FieldLabel colors={colors}>Chassis Number</FieldLabel>
      <Input colors={colors} value={form.chassisNumber} onChangeText={(v) => setForm((f) => ({ ...f, chassisNumber: v }))} />

      <ImagePickerField
        colors={colors}
        label="Registration Document"
        value={form.registrationImage}
        onChange={(url) => setForm((f) => ({ ...f, registrationImage: url }))}
      />

      {!!formError && <Text style={styles.errorText}>{formError}</Text>}

      <View style={styles.modalFooterRow}>
        <Pressable style={styles.secondaryButton} onPress={onClose}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.primaryButton} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={"#FFFFFF"} size="small" /> : <Text style={styles.primaryButtonText}>Save Changes</Text>}
        </Pressable>
      </View>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Add Vehicle modal — multi-step wizard (same pattern as AddAdminModal)
// ---------------------------------------------------------------------------

const STEP_LABELS = ["Vehicle Info", "Photos", "Assign Driver", "Review"];

function AddVehicleModal({
  colors,
  isMobile,
  onClose,
  onCreate,
}: {
  colors: any;
  isMobile: boolean;
  onClose: () => void;
  onCreate: (payload: Partial<VehicleRecord> & { assignedDriverId?: string }) => Promise<void>;
}) {
  const styles = localStyles(colors);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [plateNumber, setPlateNumber] = useState("");
  const [color, setColor] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");

  const [image, setImage] = useState<string | null>(null);
  const [registrationImage, setRegistrationImage] = useState<string | null>(null);

  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{ plateNumber?: string }>({});
  const [submitError, setSubmitError] = useState("");

  const canGoNextFromDetails = brand.trim() && model.trim() && plateNumber.trim();

  useEffect(() => {
    if (step !== 2) return;
    setDriversLoading(true);
    vehicleService
      .getAssignableDrivers()
      .then(setDrivers)
      .catch(() => setDrivers([]))
      .finally(() => setDriversLoading(false));
  }, [step]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setFieldErrors({});
    setSubmitError("");
    try {
      await onCreate({
        brand,
        model,
        vehicleType,
        plateNumber,
        color,
        engineNumber,
        chassisNumber,
        image,
        registrationImage,
        assignedDriverId: selectedDriverId ?? undefined,
      });
    } catch (e) {
      const apiErr = e instanceof ApiError ? e : null;
      if (apiErr?.errors?.plateNumber) {
        setFieldErrors({ plateNumber: apiErr.errors.plateNumber[0] });
        setStep(0);
      } else {
        setSubmitError(apiErr?.message ?? "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const tempVehicle: VehicleRecord = {
    id: "",
    brand,
    model,
    vehicleType,
    plateNumber,
    engineNumber,
    chassisNumber,
    color,
    image,
    registrationImage,
    status: "Available",
    assignedDriverId: selectedDriverId,
    assignedDriver: null,
    dateAdded: "",
  };

  return (
    <ModalShell colors={colors} isMobile={isMobile} visible title="Add Vehicle" onClose={onClose} maxWidth={640}>
      <View style={styles.stepRow}>
        {STEP_LABELS.map((label, idx) => (
          <View key={label} style={{ alignItems: "center", flex: 1 }}>
            <View style={[styles.stepDot, idx <= step && { backgroundColor: colors.primary }]}>
              {idx < step ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : (
                <Text style={[styles.stepDotText, idx <= step && { color: "#FFFFFF" }]}>{idx + 1}</Text>
              )}
            </View>
            {!isMobile && <Text style={styles.stepLabel}>{label}</Text>}
          </View>
        ))}
      </View>

      {/* Step 1: Vehicle Info */}
      {step === 0 && (
        <View>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <VehiclePhoto vehicle={tempVehicle} colors={colors} size={84} />
          </View>

          <View style={isMobile ? undefined : { flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <FieldLabel colors={colors}>Brand</FieldLabel>
              <Input colors={colors} value={brand} onChangeText={setBrand} placeholder="e.g. Toyota" />
            </View>
            <View style={{ flex: 1 }}>
              <FieldLabel colors={colors}>Model</FieldLabel>
              <Input colors={colors} value={model} onChangeText={setModel} placeholder="e.g. Hiace" />
            </View>
          </View>

          <FieldLabel colors={colors}>Vehicle Type</FieldLabel>
          <Dropdown colors={colors} open={typeOpen} setOpen={setTypeOpen} value={vehicleType} options={VEHICLE_TYPES} onSelect={setVehicleType} />

          <FieldLabel colors={colors}>Plate Number</FieldLabel>
          <Input
            colors={colors}
            value={plateNumber}
            onChangeText={(v) => {
              setPlateNumber(v);
              if (fieldErrors.plateNumber) setFieldErrors({});
            }}
            placeholder="e.g. EDS-101-KY"
            autoCapitalize="characters"
          />
          {!!fieldErrors.plateNumber && <Text style={styles.errorText}>{fieldErrors.plateNumber}</Text>}

          <FieldLabel colors={colors}>Color</FieldLabel>
          <Input colors={colors} value={color} onChangeText={setColor} placeholder="e.g. Kayora Blue" />

          <FieldLabel colors={colors}>Engine Number</FieldLabel>
          <Input colors={colors} value={engineNumber} onChangeText={setEngineNumber} placeholder="Optional" />

          <FieldLabel colors={colors}>Chassis Number</FieldLabel>
          <Input colors={colors} value={chassisNumber} onChangeText={setChassisNumber} placeholder="Optional" />
        </View>
      )}

      {/* Step 2: Photos */}
      {step === 1 && (
        <View>
          <ImagePickerField colors={colors} label="Vehicle Photo" value={image} onChange={setImage} />
          <ImagePickerField colors={colors} label="Registration Document" value={registrationImage} onChange={setRegistrationImage} />
          <Text style={styles.helperText}>Both photos are optional and can be added later from the Edit screen.</Text>
        </View>
      )}

      {/* Step 3: Assign Driver */}
      {step === 2 && (
        <View>
          <Text style={styles.helperText}>Optionally assign this vehicle to a driver now, or leave it unassigned for later.</Text>
          {driversLoading ? (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <View style={{ gap: 8, marginTop: 12 }}>
              <Pressable
                style={[styles.driverOptionRow, selectedDriverId === null && { borderColor: colors.primary }]}
                onPress={() => setSelectedDriverId(null)}
              >
                <View style={styles.checkbox}>{selectedDriverId === null && <Ionicons name="checkmark" size={13} color={colors.primary} />}</View>
                <Text style={styles.adminName}>Leave unassigned</Text>
              </Pressable>
              {drivers.map((d) => (
                <Pressable
                  key={d.id}
                  style={[styles.driverOptionRow, selectedDriverId === d.id && { borderColor: colors.primary }]}
                  onPress={() => setSelectedDriverId(d.id)}
                >
                  <View style={styles.checkbox}>{selectedDriverId === d.id && <Ionicons name="checkmark" size={13} color={colors.primary} />}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.adminName}>{d.name}</Text>
                    <Text style={styles.helperText}>
                      {d.driverId}
                      {d.currentVehiclePlate ? ` · Currently on ${d.currentVehiclePlate}` : ""}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Step 4: Review */}
      {step === 3 && (
        <View>
          <InfoRow colors={colors} label="Vehicle" value={`${brand} ${model}`} />
          <InfoRow colors={colors} label="Type" value={vehicleType} />
          <InfoRow colors={colors} label="Plate Number" value={plateNumber} />
          <InfoRow colors={colors} label="Color" value={color || "—"} />
          <InfoRow colors={colors} label="Engine Number" value={engineNumber || "—"} />
          <InfoRow colors={colors} label="Chassis Number" value={chassisNumber || "—"} />
          <InfoRow
            colors={colors}
            label="Assigned Driver"
            value={selectedDriverId ? drivers.find((d) => d.id === selectedDriverId)?.name ?? "—" : "Unassigned"}
          />
          {!!submitError && <Text style={styles.errorText}>{submitError}</Text>}
        </View>
      )}

      <View style={styles.modalFooterRow}>
        {step > 0 ? (
          <Pressable style={styles.secondaryButton} onPress={() => setStep((s) => s - 1)}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        )}

        {step < 3 ? (
          <Pressable
            style={[styles.primaryButton, step === 0 && !canGoNextFromDetails && { opacity: 0.5 }]}
            disabled={step === 0 && !canGoNextFromDetails}
            onPress={() => setStep((s) => s + 1)}
          >
            <Text style={styles.primaryButtonText}>Next</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.primaryButton} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color={"#FFFFFF"} size="small" /> : <Text style={styles.primaryButtonText}>Add Vehicle</Text>}
          </Pressable>
        )}
      </View>
    </ModalShell>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ManageVehiclesScreen() {
  const { palette: colors } = useTheme();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const styles = useMemo(() => localStyles(colors), [colors]);
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState<"All" | VehicleStatus>("All");

  const [viewTarget, setViewTarget] = useState<VehicleRecord | null>(null);
  const [editTarget, setEditTarget] = useState<VehicleRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleRecord | null>(null);
  const [assignTarget, setAssignTarget] = useState<VehicleRecord | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [assignBusy, setAssignBusy] = useState(false);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vehicleService.getVehicles(statusTab, query);
      setVehicles(data);
    } catch (e) {
      toast.show("Could not load vehicles. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  }, [statusTab, query, toast.show]);

  useEffect(() => {
    loadVehicles();
  }, [statusTab]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadVehicles();
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const stats = useMemo(
    () => ({
      total: vehicles.length,
      assigned: vehicles.filter((v) => v.status === "Assigned").length,
      available: vehicles.filter((v) => v.status === "Available").length,
    }),
    [vehicles]
  );

  const handleCreate = async (payload: Partial<VehicleRecord> & { assignedDriverId?: string }) => {
    const created = await vehicleService.createVehicle(payload);
    setVehicles((prev) => [created, ...prev]);
    setAddOpen(false);
    toast.show("Vehicle added successfully.");
  };

  const handleSaveEdit = async (updated: VehicleRecord) => {
    const saved = await vehicleService.updateVehicle(updated.id, updated);
    setVehicles((prev) => prev.map((v) => (v.id === saved.id ? saved : v)));
    setEditTarget(null);
    toast.show("Vehicle updated successfully.");
  };

  const handleDeleteConfirmed = async (id: string) => {
    await vehicleService.deleteVehicle(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setDeleteTarget(null);
    toast.show("Vehicle deleted successfully.");
  };

  const handleAssignFromView = async (driverId: string) => {
    if (!viewTarget) return;
    setAssignBusy(true);
    try {
      const updated = await vehicleService.assignVehicle(viewTarget.id, driverId);
      setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setViewTarget(updated);
      toast.show("Driver assigned successfully.");
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Could not assign this driver.", "error");
    } finally {
      setAssignBusy(false);
    }
  };

  const handleUnassignFromView = async () => {
    if (!viewTarget) return;
    setAssignBusy(true);
    try {
      const updated = await vehicleService.unassignVehicle(viewTarget.id);
      setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setViewTarget(updated);
      toast.show("Driver unassigned.");
    } catch (e) {
      toast.show(e instanceof ApiError ? e.message : "Could not unassign this driver.", "error");
    } finally {
      setAssignBusy(false);
    }
  };

  const handleAssignFromModal = async (driverId: string) => {
    if (!assignTarget) return;
    const updated = await vehicleService.assignVehicle(assignTarget.id, driverId);
    setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    setAssignTarget(null);
    toast.show("Driver assigned successfully.");
  };

  return (
    <AdminLayout title="Manage Vehicles">
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.headerRow, isMobile && styles.headerRowMobile]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.pageTitle}>Manage Vehicles</Text>
              <Text style={styles.pageSubtitle}>Add, edit, and assign company vehicles to drivers.</Text>
            </View>
            <Pressable style={[styles.primaryButton, isMobile && styles.fullWidthButton]} onPress={() => setAddOpen(true)}>
              <Ionicons name="add" size={18} color={"#FFFFFF"} />
              <Text style={styles.primaryButtonText}>Add Vehicle</Text>
            </Pressable>
          </View>

          <View style={[styles.statsRow, isMobile && styles.statsRowMobile]}>
            <StatCard colors={colors} icon="car" label="Total Vehicles" value={stats.total} />
            <StatCard colors={colors} icon="person" label="Assigned" value={stats.assigned} />
            <StatCard colors={colors} icon="checkmark-circle" label="Unassigned" value={stats.available} />
          </View>

          <View style={styles.tabsRow}>
            {STATUS_TABS.map((tab) => (
              <Pressable key={tab.key} style={styles.tabButton} onPress={() => setStatusTab(tab.key)}>
                <Text style={[styles.tabButtonText, statusTab === tab.key && styles.tabButtonTextActive]}>{tab.label}</Text>
                {statusTab === tab.key && <View style={styles.tabUnderline} />}
              </Pressable>
            ))}
          </View>

          <View style={[styles.toolbarRow, isMobile && styles.toolbarRowMobile]}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search vehicles..."
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery("")}>
                  <Ionicons name="close-circle" size={16} color={colors.muted} />
                </Pressable>
              )}
            </View>
          </View>

          {loading ? (
            <View style={styles.card}>
              {[...Array(4)].map((_, i) => (
                <View key={i} style={styles.skeletonRow}>
                  <SkeletonBlock colors={colors} width={40} height={40} style={{ borderRadius: 10 }} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonBlock colors={colors} width="60%" height={12} />
                    <SkeletonBlock colors={colors} width="40%" height={10} />
                  </View>
                  <SkeletonBlock colors={colors} width={70} height={22} style={{ borderRadius: 11 }} />
                </View>
              ))}
            </View>
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyTitle}>No vehicles found.</Text>
              <Text style={styles.emptySubtitle}>Add your first vehicle to get started.</Text>
            </View>
          ) : isMobile ? (
            <View style={{ gap: 12 }}>
              {vehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  colors={colors}
                  onView={() => setViewTarget(vehicle)}
                  onEdit={() => setEditTarget(vehicle)}
                  onDelete={() => setDeleteTarget(vehicle)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, { flex: 2.2 }]}>Vehicle</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.3 }]}>Type</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.8 }]}>Assigned Driver</Text>
                <Text style={[styles.tableHeaderCell, { flex: 1.3, textAlign: "right" }]}>Actions</Text>
              </View>
              {vehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.tableRow}>
                  <View style={[styles.adminCell, { flex: 2.2 }]}>
                    <VehiclePhoto vehicle={vehicle} colors={colors} size={36} />
                    <View>
                      <Text style={styles.vehicleName}>
                        {vehicle.brand} {vehicle.model}
                      </Text>
                      <Text style={styles.vehiclePlate}>{vehicle.plateNumber}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tableCellText, { flex: 1.3 }]}>{vehicle.vehicleType}</Text>
                  <View style={{ flex: 1 }}>
                    <Badge colors={colors} {...statusColor(colors, vehicle.status)} text={vehicle.status} />
                  </View>
                  <Text style={[styles.tableCellText, { flex: 1.8 }]}>{vehicle.assignedDriver?.name ?? "Unassigned"}</Text>
                  <View style={[styles.actionsCell, { flex: 1.3 }]}>
                    {vehicle.assignedDriver ? (
                      <Pressable
                        onPress={async () => {
                          setAssignBusy(true);
                          try {
                            const updated = await vehicleService.unassignVehicle(vehicle.id);
                            setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
                            toast.show("Driver unassigned.");
                          } catch {
                            toast.show("Could not unassign this vehicle.", "error");
                          } finally {
                            setAssignBusy(false);
                          }
                        }}
                        style={styles.iconButton}
                        disabled={assignBusy}
                      >
                        <Ionicons name="person-remove-outline" size={18} color={colors.warning ?? "#B7791F"} />
                      </Pressable>
                    ) : (
                      <Pressable onPress={() => setAssignTarget(vehicle)} style={styles.iconButton}>
                        <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                      </Pressable>
                    )}
                    <Pressable onPress={() => setViewTarget(vehicle)} style={styles.iconButton}>
                      <Ionicons name="eye-outline" size={18} color={colors.muted} />
                    </Pressable>
                    <Pressable onPress={() => setEditTarget(vehicle)} style={styles.iconButton}>
                      <Ionicons name="create-outline" size={18} color={colors.primary} />
                    </Pressable>
                    <Pressable onPress={() => setDeleteTarget(vehicle)} style={styles.iconButton}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger ?? "#D64545"} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <ToastView colors={colors} toast={toast} />

        {viewTarget && (
          <ViewVehicleModal
            vehicle={viewTarget}
            colors={colors}
            isMobile={isMobile}
            onClose={() => setViewTarget(null)}
            onAssign={() => {
              setAssignTarget(viewTarget);
              setViewTarget(null);
            }}
            onUnassign={handleUnassignFromView}
            busy={assignBusy}
          />
        )}

        {editTarget && (
          <EditVehicleModal vehicle={editTarget} colors={colors} isMobile={isMobile} onClose={() => setEditTarget(null)} onSave={handleSaveEdit} />
        )}

        {deleteTarget && (
          <DeleteVehicleModal vehicle={deleteTarget} colors={colors} onClose={() => setDeleteTarget(null)} onConfirm={handleDeleteConfirmed} />
        )}

        {assignTarget && (
          <AssignDriverModal colors={colors} isMobile={isMobile} onClose={() => setAssignTarget(null)} onConfirm={handleAssignFromModal} />
        )}

        {addOpen && <AddVehicleModal colors={colors} isMobile={isMobile} onClose={() => setAddOpen(false)} onCreate={handleCreate} />}
      </View>
    </AdminLayout>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function localStyles(colors: any) {
  return StyleSheet.create({
    screen: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 60, gap: 16 },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 4 },
    headerRowMobile: { flexDirection: "column", alignItems: "stretch", gap: 12 },
    pageTitle: { fontSize: 22, fontWeight: "800", color: colors.text ?? "#101828" },
    pageSubtitle: { fontSize: 13, color: colors.muted, marginTop: 4 },

    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
    fullWidthButton: { justifyContent: "center" },

    secondaryButton: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      alignItems: "center",
      justifyContent: "center",
    },
    secondaryButtonText: { color: colors.text ?? "#101828", fontSize: 14, fontWeight: "600" },

    dangerButton: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: colors.danger ?? "#D64545",
      alignItems: "center",
      justifyContent: "center",
    },
    dangerButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

    statsRow: { flexDirection: "row", gap: 12 },
    statsRowMobile: { flexDirection: "column" },
    statCard: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      padding: 16,
    },
    statIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.primary + "1A",
      alignItems: "center",
      justifyContent: "center",
    },
    statValue: { fontSize: 20, fontWeight: "800", color: colors.text ?? "#101828" },
    statLabel: { fontSize: 12, color: colors.muted },

    tabsRow: {
      flexDirection: "row",
      gap: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.border ?? "#E2E5EA",
    },
    tabButton: { paddingVertical: 10, paddingHorizontal: 14, alignItems: "center" },
    tabButtonText: { fontSize: 13, fontWeight: "600", color: colors.muted },
    tabButtonTextActive: { color: colors.primary },
    tabUnderline: { height: 2, backgroundColor: colors.primary, marginTop: 8, width: "100%", borderRadius: 1 },

    toolbarRow: { flexDirection: "row", gap: 10 },
    toolbarRowMobile: { flexDirection: "column" },
    searchBox: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 44,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      backgroundColor: colors.card,
    },
    searchInput: { flex: 1, color: colors.text ?? "#101828", fontSize: 14 },

    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      overflow: "hidden",
    },
    tableHeaderRow: {
      flexDirection: "row",
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.border + "40",
      borderBottomWidth: 1,
      borderBottomColor: colors.border ?? "#E2E5EA",
    },
    tableHeaderCell: { fontSize: 12, fontWeight: "600", color: colors.muted },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border ?? "#EEF0F3",
    },
    adminCell: { flexDirection: "row", alignItems: "center", gap: 10 },
    vehicleName: { fontSize: 14, fontWeight: "600", color: colors.text ?? "#101828" },
    vehiclePlate: { fontSize: 12, color: colors.muted },
    tableCellText: { fontSize: 13, color: colors.text ?? "#101828" },
    actionsCell: { flexDirection: "row", justifyContent: "flex-end", gap: 4 },
    iconButton: { padding: 6 },

    skeletonRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border ?? "#EEF0F3" },

    emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 56, gap: 8 },
    emptyTitle: { fontSize: 15, fontWeight: "600", color: colors.text ?? "#101828" },
    emptySubtitle: { fontSize: 13, color: colors.muted },

    mobileCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      padding: 14,
      gap: 10,
    },
    mobileCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    mobileBadgeRow: { flexDirection: "row", gap: 8 },
    mobileMetaRow: { flexDirection: "row", justifyContent: "space-between" },
    mobileActionsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      borderTopWidth: 1,
      borderTopColor: colors.border ?? "#EEF0F3",
      paddingTop: 10,
    },
    mobileActionButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 10 },
    mobileActionText: { fontSize: 13, color: colors.muted, fontWeight: "600" },

    vehiclePhotoFallback: {
      backgroundColor: colors.primary + "1A",
      alignItems: "center",
      justifyContent: "center",
    },

    modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", alignItems: "center", justifyContent: "center" },
    modalCard: { backgroundColor: colors.card, borderRadius: 16, overflow: "hidden" },
    modalCardMobile: { width: "100%", height: "100%", borderRadius: 0 },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border ?? "#E2E5EA",
    },
    modalTitle: { fontSize: 16, fontWeight: "700", color: colors.text ?? "#101828" },
    modalFooterRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 10 },

    fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.text ?? "#101828", marginBottom: 6, marginTop: 10 },
    input: {
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: colors.text ?? "#101828",
      marginBottom: 4,
      backgroundColor: colors.background ?? "#FAFBFC",
    },

    dropdownField: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.background ?? "#FAFBFC",
    },
    dropdownFieldText: { fontSize: 14, color: colors.text ?? "#101828" },
    dropdownList: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      borderRadius: 10,
      backgroundColor: colors.card,
      maxHeight: 220,
    },
    dropdownItem: { paddingVertical: 10, paddingHorizontal: 14 },
    dropdownItemText: { fontSize: 14, color: colors.text ?? "#101828" },

    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border ?? "#EEF0F3",
    },
    infoLabel: { fontSize: 13, color: colors.muted },
    infoValue: { fontSize: 13, color: colors.text ?? "#101828", fontWeight: "600" },

    deleteAdminPreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.border + "40",
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    deleteWarning: { fontSize: 13, color: colors.muted, marginBottom: 14, lineHeight: 18 },
    errorText: { color: colors.danger ?? "#D64545", fontSize: 12, marginTop: 4 },

    stepRow: { flexDirection: "row", marginBottom: 18 },
    stepDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.border ?? "#E2E5EA",
      alignItems: "center",
      justifyContent: "center",
    },
    stepDotText: { fontSize: 12, fontWeight: "700", color: colors.muted },
    stepLabel: { fontSize: 10, color: colors.muted, marginTop: 4, textAlign: "center" },

    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 5,
      borderWidth: 1.5,
      borderColor: colors.border ?? "#C5CAD3",
      alignItems: "center",
      justifyContent: "center",
    },
    helperText: { fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 17 },

    imagePickerBox: {
      height: 140,
      borderRadius: 12,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border ?? "#C5CAD3",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background ?? "#FAFBFC",
      overflow: "hidden",
    },
    imagePickerPreview: { width: "100%", height: "100%" },
    documentPreview: { width: "100%", height: 200, borderRadius: 10, marginTop: 8, backgroundColor: colors.border ?? "#EEF0F3" },

    assignedDriverCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.border + "30",
      borderRadius: 12,
      padding: 12,
    },
    assignedDriverAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + "1A",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitials: { color: colors.primary ?? "#0D4A8C", fontWeight: "700" },
    unassignedRow: { alignItems: "flex-start", gap: 10 },

    driverOptionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderColor: colors.border ?? "#E2E5EA",
      borderRadius: 10,
      padding: 12,
    },

    adminName: { fontSize: 14, fontWeight: "600", color: colors.text ?? "#101828" },
    adminUsername: { fontSize: 12, color: colors.muted },

    toast: {
      position: "absolute",
      top: 16,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      elevation: 6,
    },
    toastText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  });
}