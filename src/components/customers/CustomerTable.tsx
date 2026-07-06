import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Palette } from "../../contexts/ThemeContext";
import { Customer } from "../../types/customer";
import { CustomerAvatar } from "./CustomerAvatar";

const COLUMN_WIDTHS = {
  customer: 220,
  contact: 210,
  address: 240,
  joined: 130,
  actions: 100,
};

function formatJoinedDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function CustomerTableBase({
  palette,
  customers,
  onDelete,
}: {
  palette: Palette;
  customers: Customer[];
  onDelete: (customer: Customer) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={[styles.headerRow, { borderBottomColor: palette.border }]}>
          <Text
            style={[
              styles.headerCell,
              { width: COLUMN_WIDTHS.customer, color: palette.muted },
            ]}
          >
            Customer
          </Text>
          <Text
            style={[
              styles.headerCell,
              { width: COLUMN_WIDTHS.contact, color: palette.muted },
            ]}
          >
            Contact
          </Text>
          <Text
            style={[
              styles.headerCell,
              { width: COLUMN_WIDTHS.address, color: palette.muted },
            ]}
          >
            Address
          </Text>
          <Text
            style={[
              styles.headerCell,
              { width: COLUMN_WIDTHS.joined, color: palette.muted },
            ]}
          >
            Joined
          </Text>
          <Text
            style={[
              styles.headerCell,
              { width: COLUMN_WIDTHS.actions, color: palette.muted },
            ]}
          >
            Actions
          </Text>
        </View>

        {customers.map((customer, index) => (
          <View
            key={customer.id}
            style={[
              styles.row,
              index !== customers.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: palette.border,
              },
            ]}
          >
            <View
              style={[styles.customerCell, { width: COLUMN_WIDTHS.customer }]}
            >
              <CustomerAvatar
                palette={palette}
                name={customer.name}
                profilePicture={customer.profilePicture}
                size={40}
              />
              <View style={{ marginLeft: 12, flexShrink: 1 }}>
                <Text
                  style={[styles.customerName, { color: palette.text }]}
                  numberOfLines={1}
                >
                  {customer.name}
                </Text>
                <Text style={[styles.customerId, { color: palette.muted }]}>
                  {customer.id}
                </Text>
              </View>
            </View>

            <View style={{ width: COLUMN_WIDTHS.contact }}>
              <Text
                style={[styles.cellPrimary, { color: palette.text }]}
                numberOfLines={1}
              >
                {customer.phone}
              </Text>
              <Text
                style={[styles.cellSecondary, { color: palette.muted }]}
                numberOfLines={1}
              >
                {customer.email}
              </Text>
            </View>

            <Text
              style={[
                styles.cellPrimary,
                { width: COLUMN_WIDTHS.address, color: palette.text },
              ]}
              numberOfLines={1}
            >
              {customer.address.street}, {customer.address.city},{" "}
              {customer.address.state}
            </Text>

            <Text
              style={[
                styles.cellPrimary,
                { width: COLUMN_WIDTHS.joined, color: palette.muted },
              ]}
            >
              {formatJoinedDate(customer.joinedAt)}
            </Text>

            <View style={{ width: COLUMN_WIDTHS.actions }}>
              <Pressable
                onPress={() => onDelete(customer)}
                style={[
                  styles.deleteButton,
                  { borderColor: palette.danger + "40" },
                ]}
              >
                <Ionicons
                  name="trash-outline"
                  size={16}
                  color={palette.danger}
                />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export const CustomerTable = memo(CustomerTableBase);

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 4,
    gap: 8,
  },
  headerCell: {
    fontSize: 11.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  customerCell: { flexDirection: "row", alignItems: "center" },
  customerName: { fontSize: 14, fontWeight: "700" },
  customerId: { fontSize: 11.5, marginTop: 2 },
  cellPrimary: { fontSize: 13.5, paddingRight: 8 },
  cellSecondary: { fontSize: 12, marginTop: 2 },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
