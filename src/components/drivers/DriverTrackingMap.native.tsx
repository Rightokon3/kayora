import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import MapLibreGL from "@maplibre/maplibre-react-native";

MapLibreGL.setAccessToken(null);

const STYLE_LIGHT = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const STYLE_DARK = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export interface DriverTrackingMapHandle {
  centerOn: (lat: number, lng: number) => void;
}

interface DriverTrackingMapProps {
  latitude: number;
  longitude: number;
  isDark: boolean;
  onReady?: () => void;
}

export const DriverTrackingMap = forwardRef<DriverTrackingMapHandle, DriverTrackingMapProps>(
  function DriverTrackingMap({ latitude, longitude, isDark, onReady }, ref) {
    const cameraRef = useRef<MapLibreGL.Camera>(null);

    useImperativeHandle(ref, () => ({
      centerOn: (lat: number, lng: number) => {
        cameraRef.current?.setCamera({
          centerCoordinate: [lng, lat],
          zoomLevel: 16,
          animationDuration: 600,
        });
      },
    }));

    return (
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={isDark ? STYLE_DARK : STYLE_LIGHT}
        logoEnabled={false}
        attributionEnabled
        onDidFinishLoadingMap={onReady}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: [longitude, latitude], zoomLevel: 15 }}
        />
        <MapLibreGL.MarkerView coordinate={[longitude, latitude]} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.pin}>
            <Text style={styles.pinEmoji}>🚚</Text>
          </View>
        </MapLibreGL.MarkerView>
      </MapLibreGL.MapView>
    );
  }
);

const styles = StyleSheet.create({
  map: { flex: 1 },
  pin: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "#0D4A8C",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0D4A8C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  pinEmoji: { fontSize: 13 },
});