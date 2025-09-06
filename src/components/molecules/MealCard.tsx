// src/components/molecules/MealCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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
    breakfast: '#F59E0B',
    lunch: '#10B981',
    dinner: '#6366F1',
    snack: '#EC4899'
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
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  compactCard: {
    padding: 12,
    marginBottom: 4,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  compactMealName: {
    fontSize: 14,
    marginBottom: 4,
  },
  mealTypeContainer: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  mealType: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  mealMacros: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  compactMacros: {
    fontSize: 12,
    marginBottom: 4,
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTime: {
    fontSize: 12,
    color: '#888',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 11,
    color: '#F59E0B',
    marginRight: 4,
  },
  unconfirmedIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  quantityText: {
    fontSize: 11,
    color: '#888',
    fontStyle: 'italic',
  },
  notesText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
});