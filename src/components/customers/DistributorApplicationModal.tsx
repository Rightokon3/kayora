import React from "react";
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DistributorApplication } from "../../types/customer";

interface DistributorApplicationModalProps {
  visible: boolean;
  palette: any;
  application: DistributorApplication | null;
  loadingDetail: boolean;
  actionLoading: boolean;
  onClose: () => void;
  onApprove: () => void;
  onDeny: () => void;
}

const Field = ({ label, value, palette }: { label: string; value?: string | null; palette: any }) => (
  <View style={styles.field}>
    <Text style={[styles.fieldLabel, { color: palette.muted }]}>{label}</Text>
    <Text style={[styles.fieldValue, { color: palette.text }]}>{value?.trim() ? value : "—"}</Text>
  </View>
);

export function DistributorApplicationModal({
  visible,
  palette,
  application,
  loadingDetail,
  actionLoading,
  onClose,
  onApprove,
  onDeny,
}: DistributorApplicationModalProps) {
  const isPending = application?.status === "pending";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text }]}>Distributor Application</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={22} color={palette.muted} />
            </Pressable>
          </View>

          {loadingDetail || !application ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator color={palette.text} />
            </View>
          ) : (
            <>
              <View style={[styles.statusPill, statusStyles[application.status], { alignSelf: "flex-start" }]}>
                <Text style={styles.statusPillText}>{application.status.toUpperCase()}</Text>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Field label="Full Name" value={application.fullName} palette={palette} />
                <Field label="Business Name" value={application.businessName} palette={palette} />
                <Field label="Business Type" value={application.businessType} palette={palette} />
                <Field
                  label="Location"
                  value={[application.city, application.lga, application.state].filter(Boolean).join(", ")}
                  palette={palette}
                />
                <Field label="Phone" value={application.phone} palette={palette} />
                <Field label="WhatsApp" value={application.whatsapp} palette={palette} />
                <Field label="Email" value={application.email} palette={palette} />
                <Field label="Estimated Monthly Volume" value={application.estimatedMonthlyVolume} palette={palette} />
                <Field label="Years in Business" value={application.yearsInBusiness} palette={palette} />
                <Field label="Additional Info" value={application.additionalInfo} palette={palette} />
              </ScrollView>

              {isPending && (
                <View style={styles.actionsRow}>
                  <Pressable
                    disabled={actionLoading}
                    onPress={onDeny}
                    style={[styles.actionButton, { borderColor: palette.danger }]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color={palette.danger} size="small" />
                    ) : (
                      <Text style={[styles.actionButtonText, { color: palette.danger }]}>Deny</Text>
                    )}
                  </Pressable>
                  <Pressable
                    disabled={actionLoading}
                    onPress={onApprove}
                    style={[styles.actionButton, styles.approveButton]}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={[styles.actionButtonText, { color: "#FFFFFF" }]}>Approve</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const statusStyles = StyleSheet.create({
  pending: { backgroundColor: "#B45309" },
  approved: { backgroundColor: "#15803D" },
  rejected: { backgroundColor: "#6B7280" },
});

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: 20 },
  card: { width: "100%", maxWidth: 480, borderWidth: 1, borderRadius: 20, padding: 22 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 18, fontWeight: "800" },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 14 },
  statusPillText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.4 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 11.5, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  fieldValue: { fontSize: 14.5, marginTop: 3 },
  actionsRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  approveButton: { backgroundColor: "#15803D", borderColor: "#15803D" },
  actionButtonText: { fontSize: 14, fontWeight: "700" },
});