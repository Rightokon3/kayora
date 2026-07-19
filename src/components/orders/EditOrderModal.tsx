import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { ZoomIn } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";
import { Order, OrderEditInput, OrderStatus, PaymentStatus, OrderPriority, STATUS_FILTERS } from "../../types/order";
import { AvailableDriver } from "../../types/order";
import { OrdersService } from "../../services/orders";
import { SelectField } from "../products/SelectField";

const PAYMENT_STATUSES: PaymentStatus[] = ["Paid", "Unpaid", "Refunded"];
const PRIORITIES: OrderPriority[] = ["Normal", "High", "Urgent"];
const ORDER_STATUSES: OrderStatus[] = STATUS_FILTERS.filter((s) => s.key !== "all").map((s) => s.key as OrderStatus);

export function EditOrderModal({
  order,
  palette,
  onClose,
  onSave,
}: {
  order: Order | null;
  palette: Palette;
  onClose: () => void;
  onSave: (input: OrderEditInput) => Promise<void>;
}) {
  const [form, setForm] = useState<OrderEditInput | null>(null);
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (order) {
      setForm({
        deliveryDate: order.scheduledDate ? new Date(order.scheduledDate).toLocaleDateString() : "",
        deliveryTime: order.scheduledTime ?? "",
        deliveryAddress: order.customer.deliveryAddress,
        deliveryNotes: order.specialInstructions,
        paymentStatus: order.paymentStatus,
        status: order.status,
        priority: order.priority,
        driverId: order.delivery.driverId,
        specialInstructions: order.specialInstructions,
      });
      setErrors({});
      OrdersService.getAvailableDrivers(order.id).then(setDrivers);
    }
  }, [order?.id]);

  const updateField = useCallback(<K extends keyof OrderEditInput>(key: K, value: OrderEditInput[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }, []);

  const handleSave = async () => {
    if (!form) return;
    const nextErrors: Record<string, string> = {};
    if (!form.deliveryAddress.trim()) nextErrors.deliveryAddress = "Delivery address is required.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  if (!order || !form) return null;

  const driverLabel = form.driverId ? drivers.find((d) => d.id === form.driverId)?.name ?? "Assigned Driver" : "Unassigned";

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <Animated.View entering={ZoomIn.duration(240)} style={[styles.modalCard, { backgroundColor: palette.card }]}>
            <View style={styles.headerRow}>
              <View>
                <Text style={[styles.title, { color: palette.text }]}>Edit Order</Text>
                <Text style={[styles.subtitle, { color: palette.muted }]}>Order #{order.id}</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={[styles.closeButton, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="close" size={18} color={palette.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8, gap: 16 }}>
              <View style={styles.row}>
                <Field label="Delivery Date" palette={palette} style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                    placeholder="DD/MM/YYYY"
                    placeholderTextColor={palette.muted}
                    value={form.deliveryDate}
                    onChangeText={(t) => updateField("deliveryDate", t)}
                  />
                </Field>
                <Field label="Delivery Time" palette={palette} style={{ flex: 1 }}>
                  <TextInput
                    style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                    placeholder="e.g. 2:00 PM"
                    placeholderTextColor={palette.muted}
                    value={form.deliveryTime}
                    onChangeText={(t) => updateField("deliveryTime", t)}
                  />
                </Field>
              </View>

              <Field label="Delivery Address" palette={palette} error={errors.deliveryAddress}>
                <TextInput
                  style={[styles.input, { color: palette.text, borderColor: errors.deliveryAddress ? palette.danger : palette.border, backgroundColor: palette.background }]}
                  placeholderTextColor={palette.muted}
                  value={form.deliveryAddress}
                  onChangeText={(t) => updateField("deliveryAddress", t)}
                />
              </Field>

              <Field label="Delivery Notes" palette={palette}>
                <TextInput
                  style={[styles.textarea, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                  placeholderTextColor={palette.muted}
                  value={form.deliveryNotes}
                  onChangeText={(t) => updateField("deliveryNotes", t)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </Field>

              <View style={styles.row}>
                <Field label="Payment Status" palette={palette} style={{ flex: 1 }}>
                  <SelectField palette={palette} label="Payment Status" value={form.paymentStatus} options={PAYMENT_STATUSES} onSelect={(v) => updateField("paymentStatus", v as PaymentStatus)} />
                </Field>
                <Field label="Priority" palette={palette} style={{ flex: 1 }}>
                  <SelectField palette={palette} label="Priority" value={form.priority} options={PRIORITIES} onSelect={(v) => updateField("priority", v as OrderPriority)} />
                </Field>
              </View>

              <Field label="Order Status" palette={palette}>
                <SelectField palette={palette} label="Order Status" value={form.status} options={ORDER_STATUSES} onSelect={(v) => updateField("status", v as OrderStatus)} />
              </Field>

              <Field label="Assign Driver" palette={palette}>
                <SelectField
                  palette={palette}
                  label="Driver"
                  value={driverLabel}
                  options={["Unassigned", ...drivers.map((d) => d.name)]}
                  onSelect={(name) => {
                    if (name === "Unassigned") {
                      updateField("driverId", null);
                    } else {
                      const match = drivers.find((d) => d.name === name);
                      updateField("driverId", match?.id ?? null);
                    }
                  }}
                />
              </Field>

              <Field label="Special Instructions" palette={palette}>
                <TextInput
                  style={[styles.textarea, { color: palette.text, borderColor: palette.border, backgroundColor: palette.background }]}
                  placeholderTextColor={palette.muted}
                  value={form.specialInstructions}
                  onChangeText={(t) => updateField("specialInstructions", t)}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </Field>

              <View style={styles.footerButtonsRow}>
                <Pressable onPress={onClose} disabled={saving} style={[styles.cancelButton, { borderColor: palette.border }]}>
                  <Text style={[styles.cancelButtonText, { color: palette.text }]}>Cancel</Text>
                </Pressable>
                <Pressable onPress={handleSave} disabled={saving} style={[styles.saveButton, { backgroundColor: palette.primary }]}>
                  {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

function Field({ label, palette, error, style, children }: { label: string; palette: Palette; error?: string; style?: any; children: React.ReactNode }) {
  return (
    <View style={style}>
      <Text style={[styles.fieldLabel, { color: palette.text }]}>{label}</Text>
      {children}
      {error && <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingVertical: 30 },
  modalCard: { width: "100%", maxWidth: 520, maxHeight: "90%", borderRadius: 24, padding: 22 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  title: { fontSize: 18, fontWeight: "800" },
  subtitle: { fontSize: 12.5, marginTop: 4 },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },

  row: { flexDirection: "row", gap: 12 },
  fieldLabel: { fontSize: 12.5, fontWeight: "700", marginBottom: 8 },
  errorText: { fontSize: 11.5, fontWeight: "600", marginTop: 6 },
  input: { height: 48, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, fontSize: 14 },
  textarea: { height: 84, borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },

  footerButtonsRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelButton: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cancelButtonText: { fontSize: 14, fontWeight: "700" },
  saveButton: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});