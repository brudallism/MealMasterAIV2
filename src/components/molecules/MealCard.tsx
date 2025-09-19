// src/components/molecules/MealCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '@/utils/theme';

export interface Meal {
  id: string;
  food_name: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
  quantity_grams?: number;
  notes?: string;
  ai_confidence?: number;
  user_confirmed?: boolean;
}

interface MealCardProps {
  meal: Meal;
  onPress?: () => void;
  showDetails?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function MealCard({ 
  meal, 
  onPress, 
  showDetails = true, 
  variant = 'default' 
}: MealCardProps) {
  const mealTypeColors = {
    breakfast: colors.mealTypes.breakfast,   // Golden Ochre
    lunch: colors.mealTypes.lunch,           // Sage Green
    dinner: colors.mealTypes.dinner,         // Terracotta
    snack: colors.mealTypes.snack            // Bark Brown
  };

  const formatMacros = (calories: number, protein: number, carbs: number, fat: number) => {
    if (variant === 'compact') {
      return `${Math.round(calories)} cal`;
    }
    return `${Math.round(calories)} cal • ${Math.round(protein)}g protein • ${Math.round(carbs)}g carbs • ${Math.round(fat)}g fat`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMealType = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  const CardContent = (
    <View style={[
      styles.mealCard, 
      variant === 'compact' && styles.compactCard,
      { borderLeftColor: mealTypeColors[meal.meal_type] }
    ]}>
      <View style={styles.mealHeader}>
        <Text style={[styles.mealName, variant === 'compact' && styles.compactMealName]} numberOfLines={1}>
          {meal.food_name}
        </Text>
        <View style={styles.mealTypeContainer}>
          <Text style={[styles.mealType, { color: mealTypeColors[meal.meal_type] }]}>
            {formatMealType(meal.meal_type)}
          </Text>
        </View>
      </View>
      
      {showDetails && (
        <Text style={[styles.mealMacros, variant === 'compact' && styles.compactMacros]}>
          {formatMacros(meal.calories, meal.protein, meal.carbs, meal.fat)}
        </Text>
      )}
      
      <View style={styles.mealFooter}>
        <Text style={styles.mealTime}>
          {formatTime(meal.logged_at)}
        </Text>
        
        {variant === 'detailed' && meal.ai_confidence && meal.ai_confidence < 1.0 && (
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceText}>
              AI: {Math.round(meal.ai_confidence * 100)}%
            </Text>
            {!meal.user_confirmed && (
              <View style={styles.unconfirmedIndicator} />
            )}
          </View>
        )}
        
        {meal.quantity_grams && (
          <Text style={styles.quantityText}>
            {meal.quantity_grams}g
          </Text>
        )}
      </View>
      
      {variant === 'detailed' && meal.notes && (
        <Text style={styles.notesText} numberOfLines={2}>
          💭 {meal.notes}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {CardContent}
      </TouchableOpacity>
    );
  }

  return CardContent;
}

const styles = StyleSheet.create({
  mealCard: {
    backgroundColor: colors.background.secondary, // Cream Linen
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary[500], // Default Deep Forest Green
    ...shadows.sm,
  },
  compactCard: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  mealName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary, // Deep Brown
    flex: 1,
    marginRight: spacing.sm,
  },
  compactMealName: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  mealTypeContainer: {
    backgroundColor: colors.supporting.warmBeige, // Warm Beige background
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xl,
  },
  mealType: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
  },
  mealMacros: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary, // Bark Brown
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  compactMacros: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.xs,
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTime: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary, // Sage Green
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 11,
    color: colors.warning[500], // Golden Ochre
    marginRight: spacing.xs,
  },
  unconfirmedIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error[500], // Terracotta
  },
  quantityText: {
    fontSize: 11,
    color: colors.text.tertiary, // Sage Green
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary, // Bark Brown
    fontStyle: 'italic',
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});