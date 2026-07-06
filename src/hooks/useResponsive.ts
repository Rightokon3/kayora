import { useWindowDimensions } from "react-native";



export type DeviceClass = "phone" | "tablet" | "desktop";

export interface ResponsiveInfo {
  width: number;
  height: number;
  device: DeviceClass;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  columns: 1 | 2;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  let device: DeviceClass = "phone";
  if (width >= 1024) device = "desktop";
  else if (width >= 768) device = "tablet";

  return {
    width,
    height,
    device,
    isPhone: device === "phone",
    isTablet: device === "tablet",
    isDesktop: device === "desktop",
    columns: device === "phone" ? 1 : 2,
  };
}