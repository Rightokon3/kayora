import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

function ShimmerBlock({ palette, style }: { palette: Palette; style: any }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[{ backgroundColor: palette.pillBg, borderRadius: 8 }, style, animatedStyle]} />;
}

export function CustomersSkeleton({ palette, rows = 4 }: { palette: Palette; rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.row,
            { borderBottomColor: palette.border },
            index !== rows - 1 && { borderBottomWidth: 1 },
          ]}
        >
          <ShimmerBlock palette={palette} style={{ width: 40, height: 40, borderRadius: 20 }} />
          <View style={{ flex: 1, marginLeft: 14, gap: 8 }}>
            <ShimmerBlock palette={palette} style={{ width: "35%", height: 12 }} />
            <ShimmerBlock palette={palette} style={{ width: "55%", height: 10 }} />
          </View>
          <ShimmerBlock palette={palette} style={{ width: 90, height: 10, marginLeft: 14 }} />
          <ShimmerBlock palette={palette} style={{ width: 34, height: 34, borderRadius: 9, marginLeft: 14 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
});