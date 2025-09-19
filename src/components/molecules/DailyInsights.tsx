// src/components/molecules/DailyInsights.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '@/utils/theme';

interface DailyInsightsProps {
  dailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  goals: {
    daily_calorie_goal: number;
    protein_goal: number;
    carb_goal: number;
    fat_goal: number;
  };
  onViewDetails?: () => void;
}

export default function DailyInsights({
  dailyTotals,
  goals,
  onViewDetails,
}: DailyInsightsProps) {
  // Calculate macro balance insights
  const getCalorieInsight = () => {
    const remaining = goals.daily_calorie_goal - dailyTotals.calories;
    const percentage = goals.daily_calorie_goal > 0
      ? (dailyTotals.calories / goals.daily_calorie_goal) * 100
      : 0;

    if (percentage >= 100) {
      return {
        icon: 'checkmark-circle',
        color: colors.success[500],
        title: 'Goal Achieved!',
        message: `You've met your calorie goal for today`,
      };
    } else if (percentage >= 80) {
      return {
        icon: 'trending-up',
        color: colors.warning[500],
        title: 'Almost There!',
        message: `${Math.round(remaining)} calories remaining`,
      };
    } else if (percentage >= 50) {
      return {
        icon: 'fitness',
        color: colors.primary[500],
        title: 'Good Progress',
        message: `${Math.round(remaining)} calories remaining`,
      };
    } else if (percentage > 0) {
      return {
        icon: 'sunny',
        color: colors.theme.orange,
        title: 'Great Start!',
        message: `${Math.round(remaining)} calories remaining`,
      };
    } else {
      return {
        icon: 'add-circle',
        color: colors.gray[500],
        title: 'Start Logging',
        message: 'Log your first meal to begin tracking',
      };
    }
  };

  const getMacroBalance = () => {
    const totalMacroCalories = (dailyTotals.protein * 4) + (dailyTotals.carbs * 4) + (dailyTotals.fat * 9);

    if (totalMacroCalories === 0) {
      return {
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    }

    return {
      protein: Math.round(((dailyTotals.protein * 4) / totalMacroCalories) * 100),
      carbs: Math.round(((dailyTotals.carbs * 4) / totalMacroCalories) * 100),
      fat: Math.round(((dailyTotals.fat * 9) / totalMacroCalories) * 100),
    };
  };

  const getProteinInsight = () => {
    const percentage = goals.protein_goal > 0
      ? (dailyTotals.protein / goals.protein_goal) * 100
      : 0;

    if (percentage >= 100) {
      return { status: 'excellent', color: colors.success[500] };
    } else if (percentage >= 80) {
      return { status: 'good', color: colors.warning[500] };
    } else if (percentage >= 50) {
      return { status: 'fair', color: colors.primary[500] };
    } else {
      return { status: 'low', color: colors.error[500] };
    }
  };

  const calorieInsight = getCalorieInsight();
  const macroBalance = getMacroBalance();
  const proteinInsight = getProteinInsight();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Insights</Text>
        {onViewDetails && (
          <TouchableOpacity onPress={onViewDetails} style={styles.detailsButton}>
            <Text style={styles.detailsText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Primary Insight */}
      <View style={styles.primaryInsight}>
        <View style={styles.insightIcon}>
          <Ionicons
            name={calorieInsight.icon as any}
            size={24}
            color={calorieInsight.color}
          />
        </View>
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>{calorieInsight.title}</Text>
          <Text style={styles.insightMessage}>{calorieInsight.message}</Text>
        </View>
      </View>

      {/* Macro Balance Quick View */}
      {dailyTotals.calories > 0 && (
        <View style={styles.macroSection}>
          <Text style={styles.macroTitle}>Macro Balance</Text>
          <View style={styles.macroBar}>
            <View
              style={[
                styles.macroSegment,
                {
                  backgroundColor: colors.macros.protein,
                  flex: macroBalance.protein
                }
              ]}
            />
            <View
              style={[
                styles.macroSegment,
                {
                  backgroundColor: colors.macros.carbs,
                  flex: macroBalance.carbs
                }
              ]}
            />
            <View
              style={[
                styles.macroSegment,
                {
                  backgroundColor: colors.macros.fat,
                  flex: macroBalance.fat
                }
              ]}
            />
          </View>
          <View style={styles.macroLabels}>
            <Text style={styles.macroLabel}>
              🥩 {macroBalance.protein}%
            </Text>
            <Text style={styles.macroLabel}>
              🍞 {macroBalance.carbs}%
            </Text>
            <Text style={styles.macroLabel}>
              🥑 {macroBalance.fat}%
            </Text>
          </View>
        </View>
      )}

      {/* Protein Status */}
      {dailyTotals.protein > 0 && (
        <View style={styles.proteinStatus}>
          <View style={[styles.statusDot, { backgroundColor: proteinInsight.color }]} />
          <Text style={styles.statusText}>
            Protein intake: {proteinInsight.status}
          </Text>
          <Text style={styles.statusValue}>
            {Math.round(dailyTotals.protein)}g / {Math.round(goals.protein_goal)}g
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[500],
    marginRight: spacing.xs,
  },
  primaryInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.base,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  insightMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
  },
  macroSection: {
    marginBottom: spacing.base,
  },
  macroTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  macroBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.gray[200],
    marginBottom: spacing.sm,
  },
  macroSegment: {
    height: '100%',
  },
  macroLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },
  proteinStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  statusText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.gray[700],
  },
  statusValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[800],
  },
});