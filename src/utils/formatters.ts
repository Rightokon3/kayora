export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

export function formatCompactNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

import { OrderStatus } from "../types/dashboard";
import { Palette } from "../contexts/ThemeContext";

export function orderStatusColor(status: OrderStatus, palette: Palette): string {
  switch (status) {
    case "Delivered":
      return palette.success;
    case "In Transit":
      return palette.accent;
    case "Assigned":
      return palette.secondary;
    case "Preparing":
      return palette.warning;
    case "Pending":
      return palette.muted;
    case "Cancelled":
      return palette.danger;
    default:
      return palette.muted;
  }
}