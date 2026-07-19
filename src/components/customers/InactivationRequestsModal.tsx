import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { ZoomIn } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";
import { AccountInactivationRequest } from "../../types/customer";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function statusColor(status: string, palette: Palette): string {
  if (status === "approved") return palette.success;
  if (status === "rejected") return palette.danger;
  return palette.muted; // "pending" — using muted since Palette's exact field set isn't confirmed
}

export function InactivationRequestsModal({
  visible,
  palette,
  requests,
  resolvingId,
  onClose,
  onResolve,
}: {
  visible: boolean;
  palette: Palette;
  requests: AccountInactivationRequest[];
  resolvingId: number | null;
  onClose: () => void;
  onResolve: (request: AccountInactivationRequest) => void;
}) {
  if (!visible) return null;

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <BlurView intensity={35} tint={palette.scheme === "dark" ? "dark" : "light"} style={StyleSheet.absoluteFill}>
        <View style={styles.overlay}>
          <Animated.View entering={ZoomIn.duration(220)} style={[styles.card, { backgroundColor: palette.card }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, { color: palette.text }]}>Account Deletion Requests</Text>
              <Pressable onPress={onClose} hitSlop={10} style={[styles.closeButton, { backgroundColor: palette.pillBg }]}>
                <Ionicons name="close" size={18} color={palette.text} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {requests.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="checkmark-circle-outline" size={34} color={palette.muted} />
                  <Text style={[styles.emptyText, { color: palette.muted }]}>No pending deletion requests.</Text>
                </View>
              ) : (
                requests.map((req, index) => (
                  <View
                    key={req.id}
                    style={[
                      styles.requestRow,
                      { borderColor: palette.border },
                      index !== requests.length - 1 && { marginBottom: 12 },
                    ]}
                  >
                    <View style={styles.requestTopRow}>
                      <Text style={[styles.userIdText, { color: palette.text }]}>User ID: {req.user_id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor(req.status, palette) + "1A" }]}>
                        <Text style={[styles.statusBadgeText, { color: statusColor(req.status, palette) }]}>
                          {req.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.fieldLabel, { color: palette.muted }]}>Account Type</Text>
                    <Text style={[styles.fieldValue, { color: palette.text }]}>{req.account_type}</Text>

                    <Text style={[styles.fieldLabel, { color: palette.muted, marginTop: 8 }]}>Reason</Text>
                    <Text style={[styles.fieldValue, { color: palette.text }]}>{req.reason ?? "—"}</Text>

                    <View style={styles.datesRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.fieldLabel, { color: palette.muted }]}>Created</Text>
                        <Text style={[styles.fieldValueSmall, { color: palette.text }]}>
                          {formatDateTime(req.created_at)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.fieldLabel, { color: palette.muted }]}>Updated</Text>
                        <Text style={[styles.fieldValueSmall, { color: palette.text }]}>
                          {formatDateTime(req.updated_at)}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => onResolve(req)}
                      disabled={resolvingId === req.id}
                      style={[styles.deleteButton, { backgroundColor: palette.danger }]}
                    >
                      {resolvingId === req.id ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={15} color="#FFFFFF" />
                          <Text style={styles.deleteButtonText}>Delete Account</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                ))
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  card: { width: "100%", maxWidth: 460, borderRadius: 22, padding: 22 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 17, fontWeight: "800" },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  emptyWrap: { alignItems: "center", paddingVertical: 32, gap: 10 },
  emptyText: { fontSize: 13, fontWeight: "600" },
  requestRow: { borderWidth: 1, borderRadius: 16, padding: 14 },
  requestTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  userIdText: { fontSize: 14, fontWeight: "800" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: "800", textTransform: "capitalize" },
  fieldLabel: { fontSize: 10.5, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  fieldValue: { fontSize: 13, marginTop: 3, lineHeight: 18 },
  fieldValueSmall: { fontSize: 12, marginTop: 3 },
  datesRow: { flexDirection: "row", marginTop: 10, gap: 12 },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    borderRadius: 10,
    marginTop: 14,
  },
  deleteButtonText: { color: "#FFFFFF", fontSize: 12.5, fontWeight: "700" },
});