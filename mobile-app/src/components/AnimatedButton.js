import React, { useRef } from "react";
import { Pressable, Animated, Platform, Easing } from "react-native";

export default function AnimatedButton({ 
  children, 
  onPress, 
  style, 
  disabled, 
  activeScale = 0.93, 
  hoverScale = 1.05, 
  focusScale = 1.02 
}) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const rotateXValue = useRef(new Animated.Value(0)).current;
  const rotateYValue = useRef(new Animated.Value(0)).current;

  // Custom bezier curve simulating CSS ease-in-out
  const transitionEase = Easing.bezier(0.25, 0.1, 0.25, 1);

  const animate = (scale, rx, ry, delay = 0) => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: scale,
        duration: 150,
        delay,
        easing: transitionEase,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(rotateXValue, {
        toValue: rx,
        duration: 150,
        delay,
        easing: transitionEase,
        useNativeDriver: Platform.OS !== "web",
      }),
      Animated.timing(rotateYValue, {
        toValue: ry,
        duration: 150,
        delay,
        easing: transitionEase,
        useNativeDriver: Platform.OS !== "web",
      }),
    ]).start();
  };

  const handlePressIn = () => {
    if (disabled) return;
    // Active state: scale down + 3D back-tilt
    animate(activeScale, -4, 4);
  };

  const handlePressOut = () => {
    if (disabled) return;
    // Release active: return to rest/hover with delay-150
    animate(1, 0, 0, 150);
  };

  const handleHoverIn = () => {
    if (disabled) return;
    // Hover state: lift up + 3D forward-tilt
    animate(hoverScale, 3, -3);
  };

  const handleHoverOut = () => {
    if (disabled) return;
    // Unhover: transition back
    animate(1, 0, 0);
  };

  const handleFocus = () => {
    if (disabled) return;
    // Focus state
    animate(focusScale, 2, -2);
  };

  const handleBlur = () => {
    if (disabled) return;
    animate(1, 0, 0);
  };

  const rotX = rotateXValue.interpolate({
    inputRange: [-10, 10],
    outputRange: ["-10deg", "10deg"],
  });

  const rotY = rotateYValue.interpolate({
    inputRange: [-10, 10],
    outputRange: ["-10deg", "10deg"],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onHoverIn={Platform.OS === "web" ? handleHoverIn : undefined}
      onHoverOut={Platform.OS === "web" ? handleHoverOut : undefined}
      onFocus={Platform.OS === "web" ? handleFocus : undefined}
      onBlur={Platform.OS === "web" ? handleBlur : undefined}
      disabled={disabled}
      style={style}
    >
      <Animated.View
        style={{
          transform: [
            { perspective: 350 },
            { scale: scaleValue },
            { rotateX: rotX },
            { rotateY: rotY },
          ],
        }}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}
