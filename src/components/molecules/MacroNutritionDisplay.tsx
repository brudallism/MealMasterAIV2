// src/components/molecules/MacroNutritionDisplay.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import EnhancedCalorieProgressBar from '@/components/atoms/EnhancedCalorieProgressBar';
import EnhancedMacroRing from '@/components/atoms/EnhancedMacroRing';
import { colors, spacing } from '@/utils/theme';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

interface MacroNutritionDisplayProps {
  // Core nutrition data
  nutrition: NutritionData;

  // Variants for different use cases
  variant: 'absolute' | 'progress' | 'progress-preview' | 'rings-only' | 'basket-meal' | 'basket-progress' | 'food-detail';

  // For progress variants - daily targets
  targets?: {
    daily_calorie_goal: number;
    protein_goal: number;
    carb_goal: number;
    fat_goal: number;
    fiber_goal: number;
  };

  // For progress-preview variant - current daily totals
  currentTotals?: NutritionData;

  // Sizing and appearance
  size?: 'small' | 'medium' | 'large';
  showFiber?: boolean;

  // Animation controls
  animated?: boolean;
}

export default function MacroNutritionDisplay({
  nutrition,
  variant,
  targets,
  currentTotals,
  size = 'medium',
  showFiber = true,
  animated = true,
}: MacroNutritionDisplayProps) {

  // For progress-preview variant, calculate combined values and display with opacity
  const getCalorieDisplayData = () => {
    if (variant === 'basket-progress' && currentTotals && targets) {
      return {
        current: currentTotals.calories + nutrition.calories,
        target: targets.daily_calorie_goal,
        dualSection: {
          currentValue: currentTotals.calories,
          additionalValue: nutrition.calories,
          currentText: `${Math.round(currentTotals.calories)}`,
          additionalText: `+${Math.round(nutrition.calories)}`
        }
      };
    } else if (variant === 'basket-meal') {
      return {
        current: nutrition.calories,
        target: nutrition.calories, // Make target same as current for full bar
        displayText: `${Math.round(nutrition.calories)} Calories`
      };
    } else if (variant === 'food-detail') {
      return {
        current: nutrition.calories,
        target: nutrition.calories, // Make target same as current for full bar
        displayText: `${Math.round(nutrition.calories)} Calories`
      };
    } else if (variant === 'progress-preview' && currentTotals && targets) {
      return {
        current: currentTotals.calories,
        additional: nutrition.calories,
        target: targets.daily_calorie_goal,
        displayText: `${Math.round(currentTotals.calories)}/+${Math.round(nutrition.calories)}`
      };
    } else if (variant === 'progress' && targets) {
      return {
        current: nutrition.calories,
        target: targets.daily_calorie_goal
      };
    } else {
      return {
        current: nutrition.calories
      };
    }
  };

  const getMacroDisplayData = (macroType: 'protein' | 'carbs' | 'fat' | 'fiber') => {
    const currentValue = nutrition[macroType] || 0;

    if (variant === 'basket-progress' && currentTotals && targets) {
      const currentTotal = currentTotals[macroType] || 0;
      // Map macro types to correct goal property names
      const goalPropertyMap = {
        protein: 'protein_goal',
        carbs: 'carb_goal', // Note: carb_goal not carbs_goal
        fat: 'fat_goal',
        fiber: 'fiber_goal'
      };
      const targetValue = targets[goalPropertyMap[macroType] as keyof typeof targets] || 0;

      return {
        current: currentTotal + currentValue,
        target: targetValue > 0 ? targetValue : 100, // Fallback to prevent 0 targets
        dayProgressData: {
          currentTotal: Math.round(currentTotal),
          additional: Math.round(currentValue),
          target: targetValue > 0 ? targetValue : 100
        }
      };
    } else if (variant === 'basket-meal') {
      return {
        current: currentValue,
        target: currentValue, // Make target same as current for full rings
      };
    } else if (variant === 'food-detail') {
      return {
        current: currentValue,
        target: currentValue, // Make target same as current for full rings
      };
    } else if (variant === 'progress-preview' && currentTotals && targets) {
      const currentTotal = currentTotals[macroType] || 0;
      const goalPropertyMap = {
        protein: 'protein_goal',
        carbs: 'carb_goal',
        fat: 'fat_goal',
        fiber: 'fiber_goal'
      };
      const targetValue = targets[goalPropertyMap[macroType] as keyof typeof targets] || 0;

      return {
        current: currentTotal + currentValue,
        target: targetValue,
        centerText: `${Math.round(currentTotal)}+${Math.round(currentValue)} / ${targetValue}`
      };
    } else if (variant === 'progress' && targets) {
      const goalPropertyMap = {
        protein: 'protein_goal',
        carbs: 'carb_goal',
        fat: 'fat_goal',
        fiber: 'fiber_goal'
      };
      const targetValue = targets[goalPropertyMap[macroType] as keyof typeof targets] || 0;
      return {
        current: currentValue,
        target: targetValue
      };
    } else {
      return {
        current: currentValue
      };
    }
  };

  const calorieData = getCalorieDisplayData();

  const macroColors = {
    protein: colors.macros.protein,
    carbs: colors.macros.carbs,
    fat: colors.macros.fats,
    fiber: colors.macros.fiber,
  };

  const renderCalorieBar = () => {
    if (variant === 'absolute' || variant === 'rings-only') {
      // For absolute and rings-only variants, don't show calorie bar (just macro rings)
      return null;
    }

    const isProgressPreview = variant === 'progress-preview';
    const isBasketProgress = variant === 'basket-progress';
    const isAbsoluteValue = variant === 'basket-meal' || variant === 'food-detail';

    return (
      <View style={styles.calorieSection}>
        <EnhancedCalorieProgressBar
          current={calorieData.current || 0}
          target={calorieData.target || 2000}
          variant="dashboard"
          size={size}
          showBubbles={!isProgressPreview && !isAbsoluteValue}
          showLabels={true}
          customDisplayText={calorieData.displayText}
          dualSection={calorieData.dualSection}
        />
      </View>
    );
  };

  const renderMacroRings = () => {
    const macros = ['protein', 'carbs', 'fat', 'fiber'] as const;

    return (
      <View style={styles.macroRings}>
        {macros.map((macro) => {
          const macroData = getMacroDisplayData(macro);
          const isAbsolute = variant === 'absolute' || variant === 'rings-only' || variant === 'basket-meal' || variant === 'food-detail';
          const isProgressPreview = variant === 'progress-preview';
          const isBasketProgress = variant === 'basket-progress';

          return (
            <View
              key={macro}
              style={styles.macroRingContainer}
            >
              <EnhancedMacroRing
                label={macro.charAt(0).toUpperCase() + macro.slice(1)}
                current={macroData.current}
                target={macroData.target}
                color={macroColors[macro]}
                variant={isAbsolute ? 'absolute' : 'progress'}
                size={size}
                animated={animated && !isProgressPreview}
                showStatusIndicators={!isAbsolute && !isProgressPreview}
                customCenterText={macroData.centerText}
                dayProgressData={macroData.dayProgressData}
              />
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderCalorieBar()}
      {renderMacroRings()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  calorieSection: {
    width: '100%',
    marginBottom: spacing.base,
  },
  macroRings: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Changed from space-between to space-around for better distribution
    alignItems: 'center',
    width: '100%',
    flexWrap: 'nowrap', // Prevent wrapping to ensure all rings stay on one row
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.base, // Extra bottom padding for macro labels
    overflow: 'visible',
  },
  macroRingContainer: {
    flex: 1,
    maxWidth: 90, // Set max width to ensure 4 rings fit
    alignItems: 'center',
    overflow: 'visible',
    paddingVertical: spacing.xs,
    paddingBottom: spacing.lg, // Extra bottom padding for labels
    minHeight: 120, // Ensure enough height for ring + label
  },
});