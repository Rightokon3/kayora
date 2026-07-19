import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Palette } from "../../contexts/ThemeContext";
import { TimelineEvent } from "../../types/order";

function formatTimestamp(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

export function OrderTimeline({ palette, events }: { palette: Palette; events: TimelineEvent[] }) {
  return (
    <View>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        return (
          <View key={event.label} style={styles.row}>
            <View style={styles.iconColumn}>
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: event.completed ? palette.success : palette.pillBg,
                    borderColor: event.completed ? palette.success : palette.border,
                  },
                ]}
              >
                {event.completed && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
              </View>
              {!isLast && (
                <View style={[styles.connector, { backgroundColor: event.completed ? palette.success : palette.border }]} />
              )}
            </View>

            <View style={{ flex: 1, paddingBottom: isLast ? 0 : 18 }}>
              <Text style={[styles.label, { color: event.completed ? palette.text : palette.muted, fontWeight: event.completed ? "700" : "500" }]}>
                {event.label}
              </Text>
              {event.timestamp && <Text style={[styles.timestamp, { color: palette.muted }]}>{formatTimestamp(event.timestamp)}</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  iconColumn: { alignItems: "center", marginRight: 12 },
  iconCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  connector: { width: 2, flex: 1, marginTop: 4, marginBottom: 4, minHeight: 18 },
  label: { fontSize: 13 },
  timestamp: { fontSize: 11, marginTop: 3 },
});