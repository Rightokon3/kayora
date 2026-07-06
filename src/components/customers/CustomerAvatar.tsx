import React, { memo, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { Palette } from "../../contexts/ThemeContext";

function CustomerAvatarBase({
  palette,
  name,
  profilePicture,
  size = 44,
}: {
  palette: Palette;
  name: string;
  profilePicture: string | null;
  size?: number;
}) {
  const opacity = useSharedValue(0);
  const [loaded, setLoaded] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const handleLoad = () => {
    setLoaded(true);
    opacity.value = withTiming(1, { duration: 300 });
  };

  const initial = name.trim().charAt(0).toUpperCase();
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (profilePicture) {
    return (
      <View style={dimension}>
        {!loaded && (
          <View style={[dimension, styles.fallback, { backgroundColor: palette.pillBg, position: "absolute" }]} />
        )}
        <Animated.Image
          source={{ uri: profilePicture }}
          style={[dimension, animatedStyle]}
          onLoad={handleLoad}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[dimension, styles.fallback, { backgroundColor: palette.primary }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

export const CustomerAvatar = memo(CustomerAvatarBase);

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
  initial: { color: "#FFFFFF", fontWeight: "800" },
});