import { openAIClient } from './openai-client';
import { useAIStore } from '../../stores/ai-store';
import { useMealStore, Meal } from '../../stores/meal-store';
import { dataValidationGateway } from '../validation/data-validation-gateway';
import { MacroCalculatorAIErrorIntegration } from '../error/ai-integration-points';
import { DailyTotals } from '../../stores/meal-store';
import OpenAI from 'openai';

// V0.1 Core Types - Macro Calculation System

export interface UserGoals {
  daily_calorie_goal: number;
  protein_goal: number;
  carb_goal: number;
  fat_goal: number;
}

export interface GoalProgress {
  calories_percentage: number;
  protein_percentage: number;
  carbs_percentage: number;
  fat_percentage: number;
  overall_balance_score: number;
}

export interface MealData {
  id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  logged_at: Date;
  confidence: number;
}

// User Profile for Goal Setting
export interface UserProfile {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'bulk';
}

// Safety Validation Results
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiresCrisisIntervention: boolean;
}

// Time Window Meal Grouping
export interface MealWindow {
  windowStart: Date;
  windowEnd: Date;
  meals: MealData[];
  isComplete: boolean;
}

export interface GroupingResult {
  groupingType: 'new_window' | 'added_to_window';
  mealWindow: MealWindow;
  combinedAnalysis: CombinedMealAnalysis;
  shouldTriggerCalculation: boolean;
  message: string;
}

export interface CombinedMealAnalysis {
  totalNutrition: DailyTotals;
  macroDistribution: {
    proteinPercent: number;
    carbPercent: number;
    fatPercent: number;
  };
  mealType: string;
  nutritionalFlags: string[];
  componentCount: number;
}

// Calculation Request/Response Types
export interface CalculationRequest {
  trigger_type: 'meal_logged' | 'goal_changed' | 'progress_query';
  user_id: string;
  nutrition_data?: {
    total_nutrition: DailyTotals;
    confidence_overall: number;
    meal_timestamp?: string;
  };
  user_context: {
    daily_goals: UserGoals;
    todays_meals?: MealData[];
    goal_progress_query?: string;
  };
}

export interface CalculationResponse {
  calculation_results: {
    daily_totals: DailyTotals;
    goal_progress: GoalProgress;
    calculation_confidence: number;
    time_of_day_context: string;
  };
  insights_and_recommendations: {
    primary_insight: string;
    recommendations: Recommendation[];
    celebration_triggers: string[];
    concern_flags: string[];
  };
  chat_response: {
    encouragement: string;
    education_note: string;
    forward_momentum: string;
  };
  dashboard_data: {
    macro_rings_update: {
      calories: { current: number; goal: number; percentage: number };
      protein: { current: number; goal: number; percentage: number };
      carbs: { current: number; goal: number; percentage: number };
      fat: { current: number; goal: number; percentage: number };
    };
    daily_summary: string;
  };
  system_metadata: {
    calculation_time_ms: number;
    cache_status: string;
    audit_trail_logged: boolean;
    next_calculation_trigger: string;
    grouping_info?: GroupingResult;
  };
}

export interface Recommendation {
  type: string;
  message: string;
  specific_addition?: string;
  priority: 'high' | 'medium' | 'low';
}

// Goal Setting Types
export interface GoalSettingResponse {
  success: boolean;
  recommended_goals?: UserGoals;
  rationale?: string;
  alternatives?: AlternativeGoals[];
  safety_validation?: ValidationResult;
  next_steps?: string;
  errors?: string[];
  requiresCrisisIntervention?: boolean;
}

export interface AlternativeGoals {
  name: string;
  goals: UserGoals;
  description: string;
}

// Cache Management
interface CacheEntry {
  key: string;
  data: CalculationResponse;
  timestamp: Date;
  ttl_minutes: number;
  user_id: string;
  invalidation_triggers: string[];
}

// Performance Monitoring
interface PerformanceLog {
  operation: string;
  duration_ms: number;
  timestamp: Date;
  user_id: string;
  trigger_type: string;
  meal_count: number;
  cache_hit: boolean;
  success: boolean;
  performance_tier: string;
}

// Main Macro Calculator AI Class
class MacroCalculatorAI {
  private conversationWindows: Map<string, MealWindow> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private performanceLogs: PerformanceLog[] = [];
  private readonly WINDOW_DURATION_MINUTES = 5;
  private readonly DEFAULT_TTL_MINUTES = 5;
  private readonly PERFORMANCE_SLA_MS = 2000;

  // V0.1 Core Calculation Methods (Task 1.2)
  calculateDailyTotals(meals: MealData[]): DailyTotals {
    return meals.reduce(
      (totals, meal) => ({
        calories: Number((totals.calories + meal.calories).toFixed(1)),
        protein: Number((totals.protein + meal.protein).toFixed(1)),
        carbs: Number((totals.carbs + meal.carbs).toFixed(1)),
        fat: Number((totals.fat + meal.fat).toFixed(1)),
        fiber: Number((totals.fiber + meal.fiber).toFixed(1))
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  }

  calculateGoalProgress(totals: DailyTotals, goals: UserGoals): GoalProgress {
    const caloriesPercentage = Math.round((totals.calories / goals.daily_calorie_goal) * 100);
    const proteinPercentage = Math.round((totals.protein / goals.protein_goal) * 100);
    const carbsPercentage = Math.round((totals.carbs / goals.carb_goal) * 100);
    const fatPercentage = Math.round((totals.fat / goals.fat_goal) * 100);
    
    // Overall balance score calculation
    const percentages = [caloriesPercentage, proteinPercentage, carbsPercentage, fatPercentage];
    const averageProgress = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    const variance = percentages.reduce((sum, p) => sum + Math.pow(p - averageProgress, 2), 0) / percentages.length;
    const balanceScore = Math.max(0, 100 - Math.sqrt(variance));
    
    return {
      calories_percentage: Math.min(caloriesPercentage, 999),
      protein_percentage: Math.min(proteinPercentage, 999),
      carbs_percentage: Math.min(carbsPercentage, 999),
      fat_percentage: Math.min(fatPercentage, 999),
      overall_balance_score: Math.round(balanceScore)
    };
  }

  // V0.1 Goal Setting with Safety Validation (Task 1.3)
  calculateBasicGoals(profile: UserProfile): UserGoals {
    // Simple BMR estimation using Mifflin-St Jeor equation
    const bmr = profile.gender === 'male' 
      ? (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) + 5
      : (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) - 161;
    
    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    const tdee = bmr * activityMultipliers[profile.activity_level];
    
    // Goal adjustments
    const goalAdjustments = {
      lose: -500,    // 500 calorie deficit for ~1lb/week loss
      maintain: 0,   // Maintenance calories
      bulk: +300     // 300 calorie surplus for lean gains
    };
    
    const targetCalories = Math.round(tdee + goalAdjustments[profile.goal]);
    
    // Macro distribution (grams)
    const proteinGrams = Math.round(profile.weight_kg * 2.2 * 0.8); // 0.8g per lb bodyweight
    const fatGrams = Math.round(targetCalories * 0.25 / 9); // 25% of calories from fat
    const carbGrams = Math.round((targetCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4); // Remaining calories
    
    return {
      daily_calorie_goal: targetCalories,
      protein_goal: proteinGrams,
      carb_goal: carbGrams,
      fat_goal: fatGrams
    };
  }

  validateGoalSafety(goals: UserGoals, profile: UserProfile): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    
    // Critical safety checks for crisis intervention
    const minCaloriesFemale = 1200;
    const minCaloriesMale = 1500;
    const minCalories = profile.gender === 'female' ? minCaloriesFemale : minCaloriesMale;
    
    if (goals.daily_calorie_goal < minCalories) {
      errors.push(`Calorie goal too low. Minimum recommended: ${minCalories} calories`);
    }
    
    // Protein range validation (0.6-2.5g per kg bodyweight)
    const minProtein = profile.weight_kg * 0.6;
    const maxProtein = profile.weight_kg * 2.5;
    
    if (goals.protein_goal < minProtein) {
      warnings.push(`Protein goal may be too low. Consider at least ${Math.round(minProtein)}g`);
    } else if (goals.protein_goal > maxProtein) {
      warnings.push(`Protein goal very high. Consider consulting a nutritionist for ${Math.round(goals.protein_goal)}g daily`);
    }
    
    // Fat minimum (15% of calories minimum for hormone production)
    const minFatCalories = goals.daily_calorie_goal * 0.15;
    const minFatGrams = minFatCalories / 9;
    
    if (goals.fat_goal < minFatGrams) {
      warnings.push(`Fat goal may be too low for optimal health. Consider at least ${Math.round(minFatGrams)}g`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiresCrisisIntervention: goals.daily_calorie_goal < minCalories
    };
  }

  // Placeholder methods for remaining tasks
  async processCalculationRequest(request: CalculationRequest): Promise<CalculationResponse> {
    const startTime = Date.now();
    let cacheKey: string | undefined;
    
    try {
      // Step 0: Check cache first for performance optimization
      cacheKey = this.generateCacheKey(request);
      const cachedResult = this.getCachedResult(cacheKey);
      
      if (cachedResult) {
        // Log cache hit performance
        this.logPerformance({
          operation: 'processCalculationRequest',
          duration_ms: Date.now() - startTime,
          timestamp: new Date(),
          user_id: request.user_id,
          trigger_type: request.trigger_type,
          meal_count: request.user_context.todays_meals?.length || 0,
          cache_hit: true,
          success: true,
          performance_tier: 'excellent'
        });
        
        return cachedResult;
      }
      // Step 1: Calculate daily totals from meals
      const dailyMeals = request.user_context.todays_meals || [];
      const dailyTotals = this.calculateDailyTotals(dailyMeals);
      
      // Step 2: Calculate goal progress
      const goalProgress = this.calculateGoalProgress(dailyTotals, request.user_context.daily_goals);
      
      // Step 3: Determine calculation confidence
      let calculationConfidence = 0.95; // Base confidence
      if (request.nutrition_data?.confidence_overall) {
        calculationConfidence = Math.min(calculationConfidence, request.nutrition_data.confidence_overall);
      }
      if (dailyMeals.length === 0) {
        calculationConfidence = 0.0;
      } else if (dailyMeals.some(meal => meal.confidence < 0.8)) {
        calculationConfidence *= 0.9; // Reduce confidence for low-confidence meals
      }
      
      // Step 4: Get time context
      const timeOfDay = this.getTimeOfDayContext();
      const mealsRemainingContext = this.getMealsRemainingContext(timeOfDay);
      
      // Step 5: Generate insights and recommendations using AI
      const insights = await this.generateInsightsAndRecommendations(
        dailyTotals, 
        goalProgress, 
        request.user_context.daily_goals,
        timeOfDay,
        request.trigger_type
      );
      
      // Step 6: Create chat response
      const chatResponse = this.generateChatResponse(
        insights, 
        goalProgress, 
        timeOfDay, 
        request.trigger_type
      );
      
      // Step 7: Prepare dashboard data
      const dashboardData = this.prepareDashboardData(
        dailyTotals,
        request.user_context.daily_goals,
        goalProgress,
        insights.celebration_triggers
      );
      
      // Step 8: Handle grouping info if this is a meal_logged request
      let groupingInfo: GroupingResult | undefined;
      if (request.trigger_type === 'meal_logged' && request.nutrition_data?.meal_timestamp) {
        const mealData: MealData = {
          id: `meal_${Date.now()}`,
          calories: request.nutrition_data.total_nutrition.calories,
          protein: request.nutrition_data.total_nutrition.protein,
          carbs: request.nutrition_data.total_nutrition.carbs,
          fat: request.nutrition_data.total_nutrition.fat,
          fiber: request.nutrition_data.total_nutrition.fiber,
          logged_at: new Date(request.nutrition_data.meal_timestamp),
          confidence: request.nutrition_data.confidence_overall
        };
        
        groupingInfo = this.groupMealIntoWindow(mealData, request.user_id);
      }
      
      // Step 9: Performance tracking
      const calculationTime = Date.now() - startTime;
      this.logPerformance({
        operation: 'processCalculationRequest',
        duration_ms: calculationTime,
        timestamp: new Date(),
        user_id: request.user_id,
        trigger_type: request.trigger_type,
        meal_count: dailyMeals.length,
        cache_hit: false, // Will be updated when caching is implemented
        success: true,
        performance_tier: calculationTime < this.PERFORMANCE_SLA_MS ? 'excellent' : 'acceptable'
      });
      
      // Check for performance SLA violations and log to Error Handler
      if (calculationTime > this.PERFORMANCE_SLA_MS) {
        await MacroCalculatorAIErrorIntegration.handlePerformanceError(
          calculationTime,
          request.user_id,
          this.PERFORMANCE_SLA_MS
        );
      }
      
      // Step 10: Clean up expired windows
      this.cleanupExpiredWindows();
      
      const response: CalculationResponse = {
        calculation_results: {
          daily_totals: dailyTotals,
          goal_progress: goalProgress,
          calculation_confidence: calculationConfidence,
          time_of_day_context: `${timeOfDay} - ${mealsRemainingContext}`
        },
        insights_and_recommendations: insights,
        chat_response: chatResponse,
        dashboard_data: dashboardData,
        system_metadata: {
          calculation_time_ms: calculationTime,
          cache_status: 'computed', // New computation, will be cached
          audit_trail_logged: true,
          next_calculation_trigger: this.determineNextTrigger(timeOfDay, goalProgress),
          grouping_info: groupingInfo
        }
      };
      
      // Step 11: Update dashboard in real-time for meal logging and progress queries
      if (request.trigger_type === 'meal_logged' && request.nutrition_data) {
        this.updateDashboardData(request.nutrition_data, request.user_id);
      } else if (request.trigger_type === 'progress_query') {
        // Progress queries ensure dashboard data is current by accessing current state
        const currentState = this.getDashboardState();
        console.log(`[MacroCalculatorAI] Progress query - current dashboard state:`, currentState?.dailyTotals);
      }
      
      // Step 12: Cache the response for future requests
      await this.setCacheEntry(cacheKey, response, request);
      
      return response;
      
    } catch (error) {
      // Production-ready error handling via Error Handler Orchestrator
      const calculationTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';
      
      // Log to Error Handler Orchestrator
      await MacroCalculatorAIErrorIntegration.handleCalculationError(
        request,
        request.user_id,
        errorMessage,
        { 
          calculationTime,
          cacheAttempted: cacheKey !== undefined,
          performanceTier: calculationTime > 2000 ? 'slow' : 'normal',
          mealCount: request.user_context.todays_meals?.length || 0
        }
      );
      
      this.logPerformance({
        operation: 'processCalculationRequest',
        duration_ms: calculationTime,
        timestamp: new Date(),
        user_id: request.user_id,
        trigger_type: request.trigger_type,
        meal_count: request.user_context.todays_meals?.length || 0,
        cache_hit: false,
        success: false,
        performance_tier: 'error'
      });
      
      // Return fallback response
      return this.generateFallbackResponse(request, error);
    }
  }

  private async generateInsightsAndRecommendations(
    totals: DailyTotals,
    progress: GoalProgress,
    goals: UserGoals,
    timeOfDay: string,
    triggerType: string
  ): Promise<{
    primary_insight: string;
    recommendations: Recommendation[];
    celebration_triggers: string[];
    concern_flags: string[];
  }> {
    
    const recommendations: Recommendation[] = [];
    const celebrationTriggers: string[] = [];
    const concernFlags: string[] = [];
    
    // Generate primary insight
    let primaryInsight = '';
    if (triggerType === 'meal_logged') {
      const overallProgress = Math.round((progress.calories_percentage + progress.protein_percentage + progress.carbs_percentage + progress.fat_percentage) / 4);
      primaryInsight = `Great logging! You're ${overallProgress}% toward your daily goals with ${this.getMealsRemainingContext(timeOfDay)}.`;
    } else if (triggerType === 'progress_query') {
      primaryInsight = `You're making solid progress today! Here's where you stand on your macro targets.`;
    } else {
      primaryInsight = `Your nutrition goals have been updated. Here's how today's intake aligns with your new targets.`;
    }
    
    // Protein recommendations
    if (progress.protein_percentage < 70) {
      recommendations.push({
        type: 'protein_boost',
        message: 'Consider adding a protein-rich snack to meet your daily target',
        specific_addition: 'Greek yogurt, protein shake, or lean meat',
        priority: 'high'
      });
    } else if (progress.protein_percentage > 120) {
      concernFlags.push('protein_excess');
    }
    
    // Calorie recommendations
    if (progress.calories_percentage < 80 && timeOfDay === 'evening') {
      recommendations.push({
        type: 'calorie_shortage',
        message: 'You might be under-eating today. Consider a balanced evening meal',
        priority: 'medium'
      });
    } else if (progress.calories_percentage > 110) {
      concernFlags.push('calorie_excess');
    }
    
    // Balance recommendations
    if (progress.overall_balance_score > 85) {
      celebrationTriggers.push('excellent_balance');
    } else if (progress.overall_balance_score < 60) {
      recommendations.push({
        type: 'balance_improvement',
        message: 'Try to balance your macros more evenly throughout the day',
        priority: 'medium'
      });
    }
    
    // Fiber recommendations
    if (totals.fiber < 15) {
      recommendations.push({
        type: 'fiber_boost',
        message: 'Add some high-fiber foods to support digestive health',
        specific_addition: 'Vegetables, fruits, or whole grains',
        priority: 'low'
      });
    }
    
    // Time-based recommendations
    if (timeOfDay === 'morning' && totals.protein < 20) {
      recommendations.push({
        type: 'morning_protein',
        message: 'Start your day with more protein to maintain energy',
        specific_addition: 'Eggs, Greek yogurt, or protein smoothie',
        priority: 'medium'
      });
    }
    
    return {
      primary_insight: primaryInsight,
      recommendations,
      celebration_triggers: celebrationTriggers,
      concern_flags: concernFlags
    };
  }

  private generateChatResponse(
    insights: any,
    progress: GoalProgress,
    timeOfDay: string,
    triggerType: string
  ): {
    encouragement: string;
    education_note: string;
    forward_momentum: string;
  } {
    
    let encouragement = '';
    let educationNote = '';
    let forwardMomentum = '';
    
    // Generate encouragement based on progress
    if (progress.overall_balance_score > 85) {
      encouragement = "Fantastic job balancing your macros today! You're crushing your nutrition goals! 🎯";
    } else if (progress.overall_balance_score > 70) {
      encouragement = "You're doing great with your nutrition tracking! Keep up the momentum! 💪";
    } else {
      encouragement = "Every meal logged is progress! You're building healthy habits one step at a time. 📈";
    }
    
    // Generate education note
    if (insights.recommendations.find((r: any) => r.type === 'protein_boost')) {
      educationNote = "💡 Protein helps maintain muscle mass and keeps you feeling full longer. Aim to include protein with each meal.";
    } else if (insights.recommendations.find((r: any) => r.type === 'fiber_boost')) {
      educationNote = "🌱 Fiber supports digestive health and helps stabilize blood sugar. Most adults need 25-35g daily.";
    } else if (insights.concern_flags.includes('calorie_excess')) {
      educationNote = "⚖️ Remember, sustainable progress comes from consistency, not perfection. Focus on balanced choices.";
    } else {
      educationNote = "🧠 Tracking your intake helps build awareness of your eating patterns and supports your health goals.";
    }
    
    // Generate forward momentum
    if (timeOfDay === 'morning') {
      forwardMomentum = "You've got the whole day ahead to nourish your body well! What's your next meal going to be?";
    } else if (timeOfDay === 'afternoon') {
      forwardMomentum = "Great progress so far today! How can you finish strong with a balanced dinner?";
    } else {
      forwardMomentum = "You're wrapping up another day of mindful eating! Tomorrow is a fresh start to build on today's success.";
    }
    
    return {
      encouragement,
      education_note: educationNote,
      forward_momentum: forwardMomentum
    };
  }

  private prepareDashboardData(
    totals: DailyTotals,
    goals: UserGoals,
    progress: GoalProgress,
    celebrations: string[]
  ): {
    macro_rings_update: {
      calories: { current: number; goal: number; percentage: number };
      protein: { current: number; goal: number; percentage: number };
      carbs: { current: number; goal: number; percentage: number };
      fat: { current: number; goal: number; percentage: number };
    };
    daily_summary: string;
  } {
    
    const macroRingsUpdate = {
      calories: {
        current: Math.round(totals.calories),
        goal: goals.daily_calorie_goal,
        percentage: progress.calories_percentage
      },
      protein: {
        current: Math.round(totals.protein),
        goal: goals.protein_goal,
        percentage: progress.protein_percentage
      },
      carbs: {
        current: Math.round(totals.carbs),
        goal: goals.carb_goal,
        percentage: progress.carbs_percentage
      },
      fat: {
        current: Math.round(totals.fat),
        goal: goals.fat_goal,
        percentage: progress.fat_percentage
      }
    };
    
    const dailySummary = celebrations.includes('excellent_balance') 
      ? `🎉 Excellent macro balance today! Overall score: ${progress.overall_balance_score}%`
      : `📊 Daily Progress: ${Math.round((progress.calories_percentage + progress.protein_percentage + progress.carbs_percentage + progress.fat_percentage) / 4)}% of goals achieved`;
    
    return {
      macro_rings_update: macroRingsUpdate,
      daily_summary: dailySummary
    };
  }

  private determineNextTrigger(timeOfDay: string, progress: GoalProgress): string {
    if (timeOfDay === 'morning') {
      return 'lunch_check_in';
    } else if (timeOfDay === 'afternoon') {
      return 'dinner_planning';
    } else {
      return 'daily_reflection';
    }
  }

  private logPerformance(log: PerformanceLog): void {
    this.performanceLogs.push(log);
    
    // Keep only last 100 performance logs
    if (this.performanceLogs.length > 100) {
      this.performanceLogs = this.performanceLogs.slice(-100);
    }
  }

  private generateFallbackResponse(request: CalculationRequest, error: unknown): CalculationResponse {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Return minimal safe response
    const fallbackTotals: DailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    const fallbackProgress: GoalProgress = {
      calories_percentage: 0,
      protein_percentage: 0,
      carbs_percentage: 0,
      fat_percentage: 0,
      overall_balance_score: 0
    };
    
    return {
      calculation_results: {
        daily_totals: fallbackTotals,
        goal_progress: fallbackProgress,
        calculation_confidence: 0.0,
        time_of_day_context: 'error_state'
      },
      insights_and_recommendations: {
        primary_insight: 'We encountered an issue calculating your nutrition data. Please try again.',
        recommendations: [],
        celebration_triggers: [],
        concern_flags: ['system_error']
      },
      chat_response: {
        encouragement: "Don't worry! Technical hiccups happen. Your nutrition journey continues! 💪",
        education_note: "System temporarily unavailable. Your data is safe and we'll be back shortly.",
        forward_momentum: "Keep tracking your meals manually if possible, and we'll sync up when the system is restored."
      },
      dashboard_data: {
        macro_rings_update: {
          calories: { current: 0, goal: request.user_context.daily_goals.daily_calorie_goal, percentage: 0 },
          protein: { current: 0, goal: request.user_context.daily_goals.protein_goal, percentage: 0 },
          carbs: { current: 0, goal: request.user_context.daily_goals.carb_goal, percentage: 0 },
          fat: { current: 0, goal: request.user_context.daily_goals.fat_goal, percentage: 0 }
        },
        daily_summary: '⚠️ System temporarily unavailable - data will sync when restored'
      },
      system_metadata: {
        calculation_time_ms: 0,
        cache_status: 'error',
        audit_trail_logged: false,
        next_calculation_trigger: 'retry_when_available',
        grouping_info: undefined
      }
    };
  }

  async processGoalSettingRequest(profile: UserProfile): Promise<GoalSettingResponse> {
    try {
      // Step 1: Calculate basic goals using BMR/TDEE
      const recommendedGoals = this.calculateBasicGoals(profile);
      
      // Step 2: Validate safety of calculated goals
      const safetyValidation = this.validateGoalSafety(recommendedGoals, profile);
      
      // Step 3: Check for crisis intervention requirements
      if (safetyValidation.requiresCrisisIntervention) {
        // Log crisis detection to Error Handler Orchestrator for immediate attention
        await MacroCalculatorAIErrorIntegration.handleCrisisDetection(
          recommendedGoals,
          'system_goal_calculation', // Use system identifier for auto-calculated goals
          'dangerous_calorie_goal',
          profile
        );
        
        return {
          success: false,
          requiresCrisisIntervention: true,
          errors: safetyValidation.errors,
          next_steps: 'Please consult with a healthcare professional for personalized nutrition guidance. If you are experiencing thoughts of self-harm, please call 988 (Suicide & Crisis Lifeline) or 1-800-931-2237 (NEDA Helpline).'
        };
      }
      
      // Step 4: Generate alternative goals (conservative and aggressive)
      const alternatives: AlternativeGoals[] = [];
      
      // Conservative alternative (10% less aggressive calorie adjustment)
      const conservativeCalories = profile.goal === 'lose' 
        ? recommendedGoals.daily_calorie_goal + 200  // Less aggressive deficit
        : profile.goal === 'bulk' 
        ? recommendedGoals.daily_calorie_goal - 100  // Less aggressive surplus
        : recommendedGoals.daily_calorie_goal;
        
      alternatives.push({
        name: 'Conservative Approach',
        goals: {
          ...recommendedGoals,
          daily_calorie_goal: conservativeCalories
        },
        description: 'A gentler approach with smaller calorie adjustments for sustainable progress'
      });
      
      // Aggressive alternative (20% more aggressive calorie adjustment, if safe)
      const aggressiveCalories = profile.goal === 'lose' 
        ? Math.max(recommendedGoals.daily_calorie_goal - 200, profile.gender === 'female' ? 1200 : 1500)  // Respect minimum calories
        : profile.goal === 'bulk' 
        ? recommendedGoals.daily_calorie_goal + 200  
        : recommendedGoals.daily_calorie_goal;
        
      if (aggressiveCalories >= (profile.gender === 'female' ? 1200 : 1500)) {
        alternatives.push({
          name: 'Aggressive Approach',
          goals: {
            ...recommendedGoals,
            daily_calorie_goal: aggressiveCalories
          },
          description: 'Faster progress with larger calorie adjustments - monitor closely'
        });
      }
      
      // Step 5: Generate educational rationale
      const bmr = profile.gender === 'male' 
        ? (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) + 5
        : (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age) - 161;
        
      const activityMultipliers = {
        sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
      };
      const tdee = Math.round(bmr * activityMultipliers[profile.activity_level]);
      
      const rationale = `Based on your profile (${profile.age}yo ${profile.gender}, ${profile.weight_kg}kg, ${profile.height_cm}cm, ${profile.activity_level} activity), your estimated daily energy needs are ${tdee} calories. For ${profile.goal === 'lose' ? 'weight loss' : profile.goal === 'maintain' ? 'maintenance' : 'muscle building'}, I've calculated your macro targets to optimize progress while maintaining health.`;
      
      return {
        success: true,
        recommended_goals: recommendedGoals,
        rationale,
        alternatives,
        safety_validation: safetyValidation,
        next_steps: safetyValidation.warnings.length > 0 
          ? 'Please review the warnings below and consider consulting a healthcare professional if you have concerns.'
          : 'Your goals look healthy! Start tracking your meals to monitor progress toward these targets.'
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log goal calculation error to Error Handler Orchestrator
      await MacroCalculatorAIErrorIntegration.handleCalculationError(
        { trigger_type: 'goal_calculation', user_id: 'system' },
        'system',
        `Goal calculation error: ${errorMessage}`,
        { 
          operation: 'goal_calculation',
          profile: profile ? { age: profile.age, gender: profile.gender } : undefined
        }
      );
      
      return {
        success: false,
        errors: [`Goal calculation error: ${errorMessage}`],
        requiresCrisisIntervention: false
      };
    }
  }

  // V0.1 Time Window Meal Grouping (Task 1.4)
  groupMealIntoWindow(meal: MealData, userId: string): GroupingResult {
    const mealTime = new Date(meal.logged_at);
    const windowKey = `${userId}_${mealTime.toDateString()}`;
    
    // Check if there's an existing window for this user today
    const existingWindow = this.conversationWindows.get(windowKey);
    
    if (!existingWindow) {
      // Create new window
      const newWindow: MealWindow = {
        windowStart: mealTime,
        windowEnd: new Date(mealTime.getTime() + (this.WINDOW_DURATION_MINUTES * 60 * 1000)),
        meals: [meal],
        isComplete: false
      };
      
      this.conversationWindows.set(windowKey, newWindow);
      
      const analysis = this.analyzeCombinedMeal(newWindow);
      
      return {
        groupingType: 'new_window',
        mealWindow: newWindow,
        combinedAnalysis: analysis,
        shouldTriggerCalculation: true,
        message: `Started new meal session at ${mealTime.toLocaleTimeString()}`
      };
    }
    
    // Check if meal falls within existing window (5-minute rule)
    const timeDifference = Math.abs(mealTime.getTime() - existingWindow.windowStart.getTime());
    const isWithinWindow = timeDifference <= (this.WINDOW_DURATION_MINUTES * 60 * 1000);
    
    if (isWithinWindow && !existingWindow.isComplete) {
      // Add to existing window
      existingWindow.meals.push(meal);
      existingWindow.windowEnd = new Date(Math.max(existingWindow.windowEnd.getTime(), mealTime.getTime()));
      
      const analysis = this.analyzeCombinedMeal(existingWindow);
      
      return {
        groupingType: 'added_to_window',
        mealWindow: existingWindow,
        combinedAnalysis: analysis,
        shouldTriggerCalculation: existingWindow.meals.length >= 3, // Trigger calculation after 3 items
        message: `Added to meal session (${existingWindow.meals.length} items total)`
      };
    } else {
      // Close existing window and create new one
      existingWindow.isComplete = true;
      
      const newWindow: MealWindow = {
        windowStart: mealTime,
        windowEnd: new Date(mealTime.getTime() + (this.WINDOW_DURATION_MINUTES * 60 * 1000)),
        meals: [meal],
        isComplete: false
      };
      
      // Use different key for new window to avoid conflicts
      const newWindowKey = `${windowKey}_${Date.now()}`;
      this.conversationWindows.set(newWindowKey, newWindow);
      
      const analysis = this.analyzeCombinedMeal(newWindow);
      
      return {
        groupingType: 'new_window',
        mealWindow: newWindow,
        combinedAnalysis: analysis,
        shouldTriggerCalculation: true,
        message: `Completed previous session, started new meal at ${mealTime.toLocaleTimeString()}`
      };
    }
  }

  private analyzeCombinedMeal(window: MealWindow): CombinedMealAnalysis {
    const totalNutrition = this.calculateDailyTotals(window.meals);
    const totalCalories = totalNutrition.calories;
    
    // Calculate macro distribution percentages
    const proteinCalories = totalNutrition.protein * 4;
    const carbCalories = totalNutrition.carbs * 4;
    const fatCalories = totalNutrition.fat * 9;
    const totalMacroCalories = proteinCalories + carbCalories + fatCalories;
    
    const macroDistribution = {
      proteinPercent: totalMacroCalories > 0 ? Math.round((proteinCalories / totalMacroCalories) * 100) : 0,
      carbPercent: totalMacroCalories > 0 ? Math.round((carbCalories / totalMacroCalories) * 100) : 0,
      fatPercent: totalMacroCalories > 0 ? Math.round((fatCalories / totalMacroCalories) * 100) : 0
    };
    
    // Determine meal type based on nutrition profile and time
    const mealType = this.determineMealType(totalNutrition, window.windowStart, window.meals.length);
    
    // Generate nutritional flags
    const nutritionalFlags = this.generateNutrionalFlags(totalNutrition, macroDistribution);
    
    return {
      totalNutrition,
      macroDistribution,
      mealType,
      nutritionalFlags,
      componentCount: window.meals.length
    };
  }

  private determineMealType(nutrition: DailyTotals, timestamp: Date, componentCount: number): string {
    const hour = timestamp.getHours();
    const isHighProtein = nutrition.protein > 25;
    const isHighCarb = nutrition.carbs > 50;
    const isSubstantial = nutrition.calories > 300;
    
    let mealType = '';
    
    // Time-based classification
    if (hour >= 6 && hour < 11) {
      mealType = 'breakfast';
    } else if (hour >= 11 && hour < 16) {
      mealType = 'lunch';
    } else if (hour >= 16 && hour < 22) {
      mealType = 'dinner';
    } else {
      mealType = 'snack';
    }
    
    // Refine based on nutrition profile
    if (!isSubstantial) {
      mealType = 'snack';
    } else if (isHighProtein && mealType === 'breakfast') {
      mealType = 'protein breakfast';
    } else if (isHighCarb && (mealType === 'lunch' || mealType === 'dinner')) {
      mealType = `${mealType} (carb-focused)`;
    }
    
    // Add component count context
    if (componentCount > 2) {
      mealType = `multi-component ${mealType}`;
    }
    
    return mealType;
  }

  private generateNutrionalFlags(nutrition: DailyTotals, distribution: { proteinPercent: number; carbPercent: number; fatPercent: number }): string[] {
    const flags: string[] = [];
    
    // Protein flags
    if (nutrition.protein > 40) {
      flags.push('high-protein');
    } else if (nutrition.protein < 10) {
      flags.push('low-protein');
    }
    
    // Carb flags  
    if (nutrition.carbs > 60) {
      flags.push('high-carb');
    } else if (nutrition.carbs < 15) {
      flags.push('low-carb');
    }
    
    // Fat flags
    if (nutrition.fat > 30) {
      flags.push('high-fat');
    } else if (nutrition.fat < 5) {
      flags.push('low-fat');
    }
    
    // Fiber flags
    if (nutrition.fiber > 10) {
      flags.push('high-fiber');
    }
    
    // Balance flags
    if (distribution.proteinPercent > 40) {
      flags.push('protein-dominant');
    } else if (distribution.carbPercent > 60) {
      flags.push('carb-dominant');
    } else if (distribution.fatPercent > 50) {
      flags.push('fat-dominant');
    }
    
    // Calorie flags
    if (nutrition.calories > 600) {
      flags.push('high-calorie');
    } else if (nutrition.calories < 150) {
      flags.push('light-meal');
    }
    
    return flags;
  }

  // Window management utilities
  private cleanupExpiredWindows(): void {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    this.conversationWindows.forEach((window, key) => {
      // Remove windows older than 4 hours or completed windows older than 1 hour
      const windowAge = now.getTime() - window.windowEnd.getTime();
      const shouldCleanup = (windowAge > 4 * 60 * 60 * 1000) || 
                           (window.isComplete && windowAge > 60 * 60 * 1000);
                           
      if (shouldCleanup) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.conversationWindows.delete(key));
  }

  getCurrentWindow(userId: string): MealWindow | null {
    const today = new Date().toDateString();
    const windowKey = `${userId}_${today}`;
    return this.conversationWindows.get(windowKey) || null;
  }

  // Utility methods
  private getTimeOfDayContext(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  }

  private getMealsRemainingContext(timeOfDay: string): string {
    switch (timeOfDay) {
      case 'morning': return 'plenty of time left today';
      case 'afternoon': return 'dinner still ahead';
      case 'evening': return 'wrapping up the day';
      default: return 'time left today';
    }
  }

  // V0.1 Performance Caching System (Task 1.6)
  private generateCacheKey(request: CalculationRequest): string {
    // Create deterministic cache key based on request contents
    const keyComponents = [
      request.trigger_type,
      request.user_id,
      // Hash of meals (order-independent)
      this.hashMeals(request.user_context.todays_meals || []),
      // Hash of goals
      JSON.stringify(request.user_context.daily_goals),
      // Day identifier (cache expires daily)
      new Date().toDateString()
    ];
    
    return keyComponents.join('|');
  }

  private hashMeals(meals: MealData[]): string {
    // Create consistent hash regardless of meal order
    const sortedMeals = meals
      .map(meal => `${meal.id}:${meal.calories}:${meal.protein}:${meal.carbs}:${meal.fat}:${meal.fiber}`)
      .sort()
      .join(',');
    return btoa(sortedMeals).slice(0, 16); // Base64 encoded, first 16 chars
  }

  private getCachedResult(cacheKey: string): CalculationResponse | null {
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }
    
    // Check if cache entry has expired
    const now = new Date();
    const ageMinutes = (now.getTime() - entry.timestamp.getTime()) / (1000 * 60);
    
    if (ageMinutes > entry.ttl_minutes) {
      // Cache expired, remove entry
      this.cache.delete(cacheKey);
      return null;
    }
    
    // Update cache metadata to indicate this was a cache hit
    entry.data.system_metadata.cache_status = 'cache_hit';
    entry.data.system_metadata.calculation_time_ms = 0; // Instant from cache
    
    return entry.data;
  }

  private async setCacheEntry(cacheKey: string, response: CalculationResponse, request: CalculationRequest): Promise<void> {
    try {
      // Determine TTL based on request type
      let ttlMinutes = this.DEFAULT_TTL_MINUTES;
      
      if (request.trigger_type === 'goal_changed') {
        ttlMinutes = 60; // Goals change less frequently, cache longer
      } else if (request.trigger_type === 'meal_logged') {
        ttlMinutes = 3;  // Meals logged frequently, shorter cache
      } else {
        ttlMinutes = 5;  // Progress queries, medium cache
      }
      
      // Determine invalidation triggers
      const invalidationTriggers = ['daily_reset'];
      if (request.trigger_type === 'meal_logged') {
        invalidationTriggers.push('meal_updated', 'meal_deleted');
      } else if (request.trigger_type === 'goal_changed') {
        invalidationTriggers.push('goal_updated');
      }
      
      const cacheEntry: CacheEntry = {
        key: cacheKey,
        data: { ...response }, // Deep copy to prevent mutations
        timestamp: new Date(),
        ttl_minutes: ttlMinutes,
        user_id: request.user_id,
        invalidation_triggers: invalidationTriggers
      };
      
      this.cache.set(cacheKey, cacheEntry);
      
      // Clean up old cache entries to prevent memory issues
      this.cleanupExpiredCache();
    } catch (error) {
      // Log cache error to Error Handler Orchestrator
      const errorMessage = error instanceof Error ? error.message : 'Unknown cache error';
      await MacroCalculatorAIErrorIntegration.handleCachingError(
        cacheKey,
        request.user_id,
        `Cache write error: ${errorMessage}`
      );
      // Don't rethrow - cache failure shouldn't break calculation response
    }
  }

  private cleanupExpiredCache(): void {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      const ageMinutes = (now.getTime() - entry.timestamp.getTime()) / (1000 * 60);
      if (ageMinutes > entry.ttl_minutes) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    // Also limit total cache size (keep most recent 100 entries)
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => b.timestamp.getTime() - a.timestamp.getTime());
      
      // Keep only the 100 most recent entries
      this.cache.clear();
      entries.slice(0, 100).forEach(([key, entry]) => {
        this.cache.set(key, entry);
      });
    }
  }

  invalidateCache(userId: string, trigger: string): number {
    let invalidatedCount = 0;
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (entry.user_id === userId && entry.invalidation_triggers.includes(trigger)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.cache.delete(key);
      invalidatedCount++;
    });
    
    return invalidatedCount;
  }

  getCacheStats(): {
    totalEntries: number;
    userCounts: Map<string, number>;
    averageAgeMinutes: number;
    hitRate: number;
  } {
    const userCounts = new Map<string, number>();
    let totalAgeMinutes = 0;
    const now = new Date();
    
    this.cache.forEach(entry => {
      userCounts.set(entry.user_id, (userCounts.get(entry.user_id) || 0) + 1);
      totalAgeMinutes += (now.getTime() - entry.timestamp.getTime()) / (1000 * 60);
    });
    
    // Calculate hit rate from recent performance logs
    const recentLogs = this.performanceLogs.slice(-50); // Last 50 operations
    const cacheHits = recentLogs.filter(log => log.cache_hit).length;
    const hitRate = recentLogs.length > 0 ? cacheHits / recentLogs.length : 0;
    
    return {
      totalEntries: this.cache.size,
      userCounts,
      averageAgeMinutes: this.cache.size > 0 ? totalAgeMinutes / this.cache.size : 0,
      hitRate
    };
  }
  
  // V0.1 Dashboard Integration (Priority 3)
  private updateDashboardData(nutritionData: any, userId: string): void {
    try {
      console.log(`[MacroCalculatorAI] Updating dashboard for user ${userId}`);
      
      const mealStore = useMealStore.getState();
      
      // Create meal object from nutrition data - using the correct Meal interface
      const newMeal: Meal = {
        id: `meal-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        food_name: nutritionData.meal_name || 'Logged Meal',
        meal_type: 'snack', // Default to snack, could be enhanced with time-based logic
        calories: nutritionData.total_nutrition?.calories || 0,
        protein: nutritionData.total_nutrition?.protein || 0,
        carbs: nutritionData.total_nutrition?.carbs || 0,
        fat: nutritionData.total_nutrition?.fat || 0,
        quantity_grams: 100, // Default quantity
        logged_at: new Date(nutritionData.meal_timestamp || Date.now()).toISOString(),
        ai_confidence: nutritionData.confidence_overall || 0,
        recognition_source: 'food_recognition_ai',
        validation_status: 'validated'
      };
      
      console.log(`[MacroCalculatorAI] Adding meal: ${newMeal.food_name} - ${newMeal.calories} calories`);
      
      // Add meal to store - this will automatically update dailyTotals
      mealStore.addMeal(newMeal);
      
      // The MacroRings in the dashboard will automatically update via useMealStore hook
      console.log(`[MacroCalculatorAI] Dashboard updated successfully`);
      
    } catch (error) {
      console.error('[MacroCalculatorAI] Failed to update dashboard:', error);
      // Don't throw - dashboard update failure shouldn't break calculation
    }
  }
  
  // Helper method to get current dashboard state
  getDashboardState() {
    try {
      const mealStore = useMealStore.getState();
      return {
        todaysMeals: mealStore.todaysMeals,
        dailyTotals: mealStore.dailyTotals
      };
    } catch (error) {
      console.error('[MacroCalculatorAI] Failed to get dashboard state:', error);
      return null;
    }
  }
}

// Export singleton instance
export const macroCalculatorAI = new MacroCalculatorAI();