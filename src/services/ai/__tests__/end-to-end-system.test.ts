// End-to-End System Integration Tests
// Complete food logging and goal setting flow validation from chat to dashboard

// Mock OpenAI and OpenAI client before importing user-facing-ai
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked response' } }]
        })
      }
    }
  }))
}));

jest.mock('../openai-client', () => ({
  openAIClient: {
    createCompletion: jest.fn().mockResolvedValue('Mocked AI response')
  }
}));

import { userFacingAI } from '../user-facing-ai';
import { macroCalculatorAI } from '../macro-calculator-ai';
import { useMealStore } from '../../../stores/meal-store';
import { useUserStore } from '../../../stores/user-store';
import { useAIStore } from '../../../stores/ai-store';

// Mock stores for isolated testing
jest.mock('../../../stores/meal-store');
jest.mock('../../../stores/user-store');
jest.mock('../../../stores/ai-store');

describe('End-to-End System Integration Tests', () => {
  
  let mockMealStore: any;
  let mockUserStore: any;
  let mockAIStore: any;
  
  beforeEach(() => {
    // Reset all stores to clean state
    mockMealStore = {
      todaysMeals: [],
      dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
      addMeal: jest.fn(),
      updateMeal: jest.fn(),
      setLoading: jest.fn(),
      calculateTotals: jest.fn()
    };
    
    mockUserStore = {
      profile: {
        id: 'test-user-123',
        age: 25,
        weight: 70,
        height: 175,
        activity_level: 'moderate',
        gender: 'male'
      },
      goals: {
        daily_calorie_goal: 2000,
        protein_goal: 150,
        carb_goal: 200,
        fat_goal: 70
      },
      updateGoals: jest.fn(),
      setProfile: jest.fn()
    };
    
    mockAIStore = {
      isProcessing: false,
      currentSystem: null,
      lastResponse: null,
      setProcessing: jest.fn(),
      setCurrentSystem: jest.fn(),
      setLastResponse: jest.fn(),
      addInteraction: jest.fn()
    };
    
    // Mock store implementations
    (useMealStore as unknown as jest.Mock).mockImplementation((selector) => {
      if (selector) return selector(mockMealStore);
      return mockMealStore;
    });
    (useMealStore as any).getState = () => mockMealStore;
    (useMealStore as any).setState = (updater: any) => {
      if (typeof updater === 'function') {
        Object.assign(mockMealStore, updater(mockMealStore));
      } else {
        Object.assign(mockMealStore, updater);
      }
    };
    
    (useUserStore as unknown as jest.Mock).mockImplementation((selector) => {
      if (selector) return selector(mockUserStore);
      return mockUserStore;
    });
    (useUserStore as any).getState = () => mockUserStore;
    
    (useAIStore as unknown as jest.Mock).mockImplementation((selector) => {
      if (selector) return selector(mockAIStore);
      return mockAIStore;
    });
    (useAIStore as any).getState = () => mockAIStore;
    
    // Clear AI system state
    (userFacingAI as any).conversationHistory = [];
    (macroCalculatorAI as any).conversationWindows.clear();
  });

  describe('Complete Food Logging Flow', () => {
    
    it('should handle complete flow from chat input to dashboard display', async () => {
      // 1. User inputs food in natural language
      const userMessage = "I just ate a chicken breast with rice and broccoli for lunch";
      const userId = 'test-user-123';
      
      // 2. Process through User Facing AI
      const userFacingResponse = await userFacingAI.processMessage(userMessage, userId);
      
      // 3. Validate User Facing AI response structure
      expect(userFacingResponse).toBeDefined();
      expect(userFacingResponse.response).toBeTruthy();
      expect(userFacingResponse.success).toBe(true);
      expect(userFacingResponse.metadata?.intent?.intent).toBe('food_logging');
      expect(userFacingResponse.metadata?.intent?.confidence).toBeGreaterThan(0);
      
      // 4. Simulate nutrition data extraction (normally from food recognition)
      const mockNutritionData = {
        total_nutrition: {
          calories: 450,
          protein: 35,
          carbs: 40,
          fat: 12,
          fiber: 6
        },
        confidence_overall: 0.88,
        meal_timestamp: new Date().toISOString(),
        meal_name: 'Chicken breast with rice and broccoli'
      };
      
      // 5. Process through Macro Calculator AI
      const macroRequest = {
        trigger_type: 'meal_logged' as const,
        user_id: userId,
        nutrition_data: mockNutritionData,
        user_context: {
          daily_goals: mockUserStore.goals,
          todays_meals: mockMealStore.todaysMeals
        }
      };
      
      const macroResponse = await macroCalculatorAI.processCalculationRequest(macroRequest);
      
      // 6. Validate macro calculation results
      expect(macroResponse.calculation_results.daily_totals.calories).toBe(450);
      expect(macroResponse.calculation_results.daily_totals.protein).toBe(35);
      expect(macroResponse.calculation_results.goal_progress.calories_percentage).toBe(23); // 450/2000
      expect(macroResponse.calculation_results.goal_progress.protein_percentage).toBe(23); // 35/150
      
      // 7. Validate dashboard data structure
      expect(macroResponse.dashboard_data.macro_rings_update.calories.current).toBe(450);
      expect(macroResponse.dashboard_data.macro_rings_update.calories.goal).toBe(2000);
      expect(macroResponse.dashboard_data.macro_rings_update.calories.percentage).toBe(23);
      
      // 8. Validate meal store integration (meal should be added)
      expect(mockMealStore.addMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          food_name: 'Chicken breast with rice and broccoli',
          calories: 450,
          protein: 35,
          carbs: 40,
          fat: 12,
          ai_confidence: 0.88,
          recognition_source: 'food_recognition_ai',
          validation_status: 'validated'
        })
      );
      
      // 9. Validate chat response provides value to user
      expect(macroResponse.chat_response.encouragement).toBeTruthy();
      expect(macroResponse.chat_response.education_note).toBeTruthy();
      expect(macroResponse.chat_response.forward_momentum).toBeTruthy();
      
      // 10. Validate system performance
      expect(macroResponse.system_metadata.calculation_time_ms).toBeLessThan(2000);
      expect(macroResponse.system_metadata.audit_trail_logged).toBe(true);
    });
    
    it('should handle multiple meals building up daily totals', async () => {
      // Start with existing meals in the store
      mockMealStore.todaysMeals = [
        {
          id: 'breakfast-1',
          food_name: 'Oatmeal with berries',
          calories: 300,
          protein: 12,
          carbs: 45,
          fat: 8,
          logged_at: new Date().toISOString(),
          meal_type: 'breakfast'
        }
      ];
      
      // Process new lunch meal
      const lunchNutritionData = {
        total_nutrition: { calories: 520, protein: 42, carbs: 35, fat: 18, fiber: 8 },
        confidence_overall: 0.91,
        meal_timestamp: new Date().toISOString(),
        meal_name: 'Grilled salmon with quinoa'
      };
      
      const macroRequest = {
        trigger_type: 'meal_logged' as const,
        user_id: 'test-user-123',
        nutrition_data: lunchNutritionData,
        user_context: {
          daily_goals: mockUserStore.goals,
          todays_meals: mockMealStore.todaysMeals
        }
      };
      
      const response = await macroCalculatorAI.processCalculationRequest(macroRequest);
      
      // Should calculate cumulative totals (300 + 520 = 820 calories)
      expect(response.calculation_results.daily_totals.calories).toBe(820);
      expect(response.calculation_results.daily_totals.protein).toBe(54); // 12 + 42
      expect(response.calculation_results.goal_progress.calories_percentage).toBe(41); // 820/2000
      
      // Should provide progress-aware messaging
      expect(response.insights_and_recommendations.primary_insight).toMatch(/progress|building|solid/i);
    });
  });

  describe('Complete Goal Setting Flow', () => {
    
    it('should handle complete goal setting from chat to updated targets', async () => {
      // 1. User requests goal setting in natural language
      const goalMessage = "I'm a 28 year old female, 65kg, 168cm tall, moderately active, and want to lose weight";
      const userId = 'goal-test-user';
      
      // 2. Process through User Facing AI goal setting flow
      const userResponse = await userFacingAI.processMessage(goalMessage, userId);
      
      // 3. Validate goal setting intent detection
      expect(userResponse.metadata?.intent?.intent).toBe('goal_setting');
      expect(userResponse.response).toBeTruthy();
      
      // 4. Simulate goal calculation trigger
      const goalRequest = {
        trigger_type: 'goal_changed' as const,
        user_id: userId,
        user_context: {
          daily_goals: {
            daily_calorie_goal: 1650, // Lower for weight loss
            protein_goal: 130,
            carb_goal: 165,
            fat_goal: 55
          },
          todays_meals: [],
          user_profile: {
            age: 28,
            gender: 'female',
            weight: 65,
            height: 168,
            activity_level: 'moderate',
            goal_type: 'weight_loss'
          }
        }
      };
      
      const macroResponse = await macroCalculatorAI.processCalculationRequest(goalRequest);
      
      // 5. Validate goal-specific messaging and safety checks
      expect(macroResponse.insights_and_recommendations.primary_insight).toContain('goals have been updated');
      // Crisis indicators are part of the goal setting logic, not the calculation results
      expect(macroResponse.insights_and_recommendations.concern_flags).toBeDefined();
      expect(macroResponse.insights_and_recommendations.concern_flags.includes('extreme_restriction')).toBe(false); // 1650 is safe
      
      // 6. Validate dashboard updates with new targets
      expect(macroResponse.dashboard_data.macro_rings_update.calories.goal).toBe(1650);
      expect(macroResponse.dashboard_data.macro_rings_update.protein.goal).toBe(130);
      
      // 7. Validate educational content for goal setting
      expect(macroResponse.chat_response.education_note).toBeTruthy();
      expect(macroResponse.chat_response.forward_momentum).toContain('goal');
    });
    
    it('should handle crisis detection in goal setting', async () => {
      // Test extremely low calorie goal that should trigger crisis detection
      const crisisGoalRequest = {
        trigger_type: 'goal_changed' as const,
        user_id: 'crisis-test-user',
        user_context: {
          daily_goals: {
            daily_calorie_goal: 800, // Dangerously low
            protein_goal: 60,
            carb_goal: 80,
            fat_goal: 30
          },
          todays_meals: [],
          user_profile: {
            age: 25,
            gender: 'female',
            weight: 60,
            height: 165,
            activity_level: 'moderate'
          }
        }
      };
      
      const response = await macroCalculatorAI.processCalculationRequest(crisisGoalRequest);
      
      // Should detect crisis and provide intervention
      expect(response.insights_and_recommendations.concern_flags.includes('extreme_restriction')).toBe(true);
      expect(response.insights_and_recommendations.concern_flags.includes('requires_intervention')).toBe(true);
      expect(response.insights_and_recommendations.primary_insight).toMatch(/concerning|safe|professional/i);
    });
  });

  describe('Progress Query Flow', () => {
    
    it('should handle progress queries with comprehensive insights', async () => {
      // Setup user with several meals logged
      mockMealStore.todaysMeals = [
        { id: '1', food_name: 'Breakfast', calories: 350, protein: 20, carbs: 40, fat: 12, fiber: 6, logged_at: '2023-01-01T08:00:00Z' },
        { id: '2', food_name: 'Snack', calories: 150, protein: 8, carbs: 18, fat: 6, fiber: 3, logged_at: '2023-01-01T10:30:00Z' },
        { id: '3', food_name: 'Lunch', calories: 480, protein: 35, carbs: 45, fat: 18, fiber: 10, logged_at: '2023-01-01T13:00:00Z' }
      ];
      
      // User asks about progress
      const progressMessage = "How am I doing with my nutrition today?";
      const userResponse = await userFacingAI.processMessage(progressMessage, 'progress-user');
      
      // Should detect progress query intent
      expect(userResponse.metadata?.intent?.intent).toBe('progress_query');
      
      // Process through macro calculator
      const progressRequest = {
        trigger_type: 'progress_query' as const,
        user_id: 'progress-user',
        user_context: {
          daily_goals: mockUserStore.goals,
          todays_meals: mockMealStore.todaysMeals,
          goal_progress_query: progressMessage
        }
      };
      
      const macroResponse = await macroCalculatorAI.processCalculationRequest(progressRequest);
      
      // Should provide comprehensive progress analysis
      expect(macroResponse.calculation_results.daily_totals.calories).toBe(980); // 350 + 150 + 480
      expect(macroResponse.calculation_results.goal_progress.calories_percentage).toBe(49); // 980/2000
      
      // Should have progress-specific insights
      expect(macroResponse.insights_and_recommendations.primary_insight).toBeTruthy();
      expect(macroResponse.chat_response.encouragement).toBeTruthy();
      
      // Should provide next-step guidance
      expect(macroResponse.chat_response.forward_momentum).toBeTruthy();
    });
  });

  describe('Error Handling and Recovery', () => {
    
    it('should gracefully handle system errors without breaking user experience', async () => {
      // Force an error in macro calculation
      const invalidRequest = {
        trigger_type: 'meal_logged' as const,
        user_id: 'error-test-user',
        nutrition_data: undefined, // Invalid data
        user_context: {
          daily_goals: mockUserStore.goals,
          todays_meals: []
        }
      };
      
      // Should not throw error but provide fallback response
      const response = await macroCalculatorAI.processCalculationRequest(invalidRequest);
      
      // Should have fallback values
      expect(response.calculation_results.daily_totals.calories).toBe(0);
      expect(response.calculation_results.calculation_confidence).toBe(0);
      expect(response.chat_response.encouragement).toBeTruthy(); // Should still encourage user
    });
    
    it('should maintain system state consistency during concurrent operations', async () => {
      // Simulate multiple meals being logged simultaneously
      const concurrentRequests = [
        {
          trigger_type: 'meal_logged' as const,
          user_id: 'concurrent-user',
          nutrition_data: {
            total_nutrition: { calories: 300, protein: 20, carbs: 30, fat: 10, fiber: 5 },
            confidence_overall: 0.9,
            meal_timestamp: new Date().toISOString()
          },
          user_context: { daily_goals: mockUserStore.goals, todays_meals: [] }
        },
        {
          trigger_type: 'meal_logged' as const,
          user_id: 'concurrent-user',
          nutrition_data: {
            total_nutrition: { calories: 400, protein: 25, carbs: 40, fat: 15, fiber: 8 },
            confidence_overall: 0.85,
            meal_timestamp: new Date().toISOString()
          },
          user_context: { daily_goals: mockUserStore.goals, todays_meals: [] }
        }
      ];
      
      // Process concurrently
      const responses = await Promise.all(
        concurrentRequests.map(req => macroCalculatorAI.processCalculationRequest(req))
      );
      
      // Both should succeed
      expect(responses).toHaveLength(2);
      responses.forEach(response => {
        expect(response.calculation_results).toBeDefined();
        expect(response.system_metadata.calculation_time_ms).toBeLessThan(2000);
      });
    });
  });

  describe('Real-time Dashboard Integration', () => {
    
    it('should update dashboard components immediately after meal logging', async () => {
      // Process meal through complete system
      const nutritionData = {
        total_nutrition: { calories: 380, protein: 28, carbs: 42, fat: 14, fiber: 7 },
        confidence_overall: 0.89,
        meal_timestamp: new Date().toISOString(),
        meal_name: 'Turkey sandwich'
      };
      
      const request = {
        trigger_type: 'meal_logged' as const,
        user_id: 'dashboard-user',
        nutrition_data: nutritionData,
        user_context: {
          daily_goals: mockUserStore.goals,
          todays_meals: []
        }
      };
      
      const response = await macroCalculatorAI.processCalculationRequest(request);
      
      // Verify meal store was updated (which triggers dashboard re-render)
      expect(mockMealStore.addMeal).toHaveBeenCalledWith(
        expect.objectContaining({
          food_name: 'Turkey sandwich',
          calories: 380,
          protein: 28
        })
      );
      
      // Verify dashboard data format is correct for UI consumption
      const dashboardData = response.dashboard_data.macro_rings_update;
      expect(dashboardData.calories.current).toBe(380);
      expect(dashboardData.calories.percentage).toBe(19); // 380/2000
      expect(dashboardData.protein.current).toBe(28);
      expect(dashboardData.protein.percentage).toBe(19); // 28/150
      
      // Verify user gets immediate feedback
      expect(response.dashboard_data.daily_summary).toBeTruthy();
    });
  });
});