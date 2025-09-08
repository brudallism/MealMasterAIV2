// Macro Calculator AI - Time Window Meal Grouping Tests
// 5-Minute Window Grouping Logic Validation

import { macroCalculatorAI, MealData, GroupingResult } from '../macro-calculator-ai';

describe('Macro Calculator AI - Time Window Meal Grouping Tests', () => {
  
  const createMockMeal = (
    id: string,
    timestamp: Date,
    calories: number = 200,
    protein: number = 15,
    carbs: number = 20,
    fat: number = 8,
    fiber: number = 3
  ): MealData => ({
    id,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    logged_at: timestamp,
    confidence: 0.9
  });

  const testUserId = 'test-user-123';

  beforeEach(() => {
    // Clear any existing windows before each test
    (macroCalculatorAI as any).conversationWindows.clear();
  });

  describe('New Window Creation', () => {
    
    it('should create new window for first meal of the day', () => {
      const mealTime = new Date('2024-12-10T12:00:00Z');
      const meal = createMockMeal('meal-1', mealTime, 350, 25, 30, 12);
      
      const result = macroCalculatorAI.groupMealIntoWindow(meal, testUserId);
      
      expect(result.groupingType).toBe('new_window');
      expect(result.mealWindow.meals).toHaveLength(1);
      expect(result.mealWindow.meals[0].id).toBe('meal-1');
      expect(result.shouldTriggerCalculation).toBe(true);
      expect(result.message).toContain('Started new meal session');
      expect(result.combinedAnalysis.componentCount).toBe(1);
    });
  });

  describe('5-Minute Window Logic', () => {
    
    it('should add meal to existing window within 5 minutes', () => {
      const baseTime = new Date('2024-12-10T12:00:00Z');
      const meal1 = createMockMeal('meal-1', baseTime, 300, 20, 25, 10);
      const meal2 = createMockMeal('meal-2', new Date(baseTime.getTime() + 3 * 60 * 1000), 150, 8, 15, 5); // 3 minutes later
      
      // First meal creates window
      const result1 = macroCalculatorAI.groupMealIntoWindow(meal1, testUserId);
      expect(result1.groupingType).toBe('new_window');
      
      // Second meal should be added to same window
      const result2 = macroCalculatorAI.groupMealIntoWindow(meal2, testUserId);
      expect(result2.groupingType).toBe('added_to_window');
      expect(result2.mealWindow.meals).toHaveLength(2);
      expect(result2.message).toContain('Added to meal session (2 items total)');
      expect(result2.shouldTriggerCalculation).toBe(false); // Less than 3 items
    });
    
    it('should create new window for meal outside 5-minute window', () => {
      const baseTime = new Date('2024-12-10T12:00:00Z');
      const meal1 = createMockMeal('meal-1', baseTime, 300, 20, 25, 10);
      const meal2 = createMockMeal('meal-2', new Date(baseTime.getTime() + 7 * 60 * 1000), 150, 8, 15, 5); // 7 minutes later
      
      // First meal creates window
      const result1 = macroCalculatorAI.groupMealIntoWindow(meal1, testUserId);
      expect(result1.groupingType).toBe('new_window');
      
      // Second meal should create new window (outside 5-minute rule)
      const result2 = macroCalculatorAI.groupMealIntoWindow(meal2, testUserId);
      expect(result2.groupingType).toBe('new_window');
      expect(result2.mealWindow.meals).toHaveLength(1);
      expect(result2.message).toContain('Completed previous session');
    });
    
    it('should trigger calculation after 3 items in window', () => {
      const baseTime = new Date('2024-12-10T12:00:00Z');
      const meal1 = createMockMeal('meal-1', baseTime, 200, 15, 20, 8);
      const meal2 = createMockMeal('meal-2', new Date(baseTime.getTime() + 2 * 60 * 1000), 150, 10, 15, 5);
      const meal3 = createMockMeal('meal-3', new Date(baseTime.getTime() + 4 * 60 * 1000), 100, 8, 12, 3);
      
      macroCalculatorAI.groupMealIntoWindow(meal1, testUserId);
      macroCalculatorAI.groupMealIntoWindow(meal2, testUserId);
      
      const result3 = macroCalculatorAI.groupMealIntoWindow(meal3, testUserId);
      expect(result3.groupingType).toBe('added_to_window');
      expect(result3.shouldTriggerCalculation).toBe(true); // 3 items reached
      expect(result3.mealWindow.meals).toHaveLength(3);
    });
  });

  describe('Combined Meal Analysis', () => {
    
    it('should correctly calculate total nutrition for combined meals', () => {
      const baseTime = new Date('2024-12-10T12:30:00Z'); // Lunch time
      const meal1 = createMockMeal('meal-1', baseTime, 300, 25, 30, 12, 5);
      const meal2 = createMockMeal('meal-2', new Date(baseTime.getTime() + 2 * 60 * 1000), 200, 15, 20, 8, 3);
      
      macroCalculatorAI.groupMealIntoWindow(meal1, testUserId);
      const result = macroCalculatorAI.groupMealIntoWindow(meal2, testUserId);
      
      const analysis = result.combinedAnalysis;
      expect(analysis.totalNutrition.calories).toBe(500);
      expect(analysis.totalNutrition.protein).toBe(40);
      expect(analysis.totalNutrition.carbs).toBe(50);
      expect(analysis.totalNutrition.fat).toBe(20);
      expect(analysis.totalNutrition.fiber).toBe(8);
      expect(analysis.componentCount).toBe(2);
    });
    
    it('should calculate correct macro distribution percentages', () => {
      const baseTime = new Date('2024-12-10T12:30:00Z');
      // Meal with known macro distribution
      const meal1 = createMockMeal('meal-1', baseTime, 400, 50, 10, 10, 2); // High protein meal
      
      const result = macroCalculatorAI.groupMealIntoWindow(meal1, testUserId);
      const analysis = result.combinedAnalysis;
      
      // Protein: 50g * 4 = 200 cal, Carbs: 10g * 4 = 40 cal, Fat: 10g * 9 = 90 cal
      // Total: 330 cal from macros
      // Protein: 200/330 = 60.6% ≈ 61%
      expect(analysis.macroDistribution.proteinPercent).toBeCloseTo(61, 1);
      expect(analysis.macroDistribution.carbPercent).toBeCloseTo(12, 1);
      expect(analysis.macroDistribution.fatPercent).toBeCloseTo(27, 1);
    });
    
    it('should correctly identify meal types based on time and nutrition', () => {
      // Use local time to avoid timezone issues
      const breakfastTime = new Date(2024, 11, 10, 8, 0, 0); // 8 AM local time
      const lunchTime = new Date(2024, 11, 10, 13, 0, 0);    // 1 PM local time
      const dinnerTime = new Date(2024, 11, 10, 19, 0, 0);   // 7 PM local time
      const snackTime = new Date(2024, 11, 10, 23, 0, 0);    // 11 PM local time
      
      // High protein breakfast
      const breakfast = createMockMeal('breakfast', breakfastTime, 400, 35, 20, 15);
      const breakfastResult = macroCalculatorAI.groupMealIntoWindow(breakfast, testUserId + '_1');
      expect(breakfastResult.combinedAnalysis.mealType).toContain('protein breakfast');
      
      // High carb lunch
      const lunch = createMockMeal('lunch', lunchTime, 500, 20, 70, 12);
      const lunchResult = macroCalculatorAI.groupMealIntoWindow(lunch, testUserId + '_2');
      expect(lunchResult.combinedAnalysis.mealType).toContain('lunch (carb-focused)');
      
      // Regular dinner
      const dinner = createMockMeal('dinner', dinnerTime, 600, 30, 40, 25);
      const dinnerResult = macroCalculatorAI.groupMealIntoWindow(dinner, testUserId + '_3');
      expect(dinnerResult.combinedAnalysis.mealType).toContain('dinner');
      
      // Light snack
      const snack = createMockMeal('snack', snackTime, 120, 5, 15, 4);
      const snackResult = macroCalculatorAI.groupMealIntoWindow(snack, testUserId + '_4');
      expect(snackResult.combinedAnalysis.mealType).toBe('snack');
    });
    
    it('should generate appropriate nutritional flags', () => {
      const mealTime = new Date('2024-12-10T12:00:00Z');
      
      // High protein, low carb meal
      const highProteinMeal = createMockMeal('high-protein', mealTime, 400, 50, 10, 15, 12);
      const result = macroCalculatorAI.groupMealIntoWindow(highProteinMeal, testUserId);
      
      expect(result.combinedAnalysis.nutritionalFlags).toContain('high-protein');
      expect(result.combinedAnalysis.nutritionalFlags).toContain('low-carb');
      expect(result.combinedAnalysis.nutritionalFlags).toContain('high-fiber');
      expect(result.combinedAnalysis.nutritionalFlags).toContain('protein-dominant');
    });
    
    it('should handle multi-component meals', () => {
      const baseTime = new Date('2024-12-10T18:00:00Z'); // Dinner time
      const meal1 = createMockMeal('main', baseTime, 300, 25, 30, 12);
      const meal2 = createMockMeal('side1', new Date(baseTime.getTime() + 1 * 60 * 1000), 150, 8, 20, 5);
      const meal3 = createMockMeal('side2', new Date(baseTime.getTime() + 2 * 60 * 1000), 100, 5, 15, 3);
      
      macroCalculatorAI.groupMealIntoWindow(meal1, testUserId);
      macroCalculatorAI.groupMealIntoWindow(meal2, testUserId);
      const result = macroCalculatorAI.groupMealIntoWindow(meal3, testUserId);
      
      expect(result.combinedAnalysis.mealType).toContain('multi-component');
      expect(result.combinedAnalysis.componentCount).toBe(3);
    });
  });

  describe('Window Management', () => {
    
    it('should maintain separate windows for different users', () => {
      const mealTime = new Date('2024-12-10T12:00:00Z');
      const user1Meal = createMockMeal('user1-meal', mealTime, 300, 20, 25, 10);
      const user2Meal = createMockMeal('user2-meal', mealTime, 250, 18, 22, 8);
      
      const result1 = macroCalculatorAI.groupMealIntoWindow(user1Meal, 'user-1');
      const result2 = macroCalculatorAI.groupMealIntoWindow(user2Meal, 'user-2');
      
      expect(result1.mealWindow.meals).toHaveLength(1);
      expect(result2.mealWindow.meals).toHaveLength(1);
      expect(result1.mealWindow.meals[0].id).toBe('user1-meal');
      expect(result2.mealWindow.meals[0].id).toBe('user2-meal');
    });
    
    it('should handle window completion correctly', () => {
      const baseTime = new Date('2024-12-10T12:00:00Z');
      const meal1 = createMockMeal('meal-1', baseTime, 300, 20, 25, 10);
      const meal2 = createMockMeal('meal-2', new Date(baseTime.getTime() + 10 * 60 * 1000), 200, 15, 20, 8); // 10 minutes later
      
      // First meal creates window
      const result1 = macroCalculatorAI.groupMealIntoWindow(meal1, testUserId);
      expect(result1.mealWindow.isComplete).toBe(false);
      
      // Second meal should complete first window and create new one
      const result2 = macroCalculatorAI.groupMealIntoWindow(meal2, testUserId);
      expect(result2.groupingType).toBe('new_window');
      expect(result2.message).toContain('Completed previous session');
    });
    
    it('should retrieve current window for user', () => {
      const mealTime = new Date(); // Use current date/time
      const meal = createMockMeal('meal-1', mealTime, 300, 20, 25, 10);
      
      // Initially no current window
      let currentWindow = macroCalculatorAI.getCurrentWindow(testUserId);
      expect(currentWindow).toBeNull();
      
      // Create window
      macroCalculatorAI.groupMealIntoWindow(meal, testUserId);
      
      // Should now have current window
      currentWindow = macroCalculatorAI.getCurrentWindow(testUserId);
      expect(currentWindow).not.toBeNull();
      expect(currentWindow!.meals).toHaveLength(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    
    it('should handle meals with zero calories gracefully', () => {
      const mealTime = new Date('2024-12-10T12:00:00Z');
      const zeroCalorieMeal = createMockMeal('zero-cal', mealTime, 0, 0, 0, 0, 0);
      
      const result = macroCalculatorAI.groupMealIntoWindow(zeroCalorieMeal, testUserId);
      
      expect(result.groupingType).toBe('new_window');
      expect(result.combinedAnalysis.totalNutrition.calories).toBe(0);
      expect(result.combinedAnalysis.macroDistribution.proteinPercent).toBe(0);
      expect(result.combinedAnalysis.nutritionalFlags).toContain('light-meal');
    });
    
    it('should handle exact 5-minute boundary correctly', () => {
      const baseTime = new Date('2024-12-10T12:00:00Z');
      const meal1 = createMockMeal('meal-1', baseTime, 300, 20, 25, 10);
      const meal2 = createMockMeal('meal-2', new Date(baseTime.getTime() + 5 * 60 * 1000), 200, 15, 20, 8); // Exactly 5 minutes
      
      macroCalculatorAI.groupMealIntoWindow(meal1, testUserId);
      const result2 = macroCalculatorAI.groupMealIntoWindow(meal2, testUserId);
      
      // Should be added to window (5 minutes is within the boundary)
      expect(result2.groupingType).toBe('added_to_window');
      expect(result2.mealWindow.meals).toHaveLength(2);
    });
    
    it('should handle invalid timestamps gracefully', () => {
      const invalidDate = new Date('invalid-date');
      const meal = createMockMeal('invalid-meal', invalidDate, 300, 20, 25, 10);
      
      // Should not throw error
      expect(() => {
        macroCalculatorAI.groupMealIntoWindow(meal, testUserId);
      }).not.toThrow();
    });
  });
});