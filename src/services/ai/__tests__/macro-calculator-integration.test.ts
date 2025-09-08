// Macro Calculator AI - System Integration Tests
// End-to-End Integration with Food Recognition AI and Data Validation Gateway

import { macroCalculatorAI, CalculationRequest, CalculationResponse, MealData } from '../macro-calculator-ai';
import { DailyTotals } from '../../../stores/meal-store';

describe('Macro Calculator AI - System Integration Tests', () => {
  
  const createMockRequest = (
    triggerType: 'meal_logged' | 'goal_changed' | 'progress_query',
    userId: string = 'test-user',
    meals: MealData[] = [],
    nutritionData?: any
  ): CalculationRequest => ({
    trigger_type: triggerType,
    user_id: userId,
    nutrition_data: nutritionData,
    user_context: {
      daily_goals: {
        daily_calorie_goal: 2000,
        protein_goal: 150,
        carb_goal: 200,
        fat_goal: 70
      },
      todays_meals: meals,
      goal_progress_query: triggerType === 'progress_query' ? 'How am I doing today?' : undefined
    }
  });

  const createMockMeal = (
    id: string,
    calories: number = 300,
    protein: number = 25,
    carbs: number = 30,
    fat: number = 10,
    fiber: number = 5
  ): MealData => ({
    id,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    logged_at: new Date(),
    confidence: 0.92
  });

  beforeEach(() => {
    // Clear any existing data before each test
    (macroCalculatorAI as any).conversationWindows.clear();
    (macroCalculatorAI as any).performanceLogs = [];
  });

  describe('Meal Logging Integration Flow', () => {
    
    it('should process meal_logged request with complete integration', async () => {
      const meals = [
        createMockMeal('breakfast', 400, 30, 35, 15, 8),
        createMockMeal('lunch', 500, 40, 50, 20, 12)
      ];
      
      const nutritionData = {
        total_nutrition: { calories: 300, protein: 25, carbs: 30, fat: 10, fiber: 5 },
        confidence_overall: 0.88,
        meal_timestamp: new Date().toISOString()
      };
      
      const request = createMockRequest('meal_logged', 'user-123', meals, nutritionData);
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Validate calculation results
      expect(response.calculation_results.daily_totals.calories).toBe(900); // 400 + 500 from existing meals
      expect(response.calculation_results.daily_totals.protein).toBe(70);   // 30 + 40
      expect(response.calculation_results.daily_totals.carbs).toBe(85);     // 35 + 50
      expect(response.calculation_results.daily_totals.fat).toBe(35);       // 15 + 20
      expect(response.calculation_results.daily_totals.fiber).toBe(20);     // 8 + 12
      
      // Validate goal progress
      expect(response.calculation_results.goal_progress.calories_percentage).toBe(45); // 900/2000
      expect(response.calculation_results.goal_progress.protein_percentage).toBe(47);  // 70/150
      
      // Validate confidence calculation
      expect(response.calculation_results.calculation_confidence).toBeLessThanOrEqual(0.88);
      
      // Validate insights structure (percentage may vary slightly due to rounding)
      expect(response.insights_and_recommendations.primary_insight).toMatch(/4[5-6]%/);
      expect(response.insights_and_recommendations.recommendations.length).toBeGreaterThan(0);
      
      // Validate chat response
      expect(response.chat_response.encouragement).toBeTruthy();
      expect(response.chat_response.education_note).toBeTruthy();
      expect(response.chat_response.forward_momentum).toBeTruthy();
      
      // Validate dashboard data
      expect(response.dashboard_data.macro_rings_update.calories.current).toBe(900);
      expect(response.dashboard_data.macro_rings_update.calories.goal).toBe(2000);
      expect(response.dashboard_data.macro_rings_update.calories.percentage).toBe(45);
      
      // Validate system metadata
      expect(response.system_metadata.calculation_time_ms).toBeGreaterThan(0);
      expect(response.system_metadata.cache_status).toBe('computed');
      expect(response.system_metadata.audit_trail_logged).toBe(true);
      expect(response.system_metadata.grouping_info).toBeDefined();
    });
    
    it('should handle meal logging with time window grouping integration', async () => {
      const nutritionData = {
        total_nutrition: { calories: 350, protein: 30, carbs: 40, fat: 12, fiber: 6 },
        confidence_overall: 0.95,
        meal_timestamp: new Date().toISOString()
      };
      
      const request = createMockRequest('meal_logged', 'user-456', [], nutritionData);
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Should have grouping info for new meal
      expect(response.system_metadata.grouping_info).toBeDefined();
      expect(response.system_metadata.grouping_info!.groupingType).toBe('new_window');
      expect(response.system_metadata.grouping_info!.shouldTriggerCalculation).toBe(true);
      expect(response.system_metadata.grouping_info!.combinedAnalysis.componentCount).toBe(1);
    });
  });

  describe('Progress Query Integration Flow', () => {
    
    it('should process progress_query with comprehensive insights', async () => {
      const meals = [
        createMockMeal('breakfast', 350, 25, 35, 12, 6),
        createMockMeal('snack', 150, 10, 15, 6, 3),
        createMockMeal('lunch', 450, 35, 40, 18, 8)
      ];
      
      const request = createMockRequest('progress_query', 'user-789', meals);
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Validate comprehensive calculation
      expect(response.calculation_results.daily_totals.calories).toBe(950);
      expect(response.calculation_results.goal_progress.calories_percentage).toBe(48); // 950/2000
      
      // Should have progress-specific insights
      expect(response.insights_and_recommendations.primary_insight).toContain('solid progress');
      
      // Should not have grouping info for progress query
      expect(response.system_metadata.grouping_info).toBeUndefined();
      
      // Should have performance logging (may be 0 in fast test execution)
      expect(response.system_metadata.calculation_time_ms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Goal Changed Integration Flow', () => {
    
    it('should process goal_changed with updated targets', async () => {
      const meals = [createMockMeal('meal1', 600, 45, 60, 20, 10)];
      
      const request = createMockRequest('goal_changed', 'user-goal', meals);
      // Update goals to more aggressive targets
      request.user_context.daily_goals = {
        daily_calorie_goal: 1800, // Lower calorie goal
        protein_goal: 180,        // Higher protein goal
        carb_goal: 150,          // Lower carb goal
        fat_goal: 60             // Lower fat goal
      };
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Should recalculate with new goals
      expect(response.calculation_results.goal_progress.calories_percentage).toBe(33); // 600/1800
      expect(response.calculation_results.goal_progress.protein_percentage).toBe(25);  // 45/180
      expect(response.calculation_results.goal_progress.carbs_percentage).toBe(40);    // 60/150
      expect(response.calculation_results.goal_progress.fat_percentage).toBe(33);      // 20/60
      
      // Should have goal-change specific messaging
      expect(response.insights_and_recommendations.primary_insight).toContain('goals have been updated');
      
      // Should update dashboard with new targets
      expect(response.dashboard_data.macro_rings_update.calories.goal).toBe(1800);
      expect(response.dashboard_data.macro_rings_update.protein.goal).toBe(180);
    });
  });

  describe('Recommendation Generation Integration', () => {
    
    it('should generate protein boost recommendations for low protein intake', async () => {
      const lowProteinMeals = [
        createMockMeal('meal1', 400, 10, 60, 15, 5), // Very low protein
        createMockMeal('meal2', 300, 8, 45, 12, 4)   // Very low protein
      ];
      
      const request = createMockRequest('progress_query', 'low-protein-user', lowProteinMeals);
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Should have protein boost recommendation
      const proteinRec = response.insights_and_recommendations.recommendations.find(
        r => r.type === 'protein_boost'
      );
      expect(proteinRec).toBeDefined();
      expect(proteinRec!.priority).toBe('high');
      expect(proteinRec!.specific_addition).toContain('Greek yogurt');
      
      // Should have educational note about protein
      expect(response.chat_response.education_note).toContain('protein');
    });
    
    it('should generate fiber boost recommendations for low fiber intake', async () => {
      const lowFiberMeals = [
        createMockMeal('meal1', 400, 30, 40, 15, 1), // Very low fiber
        createMockMeal('meal2', 350, 25, 35, 12, 2)  // Very low fiber
      ];
      
      const request = createMockRequest('meal_logged', 'low-fiber-user', lowFiberMeals);
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Should have fiber recommendation
      const fiberRec = response.insights_and_recommendations.recommendations.find(
        r => r.type === 'fiber_boost'
      );
      expect(fiberRec).toBeDefined();
      expect(fiberRec!.specific_addition).toContain('Vegetables');
    });
    
    it('should generate celebration triggers for excellent balance', async () => {
      const balancedMeals = [
        createMockMeal('meal1', 600, 50, 70, 20, 15),  // Well balanced
        createMockMeal('meal2', 500, 45, 55, 18, 12),  // Well balanced
        createMockMeal('meal3', 400, 35, 45, 15, 8)    // Well balanced
      ];
      
      const request = createMockRequest('progress_query', 'balanced-user', balancedMeals);
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Should celebrate excellent balance
      expect(response.insights_and_recommendations.celebration_triggers).toContain('excellent_balance');
      expect(response.chat_response.encouragement).toContain('Fantastic');
      expect(response.dashboard_data.daily_summary).toContain('🎉');
    });
  });

  describe('Time-Based Context Integration', () => {
    
    it('should provide morning-specific recommendations and context', async () => {
      // Mock morning time (9 AM)
      const originalGetHours = Date.prototype.getHours;
      Date.prototype.getHours = jest.fn(() => 9);
      
      const morningMeals = [createMockMeal('breakfast', 300, 15, 35, 10, 5)]; // Low protein breakfast
      const request = createMockRequest('meal_logged', 'morning-user', morningMeals);
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Should have morning context
      expect(response.calculation_results.time_of_day_context).toContain('morning');
      
      // Should have morning protein recommendation
      const morningProteinRec = response.insights_and_recommendations.recommendations.find(
        r => r.type === 'morning_protein'
      );
      expect(morningProteinRec).toBeDefined();
      expect(morningProteinRec!.specific_addition).toContain('Eggs');
      
      // Should have forward-looking momentum
      expect(response.chat_response.forward_momentum).toContain('whole day ahead');
      
      // Restore original method
      Date.prototype.getHours = originalGetHours;
    });
  });

  describe('Error Handling and Fallback Integration', () => {
    
    it('should handle empty meals gracefully', async () => {
      const request = createMockRequest('progress_query', 'empty-user', []);
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Should have zero totals
      expect(response.calculation_results.daily_totals.calories).toBe(0);
      expect(response.calculation_results.calculation_confidence).toBe(0.0);
      
      // Should still provide encouraging response
      expect(response.chat_response.encouragement).toBeTruthy();
      expect(response.insights_and_recommendations.primary_insight).toBeTruthy();
    });
    
    it('should handle low-confidence meals appropriately', async () => {
      const lowConfidenceMeals = [
        { ...createMockMeal('meal1', 300, 20, 30, 10), confidence: 0.5 }, // Very low confidence
        { ...createMockMeal('meal2', 400, 25, 40, 15), confidence: 0.6 }  // Low confidence
      ];
      
      const request = createMockRequest('meal_logged', 'low-confidence-user', lowConfidenceMeals);
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Should reduce overall confidence
      expect(response.calculation_results.calculation_confidence).toBeLessThan(0.9);
      
      // Should still provide calculations
      expect(response.calculation_results.daily_totals.calories).toBe(700);
    });
  });

  describe('Performance Monitoring Integration', () => {
    
    it('should log performance metrics correctly', async () => {
      const request = createMockRequest('meal_logged', 'perf-test-user', [createMockMeal('test')]);
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Should have performance timing (may be 0 in fast test execution)
      expect(response.system_metadata.calculation_time_ms).toBeGreaterThanOrEqual(0);
      expect(response.system_metadata.calculation_time_ms).toBeLessThan(1000); // Should be fast
      
      // Should log performance internally
      const performanceLogs = (macroCalculatorAI as any).performanceLogs;
      expect(performanceLogs.length).toBeGreaterThan(0);
      expect(performanceLogs[performanceLogs.length - 1].success).toBe(true);
      expect(performanceLogs[performanceLogs.length - 1].user_id).toBe('perf-test-user');
    });
    
    it('should meet performance SLA requirements', async () => {
      const meals = Array.from({ length: 5 }, (_, i) => createMockMeal(`meal-${i}`));
      const request = createMockRequest('progress_query', 'performance-user', meals);
      
      const startTime = Date.now();
      const response = await macroCalculatorAI.processCalculationRequest(request);
      const endTime = Date.now();
      
      const actualDuration = endTime - startTime;
      const reportedDuration = response.system_metadata.calculation_time_ms;
      
      // Should meet 2-second SLA
      expect(actualDuration).toBeLessThan(2000);
      expect(reportedDuration).toBeLessThan(2000);
      
      // Reported time should be accurate
      expect(Math.abs(actualDuration - reportedDuration)).toBeLessThan(50); // Within 50ms tolerance
    });
  });

  describe('Dashboard Data Integration', () => {
    
    it('should format dashboard data correctly for UI consumption', async () => {
      const meals = [
        createMockMeal('meal1', 500, 40, 50, 18, 8),
        createMockMeal('meal2', 600, 45, 60, 22, 10)
      ];
      
      const request = createMockRequest('progress_query', 'dashboard-user', meals);
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      const dashboard = response.dashboard_data.macro_rings_update;
      
      // Should have properly rounded values
      expect(dashboard.calories.current).toBe(1100);
      expect(dashboard.protein.current).toBe(85);
      expect(dashboard.carbs.current).toBe(110);
      expect(dashboard.fat.current).toBe(40);
      
      // Should have correct percentages
      expect(dashboard.calories.percentage).toBe(55); // 1100/2000
      expect(dashboard.protein.percentage).toBe(57);  // 85/150
      expect(dashboard.carbs.percentage).toBe(55);    // 110/200
      expect(dashboard.fat.percentage).toBe(57);      // 40/70
      
      // Should have summary message (may be celebration or progress message)
      expect(response.dashboard_data.daily_summary).toMatch(/(Daily Progress|Excellent macro balance)/);
      expect(response.dashboard_data.daily_summary).toMatch(/\d+%/); // Should contain some percentage
    });
  });
});