import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<maplibregl.Map | null>(null);
    const markerRef = useRef<maplibregl.Marker | null>(null);

    useImperativeHandle(ref, () => ({
      centerOn: (lat: number, lng: number) => {
        mapRef.current?.flyTo({ center: [lng, lat], zoom: 16, animate: true });
      },
    }));

    // Create the map once.
    useEffect(() => {
      if (!containerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: isDark ? STYLE_DARK : STYLE_LIGHT,
        center: [longitude, latitude],
        zoom: 15,
        attributionControl: { compact: true },
      });

      map.on("load", () => {
        const el = document.createElement("div");
        el.style.width = "26px";
        el.style.height = "26px";
        el.style.borderRadius = "8px";
        el.style.background = "#0D4A8C";
        el.style.border = "3px solid #FFFFFF";
        el.style.boxShadow = "0 0 0 5px rgba(13,74,140,0.25)";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.fontSize = "13px";
        el.textContent = "🚚";

        markerRef.current = new maplibregl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(map);
        onReady?.();
      });

      mapRef.current = map;

      return () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Swap style when theme changes.
    useEffect(() => {
      mapRef.current?.setStyle(isDark ? STYLE_DARK : STYLE_LIGHT);
    }, [isDark]);

    // Move the marker + pan smoothly whenever a new location arrives
    // (the parent's 4s poll updates these props directly).
    useEffect(() => {
      if (!markerRef.current || !mapRef.current) return;
      markerRef.current.setLngLat([longitude, latitude]);
      mapRef.current.panTo([longitude, latitude], { animate: true, duration: 1000 });
    }, [latitude, longitude]);

    // Real DOM node — this file only ever runs on web, so a plain div is fine.
    return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
  }
);