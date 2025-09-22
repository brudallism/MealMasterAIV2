// src/screens/DashboardScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useMealStore } from '@/stores/meal-store';
import { useUserStore } from '@/stores/user-store';
import { useAIStore } from '@/stores/ai-store';
import { useCart } from '@/stores/cart-store';
import { useMicronutrientsStore } from '@/stores/micronutrients-store';
import EnhancedMacroRing from '@/components/atoms/EnhancedMacroRing';
import EnhancedCalorieProgressBar from '@/components/atoms/EnhancedCalorieProgressBar';
import MealCard from '@/components/molecules/MealCard';
import WeeklyCalendar from '@/components/molecules/WeeklyCalendar';
import MealDetailModal from '@/components/organisms/MealDetailModal';
import Button from '@/components/atoms/Button';
import { colors, typography, spacing, borderRadius, shadows } from '@/utils/theme';

// Random greetings for header (from September 16th commit)
const RANDOM_GREETINGS = [
  'Steak your claim! 🥩',
  'Avo great day tracking! 🥑',
  'Juiced to see you again! 🧃',
  'Egg-cited to track today? 🍳',
  'Taco \'bout crushing goals! 🌮',
  'Lettuce help you stack on track. 🥗',
  'Donut forget to hit your protein. 🍩',
  'Sip, sip, hooray! Stay hydrated. 🥤',
  'Romaine calm and track on. 🥬',
  'Berry proud of your progress. 🍓',
  'You\'re on a roll—sushi roll. 🍣',
  'Orange you glad you showed up? 🍊',
  'Bean there, tracked that. 🫘',
  'Nacho average tracker! 🧀🌶️',
  'Shell yeah, keep crackin\' goals! 🦀'
];

// Helper function to get local date in YYYY-MM-DD format
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get ordinal suffix for numbers
const getOrdinalSuffix = (day: number): string => {
  if (day >= 11 && day <= 13) {
    return `${day}th`;
  }
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
};

// Helper function to get nutrition title based on selected date
const getNutritionTitle = (selectedDate: string, todayLocal: string): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const tomorrowLocal = getLocalDateString(tomorrow);
  const yesterdayLocal = getLocalDateString(yesterday);

  if (selectedDate === todayLocal) {
    return "Today's Nutrition";
  } else if (selectedDate === tomorrowLocal) {
    return "Tomorrow's Nutrition";
  } else if (selectedDate === yesterdayLocal) {
    return "Yesterday's Nutrition";
  } else {
    // Parse date carefully to avoid timezone issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    const monthName = selectedDateObj.toLocaleDateString('en-US', { month: 'long' });
    const dayWithOrdinal = getOrdinalSuffix(day);
    return `${monthName} ${dayWithOrdinal}'s Nutrition`;
  }
};

// Helper function to get meals title based on selected date
const getMealsTitle = (selectedDate: string, todayLocal: string): string => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const tomorrowLocal = getLocalDateString(tomorrow);
  const yesterdayLocal = getLocalDateString(yesterday);

  if (selectedDate === todayLocal) {
    return "Today's Meals";
  } else if (selectedDate === tomorrowLocal) {
    return "Tomorrow's Meals";
  } else if (selectedDate === yesterdayLocal) {
    return "Yesterday's Meals";
  } else {
    // Parse date carefully to avoid timezone issues
    const [year, month, day] = selectedDate.split('-').map(Number);
    const selectedDateObj = new Date(year, month - 1, day);
    const monthName = selectedDateObj.toLocaleDateString('en-US', { month: 'long' });
    const dayWithOrdinal = getOrdinalSuffix(day);
    return `${monthName} ${dayWithOrdinal}'s Meals`;
  }
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { todaysMeals, dailyTotals, isLoading, selectedDate, setSelectedDate, updateMeal, removeMeal } = useMealStore();
  const { goals, user, session } = useUserStore();
  const { isProcessing, currentSystem, lastResponse } = useAIStore();
  const { addToCart, clearCart } = useCart();
  const { getOrderedDisplayList } = useMicronutrientsStore();

  // Random greeting selection
  const [randomGreeting, setRandomGreeting] = useState(() => {
    return RANDOM_GREETINGS[Math.floor(Math.random() * RANDOM_GREETINGS.length)];
  });

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Change greeting on refresh
      setRandomGreeting(RANDOM_GREETINGS[Math.floor(Math.random() * RANDOM_GREETINGS.length)]);

      // Add minimum delay for loading animation visibility
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Get today's date in local timezone
  const todayLocal = getLocalDateString();

  // Meal detail handlers
  const handleMealPress = (meal: any) => {
    setSelectedMeal(meal);
    setShowMealDetail(true);
  };

  const handleCloseMealDetail = () => {
    setShowMealDetail(false);
    setSelectedMeal(null);
  };

  const handleEditMeal = (meal: any) => {
    // TODO: Implement meal editing functionality
    console.log('Edit meal:', meal.id);
    setShowMealDetail(false);
  };

  const handleDeleteMeal = (mealId: string) => {
    removeMeal(mealId);
  };

  const handleCopyMeal = (meal: any) => {
    try {
      // Convert meal to cart-compatible format
      const mealAsFood = {
        id: `meal_copy_${meal.id}`,
        name: meal.food_name,
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        fiber: meal.fiber || 0,
        serving_size: `${meal.quantity_grams || 100}g`,
        source: 'user' as const,
        category: 'meal' as const,
        confidence: 1
      };

      // Add to cart
      addToCart(mealAsFood, 1, 'serving');

      console.log('Meal copied to basket:', meal.food_name);
    } catch (error) {
      console.error('Failed to copy meal to basket:', error);
    }
  };

  const handleToggleFavorite = (meal: any) => {
    // TODO: Implement favorite toggle functionality
    console.log('Toggle favorite:', meal.id);
  };

  const isMealFavorite = (meal: any) => {
    // TODO: Implement favorite checking
    return false;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
            colors={[colors.primary[500]]}
          />
        }
      >
        {/* Header with Random Greeting and Settings */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{randomGreeting}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Settings' as never)}
          >
            <Ionicons name="person-circle-outline" size={32} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Weekly Calendar */}
        <WeeklyCalendar
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Combined Macros Container */}
        <View style={styles.macroContainer}>
          <Text style={styles.sectionTitle}>
            {getNutritionTitle(selectedDate, todayLocal)}
          </Text>

          {/* Enhanced Calorie Progress Bar */}
          <View style={styles.calorieSection}>
            <EnhancedCalorieProgressBar
              current={dailyTotals.calories}
              target={goals.daily_calorie_goal}
              variant="dashboard"
              size="medium"
              showBubbles={true}
              bubbleTolerance={100}
            />
          </View>

          {/* Enhanced Macro Rings with Fiber */}
          <View style={styles.macroRings}>
            <EnhancedMacroRing
              label="Protein"
              current={dailyTotals.protein}
              target={goals.protein_goal}
              color={colors.macros.protein}
              variant="progress"
              animated={true}
              showStatusIndicators={true}
            />
            <EnhancedMacroRing
              label="Carbs"
              current={dailyTotals.carbs}
              target={goals.carb_goal}
              color={colors.macros.carbs}
              variant="progress"
              animated={true}
              showStatusIndicators={true}
            />
            <EnhancedMacroRing
              label="Fat"
              current={dailyTotals.fat}
              target={goals.fat_goal}
              color={colors.macros.fats}
              variant="progress"
              animated={true}
              showStatusIndicators={true}
            />
            <EnhancedMacroRing
              label="Fiber"
              current={dailyTotals.fiber}
              target={goals.fiber_goal}
              color={colors.macros.fiber}
              variant="progress"
              animated={true}
              showStatusIndicators={true}
            />
          </View>

          {/* Micronutrients Dropdown Toggle */}
          <TouchableOpacity
            style={styles.micronutrientToggle}
            onPress={() => setShowMicronutrients(!showMicronutrients)}
          >
            <Text style={styles.micronutrientToggleText}>Micronutrients</Text>
            <Ionicons
              name={showMicronutrients ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.primary[500]}
            />
          </TouchableOpacity>

          {/* Micronutrients Display */}
          {showMicronutrients && (
            <View style={styles.micronutrientsContainer}>
              {getOrderedDisplayList().length === 0 ? (
                <View style={styles.micronutrientEmpty}>
                  <Text style={styles.micronutrientEmptyText}>
                    No micronutrients selected
                  </Text>
                  <TouchableOpacity
                    style={styles.micronutrientConfigButton}
                    onPress={() => navigation.navigate('Settings' as never)}
                  >
                    <Text style={styles.micronutrientConfigText}>Configure in Settings</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.micronutrientGrid}>
                  {getOrderedDisplayList().map((micronutrient) => {
                    // Get actual micronutrient data from daily totals
                    const currentValue = dailyTotals.micronutrients?.[micronutrient.id] || 0;
                    const targetValue = 100; // TODO: Implement proper RDA targets
                    const percentage = (currentValue / targetValue) * 100;

                    return (
                      <View key={micronutrient.id} style={styles.micronutrientItem}>
                        <View style={styles.micronutrientHeader}>
                          <Text style={styles.micronutrientName}>
                            {micronutrient.name}
                          </Text>
                          {micronutrient.minimizeFlag && (
                            <View style={styles.minimizeIndicator}>
                              <Ionicons name="arrow-down" size={10} color="#EF4444" />
                            </View>
                          )}
                        </View>
                        <View style={styles.micronutrientProgress}>
                          <View style={styles.micronutrientProgressBar}>
                            <View
                              style={[
                                styles.micronutrientProgressFill,
                                {
                                  width: `${Math.min(percentage, 100)}%`,
                                  backgroundColor: micronutrient.minimizeFlag
                                    ? (percentage > 80 ? '#EF4444' : '#10B981')
                                    : (percentage > 80 ? '#10B981' : '#F59E0B')
                                }
                              ]}
                            />
                          </View>
                          <Text style={styles.micronutrientValue}>
                            {currentValue}{micronutrient.unit}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Today's Meals Section */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>
            {getMealsTitle(selectedDate, todayLocal)}
          </Text>
          {todaysMeals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {selectedDate === todayLocal
                  ? "No meals logged yet today"
                  : "No meals logged for this date"
                }
              </Text>
              <Text style={styles.emptySubtext}>
                {selectedDate === todayLocal
                  ? "Use the AI Coach to log your first meal!"
                  : "Select today to start logging meals"
                }
              </Text>
            </View>
          ) : (
            <>
              {/* Group meals by meal type */}
              {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                const mealsOfType = todaysMeals.filter(meal => meal.meal_type === mealType);
                if (mealsOfType.length === 0) return null;

                return (
                  <View key={mealType} style={styles.mealTypeSection}>
                    <Text style={styles.mealTypeTitle}>
                      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                    </Text>
                    {mealsOfType.map((meal) => (
                      <MealCard
                        key={meal.id}
                        meal={meal}
                        variant="default"
                        onPress={() => handleMealPress(meal)}
                      />
                    ))}
                  </View>
                );
              })}
            </>
          )}
        </View>

      </ScrollView>

      {/* Meal Detail Modal */}
      <MealDetailModal
        visible={showMealDetail}
        meal={selectedMeal}
        onClose={handleCloseMealDetail}
        onEdit={handleEditMeal}
        onDelete={handleDeleteMeal}
        onCopy={handleCopyMeal}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedMeal ? isMealFavorite(selectedMeal) : false}
      />
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary, // Warm Beige
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs*0.1,
  },
  greeting: {
    fontSize: typography.fontSize['xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500], // Deep Forest Green
  },
  profileButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  macroContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  calorieSection: {
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  macroRings: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  micronutrientToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.secondary, // Cream Linen
    borderRadius: borderRadius.md,
    marginTop: spacing.base,
  },
  micronutrientToggleText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[500], // Deep Forest Green
  },
  micronutrientsContainer: {
    backgroundColor: colors.background.secondary, // Cream Linen
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    padding: spacing.base,
  },
  micronutrientEmpty: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  micronutrientEmptyText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  micronutrientConfigButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  micronutrientConfigText: {
    color: 'white',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  micronutrientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
  },
  micronutrientItem: {
    width: '48%',
    backgroundColor: 'white',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  micronutrientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  micronutrientName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    flex: 1,
  },
  minimizeIndicator: {
    backgroundColor: '#FEF2F2',
    padding: 2,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  micronutrientProgress: {
    alignItems: 'flex-end',
  },
  micronutrientProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    marginBottom: spacing.xs * 0.5,
  },
  micronutrientProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  micronutrientValue: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary, // Bark Brown
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  mealsSection: {
    backgroundColor: colors.background.secondary, // Cream Linen
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary, // Bark Brown
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary, // Sage Green
  },
  mealTypeSection: {
    marginBottom: spacing.base,
  },
  mealTypeTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary, // Bark Brown
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
});