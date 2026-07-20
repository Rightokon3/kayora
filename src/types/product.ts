/**
 * BOTTLE_SIZES matches every size seen elsewhere across the app (the
 * admin dashboard's order-category chart legend, order_items.size values).
 *
 * PRODUCT_STATUSES: "Active" and "Out of Stock" are confirmed by
 * StatusBadge.tsx's color logic. The third value ("Draft") is an
 * assumption — StatusBadge.tsx just falls through to a muted color for
 * "anything else," so it doesn't reveal what that third status is
 * actually called. If your product form/backend expects a different
 * label, this is the one line to change (types/product.ts and the
 * migration's enum both need to match).
 */
export const BOTTLE_SIZES = ["30cl", "50cl", "75cl", "1L", "1.5L", "5L", "10L", "18.9L"] as const;
export const PRODUCT_STATUSES = ["Active", "Out of Stock", "Draft"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface Product {
  id: string;
  name: string;
  description: string;
  size: string;
  price: number;
  imageUri: string | null;
  available: boolean;
  status: ProductStatus;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  description: string;
  size: string;
  price: number;
  imageUri: string | null;
  available: boolean;
  status: ProductStatus;
}