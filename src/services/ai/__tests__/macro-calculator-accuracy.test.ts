// Macro Calculator AI - Mathematical Accuracy Tests
// >95% Accuracy Requirement Validation

import { macroCalculatorAI, UserGoals, MealData } from '../macro-calculator-ai';
import { DailyTotals } from '../../../stores/meal-store';

describe('Macro Calculator AI - Mathematical Accuracy Tests', () => {
  
  describe('Daily Totals Calculation - Precision Tests', () => {
    
    it('should calculate exact macro totals from multiple meals', () => {
      const meals: MealData[] = [
        { id: '1', calories: 420, protein: 45, carbs: 8, fat: 12, fiber: 2, logged_at: new Date(), confidence: 0.95 },
        { id: '2', calories: 380, protein: 25, carbs: 35, fat: 15, fiber: 5, logged_at: new Date(), confidence: 0.90 },
        { id: '3', calories: 220, protein: 15, carbs: 20, fat: 8, fiber: 3, logged_at: new Date(), confidence: 0.92 }
      ];
      
      const totals = macroCalculatorAI.calculateDailyTotals(meals);
      
      expect(totals.calories).toBe(1020);
      expect(totals.protein).toBe(85);
      expect(totals.carbs).toBe(63);
      expect(totals.fat).toBe(35);
      expect(totals.fiber).toBe(10);
    });
    
    it('should handle decimal precision correctly with rounding', () => {
      const meals: MealData[] = [
        { id: '1', calories: 123.7, protein: 12.3, carbs: 8.9, fat: 5.1, fiber: 2.4, logged_at: new Date(), confidence: 0.88 },
        { id: '2', calories: 256.3, protein: 18.7, carbs: 15.1, fat: 9.9, fiber: 3.6, logged_at: new Date(), confidence: 0.91 }
      ];
      
      const totals = macroCalculatorAI.calculateDailyTotals(meals);
      
      // Should round to 1 decimal place
      expect(totals.calories).toBe(380.0);
      expect(totals.protein).toBe(31.0);
      expect(totals.carbs).toBe(24.0);
      expect(totals.fat).toBe(15.0);
      expect(totals.fiber).toBe(6.0);
    });
    
    it('should handle edge cases: empty meals array', () => {
      const meals: MealData[] = [];
      const totals = macroCalculatorAI.calculateDailyTotals(meals);
      
      expect(totals.calories).toBe(0);
      expect(totals.protein).toBe(0);
      expect(totals.carbs).toBe(0);
      expect(totals.fat).toBe(0);
      expect(totals.fiber).toBe(0);
    });
    
    it('should handle edge cases: single meal', () => {
      const meals: MealData[] = [
        { id: '1', calories: 350.5, protein: 42.8, carbs: 0.2, fat: 8.1, fiber: 0.0, logged_at: new Date(), confidence: 0.96 }
      ];
      
      const totals = macroCalculatorAI.calculateDailyTotals(meals);
      
      expect(totals.calories).toBe(350.5);
      expect(totals.protein).toBe(42.8);
      expect(totals.carbs).toBe(0.2);
      expect(totals.fat).toBe(8.1);
      expect(totals.fiber).toBe(0.0);
    });
  });

  describe('Goal Progress Calculation - Accuracy Tests', () => {
    
    it('should calculate accurate percentages for goal progress', () => {
      const totals: DailyTotals = { 
        calories: 1440, protein: 108, carbs: 144, fat: 48, fiber: 24 
      };
      const goals: UserGoals = { 
        daily_calorie_goal: 1800, protein_goal: 120, carb_goal: 180, fat_goal: 60 
      };
      
      const progress = macroCalculatorAI.calculateGoalProgress(totals, goals);
      
      expect(progress.calories_percentage).toBe(80);
      expect(progress.protein_percentage).toBe(90);
      expect(progress.carbs_percentage).toBe(80);
      expect(progress.fat_percentage).toBe(80);
      expect(progress.overall_balance_score).toBeGreaterThan(90); // High balance score
    });
    
    it('should handle over-goal scenarios correctly', () => {
      const totals: DailyTotals = { 
        calories: 2160, protein: 150, carbs: 200, fat: 70, fiber: 30 
      };
      const goals: UserGoals = { 
        daily_calorie_goal: 1800, protein_goal: 120, carb_goal: 180, fat_goal: 60 
      };
      
      const progress = macroCalculatorAI.calculateGoalProgress(totals, goals);
      
      expect(progress.calories_percentage).toBe(120);
      expect(progress.protein_percentage).toBe(125);
      expect(progress.carbs_percentage).toBe(111);
      expect(progress.fat_percentage).toBe(117);
    });
    
    it('should cap percentages at 999% for display', () => {
      const totals: DailyTotals = { 
        calories: 20000, protein: 1200, carbs: 2000, fat: 800, fiber: 100 
      };
      const goals: UserGoals = { 
        daily_calorie_goal: 1800, protein_goal: 120, carb_goal: 180, fat_goal: 60 
      };
      
      const progress = macroCalculatorAI.calculateGoalProgress(totals, goals);
      
      // All should be capped at 999 (actual calculations: 1111%, 1000%, 1111%, 1333%)
      expect(progress.calories_percentage).toBe(999);
      expect(progress.protein_percentage).toBe(999);
      expect(progress.carbs_percentage).toBe(999);
      expect(progress.fat_percentage).toBe(999);
    });
    
    it('should calculate balanced vs imbalanced progress scores', () => {
      // Balanced progress (all around 80%)
      const balancedTotals: DailyTotals = { 
        calories: 1440, protein: 96, carbs: 144, fat: 48, fiber: 20 
      };
      const goals: UserGoals = { 
        daily_calorie_goal: 1800, protein_goal: 120, carb_goal: 180, fat_goal: 60 
      };
      
      const balancedProgress = macroCalculatorAI.calculateGoalProgress(balancedTotals, goals);
      
      // Imbalanced progress (protein very low, others normal)
      const imbalancedTotals: DailyTotals = { 
        calories: 1440, protein: 20, carbs: 144, fat: 48, fiber: 20 
      };
      
      const imbalancedProgress = macroCalculatorAI.calculateGoalProgress(imbalancedTotals, goals);
      
      // Balanced should have higher score
      expect(balancedProgress.overall_balance_score).toBeGreaterThan(imbalancedProgress.overall_balance_score);
      expect(balancedProgress.overall_balance_score).toBeGreaterThan(85);
      expect(imbalancedProgress.overall_balance_score).toBeLessThan(75);
    });
  });

  describe('Mathematical Accuracy Stress Test - 1000 Random Cases', () => {
    
    const generateRandomMeals = (count: number): MealData[] => {
      return Array.from({ length: count }, (_, i) => ({
        id: `meal_${i}`,
        calories: Math.round((Math.random() * 800 + 100) * 100) / 100, // 100-900 calories
        protein: Math.round((Math.random() * 50 + 5) * 100) / 100,     // 5-55g protein
        carbs: Math.round((Math.random() * 80 + 10) * 100) / 100,      // 10-90g carbs
        fat: Math.round((Math.random() * 40 + 2) * 100) / 100,         // 2-42g fat
        fiber: Math.round((Math.random() * 15 + 0.5) * 100) / 100,     // 0.5-15g fiber
        logged_at: new Date(),
        confidence: Math.random() * 0.3 + 0.7 // 0.7-1.0 confidence
      }));
    };
    
    it('should maintain >95% calculation accuracy across 1000 random meal combinations', () => {
      let accurateCalculations = 0;
      const testCases = 1000;
      
      for (let i = 0; i < testCases; i++) {
        const mealCount = Math.floor(Math.random() * 8) + 1; // 1-8 meals
        const meals = generateRandomMeals(mealCount);
        
        // Calculate using our method
        const calculated = macroCalculatorAI.calculateDailyTotals(meals);
        
        // Calculate expected manually for validation
        const expected = meals.reduce(
          (totals, meal) => ({
            calories: Number((totals.calories + meal.calories).toFixed(1)),
            protein: Number((totals.protein + meal.protein).toFixed(1)),
            carbs: Number((totals.carbs + meal.carbs).toFixed(1)),
            fat: Number((totals.fat + meal.fat).toFixed(1)),
            fiber: Number((totals.fiber + meal.fiber).toFixed(1))
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
        );
        
        // Check accuracy (should be exact match due to same rounding)
        const isAccurate = (
          calculated.calories === expected.calories &&
          calculated.protein === expected.protein &&
          calculated.carbs === expected.carbs &&
          calculated.fat === expected.fat &&
          calculated.fiber === expected.fiber
        );
        
        if (isAccurate) accurateCalculations++;
      }
      
      const accuracy = accurateCalculations / testCases;
      
      // Should achieve >95% accuracy
      expect(accuracy).toBeGreaterThan(0.95);
      
      // Log results for monitoring
      console.log(`Mathematical Accuracy Test: ${(accuracy * 100).toFixed(2)}% (${accurateCalculations}/${testCases} cases)`);
    });
    
    it('should handle goal progress calculation accuracy across diverse scenarios', () => {
      let accurateProgressCalculations = 0;
      const testCases = 500;
      
      for (let i = 0; i < testCases; i++) {
        // Generate random totals and goals
        const totals: DailyTotals = {
          calories: Math.round(Math.random() * 3000 + 500), // 500-3500 calories
          protein: Math.round(Math.random() * 200 + 20),    // 20-220g protein
          carbs: Math.round(Math.random() * 300 + 50),      // 50-350g carbs  
          fat: Math.round(Math.random() * 150 + 20),        // 20-170g fat
          fiber: Math.round(Math.random() * 40 + 5)         // 5-45g fiber
        };
        
        const goals: UserGoals = {
          daily_calorie_goal: Math.round(Math.random() * 1500 + 1200), // 1200-2700 calories
          protein_goal: Math.round(Math.random() * 100 + 80),           // 80-180g protein
          carb_goal: Math.round(Math.random() * 200 + 100),             // 100-300g carbs
          fat_goal: Math.round(Math.random() * 80 + 40)                 // 40-120g fat
        };
        
        const progress = macroCalculatorAI.calculateGoalProgress(totals, goals);
        
        // Validate percentage calculations manually
        const expectedCaloriesPercentage = Math.round((totals.calories / goals.daily_calorie_goal) * 100);
        const expectedProteinPercentage = Math.round((totals.protein / goals.protein_goal) * 100);
        const expectedCarbsPercentage = Math.round((totals.carbs / goals.carb_goal) * 100);
        const expectedFatPercentage = Math.round((totals.fat / goals.fat_goal) * 100);
        
        // Check accuracy (accounting for 999% cap)
        const isAccurate = (
          progress.calories_percentage === Math.min(expectedCaloriesPercentage, 999) &&
          progress.protein_percentage === Math.min(expectedProteinPercentage, 999) &&
          progress.carbs_percentage === Math.min(expectedCarbsPercentage, 999) &&
          progress.fat_percentage === Math.min(expectedFatPercentage, 999) &&
          typeof progress.overall_balance_score === 'number' &&
          progress.overall_balance_score >= 0 &&
          progress.overall_balance_score <= 100
        );
        
        if (isAccurate) accurateProgressCalculations++;
      }
      
      const progressAccuracy = accurateProgressCalculations / testCases;
      
      // Should achieve >95% accuracy
      expect(progressAccuracy).toBeGreaterThan(0.95);
      
      console.log(`Goal Progress Accuracy Test: ${(progressAccuracy * 100).toFixed(2)}% (${accurateProgressCalculations}/${testCases} cases)`);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    
    it('should handle zero goals gracefully (avoid division by zero)', () => {
      const totals: DailyTotals = { calories: 1500, protein: 100, carbs: 150, fat: 50, fiber: 25 };
      const zeroGoals: UserGoals = { daily_calorie_goal: 0, protein_goal: 0, carb_goal: 0, fat_goal: 0 };
      
      // Should not throw error
      expect(() => {
        macroCalculatorAI.calculateGoalProgress(totals, zeroGoals);
      }).not.toThrow();
      
      const progress = macroCalculatorAI.calculateGoalProgress(totals, zeroGoals);
      
      // Should handle infinity gracefully
      expect(isNaN(progress.calories_percentage)).toBe(false);
      expect(isNaN(progress.protein_percentage)).toBe(false);
      expect(isNaN(progress.carbs_percentage)).toBe(false);
      expect(isNaN(progress.fat_percentage)).toBe(false);
    });
    
    it('should handle negative meal values gracefully', () => {
      const mealsWithNegatives: MealData[] = [
        { id: '1', calories: -50, protein: -5, carbs: -10, fat: -2, fiber: -1, logged_at: new Date(), confidence: 0.8 },
        { id: '2', calories: 400, protein: 30, carbs: 40, fat: 15, fiber: 8, logged_at: new Date(), confidence: 0.9 }
      ];
      
      const totals = macroCalculatorAI.calculateDailyTotals(mealsWithNegatives);
      
      // Should handle negative values (might represent corrections)
      expect(totals.calories).toBe(350);
      expect(totals.protein).toBe(25);
      expect(totals.carbs).toBe(30);
      expect(totals.fat).toBe(13);
      expect(totals.fiber).toBe(7);
    });
  });
});