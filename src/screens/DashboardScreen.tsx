// src/screens/DashboardScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '@/stores/meal-store';
import { useUserStore } from '@/stores/user-store';
import { useAIStore } from '@/stores/ai-store';
import { useCart } from '@/stores/cart-store';
import MacroRing from '@/components/atoms/MacroRing';
import CalorieProgressBar from '@/components/atoms/CalorieProgressBar';
import MealCard from '@/components/molecules/MealCard';
import WeeklyCalendar from '@/components/molecules/WeeklyCalendar';
import MealDetailModal from '@/components/organisms/MealDetailModal';
import Button from '@/components/atoms/Button';
import SettingsScreen from './SettingsScreen';
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

export default function DashboardScreen() {
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { todaysMeals, dailyTotals, isLoading, selectedDate, setSelectedDate, updateMeal, removeMeal } = useMealStore();
  const { goals, user, session } = useUserStore();
  const { isProcessing, currentSystem, lastResponse } = useAIStore();
  const { addToCart, clearCart } = useCart();

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
            tintColor={colors.theme.teal}
            colors={[colors.theme.teal]}
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
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="person-circle-outline" size={32} color={colors.theme.teal} />
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
            {selectedDate === todayLocal ? "Today's Progress" : `Progress for ${new Date(selectedDate).toLocaleDateString()}`}
          </Text>

          {/* Calorie Progress Bar */}
          <View style={styles.calorieSection}>
            <CalorieProgressBar
              current={dailyTotals.calories}
              goal={goals.daily_calorie_goal}
              variant="horizontal"
              size="large"
              color="#FF6B6B"
            />
          </View>

          {/* Macro Rings with Fiber */}
          <View style={styles.macroRings}>
            <MacroRing
              label="Protein"
              current={dailyTotals.protein}
              goal={goals.protein_goal}
              color="#4ECDC4"
              unit="g"
            />
            <MacroRing
              label="Carbs"
              current={dailyTotals.carbs}
              goal={goals.carb_goal}
              color="#45B7D1"
              unit="g"
            />
            <MacroRing
              label="Fat"
              current={dailyTotals.fat}
              goal={goals.fat_goal}
              color="#F9CA24"
              unit="g"
            />
            <MacroRing
              label="Fiber"
              current={dailyTotals.fiber}
              goal={goals.fiber_goal}
              color="#8B7D6B"
              unit="g"
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
              color={colors.theme.teal}
            />
          </TouchableOpacity>

          {/* Micronutrients Placeholder */}
          {showMicronutrients && (
            <View style={styles.micronutrientPlaceholder}>
              <Text style={styles.micronutrientPlaceholderText}>
                Micronutrient tracking coming soon!
              </Text>
            </View>
          )}
        </View>

        {/* Today's Meals Section */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>
            {selectedDate === todayLocal
              ? "Today's Meals"
              : `Meals for ${new Date(selectedDate).toLocaleDateString()}`
            }
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

        <View style={styles.testSection}>
          <Button
            title="Test All Stores (Check Console)"
            onPress={() => console.log('Full State Test:', { 
              meals: { todaysMeals, dailyTotals, isLoading },
              ai: { isProcessing, currentSystem, lastResponse },
              goals
            })}
            variant="secondary"
            size="small"
          />
        </View>
      </ScrollView>

      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SettingsScreen />
        <SafeAreaView style={styles.modalCloseContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowSettings(false)}
          >
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

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
    backgroundColor: colors.theme.cream,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  greeting: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.theme.teal,
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
    marginTop: spacing.base,
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
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    marginTop: spacing.base,
  },
  micronutrientToggleText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
  },
  micronutrientPlaceholder: {
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  micronutrientPlaceholderText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  mealsSection: {
    backgroundColor: colors.background.primary,
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
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
  },
  testSection: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  mealTypeSection: {
    marginBottom: 16,
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  modalCloseContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCloseButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});