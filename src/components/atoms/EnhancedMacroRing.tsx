// src/components/atoms/EnhancedMacroRing.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography, spacing, borderRadius, shadows } from '@/utils/theme';

interface EnhancedMacroRingProps {
  // Core props
  label: string;
  current: number;
  target?: number; // Optional for meal-only mode
  color: string;
  unit?: string;

  // Visual variants
  size?: 'small' | 'medium' | 'large';
  variant?: 'progress' | 'absolute'; // progress = vs target, absolute = meal-only

  // Animation control
  animated?: boolean;
  animationDuration?: number;

  // Status indicators
  showStatusIndicators?: boolean;
  targetTolerance?: number; // Percentage tolerance for star indicator (default: 5%)
}

export default function EnhancedMacroRing({
  label,
  current,
  target,
  color,
  unit = 'g',
  size = 'medium',
  variant = 'progress',
  animated = true,
  animationDuration = 800,
  showStatusIndicators = true,
  targetTolerance = 5
}: EnhancedMacroRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Calculate progress percentage (only for progress variant)
  const percentage = variant === 'progress' && target ? (current / target) * 100 : 100;
  const isOverTarget = variant === 'progress' && target ? percentage >= 105.5 : false;
  const isNearTarget = variant === 'progress' && target ?
    percentage >= (100 - targetTolerance) && percentage <= (100 + targetTolerance) : false;

  const displayCurrent = Math.round(current);
  const sizeConfig = getSizeConfig(size);
  const { svgSize, radius, strokeWidth } = sizeConfig;

  // Calculate circumference and stroke dash array for progress
  const circumference = 2 * Math.PI * radius;

  // 2-stage animation effect
  useEffect(() => {
    if (animated && variant === 'progress') {
      // Reset animation value
      animatedValue.setValue(0);

      // 2-stage animation: overshoot → settle
      Animated.sequence([
        // Stage 1: Fast overshoot (5% overshoot)
        Animated.timing(animatedValue, {
          toValue: Math.min(percentage * 1.05, 105), // 5% overshoot, capped at 105%
          duration: animationDuration * 0.6, // 60% of total duration
          useNativeDriver: false,
        }),
        // Stage 2: Settle to exact value
        Animated.timing(animatedValue, {
          toValue: percentage,
          duration: animationDuration * 0.4, // 40% of total duration
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // For absolute variant or non-animated, set immediately
      animatedValue.setValue(percentage);
    }
  }, [percentage, animated, animationDuration]);

  const renderProgressRing = () => {
    if (variant === 'absolute') {
      // Absolute variant: show full circle with current value
      return (
        <>
          {/* Background circle */}
          <Circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={colors.gray[200]}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Full progress circle for absolute values */}
          <Circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={0}
            transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
          />
          {/* Start indicator at 12 o'clock */}
          <Circle
            cx={svgSize / 2}
            cy={strokeWidth}
            r={2}
            fill={color}
          />
        </>
      );
    } else {
      // Progress variant: animated progress ring
      const AnimatedCircle = Animated.createAnimatedComponent(Circle);
      return (
        <>
          {/* Background circle */}
          <Circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={colors.gray[200]}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Animated progress circle */}
          <AnimatedCircle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedValue.interpolate({
              inputRange: [0, 100],
              outputRange: [circumference, 0],
              extrapolate: 'clamp',
            })}
            transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
          />
          {/* Start indicator at 12 o'clock */}
          <Circle
            cx={svgSize / 2}
            cy={strokeWidth}
            r={2}
            fill={color}
          />
        </>
      );
    }
  };

  const renderCenterContent = () => {
    if (variant === 'absolute') {
      // Absolute variant: show only current value
      return (
        <Text style={[styles.singleValue, sizeConfig.centerText]}>
          {displayCurrent}{unit}
        </Text>
      );
    } else {
      // Progress variant: show current/target
      return (
        <>
          <Text style={[styles.currentValue, sizeConfig.centerText]}>
            {displayCurrent}{unit}
          </Text>
          <View style={[styles.divider, sizeConfig.divider]} />
          <Text style={[styles.targetValue, sizeConfig.centerText]}>
            {target}{unit}
          </Text>
        </>
      );
    }
  };

  const renderStatusIndicators = () => {
    if (!showStatusIndicators || variant === 'absolute') return null;

    return (
      <>
        {/* Star bubble for within target range */}
        {isNearTarget && !isOverTarget && (
          <View style={[styles.starBubble, sizeConfig.bubble]}>
            <Text style={[styles.starIcon, sizeConfig.bubbleText]}>★</Text>
          </View>
        )}

        {/* Warning bubble for over target */}
        {isOverTarget && (
          <View style={[styles.warningBubble, sizeConfig.bubble]}>
            <Text style={[styles.warningIcon, sizeConfig.bubbleText]}>!</Text>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.ringWrapper, sizeConfig.wrapper]}>
        {/* SVG Circular Progress with 3D floating effect */}
        <View style={[styles.circularProgressContainer, sizeConfig.container]}>
          <Svg width={svgSize} height={svgSize} style={styles.circularProgressSvg}>
            {renderProgressRing()}
          </Svg>

          {/* Center content */}
          <View style={[styles.circularProgressContent, sizeConfig.content]}>
            {renderCenterContent()}
          </View>
        </View>

        {/* Status indicators */}
        {renderStatusIndicators()}
      </View>

      {/* Label */}
      <Text style={[styles.macroLabel, sizeConfig.label]}>{label}</Text>
    </View>
  );
}

function getSizeConfig(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return {
        svgSize: 60,
        radius: 24,
        strokeWidth: 4,
        wrapper: { width: 60, height: 60 },
        container: { width: 60, height: 60, borderRadius: 30 },
        content: { width: 40, height: 40 },
        centerText: { fontSize: 12 },
        label: { fontSize: 11 },
        bubble: { width: 16, height: 16, borderRadius: 8, top: -2, right: -2 },
        bubbleText: { fontSize: 10 },
        divider: { width: 16, height: 1 },
      };
    case 'large':
      return {
        svgSize: 100,
        radius: 42,
        strokeWidth: 8,
        wrapper: { width: 100, height: 100 },
        container: { width: 100, height: 100, borderRadius: 50 },
        content: { width: 70, height: 70 },
        centerText: { fontSize: 16 },
        label: { fontSize: 15 },
        bubble: { width: 24, height: 24, borderRadius: 12, top: -3, right: -3 },
        bubbleText: { fontSize: 14 },
        divider: { width: 28, height: 1 },
      };
    default: // medium
      return {
        svgSize: 80,
        radius: 32,
        strokeWidth: 6,
        wrapper: { width: 80, height: 80 },
        container: { width: 80, height: 80, borderRadius: 40 },
        content: { width: 60, height: 60 },
        centerText: { fontSize: 14 },
        label: { fontSize: 13 },
        bubble: { width: 20, height: 20, borderRadius: 10, top: -2, right: -2 },
        bubbleText: { fontSize: 12 },
        divider: { width: 24, height: 1 },
      };
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
  },
  ringWrapper: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  circularProgressContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: colors.background.secondary,
    // Enhanced 3D Floating Effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  circularProgressSvg: {
    position: 'absolute',
  },
  circularProgressContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Center content styles
  singleValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  currentValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  divider: {
    backgroundColor: colors.gray[300],
    marginVertical: 2,
  },
  targetValue: {
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  // Status indicator styles
  starBubble: {
    position: 'absolute',
    backgroundColor: colors.warning[500], // Golden Ochre
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
    ...shadows.sm,
    zIndex: 999,
  },
  starIcon: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 14,
  },
  warningBubble: {
    position: 'absolute',
    backgroundColor: colors.error[500], // Terracotta
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
    ...shadows.sm,
    zIndex: 999,
  },
  warningIcon: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 14,
  },
  // Label style
  macroLabel: {
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});