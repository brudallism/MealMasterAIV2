// src/components/atoms/EnhancedCalorieProgressBar.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/utils/theme';

interface EnhancedCalorieProgressBarProps {
  current: number;
  target: number;
  variant?: 'dashboard' | 'compact' | 'minimal';
  showBubbles?: boolean;
  bubbleTolerance?: number; // Calories tolerance for star indicator (default: 100)
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  customDisplayText?: string; // For progress-preview mode
  // Dual-section support for day progress view
  dualSection?: {
    currentValue: number;
    additionalValue: number;
    currentText: string;
    additionalText: string;
  };
}

export default function EnhancedCalorieProgressBar({
  current,
  target,
  variant = 'dashboard',
  showBubbles = true,
  bubbleTolerance = 100,
  size = 'medium',
  showLabels = true,
  customDisplayText,
  dualSection
}: EnhancedCalorieProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const displayCurrent = Math.round(current);

  // Star/Warning logic based on calorie tolerance
  const isWithinTarget = current >= (target - bubbleTolerance) && current <= (target + bubbleTolerance);
  const isOverTarget = current > (target + bubbleTolerance);

  const sizeConfig = getSizeConfig(size);

  // Use consistent calorie color
  const progressColor = colors.macros.calories; // Always use Sage Green for calories

  const renderDashboardVariant = () => {
    if (dualSection) {
      // Dual-section rendering for day progress view
      const currentPercentage = Math.min((dualSection.currentValue / target) * 100, 100);
      const totalPercentage = Math.min(((dualSection.currentValue + dualSection.additionalValue) / target) * 100, 100);
      const additionalPercentage = totalPercentage - currentPercentage;

      return (
        <View style={styles.container}>
          <View style={[styles.calorieBarWrapper, sizeConfig.wrapper]}>
            <View style={[styles.calorieBar, sizeConfig.bar]}>
              {/* Current day's calories (left section) */}
              <View
                style={[
                  styles.calorieBarFill,
                  {
                    width: `${currentPercentage}%`,
                    backgroundColor: progressColor,
                    borderTopLeftRadius: sizeConfig.fill.borderRadius,
                    borderBottomLeftRadius: sizeConfig.fill.borderRadius,
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  }
                ]}
              >
                {/* Text for current section - only show when large enough */}
                {showLabels && currentPercentage > 15 && (
                  <Text style={[styles.calorieBarTextInsideSection, sizeConfig.text]}>
                    {dualSection.currentText}
                  </Text>
                )}
              </View>

              {/* Additional meal calories (right section with opacity) - flush against left section */}
              <View
                style={[
                  styles.calorieBarFill,
                  {
                    width: `${additionalPercentage}%`,
                    backgroundColor: progressColor,
                    opacity: 0.6,
                    left: `${currentPercentage}%`,
                    position: 'absolute',
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    borderTopRightRadius: sizeConfig.fill.borderRadius,
                    borderBottomRightRadius: sizeConfig.fill.borderRadius,
                  }
                ]}
              >
                {/* Text inside the additional meal section - only when large enough */}
                {showLabels && additionalPercentage > 15 && (
                  <Text style={[styles.calorieBarTextInside, sizeConfig.text]}>
                    {dualSection.additionalText}
                  </Text>
                )}
              </View>

              {/* Text for additional section - when small, positioned to the right of bar */}
              {showLabels && additionalPercentage <= 15 && additionalPercentage > 0 && (
                <Text style={[
                  styles.calorieBarTextRightOfBar,
                  sizeConfig.text,
                  { left: `${currentPercentage + additionalPercentage + 2}%` } // 2% padding from bar edge
                ]}>
                  {dualSection.additionalText}
                </Text>
              )}

            </View>
          </View>

          {/* Summary text below calorie bar - positioned absolutely to not affect layout */}
          {dualSection && (
            <Text style={[styles.calorieBarSummary, sizeConfig.text]}>
              {Math.round(dualSection.currentValue + dualSection.additionalValue)} / {target} Calories
            </Text>
          )}
        </View>
      );
    }

    // Standard single-section rendering
    return (
      <View style={styles.container}>
        <View style={[styles.calorieBarWrapper, sizeConfig.wrapper]}>
          <View style={[styles.calorieBar, sizeConfig.bar]}>
            <View
              style={[
                styles.calorieBarFill,
                sizeConfig.fill,
                {
                  width: `${percentage}%`,
                  backgroundColor: progressColor,
                }
              ]}
            />

            {showLabels && (
              <Text style={[styles.calorieBarText, sizeConfig.text]}>
                {customDisplayText || `${displayCurrent} / ${target} Calories`}
              </Text>
            )}

            {/* Star bubble for within tolerance */}
            {showBubbles && isWithinTarget && !isOverTarget && (
              <View style={[styles.calorieStarBubble, sizeConfig.bubble]}>
                <Text style={[styles.calorieStarIcon, sizeConfig.bubbleText]}>★</Text>
              </View>
            )}

            {/* Warning bubble for over tolerance */}
            {showBubbles && isOverTarget && (
              <View style={[styles.calorieWarningBubble, sizeConfig.bubble]}>
                <Text style={[styles.calorieWarningIcon, sizeConfig.bubbleText]}>!</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderCompactVariant = () => (
    <View style={styles.compactContainer}>
      <View style={styles.compactHeader}>
        <Text style={[styles.compactLabel, sizeConfig.compactLabel]}>Calories</Text>
        <Text style={[styles.compactValue, sizeConfig.compactValue]}>
          {displayCurrent} / {target}
        </Text>
      </View>

      <View style={[styles.compactBar, sizeConfig.compactBarContainer]}>
        <View
          style={[
            styles.compactBarFill,
            sizeConfig.compactBar,
            {
              width: `${percentage}%`,
              backgroundColor: progressColor,
            }
          ]}
        />

        {/* Compact bubbles */}
        {showBubbles && isWithinTarget && !isOverTarget && (
          <View style={[styles.compactStarBubble, sizeConfig.compactBubble]}>
            <Text style={[styles.compactStarIcon, sizeConfig.compactBubbleText]}>★</Text>
          </View>
        )}

        {showBubbles && isOverTarget && (
          <View style={[styles.compactWarningBubble, sizeConfig.compactBubble]}>
            <Text style={[styles.compactWarningIcon, sizeConfig.compactBubbleText]}>!</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderMinimalVariant = () => (
    <View style={styles.minimalContainer}>
      <View style={[styles.minimalBar, sizeConfig.minimalBar]}>
        <View
          style={[
            styles.minimalBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: progressColor,
            }
          ]}
        />
      </View>

      {showLabels && (
        <Text style={[styles.minimalText, sizeConfig.minimalText]}>
          {displayCurrent} / {target} cal
        </Text>
      )}
    </View>
  );

  // Main component return logic
  switch (variant) {
    case 'compact':
      return renderCompactVariant();
    case 'minimal':
      return renderMinimalVariant();
    default:
      return renderDashboardVariant();
  }
}

function getSizeConfig(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return {
        title: { fontSize: typography.fontSize.base },
        wrapper: { paddingHorizontal: '2%' },
        bar: { height: 28, borderRadius: borderRadius.sm },
        fill: { borderRadius: borderRadius.sm },
        text: { fontSize: typography.fontSize.sm },
        bubble: { width: 16, height: 16, borderRadius: 8, top: -8, right: -8 },
        bubbleText: { fontSize: 10 },
        compactLabel: { fontSize: typography.fontSize.sm },
        compactValue: { fontSize: typography.fontSize.sm },
        compactBarContainer: { height: 6 },
        compactBar: { borderRadius: 3 },
        compactBubble: { width: 14, height: 14, borderRadius: 7, top: -7, right: -7 },
        compactBubbleText: { fontSize: 8 },
        minimalBar: { height: 4, borderRadius: 2 },
        minimalText: { fontSize: typography.fontSize.xs },
      };
    case 'large':
      return {
        title: { fontSize: typography.fontSize.xl },
        wrapper: { paddingHorizontal: '4%' },
        bar: { height: 44, borderRadius: borderRadius.lg },
        fill: { borderRadius: borderRadius.lg },
        text: { fontSize: typography.fontSize.lg },
        bubble: { width: 24, height: 24, borderRadius: 12, top: -12, right: -12 },
        bubbleText: { fontSize: 14 },
        compactLabel: { fontSize: typography.fontSize.base },
        compactValue: { fontSize: typography.fontSize.base },
        compactBarContainer: { height: 10 },
        compactBar: { borderRadius: 5 },
        compactBubble: { width: 18, height: 18, borderRadius: 9, top: -9, right: -9 },
        compactBubbleText: { fontSize: 10 },
        minimalBar: { height: 6, borderRadius: 3 },
        minimalText: { fontSize: typography.fontSize.sm },
      };
    default: // medium
      return {
        title: { fontSize: typography.fontSize.lg },
        wrapper: { paddingHorizontal: '3%' },
        bar: { height: 24, borderRadius: borderRadius.md },
        fill: { borderRadius: borderRadius.md },
        text: { fontSize: typography.fontSize.base },
        bubble: { width: 20, height: 20, borderRadius: 10, top: -10, right: -10 },
        bubbleText: { fontSize: 12 },
        compactLabel: { fontSize: typography.fontSize.sm },
        compactValue: { fontSize: typography.fontSize.sm },
        compactBarContainer: { height: 8 },
        compactBar: { borderRadius: 4 },
        compactBubble: { width: 16, height: 16, borderRadius: 8, top: -8, right: -8 },
        compactBubbleText: { fontSize: 9 },
        minimalBar: { height: 5, borderRadius: 2.5 },
        minimalText: { fontSize: typography.fontSize.sm },
      };
  }
}

const styles = StyleSheet.create({
  // Dashboard variant styles
  container: {
    marginBottom: spacing.sm,
  },
  calorieBarTitle: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  calorieBarWrapper: {
    position: 'relative',
  },
  calorieBar: {
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    // Enhanced 3D Floating Effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  calorieBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
  },
  calorieBarText: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    zIndex: 2,
  },
  calorieBarTextLeft: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    zIndex: 2,
    position: 'absolute',
    left: '5%',
    textAlign: 'left',
  },
  calorieBarTextRight: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500],
    zIndex: 2,
    position: 'absolute',
    right: '5%',
    textAlign: 'right',
  },
  calorieBarTextInsideLeft: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
    zIndex: 3,
    position: 'absolute',
    width: '100%',
    top: '50%',
    transform: [{ translateY: -8 }],
    textAlign: 'center',
  },
  calorieBarTextInsideSection: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.supporting.barkBrown,
    zIndex: 3,
    position: 'absolute',
    width: '100%',
    top: '50%',
    transform: [{ translateY: -8 }],
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieBarTextInside: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.inverse,
    zIndex: 3,
    position: 'absolute',
    width: '100%',
    top: '50%',
    transform: [{ translateY: -8 }],
    textAlign: 'center',
  },
  calorieBarTextRightOfBar: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.supporting.barkBrown,
    zIndex: 4,
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -8 }],
    textAlign: 'left',
  },
  calorieBarSummary: {
    fontWeight: typography.fontWeight.medium, // Match macro label weight
    color: colors.text.secondary, // Match macro label color
    fontSize: 13, // Match macro label size (medium)
    textAlign: 'center',
    position: 'absolute',
    bottom: -26, // Increased distance from bar for better padding
    width: '100%',
    zIndex: 2,
  },

  // Star/Warning bubbles for dashboard
  calorieStarBubble: {
    position: 'absolute',
    backgroundColor: colors.warning[500], // Golden Ochre
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
    ...shadows.sm,
    zIndex: 1000,
  },
  calorieStarIcon: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 14,
  },
  calorieWarningBubble: {
    position: 'absolute',
    backgroundColor: colors.error[500], // Terracotta
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background.secondary,
    ...shadows.sm,
    zIndex: 1000,
  },
  calorieWarningIcon: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 14,
  },

  // Compact variant styles
  compactContainer: {
    marginBottom: spacing.sm,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  compactLabel: {
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
  },
  compactValue: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  compactBar: {
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    position: 'relative',
    overflow: 'visible',
  },
  compactBarFill: {
    height: '100%',
  },
  compactStarBubble: {
    position: 'absolute',
    backgroundColor: colors.warning[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background.secondary,
    ...shadows.sm,
    zIndex: 999,
  },
  compactStarIcon: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 12,
  },
  compactWarningBubble: {
    position: 'absolute',
    backgroundColor: colors.error[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.background.secondary,
    ...shadows.sm,
    zIndex: 999,
  },
  compactWarningIcon: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 12,
  },

  // Minimal variant styles
  minimalContainer: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  minimalBar: {
    width: '100%',
    backgroundColor: colors.gray[200],
    position: 'relative',
    marginBottom: spacing.xs,
  },
  minimalBarFill: {
    height: '100%',
  },
  minimalText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
});