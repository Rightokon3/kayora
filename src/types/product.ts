export type ProductStatus = "Active" | "Inactive" | "Out of Stock";

export const BOTTLE_SIZES = ["50cl", "75cl", "1L", "1.5L", "5L", "10L", "18.9L"] as const;
export type BottleSize = (typeof BOTTLE_SIZES)[number];

export const PRODUCT_STATUSES: ProductStatus[] = ["Active", "Inactive", "Out of Stock"];

export interface Product {
  id: string;
  name: string;
  description: string;
  size: BottleSize | string;
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