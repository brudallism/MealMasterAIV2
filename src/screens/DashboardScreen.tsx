// src/screens/DashboardScreen.tsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { PanGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import * as Sentry from '@sentry/react-native'; // Removed since we're not using Sentry
import { useMealStore, Meal } from '@/stores/meal-store';
import { useUserStore } from '@/stores/user-store';
// import { useSearchStore } from '@/stores/search-store';
// import { useCartStore } from '@/stores/cart-store';
import { colors, typography, spacing, borderRadius, shadows } from '@/utils/theme';
// import SettingsScreen from './SettingsScreen';
import { useNavigation } from '@react-navigation/native';
import MacroRingComponent from '@/components/atoms/MacroRing';
// import SentryTestButton from '@/components/atoms/SentryTestButton'; // Removed since we're not using Sentry
// import PrivacyConsentModal, { PrivacyConsents } from '@/components/molecules/PrivacyConsentModal';
// import MealBasketModal from '@/components/organisms/MealBasketModal';
import WeeklyCalendar from '@/components/molecules/WeeklyCalendar';

const { width, height } = Dimensions.get('window');

// Food emojis for loading animation
const FOOD_EMOJIS = ['🍎', '🥕', '🥬', '🍌', '🫐', '🥑', '🍊', '🍇', '🥒', '🍅', '🥦', '🍓', '🥝', '🫒', '🌽'];

// Random greetings for header
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

// Loading animation component with rotating food emojis
const FoodLoadingAnimation = () => {
  const [shuffledEmojis, setShuffledEmojis] = useState<string[]>([]);
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);

  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = (array: string[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    // Randomize emoji order on component mount
    setShuffledEmojis(shuffleArray(FOOD_EMOJIS));
  }, []);

  useEffect(() => {
    if (shuffledEmojis.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentEmojiIndex((prev) => (prev + 1) % shuffledEmojis.length);
    }, 750); // Change every 0.75 seconds

    return () => clearInterval(interval);
  }, [shuffledEmojis]);

  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>
          {shuffledEmojis[currentEmojiIndex] || '🍎'}
        </Text>
        <Text style={styles.loadingText}>Refreshing your nutrition data...</Text>
      </View>
    </View>
  );
};

// Clean, simple calorie progress bar with star/warning indicators
const CalorieProgressBar = ({ current, target }: { current: number; target: number }) => {
  const percentage = Math.min((current / target) * 100, 100);

  // Star/Warning logic based on ±100 calories
  const isWithinTarget = current >= (target - 100) && current <= (target + 100); // 1900-2100 for 2000 target
  const isOverTarget = current > (target + 100); // 2101+ for 2000 target

  // Dynamic color based on progress
  const getColor = (percentage: number) => {
    if (percentage < 50) return colors.theme.sage;      // Green for low
    if (percentage < 80) return colors.theme.mustard;   // Yellow for medium
    if (percentage < 100) return colors.theme.orange;   // Orange for high
    return colors.theme.coral;                          // Red for over target
  };

  return (
    <View style={styles.calorieBarContainer}>
      <Text style={styles.calorieBarTitle}>Daily Calories</Text>
      <View style={styles.calorieBarWrapper}>
        <View style={styles.calorieBar}>
          <View
            style={[
              styles.calorieBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: getColor(percentage),
              }
            ]}
          />
          <Text style={styles.calorieBarText}>
            {Math.round(current)} / {target}
          </Text>

          {/* Star bubble for within ±100 calories */}
          {isWithinTarget && !isOverTarget && (
            <View style={[styles.calorieStarBubble, {
              zIndex: 999,
              backgroundColor: '#F59E0B',
              borderWidth: 1,
              borderColor: '#FFFFFF',
            }]}>
              <Text style={[styles.calorieStarIcon, { color: '#FFFFFF' }]}>★</Text>
            </View>
          )}

          {/* Warning bubble for >100 calories over target */}
          {isOverTarget && (
            <View style={[styles.calorieWarningBubble, {
              zIndex: 999,
              backgroundColor: '#EF4444',
              borderWidth: 1,
              borderColor: '#FFFFFF',
            }]}>
              <Text style={[styles.calorieWarningIcon, { color: '#FFFFFF' }]}>!</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// Single-value macro ring for meal-only views
const MealOnlyMacroRing = ({ label, current, color }: any) => {
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // For meal-only view, show full circle (100% progress)
  const strokeDashoffset = 0;

  return (
    <View style={styles.macroRing}>
      <View style={styles.ringWrapper}>
        <View style={styles.circularProgressContainer}>
          <Svg width={size} height={size} style={styles.circularProgressSvg}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Full progress circle for meal values */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            {/* Start indicator - positioned on the ring border */}
            <Circle
              cx={size / 2}
              cy={strokeWidth}
              r={1}
              fill={color}
            />
          </Svg>

          <View style={styles.circularProgressContent}>
            <Text style={styles.singleMacroValue}>{Math.round(current)}g</Text>
          </View>
        </View>
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
};

// Circular progress ring with 3D floating effect and elastic animation
const DashboardMacroRing = ({ label, current, target, color }: any) => {
  const percentage = (current / target) * 100;
  const isOverTarget = percentage >= 105.5;
  const isNearTarget = percentage >= 95 && percentage <= 105;

  // Animation values for elastic bounce
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Elastic bounce animation sequence
    Animated.sequence([
      // Fast fill to overshoot
      Animated.timing(animatedValue, {
        toValue: Math.min(percentage * 1.08, 108), // 8% overshoot, capped at 108%
        duration: 800,
        useNativeDriver: false,
      }),
      // Bounce back slightly under
      Animated.timing(animatedValue, {
        toValue: Math.max(percentage * 0.96, 0), // 4% undershoot
        duration: 400,
        useNativeDriver: false,
      }),
      // Small bounce to slightly over
      Animated.timing(animatedValue, {
        toValue: percentage * 1.02, // 2% overshoot
        duration: 300,
        useNativeDriver: false,
      }),
      // Final settle to exact value
      Animated.timing(animatedValue, {
        toValue: percentage,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [percentage]);

  // SVG circle parameters
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={styles.macroRing}>
      <View style={styles.ringWrapper}>
        {/* SVG Circular Progress */}
        <View style={styles.circularProgressContainer}>
          <Svg width={size} height={size} style={styles.circularProgressSvg}>
            {/* Background circle */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E5E7EB"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            {(() => {
              const AnimatedCircle = Animated.createAnimatedComponent(Circle);
              return (
                <AnimatedCircle
                  cx={size / 2}
                  cy={size / 2}
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
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
              );
            })()}
            {/* Start indicator at 12 o'clock - positioned on the ring border */}
            <Circle
              cx={size / 2}
              cy={strokeWidth -3}
              r={2}
              fill={color}
            />
          </Svg>

          {/* Center content */}
          <View style={styles.circularProgressContent}>
            <Text style={styles.macroValueTop}>{Math.round(current)}g</Text>
            <View style={styles.macroDivider} />
            <Text style={styles.macroValueBottom}>{target}g</Text>
          </View>
        </View>

        {/* Status indicators */}
        {isNearTarget && !isOverTarget && (
          <View style={[styles.starBubble, {
            zIndex: 999,
            backgroundColor: '#F59E0B',
            borderWidth: 1,
            borderColor: '#FFFFFF',
          }]}>
            <Text style={[styles.starIcon, { color: '#FFFFFF' }]}>★</Text>
          </View>
        )}

        {isOverTarget && (
          <View style={[styles.warningBubble, {
            zIndex: 999,
            backgroundColor: '#EF4444',
            borderWidth: 1,
            borderColor: '#FFFFFF',
          }]}>
            <Text style={[styles.warningIcon, { color: '#FFFFFF' }]}>!</Text>
          </View>
        )}
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
};

// Micronutrient progress bar component with actual/goal format
const MicronutrientBar = ({ label, current, target, unit }: {
  label: string;
  current: number;
  target: number;
  unit: string;
}) => {
  const percentage = Math.min((current / target) * 100, 100);

  // Color based on progress
  const getColor = (percentage: number) => {
    if (percentage < 50) return colors.theme.coral;       // Red for low
    if (percentage < 80) return colors.theme.mustard;     // Yellow for medium
    return colors.theme.sage;                             // Green for good
  };

  return (
    <View style={styles.micronutrientBar}>
      <View style={styles.micronutrientHeader}>
        <Text style={styles.micronutrientLabel}>{label}</Text>
        <Text style={styles.micronutrientValues}>
          {Math.round(current * 10) / 10} / {target} {unit}
        </Text>
      </View>
      <View style={styles.micronutrientProgress}>
        <View
          style={[
            styles.micronutrientProgressFill,
            {
              width: `${percentage}%`,
              backgroundColor: getColor(percentage),
            }
          ]}
        />
      </View>
    </View>
  );
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  const {
    todaysMeals,
    dailyTotals,
    selectedDate,
    updateMeal,
    removeMeal,
    setSelectedDate,
    getTotalsForDate,
    initializeMockData
  } = useMealStore();
  const {
    goals,
    needsPrivacyConsent,
    hasValidConsent,
    setPrivacyConsents
  } = useUserStore();
  // const { addStarredFood, removeStarredFood, isStarred } = useSearchStore();
  // const { clearCart, setMealName, setMealType, addToCart } = useCartStore();

  // Temporary stub functions to prevent errors
  const addStarredFood = () => {};
  const removeStarredFood = () => {};
  const isStarred = () => false;
  const clearCart = () => {};
  const setMealName = () => {};
  const setMealType = () => {};
  const addToCart = () => {};
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showMealBasket, setShowMealBasket] = useState(false);
  const [showMicronutrients, setShowMicronutrients] = useState(false);

  // Random greeting selection
  const [randomGreeting, setRandomGreeting] = useState(() => {
    return RANDOM_GREETINGS[Math.floor(Math.random() * RANDOM_GREETINGS.length)];
  });



  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Execute actual refresh methods if they exist
      const refreshPromises = [];
      // Meal data updates automatically via store

      // Change greeting on refresh
      setRandomGreeting(RANDOM_GREETINGS[Math.floor(Math.random() * RANDOM_GREETINGS.length)]);

      // Add minimum delay for loading animation visibility
      refreshPromises.push(new Promise(resolve => setTimeout(resolve, 1500)));

      await Promise.all(refreshPromises);
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Initialize mock data on component mount
  useEffect(() => {
    initializeMockData();
  }, [initializeMockData]);


  // Privacy consent check on app load
  useEffect(() => {
    if (needsPrivacyConsent || !hasValidConsent()) {
      setShowPrivacyModal(true);
    }
  }, [needsPrivacyConsent, hasValidConsent]);

  // Privacy consent handlers
  const handlePrivacyAccept = useCallback((consents: any) => {
    setPrivacyConsents(consents);
    setShowPrivacyModal(false);
  }, [setPrivacyConsents]);

  const handlePrivacyDecline = useCallback(() => {
    // For now, just close the modal
    // In production, you might want to exit the app or show limited functionality
    Alert.alert(
      'Privacy Required',
      'MealMasterAI requires privacy consent to function properly. Please review your settings or contact support.',
      [{ text: 'OK' }]
    );
  }, []);

  // Meal card handlers
  const handleToggleMealComplete = useCallback((mealId: string) => {
    const meal = todaysMeals.find(m => m.id === mealId);
    if (meal) {
      updateMeal(mealId, { eaten: !meal.eaten });
    }
  }, [todaysMeals, updateMeal]);

  const handleDeleteMeal = useCallback((mealId: string, translateX?: Animated.Value) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            // If translateX is provided, snap the card back to position
            if (translateX) {
              Animated.spring(translateX, {
                toValue: 0,
                useNativeDriver: false,
                tension: 150,
                friction: 8,
              }).start();
            }
          }
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => removeMeal(mealId)
        },
      ]
    );
  }, [removeMeal]);

  const handleMealPress = useCallback((meal: Meal) => {
    setSelectedMeal(meal);
    setShowMealDetail(true);
  }, []);

  // Meal favorite handlers
  const handleMealFavoriteToggle = useCallback((meal: Meal) => {
    const mealId = meal.id;
    if (isStarred(mealId)) {
      removeStarredFood(mealId);
    } else {
      // Convert Meal to UnifiedFoodResult format
      const unifiedFood = {
        id: mealId,
        name: meal.food_name,
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        carbs: meal.carbs || 0,
        fat: meal.fat || 0,
        fiber: meal.fiber || 0,
        serving_size: meal.portion_amount ? `${meal.portion_amount} ${meal.portion_unit}` : '1 serving',
        source: 'user' as const,
        category: meal.meal_type || 'meal',
        confidence: 1
      };
      addStarredFood(unifiedFood, meal.meal_type);
    }
  }, [isStarred, removeStarredFood, addStarredFood]);

  const isMealFavorite = useCallback((meal: Meal) => {
    return isStarred(meal.id);
  }, [isStarred]);

  // Copy meal handler
  const handleCopyMeal = useCallback((meal: Meal) => {
    // Clear cart first
    clearCart();

    // Set meal metadata first (this will populate the meal name textbox)
    setMealName(meal.food_name); // Use original name
    setMealType(meal.meal_type);

    // Check if the meal has original ingredients stored
    if (meal.original_ingredients && meal.original_ingredients.length > 0) {
      // Copy individual ingredients - this is the preferred approach
      console.log(`[Copy Meal] Copying ${meal.original_ingredients.length} individual ingredients`);

      meal.original_ingredients.forEach((ingredient, index) => {
        // Generate unique ID for each copied ingredient
        const copiedIngredient = {
          ...ingredient,
          id: `copy_${meal.id}_${index}_${Date.now()}`, // New unique ID
          addedAt: Date.now() // Update timestamp
        };

        // Add each ingredient individually to the cart
        addToCart(
          copiedIngredient.food,
          copiedIngredient.quantity,
          copiedIngredient.unit,
          copiedIngredient.notes
        );
      });
    } else {
      // Fallback: Copy as single consolidated item (for older meals without ingredients)
      console.log(`[Copy Meal] No individual ingredients found, copying as single item`);

      const unifiedFood: any = {
        id: `meal_copy_${meal.id}`,
        name: `${meal.food_name} (Legacy Meal)`, // Indicate this is a legacy copy
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: meal.fiber || 0,
        serving_size: `${meal.quantity_grams}g (Full Meal)`,
        source: 'user' as const,
        category: 'recipe' as const,
        confidence: 1
      };

      addToCart(unifiedFood, 1, 'serving');
    }

    // Close meal detail modal and show meal basket
    setShowMealDetail(false);
    setShowMealBasket(true);
  }, [clearCart, setMealName, setMealType, addToCart]);

  // Removed Sentry error test handler since we're not using Sentry

  // Helper function for smart date labeling with timezone-safe parsing
  const getDateLabel = (date: string): string => {
    // Use timezone-safe date comparison
    const today = new Date();
    const todayString = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayString = yesterday.getFullYear() + '-' +
      String(yesterday.getMonth() + 1).padStart(2, '0') + '-' +
      String(yesterday.getDate()).padStart(2, '0');

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowString = tomorrow.getFullYear() + '-' +
      String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' +
      String(tomorrow.getDate()).padStart(2, '0');

    if (date === todayString) return "Today's";
    if (date === yesterdayString) return "Yesterday's";
    if (date === tomorrowString) return "Tomorrow's";

    // For other dates, format as "Sept 19th's" using timezone-safe parsing
    const [year, month, day] = date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day); // month is 0-indexed in Date constructor
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const suffix = getDaySuffix(day);
    return `${monthName} ${day}${suffix}'s`;
  };

  const getDaySuffix = (day: number): string => {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Helper function to determine if showing projected macros
  const isShowingProjectedMacros = (): boolean => {
    const today = new Date();
    const todayString = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    return selectedDate > todayString;
  };

  // Helper function to determine if date is in the future
  const isFutureDate = (date?: string): boolean => {
    const checkDate = date || selectedDate;
    const today = new Date();
    const todayString = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    return checkDate > todayString;
  };

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
  }, [setSelectedDate]);

  // Get totals for the selected date, including projected meals if it's a future date
  const currentTotals = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const isFutureDate = selectedDate > today;

    if (isFutureDate) {
      // For future dates, get projected totals (include all planned meals)
      return getTotalsForDate(selectedDate, true);
    } else {
      // For past/current dates, use actual eaten meals
      return dailyTotals;
    }
  }, [selectedDate, dailyTotals, getTotalsForDate]);

  const macroData = {
    protein: { current: currentTotals.protein, target: goals.protein_goal, color: colors.theme.teal },
    carbs: { current: currentTotals.carbs, target: goals.carb_goal, color: colors.theme.orange },
    fat: { current: currentTotals.fat, target: goals.fat_goal, color: colors.theme.sage },
    fiber: { current: currentTotals.fiber, target: goals.fiber_goal, color: '#8B7D6B' },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
      <ScrollView 
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
        {/* Header */}
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
          onDateSelect={handleDateSelect}
        />

        {/* Nutrition Progress */}
        <View style={styles.macroContainer}>
          <Text style={styles.sectionTitle}>
            {isShowingProjectedMacros() ? `${getDateLabel(selectedDate)} Projected Macros` : `${getDateLabel(selectedDate)} Progress`}
          </Text>
          
          {/* Calorie Progress Bar */}
          <CalorieProgressBar
            current={currentTotals.calories}
            target={goals.daily_calorie_goal}
          />
          
          {/* Macro Rings */}
          <View style={styles.macroRings}>
            {Object.entries(macroData).map(([key, macro]) => (
              <DashboardMacroRing
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                current={macro.current}
                target={macro.target}
                color={macro.color}
              />
            ))}
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

          {/* Micronutrients Grid (2 columns, 6 items each) */}
          {showMicronutrients && (
            <View style={styles.micronutrientGrid}>
              <View style={styles.micronutrientColumn}>
                <MicronutrientBar
                  label="Vitamin C"
                  current={dailyTotals.micronutrients.vitamin_c}
                  target={goals.micronutrients.vitamin_c}
                  unit="mg"
                />
                <MicronutrientBar
                  label="Vitamin D"
                  current={dailyTotals.micronutrients.vitamin_d}
                  target={goals.micronutrients.vitamin_d}
                  unit="IU"
                />
                <MicronutrientBar
                  label="Vitamin B12"
                  current={dailyTotals.micronutrients.vitamin_b12}
                  target={goals.micronutrients.vitamin_b12}
                  unit="mcg"
                />
                <MicronutrientBar
                  label="Folate"
                  current={dailyTotals.micronutrients.folate}
                  target={goals.micronutrients.folate}
                  unit="mcg"
                />
                <MicronutrientBar
                  label="Iron"
                  current={dailyTotals.micronutrients.iron}
                  target={goals.micronutrients.iron}
                  unit="mg"
                />
                <MicronutrientBar
                  label="Calcium"
                  current={dailyTotals.micronutrients.calcium}
                  target={goals.micronutrients.calcium}
                  unit="mg"
                />
              </View>
              <View style={styles.micronutrientColumn}>
                <MicronutrientBar
                  label="Magnesium"
                  current={dailyTotals.micronutrients.magnesium}
                  target={goals.micronutrients.magnesium}
                  unit="mg"
                />
                <MicronutrientBar
                  label="Potassium"
                  current={dailyTotals.micronutrients.potassium}
                  target={goals.micronutrients.potassium}
                  unit="mg"
                />
                <MicronutrientBar
                  label="Zinc"
                  current={dailyTotals.micronutrients.zinc}
                  target={goals.micronutrients.zinc}
                  unit="mg"
                />
                <MicronutrientBar
                  label="Omega-3"
                  current={dailyTotals.micronutrients.omega_3}
                  target={goals.micronutrients.omega_3}
                  unit="mg"
                />
                <MicronutrientBar
                  label="Vitamin A"
                  current={dailyTotals.micronutrients.vitamin_a}
                  target={goals.micronutrients.vitamin_a}
                  unit="mcg"
                />
                <MicronutrientBar
                  label="Vitamin K"
                  current={dailyTotals.micronutrients.vitamin_k}
                  target={goals.micronutrients.vitamin_k}
                  unit="mcg"
                />
              </View>
            </View>
          )}
        </View>

        {/* Dynamic Meals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{getDateLabel(selectedDate)} Meals</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {todaysMeals.length > 0 ? (
            todaysMeals.map((meal) => {
              const translateX = new Animated.Value(0);
              let isSwipeActive = false;
              let currentTranslation = 0;
              
              // Enhanced swipe gesture handler with improved interaction
              const handleGestureEvent = Animated.event(
                [{ nativeEvent: { translationX: translateX } }],
                { 
                  useNativeDriver: false,
                  listener: ({ nativeEvent }) => {
                    currentTranslation = nativeEvent.translationX;
                    isSwipeActive = Math.abs(nativeEvent.translationX) > 5; // Consider active if moved more than 5px
                  }
                }
              );

              const handleStateChange = ({ nativeEvent }) => {
                if (nativeEvent.state === State.BEGAN) {
                  // Reset tracking when gesture begins
                  isSwipeActive = false;
                  currentTranslation = 0;
                } else if (nativeEvent.state === State.END) {
                  // Reduced threshold by 50%: from -100 to -50
                  if (nativeEvent.translationX < -50) {
                    // Animate out and show confirmation (reduced distance by 55%: -200 to -90)
                    Animated.spring(translateX, {
                      toValue: -90,
                      useNativeDriver: false,
                      tension: 100,
                      friction: 8,
                    }).start(() => {
                      handleDeleteMeal(meal.id, translateX);
                    });
                  } else {
                    // Smooth snap-back animation
                    Animated.spring(translateX, {
                      toValue: 0,
                      useNativeDriver: false,
                      tension: 150,
                      friction: 8,
                    }).start(() => {
                      // Reset swipe state after animation completes
                      isSwipeActive = false;
                      currentTranslation = 0;
                    });
                  }
                } else if (nativeEvent.state === State.CANCELLED || nativeEvent.state === State.FAILED) {
                  // Always snap back on cancel/fail
                  Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: false,
                    tension: 150,
                    friction: 8,
                  }).start(() => {
                    isSwipeActive = false;
                    currentTranslation = 0;
                  });
                }
              };

              const handleMealCardPress = () => {
                // Only allow press if card is in resting position (not being swiped)
                if (!isSwipeActive && Math.abs(currentTranslation) < 5) {
                  handleMealPress(meal);
                }
              };
              
              return (
                <View key={meal.id} style={styles.mealCardContainer}>
                  {/* Delete Background */}
                  <View style={styles.deleteBackground}>
                    <View style={styles.deleteIconContainer}>
                      <View style={styles.deleteCircle}>
                        <Ionicons name="remove" size={14} color={colors.gray[800]} />
                      </View>
                      <Text style={styles.deleteText}>Remove</Text>
                    </View>
                  </View>
                  
                  {/* Swipeable Meal Card */}
                  <PanGestureHandler
                    onGestureEvent={handleGestureEvent}
                    onHandlerStateChange={handleStateChange}
                  >
                    <Animated.View
                      style={[
                        styles.mealCardAnimated,
                        {
                          transform: [
                            {
                              translateX: translateX.interpolate({
                                inputRange: [-90, 0],
                                outputRange: [-90, 0],
                                extrapolate: 'clamp',
                              }),
                            },
                          ],
                        },
                      ]}
                    >
                      <TouchableOpacity 
                        style={styles.mealCard}
                        onPress={handleMealCardPress}
                        activeOpacity={0.7}
                      >
                        <View style={styles.mealInfo}>
                          <Text style={styles.mealName}>{meal.food_name}</Text>
                          <Text style={styles.mealTime}>
                            {new Date(meal.logged_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} • {meal.meal_type || 'Meal'}
                          </Text>
                        </View>
                        <View style={styles.mealRightSection}>
                          {!isFutureDate() && (
                            <TouchableOpacity
                              style={styles.completeToggle}
                              onPress={(e) => {
                                e.stopPropagation();
                                handleToggleMealComplete(meal.id);
                              }}
                            >
                              <Ionicons
                                name={meal.eaten ? "checkmark-circle" : "ellipse-outline"}
                                size={24}
                                color={meal.eaten ? colors.theme.sage : colors.gray[400]}
                              />
                            </TouchableOpacity>
                          )}
                          <Text style={styles.mealCalories}>{Math.round(meal.calories)} cal</Text>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  </PanGestureHandler>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyMeals}>
              <Text style={styles.emptyMealsText}>No meals logged yet today</Text>
              <Text style={styles.emptyMealsSubtext}>Start logging your meals!</Text>
            </View>
          )}
        </View>

        {/* Quick Suggestions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Suggestions</Text>
          <View style={styles.suggestionCard}>
            <View style={styles.suggestionInfo}>
              <Text style={styles.suggestionText}>🔍 Nutrition Insights</Text>
              <Text style={styles.suggestionSubtext}>Get personalized meal suggestions</Text>
            </View>
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => (navigation as any).navigate('Search')}
            >
              <Ionicons name="search" size={20} color={colors.theme.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => (navigation as any).navigate('Search')}
            >
              <Ionicons name="add-circle" size={24} color={colors.theme.teal} />
              <Text style={styles.actionText}>Log Meal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => (navigation as any).navigate('Search')}
            >
              <Ionicons name="search" size={24} color={colors.theme.orange} />
              <Text style={styles.actionText}>Find Food</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="calendar" size={24} color={colors.theme.sage} />
              <Text style={styles.actionText}>Plan Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => (navigation as any).navigate('Cart')}
            >
              <Ionicons name="basket" size={24} color={colors.theme.orange} />
              <Text style={styles.actionText}>Build Meal</Text>
            </TouchableOpacity>
            {/* Removed Sentry Test Button since we're not using Sentry */}
          </View>
        </View>
      </ScrollView>
      
      {/* Loading Overlay */}
      {refreshing && <FoodLoadingAnimation />}
      
      {/* Settings Modal */}
      {/* <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <Text>Settings Screen Placeholder</Text>
      </Modal> */}

      {/* Meal Detail Modal */}
      <Modal
        visible={showMealDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMealDetail(false)}
      >
        {selectedMeal && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowMealDetail(false)}>
                <Ionicons name="close" size={28} color={colors.gray[600]} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Meal Details</Text>
              <View style={{ width: 28 }} />
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Meal Overview */}
              <View style={styles.mealOverviewCard}>
                <View style={styles.mealHeaderSection}>
                  <Text style={styles.mealDetailName}>{selectedMeal.food_name}</Text>
                  <View style={styles.mealDetailBadgeContainer}>
                    <View style={styles.mealDetailBadge}>
                      <Text style={styles.mealDetailBadgeText}>
                        {selectedMeal.meal_type.charAt(0).toUpperCase() + selectedMeal.meal_type.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.mealFavoriteContainer}>
                      <TouchableOpacity onPress={() => handleMealFavoriteToggle(selectedMeal)} style={styles.mealFavoriteButton}>
                        <Ionicons
                          name={isMealFavorite(selectedMeal) ? "star" : "star-outline"}
                          size={20}
                          color={isMealFavorite(selectedMeal) ? "#FFD700" : "#666"}
                        />
                      </TouchableOpacity>
                      <Text style={styles.mealFavoriteText}>Add to favorites</Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.mealDetailTime}>
                  {new Date(selectedMeal.logged_at).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>

                <View style={styles.mealDetailStatus}>
                  <Ionicons 
                    name={selectedMeal.eaten ? "checkmark-circle" : "ellipse-outline"} 
                    size={20} 
                    color={selectedMeal.eaten ? colors.success[500] : colors.gray[400]} 
                  />
                  <Text style={[styles.mealDetailStatusText, { 
                    color: selectedMeal.eaten ? colors.success[500] : colors.gray[400] 
                  }]}>
                    {selectedMeal.eaten ? 'Completed' : 'Planned'}
                  </Text>
                </View>
              </View>

              {/* Nutrition Summary */}
              <View style={styles.nutritionSummaryCard}>
                <Text style={styles.cardTitle}>Nutrition Summary</Text>
                
                {/* Exact Dashboard Structure */}
                <View style={styles.macroContainer}>
                  {/* Calorie Progress Bar - Same as dashboard */}
                  <CalorieProgressBar 
                    current={selectedMeal.calories} 
                    target={goals.daily_calorie_goal} 
                  />
                  
                  {/* Macro Rings - Meal-only view (no comparison to daily targets) */}
                  <View style={styles.macroRings}>
                    <MealOnlyMacroRing
                      label="Protein"
                      current={selectedMeal.protein}
                      color={macroData.protein.color}
                    />
                    <MealOnlyMacroRing
                      label="Carbs"
                      current={selectedMeal.carbs}
                      color={macroData.carbs.color}
                    />
                    <MealOnlyMacroRing
                      label="Fat"
                      current={selectedMeal.fat}
                      color={macroData.fat.color}
                    />
                    <MealOnlyMacroRing
                      label="Fiber"
                      current={selectedMeal.fiber || 0}
                      color={macroData.fiber.color}
                    />
                  </View>
                </View>
              </View>

              {/* Ingredients Section (if available) */}
              {selectedMeal.original_ingredients && selectedMeal.original_ingredients.length > 0 && (
                <View style={styles.mealInfoCard}>
                  <Text style={styles.cardTitle}>Ingredients ({selectedMeal.original_ingredients.length})</Text>

                  {selectedMeal.original_ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientRow}>
                      <View style={styles.ingredientInfo}>
                        <Text style={styles.ingredientName} numberOfLines={1}>
                          {ingredient.food.name}
                        </Text>
                        <Text style={styles.ingredientPortion}>
                          {ingredient.quantity} {ingredient.unit}
                        </Text>
                      </View>
                      <View style={styles.ingredientNutrition}>
                        <Text style={styles.ingredientCalories}>
                          {Math.round(ingredient.calculatedNutrition.calories)} cal
                        </Text>
                        <Text style={styles.ingredientMacros}>
                          P: {Math.round(ingredient.calculatedNutrition.protein)}g |
                          C: {Math.round(ingredient.calculatedNutrition.carbs)}g |
                          F: {Math.round(ingredient.calculatedNutrition.fat)}g
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Meal Information */}
              <View style={styles.mealInfoCard}>
                <Text style={styles.cardTitle}>Meal Information</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Quantity</Text>
                  <Text style={styles.infoValue}>{selectedMeal.quantity_grams}g</Text>
                </View>

                {selectedMeal.recognition_source && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Source</Text>
                    <Text style={styles.infoValue}>
                      {selectedMeal.recognition_source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Text>
                  </View>
                )}

                {selectedMeal.ai_confidence && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>AI Confidence</Text>
                    <Text style={styles.infoValue}>{Math.round(selectedMeal.ai_confidence * 100)}%</Text>
                  </View>
                )}

                {/* Show ingredient count for meals with ingredients */}
                {selectedMeal.original_ingredients && selectedMeal.original_ingredients.length > 0 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ingredients</Text>
                    <Text style={styles.infoValue}>{selectedMeal.original_ingredients.length} items</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: colors.theme.orange }]}
                  onPress={() => handleCopyMeal(selectedMeal)}
                >
                  <Ionicons name="copy-outline" size={20} color={colors.background.primary} />
                  <Text style={[styles.modalActionButtonText, { color: colors.background.primary }]}>
                    Copy Meal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: selectedMeal.eaten ? colors.gray[200] : colors.success[500] }]}
                  onPress={() => {
                    handleToggleMealComplete(selectedMeal.id);
                    setShowMealDetail(false);
                  }}
                >
                  <Ionicons
                    name={selectedMeal.eaten ? "checkmark-circle" : "ellipse-outline"}
                    size={20}
                    color={selectedMeal.eaten ? colors.gray[600] : colors.background.primary}
                  />
                  <Text style={[styles.modalActionButtonText, {
                    color: selectedMeal.eaten ? colors.gray[600] : colors.background.primary
                  }]}>
                    {selectedMeal.eaten ? 'Mark as Planned' : 'Mark as Eaten'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: colors.error[500] }]}
                  onPress={() => {
                    setShowMealDetail(false);
                    handleDeleteMeal(selectedMeal.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.background.primary} />
                  <Text style={[styles.modalActionButtonText, { color: colors.background.primary }]}>
                    Delete Meal
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* Privacy Consent Modal */}
      {/* <PrivacyConsentModal
        visible={showPrivacyModal}
        onAccept={handlePrivacyAccept}
        onDecline={handlePrivacyDecline}
        isFirstTime={needsPrivacyConsent}
      /> */}

      {/* Meal Basket Modal */}
      {/* <MealBasketModal
        visible={showMealBasket}
        onClose={() => setShowMealBasket(false)}
      /> */}

      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.theme.cream,
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
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.gray[500],
    marginTop: 4,
  },
  profileButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  macroContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  calorieBarContainer: {
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  calorieBarTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
    marginBottom: spacing.base,
    textAlign: 'center',
  },
  calorieBarWrapper: {
    position: 'relative',
    paddingHorizontal: '3%', // Reduce bar width by 10% (5% on each side)
  },
  calorieBar: {
    backgroundColor: colors.theme.white,
    borderRadius: borderRadius.md,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
    // 3D Floating Effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
    // Subtle gradient effect
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  calorieStarBubble: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 19, // Reduced from 20 to 18 (10% smaller)
    height: 19, // Reduced from 20 to 18 (10% smaller)
    borderRadius: 9, // Adjusted to maintain circle
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.theme.white,
    ...shadows.sm,
    zIndex: 1000, // Increased from 3 to 1000
  },
  calorieStarIcon: {
    color: colors.theme.white,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 14,
  },
  calorieWarningBubble: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 19, // Reduced from 20 to 18 (10% smaller)
    height: 19, // Reduced from 20 to 18 (10% smaller)
    borderRadius: 9, // Adjusted to maintain circle
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.theme.white,
    ...shadows.sm,
    zIndex: 1000, // Increased from 3 to 1000
  },
  calorieWarningIcon: {
    color: colors.theme.white,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 14,
  },
  calorieBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    borderRadius: borderRadius.md,
  },
  calorieBarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
    zIndex: 2,
  },
  macroRings: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs, // Increased from spacing.base to add 20% more spacing
  },
  macroRing: {
    alignItems: 'center',
  },
  ringWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  circularProgressContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: colors.theme.white,
    borderRadius: 40,
    // Enhanced 3D Floating Effect to match calorie bar depth
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
    width: 60,
    height: 60,
  },
  warningBubble: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.theme.coral,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.theme.white,
    ...shadows.sm,
    zIndex: 3, // Ensure it appears above everything
  },
  warningIcon: {
    color: colors.theme.white,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 14,
  },
  starBubble: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.theme.sage,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.theme.white,
    ...shadows.sm,
    zIndex: 3, // Ensure it appears above everything
  },
  starIcon: {
    color: colors.theme.white,
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 14,
  },
  macroValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2, // Ensure text appears above progress fill
  },
  macroValueTop: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.theme.teal,
    textAlign: 'center',
    lineHeight: 12,
  },
  macroDivider: {
    width: 16,
    height: 1,
    backgroundColor: colors.theme.teal,
    marginVertical: 1,
  },
  macroValueBottom: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[500],
    textAlign: 'center',
    lineHeight: 12,
  },
  singleMacroValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.theme.teal,
    zIndex: 2,
    textAlign: 'center',
  },
  macroLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
    marginTop: spacing.sm,
  },
  macroTarget: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.theme.teal,
  },
  seeAll: {
    fontSize: typography.fontSize.lg,
    color: colors.theme.orange,
    fontWeight: typography.fontWeight.semibold,
  },
  mealCard: {
    backgroundColor: colors.theme.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.sm,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
  },
  mealTime: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    marginTop: 2,
  },
  mealRightSection: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeToggle: {
    padding: 2,
    marginBottom: 2,
  },
  mealCalories: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.sage,
  },
  emptyMeals: {
    backgroundColor: colors.theme.white,
    borderRadius: borderRadius.md,
    padding: spacing['2xl'],
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyMealsText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[500],
    marginBottom: 4,
  },
  emptyMealsSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
  },
  suggestionCard: {
    backgroundColor: colors.theme.teal,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.base,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.white,
  },
  suggestionSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.theme.cream,
    marginTop: 2,
  },
  chatButton: {
    backgroundColor: colors.theme.orange,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.theme.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    width: (width - spacing.lg * 2 - spacing.md) / 2 - spacing.md / 2,
    ...shadows.sm,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.theme.teal,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.sm,
  },
  errorTestButton: {
    backgroundColor: colors.error[50] || '#FEF2F2',
    borderWidth: 1,
    borderColor: colors.error[200] || '#FECACA',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(250, 247, 240, 0.9)', // Semi-transparent cream
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: colors.theme.white,
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    ...shadows.lg,
    minWidth: 200,
  },
  loadingEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
    textAlign: 'center',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.theme.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.background.primary,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  
  // Meal Detail Card styles
  mealOverviewCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginVertical: spacing.base,
    ...shadows.sm,
  },
  mealHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.base,
  },
  mealDetailName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
    flex: 1,
    marginRight: spacing.base,
  },
  mealDetailBadge: {
    backgroundColor: colors.theme.teal,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.base,
  },
  mealDetailBadgeText: {
    fontSize: typography.fontSize.sm,
    color: colors.background.primary,
    fontWeight: typography.fontWeight.medium,
  },
  mealDetailBadgeContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  mealFavoriteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealFavoriteButton: {
    padding: 4,
  },
  mealFavoriteText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  mealDetailTime: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginBottom: spacing.base,
  },
  mealDetailStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealDetailStatusText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.sm,
  },
  
  // Nutrition and Info Card styles
  nutritionSummaryCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    ...shadows.sm,
  },
  calorieRingContainer: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  macroRingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  fiberRingContainer: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  mealInfoCard: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginVertical: spacing.sm,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
    marginBottom: spacing.base,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroItem: {
    alignItems: 'center',
    minWidth: '30%',
    marginBottom: spacing.base,
  },
  macroValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.theme.teal,
  },
  modalMacroLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  infoLabel: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.theme.teal,
  },

  // Ingredient display styles
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  ingredientInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  ingredientName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.theme.teal,
    marginBottom: 2,
  },
  ingredientPortion: {
    fontSize: typography.fontSize.xs,
    color: colors.theme.orange,
    fontWeight: typography.fontWeight.medium,
  },
  ingredientNutrition: {
    alignItems: 'flex-end',
  },
  ingredientCalories: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
    marginBottom: 2,
  },
  ingredientMacros: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
  },

  // Action buttons
  actionButtonsContainer: {
    paddingVertical: spacing.xl,
    gap: spacing.base,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  modalActionButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  
  // Swipe-to-delete styles
  mealCardContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderRadius: borderRadius.md,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.error[500],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.lg,
  },
  deleteCircle: {
    width: 22,
    height: 22,
    borderRadius: 16,
    backgroundColor: colors.background.primary,
    borderWidth: 2,
    borderColor: colors.gray[800],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  deleteText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    textAlign: 'center',
  },
  mealCardAnimated: {
    zIndex: 2,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
  },

  // Micronutrient styles
  micronutrientToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xs,
    marginTop: spacing.xs, // Reduced from spacing.lg (65% reduction)
  },
  micronutrientToggleText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.theme.teal,
  },
  micronutrientGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  micronutrientColumn: {
    flex: 1,
    gap: spacing.sm,
  },
  micronutrientBar: {
    padding: spacing.sm,
    ...shadows.sm,
  },
  micronutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  micronutrientLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.theme.teal,
    flex: 1,
  },
  micronutrientValues: {
    fontSize: typography.fontSize.xs,
    color: colors.gray[600],
    fontWeight: typography.fontWeight.medium,
  },
  micronutrientProgress: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  micronutrientProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
});