## 💰 Cost Optimization & Monitoring Implementation

### **V0.1 Token Budget Management**

```typescript
interface TokenBudgetManager {
  readonly SYSTEM_PROMPT_TOKEN_LIMIT = 1500;
  readonly DAILY_BUDGET_USD = 1.67; // $50/month ÷ 30 days
  readonly COST_PER_1K_TOKENS = {
    'gpt-4o-input': 0.005,
    'gpt-4o-output': 0.015
  };
  
  private dailyUsage: CostTracking = {
    total_tokens: 0,
    total_cost_usd: 0,
    requests_count: 0,
    average_tokens_per_request: 0
  };
}

class ProductionCostOptimizer {
  // Aggressive token optimization for production
  optimizeCalculationRequest(request: CalculationRequest): OptimizedRequest {
    // Remove unnecessary context data
    const optimizedContext = {
      daily_goals: request.user_context.daily_goals,
      current_totals: this.calculateCurrentTotals(request.user_context.todays_meals),
      meal_count: request.user_context.todays_meals?.length || 0
      // Remove: conversation history, detailed meal descriptions, user preferences
    };
    
    // Use structured input format only (no natural language)
    return {
      trigger: request.trigger_type,
      nutrition: request.nutrition_data.total_nutrition,
      goals: optimizedContext.daily_goals,
      current: optimizedContext.current_totals,
      confidence: request.nutrition_data.confidence_overall
    };
  }
  
  // Template-based responses for common scenarios (0 AI tokens)
  generateTemplateResponse(progress: GoalProgress): string | null {
    if (progress.protein_percentage >= 90 && progress.protein_percentage <= 110) {
      return `Excellent! You're ${progress.protein_percentage}% to your protein goal - right on track!`;
    }
    
    if (progress.calories_percentage >= 80 && progress.calories_percentage <= 100) {
      return `You're doing great! ${progress.calories_percentage}% to your calorie goal with good progress.`;
    }
    
    // Return null if complex AI response needed
    return null;
  }
  
  // Cost tracking with automatic budget protection
  async trackCalculationCost(tokens: TokenUsage, requestType: string): Promise<CostResult> {
    const cost = (tokens.input * this.COST_PER_1K_TOKENS['gpt-4o-input'] + 
                  tokens.output * this.COST_PER_1K_TOKENS['gpt-4o-output']) / 1000;
    
    this.dailyUsage.total_cost_usd += cost;
    this.dailyUsage.total_tokens += tokens.input + tokens.output;
    this.dailyUsage.requests_count++;
    
    // Budget protection alerts
    if (this.dailyUsage.total_cost_usd > this.DAILY_BUDGET_USD * 0.8) {
      await this.alertBudgetWarning('80% of daily budget reached');
    }
    
    if (this.dailyUsage.total_cost_usd > this.DAILY_BUDGET_USD) {
      await this.enableEmergencyMode(); // Switch to template-only responses
    }
    
    return {
      cost_usd: cost,
      total_daily_cost: this.dailyUsage.total_cost_usd,
      budget_remaining: this.DAILY_BUDGET_USD - this.dailyUsage.total_cost_usd,
      emergency_mode_active: this.dailyUsage.total_cost_usd > this.DAILY_BUDGET_USD
    };
  }
}
```

### **V0.1 Performance SLA Implementation**

```typescript
class PerformanceSLAManager {
  private readonly SLA_TARGETS = {
    real_time_calculation: 2000,    // Meal logging
    dashboard_refresh: 1000,        // UI updates  
    background_calculation: 5000,   // Goal changes
    goal_setting_assistance: 3000   // BMR calculations
  };
  
  async executeWithSLA<T>(
    operation: string,
    task: () => Promise<T>,
    fallbackStrategy: () => Promise<T>
  ): Promise<SLAResult<T>> {
    
    const startTime = Date.now();
    const timeout = this.SLA_TARGETS[operation];
    
    try {
      // Race between task and timeout
      const result = await calculator.processCalculationRequest(lowConfidenceRequest);
      
      expect(result.calculation_results.calculation_confidence).toBeLessThan(0.95);
      expect(result.system_recommendations.concern_flags).toContain('low_calculation_confidence');
      expect(result.insights_and_recommendations.primary_insight).toContain('estimates involved');
    });
  });
  
  describe('Performance SLA Compliance', () => {
    test('should complete real-time calculations within 2 seconds', async () => {
      const realTimeRequest = createMockMealLoggingRequest();
      const startTime = Date.now();
      
      const result = await calculator.processCalculationRequest(realTimeRequest);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(2000);
      expect(result.system_metadata.calculation_time_ms).toBeLessThan(2000);
      expect(result.system_metadata.sla_breach).toBeFalsy();
    });
    
    test('should handle 50 concurrent calculations efficiently', async () => {
      const requests = Array.from({ length: 50 }, () => createMockCalculationRequest());
      const startTime = Date.now();
      
      const results = await Promise.all(
        requests.map(req => calculator.processCalculationRequest(req))
      );
      
      const totalDuration = Date.now() - startTime;
      const averageDuration = totalDuration / results.length;
      
      expect(results).toHaveLength(50);
      expect(results.every(r => r.success)).toBe(true);
      expect(averageDuration).toBeLessThan(1000); // Average under 1 second
      expect(totalDuration).toBeLessThan(10000); // Total under 10 seconds
    });
    
    test('should gracefully degrade when SLA exceeded', async () => {
      // Mock slow AI response
      jest.spyOn(testEnvironment.openAI, 'chat').mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 3000)) // 3 second delay
      );
      
      const request = createMockCalculationRequest();
      const result = await calculator.processCalculationRequest(request);
      
      expect(result.success).toBe(true);
      expect(result.system_metadata.fallback_used).toBe(true);
      expect(result.system_metadata.sla_breach_reason).toBe('timeout_protection');
      expect(result.calculation_results).toBeDefined(); // Still provides calculations
    });
  });
  
  describe('Cost Optimization', () => {
    test('should stay within daily budget limits', async () => {
      const dailyBudget = 1.67; // $50/month ÷ 30 days
      const requests = Array.from({ length: 100 }, () => createMockCalculationRequest());
      
      let totalCost = 0;
      
      for (const request of requests) {
        const result = await calculator.processCalculationRequest(request);
        totalCost += result.system_metadata.cost_tracking.api_cost_usd;
        
        // Should switch to template mode if budget exceeded
        if (totalCost > dailyBudget) {
          expect(result.system_metadata.emergency_mode_active).toBe(true);
          expect(result.system_metadata.cost_tracking.api_cost_usd).toBe(0); // Template responses = $0
        }
      }
      
      expect(totalCost).toBeLessThanOrEqual(dailyBudget * 1.1); // Allow 10% overage for emergency handling
    });
    
    test('should use template responses for common scenarios', async () => {
      const commonRequest = {
        goal_progress: { protein_percentage: 95, calories_percentage: 85 }
      };
      
      const templateResponse = calculator.generateTemplateResponse(commonRequest.goal_progress);
      
      expect(templateResponse).toBeTruthy();
      expect(templateResponse).toContain('Excellent!');
      expect(templateResponse).toContain('95%');
      expect(templateResponse).toContain('protein goal');
    });
  });
  
  describe('Integration Testing', () => {
    test('should integrate seamlessly with Food Recognition AI output', async () => {
      const foodRecognitionOutput = {
        system_source: 'food_recognition_ai',
        system_target: 'macro_calculator_ai',
        confidence_score: 0.91,
        nutrition_data: {
          total_nutrition: { calories: 420, protein: 45, carbs: 8, fat: 12, fiber: 2 },
          data_sources: ['spoonacular'],
          confidence_overall: 0.91
        }
      };
      
      const result = await calculator.processCalculationRequest(foodRecognitionOutput);
      
      expect(result.system_source).toBe('macro_calculator_ai');
      expect(result.calculation_results.daily_totals.calories).toBe(420);
      expect(result.calculation_results.calculation_confidence).toBeGreaterThan(0.9);
      expect(result.metadata.data_sources_used).toContain('spoonacular');
    });
    
    test('should route to Data Validation Gateway for audit trails', async () => {
      const request = createMockCalculationRequest();
      const auditSpy = jest.spyOn(testEnvironment.dataValidationGateway, 'logOperation');
      
      await calculator.processCalculationRequest(request);
      
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          operation_type: 'macro_calculation',
          system_source: 'macro_calculator_ai',
          success: true,
          audit_trail_id: expect.any(String)
        })
      );
    });
    
    test('should handle Error Handler System integration', async () => {
      // Force database error
      jest.spyOn(testEnvironment.database, 'getTodaysMeals').mockRejectedValue(
        new Error('Database connection failed')
      );
      
      const errorHandlerSpy = jest.spyOn(testEnvironment.errorHandler, 'handleSystemError');
      const request = createMockCalculationRequest();
      
      const result = await calculator.processCalculationRequest(request);
      
      expect(errorHandlerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          system_name: 'macro_calculator_ai',
          error_type: 'database_failure',
          recovery_action: 'use_cached_data'
        })
      );
      
      expect(result.error_details.recovery_action).toBe('using_cached_data');
      expect(result.success).toBe(true); // Should still succeed with fallback
    });
  });
  
  describe('Time Window Meal Grouping', () => {
    test('should group meals within 5-minute window correctly', async () => {
      const baseTime = new Date();
      const userId = 'test_user_123';
      
      // Log first item
      const meal1 = {
        user_id: userId,
        nutrition_data: { calories: 150, protein: 2, carbs: 35, fat: 0 },
        timestamp: baseTime
      };
      
      const result1 = await calculator.processMealGrouping(meal1);
      expect(result1.grouping_type).toBe('new_window');
      
      // Log second item 3 minutes later
      const meal2 = {
        user_id: userId,
        nutrition_data: { calories: 200, protein: 15, carbs: 10, fat: 8 },
        timestamp: new Date(baseTime.getTime() + 3 * 60 * 1000)
      };
      
      const result2 = await calculator.processMealGrouping(meal2);
      expect(result2.grouping_type).toBe('added_to_window');
      expect(result2.combined_nutrition.calories).toBe(350);
      expect(result2.combined_nutrition.protein).toBe(17);
    });
    
    test('should start new window after 5-minute gap', async () => {
      const baseTime = new Date();
      const userId = 'test_user_456';
      
      // Log first item
      const meal1 = { user_id: userId, timestamp: baseTime };
      await calculator.processMealGrouping(meal1);
      
      // Log second item 6 minutes later (outside window)
      const meal2 = {
        user_id: userId,
        timestamp: new Date(baseTime.getTime() + 6 * 60 * 1000)
      };
      
      const result2 = await calculator.processMealGrouping(meal2);
      expect(result2.grouping_type).toBe('new_window');
    });
  });
  
  describe('Goal Setting Validation', () => {
    test('should generate appropriate goals for different profiles', async () => {
      const profiles = [
        { weight_kg: 70, height_cm: 165, age: 30, gender: 'female', activity: 'moderate', goal: 'lose' },
        { weight_kg: 85, height_cm: 180, age: 25, gender: 'male', activity: 'active', goal: 'bulk' },
        { weight_kg: 60, height_cm: 160, age: 45, gender: 'female', activity: 'light', goal: 'maintain' }
      ];
      
      for (const profile of profiles) {
        const result = await calculator.processGoalSetting(profile);
        
        expect(result.success).toBe(true);
        expect(result.recommended_goals.daily_calorie_goal).toBeGreaterThan(1200);
        expect(result.recommended_goals.protein_goal).toBeGreaterThan(50);
        expect(result.safety_validation.isValid).toBe(true);
        expect(result.rationale).toContain(profile.goal);
      }
    });
    
    test('should provide alternative goal options', async () => {
      const profile = { weight_kg: 75, height_cm: 175, gender: 'male', goal: 'lose' };
      
      const result = await calculator.processGoalSetting(profile);
      
      expect(result.alternatives).toHaveLength(2);
      expect(result.alternatives.some(alt => alt.name === 'Conservative')).toBe(true);
      expect(result.alternatives.some(alt => alt.name === 'High Protein')).toBe(true);
    });
  });
});

describe('V0.2 Migration Readiness', () => {
  test('should have behavioral intelligence integration hooks', () => {
    const calculator = new MacroCalculatorAI();
    
    // Check for V0.2 extension points
    expect(calculator.enhanceWithBehavioralContext).toBeDefined();
    expect(calculator.generatePatternAwareInsights).toBeDefined();
    expect(calculator.adaptRecommendationsToUserPsychology).toBeDefined();
  });
  
  test('should support context-aware calculation triggers', async () => {
    const contextAwareRequest = {
      trigger_type: 'behavioral_pattern_detected',
      pattern_context: {
        pattern_name: 'stress_eating_afternoon',
        risk_level: 'moderate',
        suggested_intervention: 'protein_rich_snack'
      }
    };
    
    // Should gracefully handle V0.2 requests in V0.1
    const result = await calculator.processCalculationRequest(contextAwareRequest);
    
    expect(result.success).toBe(true);
    expect(result.system_metadata.v02_features_detected).toBe(true);
    expect(result.system_metadata.v02_processing_skipped).toBe(true);
  });
});
```

---

## 🚀 Production Deployment Checklist

### **Pre-Deployment Validation**

#### **Safety & Compliance**
- [ ] All crisis intervention keywords trigger appropriate escalation
- [ ] Medical boundary violations are blocked and logged
- [ ] Dangerous calorie goals are rejected with crisis intervention
- [ ] Goal validation follows established nutrition guidelines
- [ ] Mathematical calculations achieve >95% accuracy across test suites

#### **Performance & Reliability**
- [ ] Real-time calculations complete within 2-second SLA
- [ ] Dashboard updates complete within 1-second SLA
- [ ] System handles 50+ concurrent requests without degradation
- [ ] Graceful fallback strategies tested and functional
- [ ] Cache hit rates >70% for repeated calculation patterns

#### **Cost & Resource Management**
- [ ] Daily API costs stay within $1.67 budget limit
- [ ] Token usage optimized with template responses for common scenarios
- [ ] Emergency mode activates when budget limits exceeded
- [ ] System prompt stays under 1,500 token limit
- [ ] Cost tracking and alerts functional

#### **Integration & Communication**
- [ ] Food Recognition AI integration tested with all output formats
- [ ] Data Validation Gateway receives all calculation audit trails
- [ ] Error Handler System integration tested for all failure modes
- [ ] User Facing AI receives properly formatted response data
- [ ] Dashboard real-time updates work via Supabase subscriptions

### **Production Monitoring Setup**

#### **Real-Time Alerts**
```typescript
const ProductionAlerts = {
  calculation_accuracy: {
    threshold: 0.95,
    alert_channel: 'critical',
    escalation: 'immediate'
  },
  
  response_time: {
    threshold_ms: 2000,
    alert_channel: 'performance',
    escalation: 'within_5_minutes'
  },
  
  daily_budget: {
    warning_at: 0.8, // 80% of budget
    critical_at: 1.0, // 100% of budget
    alert_channel: 'cost_management'
  },
  
  error_rate: {
    threshold: 0.05, // 5% error rate
    alert_channel: 'reliability',
    escalation: 'within_15_minutes'
  }
};
```

#### **Business Metrics Dashboard**
- Daily calculation volume and accuracy trends
- Average response times by calculation type
- Cost per calculation and budget utilization
- User satisfaction with calculation results
- Goal-setting completion and success rates

---

## 🔄 V0.2 Migration Preparation

### **Behavioral Intelligence Integration Hooks**

```typescript
// V0.2 Enhancement: Behavioral Pattern Integration
class BehaviorallyAwareMacroCalculator extends MacroCalculatorAI {
  async generateInsights(
    calculations: CalculationResults, 
    userContext: UserContext
  ): Promise<InsightsAndRecommendations> {
    
    // V0.1: Basic template insights
    const basicInsights = await super.generateInsights(calculations, userContext);
    
    // V0.2: Add behavioral pattern awareness
    if (this.behavioralPsychologyAI) {
      const patterns = await this.behavioralPsychologyAI.analyzePatterns(userContext.user_id);
      const contextualInsights = await this.enhanceWithBehavioralContext(basicInsights, patterns);
      return contextualInsights;
    }
    
    return basicInsights;
  }
  
  async enhanceWithBehavioralContext(
    basicInsights: InsightsAndRecommendations,
    patterns: BehavioralPatterns
  ): Promise<InsightsAndRecommendations> {
    
    // V0.2: Pattern-aware messaging
    if (patterns.stress_eating_detected && patterns.current_stress_level > 0.7) {
      basicInsights.primary_insight = this.adaptInsightForStressEating(basicInsights.primary_insight);
      basicInsights.recommendations.unshift({
        type: 'stress_management',
        message: 'I notice you might be feeling stressed. You\'re doing great with your nutrition despite the challenges.',
        priority: 'high',
        behavioral_context: 'stress_eating_support'
      });
    }
    
    return basicInsights;
  }
  
  async generatePatternAwareInsights(userContext: UserContext): Promise<PatternInsights> {
    // V0.2: Placeholder for behavioral pattern analysis
    return {
      eating_patterns_detected: [],
      success_factor_analysis: {},
      personalized_recommendations: [],
      behavioral_coaching_suggestions: []
    };
  }
}

// V0.3 Enhancement: Meal Planning Integration  
class MealPlanningAwareMacroCalculator extends BehaviorallyAwareMacroCalculator {
  async generateRecommendations(
    calculations: CalculationResults,
    userContext: UserContext
  ): Promise<Recommendation[]> {
    
    const basicRecommendations = await super.generateRecommendations(calculations, userContext);
    
    // V0.3: Add meal planning suggestions
    if (this.mealPlannerAI) {
      const remainingMacros = this.calculateRemainingMacros(calculations, userContext);
      const mealSuggestions = await this.mealPlannerAI.suggestMealsForMacros(remainingMacros);
      
      const planningRecommendations = mealSuggestions.map(suggestion => ({
        type: 'meal_suggestion',
        message: `Try ${suggestion.meal_name} for dinner`,
        specific_addition: `${suggestion.meal_name}: ${suggestion.macros.protein}g protein, ${suggestion.macros.calories} calories`,
        recipe_id: suggestion.recipe_id,
        priority: 'medium'
      }));
      
      return [...basicRecommendations, ...planningRecommendations];
    }
    
    return basicRecommendations;
  }
}
```

### **Future Integration Points**

```typescript
// Database schema extensions for V0.2+
interface V02_MacroCalculatorExtensions {
  // Behavioral pattern integration
  user_behavior_analysis: {
    stress_eating_patterns: BehavioralPattern[];
    success_factor_identification: SuccessFactors;
    goal_achievement_psychology: PsychologyProfile;
  };
  
  // Advanced calculation context
  calculation_context: {
    time_of_day_intelligence: boolean;
    social_eating_context: SocialContext;
    meal_timing_optimization: TimingAnalysis;
  };
  
  // Proactive coaching triggers
  coaching_triggers: {
    pattern_intervention_points: InterventionTrigger[];
    celebration_milestone_detection: MilestoneDetection;
    course_correction_suggestions: CourseCorrection[];
  };
}

// API contract extensions for V0.3+
interface V03_CalculationRequest extends V01_CalculationRequest {
  meal_planning_context?: {
    upcoming_meals: PlannedMeal[];
    grocery_list_integration: boolean;
    recipe_preferences: RecipePreferences;
  };
  
  health_integration_data?: {
    activity_data: ActivityMetrics;
    sleep_data: SleepMetrics;
    stress_indicators: StressMetrics;
  };
}
```

---

## 📊 Success Criteria Validation

### **V0.1 Completion Gates**

#### **Mathematical Accuracy Gate**
- [ ] >95% accuracy across 1,000+ calculation test cases
- [ ] Zero tolerance for dangerous goal validation failures
- [ ] Perfect precision in daily totals calculations
- [ ] Consistent rounding and formatting across all outputs

#### **Performance Gate**
- [ ] <2 second response time for real-time calculations
- [ ] <1 second response time for dashboard updates
- [ ] >70% cache hit rate for repeated calculations
- [ ] Graceful degradation under load tested and functional

#### **Integration Gate**
- [ ] Seamless integration with Food Recognition AI outputs
- [ ] Proper audit trail logging through Data Validation Gateway
- [ ] Error handling integration with Error Handler System
- [ ] Real-time dashboard updates via Supabase subscriptions

#### **Cost Management Gate**
- [ ] Daily API costs consistently under $1.67 budget
- [ ] Template responses reduce costs for common scenarios
- [ ] Emergency mode protects against budget overruns
- [ ] Token optimization keeps system prompt under 1,500 tokens

#### **Safety Gate**
- [ ] Crisis intervention triggers work for dangerous goals
- [ ] Medical boundary violations properly escalated
- [ ] All safety edge cases tested and handled appropriately
- [ ] User data protection and privacy compliance verified

### **Ready for V0.2 Development When:**
- [ ] All V0.1 gates passed with production-grade reliability
- [ ] User feedback validates core calculation accuracy and usefulness
- [ ] System handles real user load without performance degradation  
- [ ] Behavioral intelligence integration hooks tested and functional
- [ ] Foundation supports advanced features without architectural changes

---

*This enhanced implementation guide provides the production-grade foundation for immediate V0.1 development while ensuring clean evolution paths to V0.2+ advanced features. All safety, performance, and cost optimization requirements are built into the core architecture from day one.* Promise.race([
        task(),
        this.createTimeoutPromise(timeout)
      ]);
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        data: result,
        duration_ms: duration,
        sla_met: duration <= timeout,
        performance_tier: this.classifyPerformance(duration, timeout)
      };
      
    } catch (error) {
      if (error.name === 'TimeoutError') {
        // Execute fallback strategy
        const fallbackResult = await fallbackStrategy();
        return {
          success: true,
          data: fallbackResult,
          duration_ms: Date.now() - startTime,
          sla_met: false,
          performance_tier: 'degraded',
          fallback_used: true
        };
      }
      
      throw error; // Re-throw non-timeout errors
    }
  }
  
  private classifyPerformance(duration: number, sla: number): PerformanceTier {
    if (duration <= sla * 0.5) return 'excellent';
    if (duration <= sla * 0.8) return 'good';
    if (duration <= sla) return 'acceptable';
    return 'poor';
  }
  
  // Graceful degradation strategies
  generateFallbackCalculation(request: CalculationRequest): CalculationResponse {
    // Pure mathematical calculation without AI insights
    const totals = this.calculateTotalsSync(request);
    const progress = this.calculateProgressSync(totals, request.user_context.daily_goals);
    
    return {
      calculation_results: {
        daily_totals: totals,
        goal_progress: progress,
        calculation_confidence: 1.0,
        time_of_day_context: 'fallback_mode'
      },
      insights_and_recommendations: {
        primary_insight: `You're ${progress.protein_percentage}% to your protein goal`,
        recommendations: [],
        celebration_triggers: [],
        concern_flags: ['fallback_mode_active']
      },
      system_metadata: {
        calculation_time_ms: Date.now() - startTime,
        cache_status: 'bypassed',
        fallback_mode: true,
        sla_breach_reason: 'timeout_protection'
      }
    };
  }
}
```

### **V0.1 Comprehensive Testing Framework**

```typescript
describe('Macro Calculator AI - Production Readiness Tests', () => {
  let calculator: MacroCalculatorAI;
  let testEnvironment: ProductionTestEnvironment;
  
  beforeAll(async () => {
    testEnvironment = await setupProductionTestEnvironment();
    calculator = testEnvironment.macroCalculator;
  });
  
  describe('Mathematical Accuracy (>95% Requirement)', () => {
    const accuracyTestCases = [
      {
        meals: [
          { calories: 420.7, protein: 45.3, carbs: 8.1, fat: 12.4, fiber: 2.1 },
          { calories: 380.2, protein: 25.7, carbs: 35.9, fat: 15.2, fiber: 5.4 }
        ],
        expected: { calories: 800.9, protein: 71.0, carbs: 44.0, fat: 27.6, fiber: 7.5 }
      },
      // 100+ additional test cases covering edge cases
    ];
    
    test.each(accuracyTestCases)('should calculate exact totals for meal set %#', ({ meals, expected }) => {
      const result = calculator.calculateDailyTotals(meals);
      
      expect(result.calories).toBeCloseTo(expected.calories, 1);
      expect(result.protein).toBeCloseTo(expected.protein, 1);
      expect(result.carbs).toBeCloseTo(expected.carbs, 1);
      expect(result.fat).toBeCloseTo(expected.fat, 1);
      expect(result.fiber).toBeCloseTo(expected.fiber, 1);
    });
    
    test('should maintain >95% accuracy across 1000 random meal combinations', async () => {
      const testCases = generateRandomMealCombinations(1000);
      let accurateCalculations = 0;
      
      for (const testCase of testCases) {
        const calculated = calculator.calculateDailyTotals(testCase.meals);
        const expected = testCase.expected;
        
        const accuracy = calculateAccuracyScore(calculated, expected);
        if (accuracy >= 0.95) accurateCalculations++;
      }
      
      const overallAccuracy = accurateCalculations / testCases.length;
      expect(overallAccuracy).toBeGreaterThan(0.95);
    });
  });
  
  describe('Safety Validation (Zero Tolerance)', () => {
    test('should immediately escalate dangerous calorie goals', async () => {
      const dangerousRequest = {
        trigger_type: 'goal_setting',
        user_profile: { weight_kg: 70, height_cm: 170, gender: 'female' },
        proposed_goals: { daily_calorie_goal: 800 } // Dangerous
      };
      
      const crisisInterventionSpy = jest.spyOn(testEnvironment.crisisIntervention, 'handleEscalation');
      
      const result = await calculator.processGoalSetting(dangerousRequest);
      
      expect(result.success).toBe(false);
      expect(result.requiresCrisisIntervention).toBe(true);
      expect(crisisInterventionSpy).toHaveBeenCalled();
    });
    
    test('should reject medical dietary advice requests', async () => {
      const medicalRequest = {
        user_query: "What should I eat for my diabetes?",
        trigger_type: 'medical_advice'
      };
      
      const result = await calculator.processCalculationRequest(medicalRequest);
      
      expect(result.error_details.error_type).toBe('medical_boundary_violation');
      expect(result.error_details.escalation_required).toBe(true);
      expect(result.error_details.recovery_action).toContain('consult healthcare professional');
    });
    
    test('should flag calculations with <95% confidence', async () => {
      const lowConfidenceRequest = {
        nutrition_data: { 
          total_nutrition: { calories: 400, protein: 20, carbs: 30, fat: 15 },
          confidence_overall: 0.60 // Low confidence
        }
      };
      
      const result = await# Macro Calculator AI Implementation Guide
*Nutrition Mathematics & Daily Progress Analysis - Version Evolution Guide*

## 📋 Dependencies & References
**Required from other documents:**
- 📎 **Reference**: Core Food Tracking V0.1 > Macro Calculator AI specifications
- 📎 **Reference**: Technical Architecture > AI-First architecture principles & Universal System Prompt Structure
- 📎 **Reference**: V0.1 MVP Definition > Iron-clad scope boundaries (>95% accuracy requirement)
- 📎 **Reference**: Data Architecture > user_preferences, daily_meals table schemas
- 📎 **Reference**: User Facing AI Guide > Integration patterns and context management
- 📎 **Reference**: Food Recognition AI Guide > Nutrition data output formats

**External Dependencies:**
- Supabase daily_meals and user_preferences tables
- OpenAI API (GPT-4o for nutrition reasoning and recommendations)
- Error Handler System for calculation failures
- Data Validation Gateway for audit trails

**Document Purpose**: Complete implementation guide for Macro Calculator AI across all development versions

---

## 🎯 System Identity & Core Purpose

### **System Identity (Consistent Across All Versions)**
**Name**: Macro Calculator AI
**Core Function**: Convert structured nutrition data into accurate daily progress analysis with goal-oriented insights
**Integration Role**: Receives nutrition data from Food Recognition AI, provides calculated totals and insights to User Facing AI and Dashboard
**Accuracy Priority**: Mathematical precision with intelligent goal guidance (>95% calculation accuracy)

### **Version-Specific Evolution**

#### **V0.1: Foundation Mathematics**
- **Focus**: Accurate macro calculations with basic goal insights
- **Intelligence Level**: Simple goal validation and basic recommendations
- **Processing**: Daily totals, goal percentages, basic suggestions
- **Goal Setting**: Simple questionnaire with healthy range validation

#### **V0.2: Behavioral Integration**
- **Focus**: Pattern-aware calculations with contextual insights
- **Intelligence Level**: Behavioral Psychology AI integration for smart recommendations
- **Processing**: Time-aware progress analysis, pattern-based suggestions
- **Goal Setting**: Adaptive goal adjustment based on user patterns

#### **V0.3: Complete Nutrition Intelligence**
- **Focus**: Comprehensive nutrition coaching with meal planning integration
- **Intelligence Level**: Full BMR/TDEE calculations with metabolic adaptation
- **Processing**: Complex meal optimization and nutritional education
- **Goal Setting**: Medical-grade precision with health condition considerations

---

## 🤖 V0.1 System Prompt Template

### **Core System Prompt**
```xml
<system_identity>
Name: Macro Calculator AI
Core Function: Calculate daily nutrition totals and provide accurate goal-oriented insights with >95% mathematical precision
Integration Role: Receives structured nutrition data from Food Recognition AI and provides calculated analysis to User Facing AI and Dashboard
Model: GPT-4o for nutrition reasoning and goal recommendations
</system_identity>

<aggressive_safety_framework>
<!-- ZERO TOLERANCE - Immediate escalation required -->
MEDICAL_DIETARY_RESTRICTIONS:
- Never provide medical dietary advice for health conditions (diabetes, kidney disease, heart disease)
- Never diagnose nutritional deficiencies or medical conditions
- Always recommend consulting healthcare professionals for medical dietary needs
- Never suggest supplements or medical interventions

DANGEROUS_GOAL_VALIDATION:
- Never accept calorie goals below 1200 for women or 1500 for men without medical supervision
- Immediately escalate extreme restriction goals to Crisis Intervention AI
- Never provide calculations for pro-eating disorder behaviors
- Always validate goals against healthy ranges before proceeding

ACCURACY_REQUIREMENTS:
- Never provide goal percentages without verifying calculation accuracy
- Always show data sources and confidence levels for recommendations
- Flag missing micronutrient data when making nutritional assessments
- Ensure mathematical precision in all macro calculations (>95% accuracy)

GOAL_SETTING_BOUNDARIES:
- Never make medical claims about optimal nutrition for health conditions
- Stick to general healthy population guidelines for goal recommendations
- Always provide ranges rather than exact prescriptive targets
- Escalate complex medical dietary needs to professional consultation
</aggressive_safety_framework>

<hard_rules>
<!-- V0.1 Binary constraints -->
NEVER:
- Provide medical dietary advice for health conditions
- Accept dangerous calorie restriction goals without escalation
- Make calculations with confidence below 95% without flagging uncertainty
- Suggest extreme macro ratios outside healthy ranges
- Override user goals without clear safety justification

ALWAYS:
- Validate goal safety before performing calculations
- Provide confidence scores for all recommendations
- Use event-driven calculation triggers for real-time updates
- Group meals within 5-minute windows for logical meal assessment
- Cache calculation results with 5-minute TTL for performance

MUST:
- Route all calculation results through Data Validation Gateway for audit trails
- Implement tiered performance SLAs (real-time <2s, dashboard <1s, background <5s)
- Differentiate error types for appropriate user messaging
- Maintain mathematical precision in all macro totals and percentages
- Log all calculations for system improvement and debugging
</hard_rules>

<decision_trees>
<!-- V0.1 Calculation trigger logic -->
IF meal_logged_event THEN trigger_immediate_calculation
ELSE IF goal_changed_event THEN recalculate_all_percentages
ELSE IF midnight_reset_event THEN reset_daily_counters
ELSE IF user_progress_query THEN retrieve_cached_calculations

<!-- V0.1 Goal validation logic -->
IF calories < 1200_female OR calories < 1500_male THEN escalate_to_crisis_intervention
ELSE IF macro_ratios outside_healthy_ranges THEN suggest_adjustments
ELSE IF goals_seem_reasonable THEN proceed_with_calculations
ELSE request_goal_clarification

<!-- V0.1 Time window meal grouping -->
IF multiple_items_logged_within_5_minutes THEN group_as_single_meal_analysis
ELSE IF individual_item_logged THEN analyze_standalone
ELSE IF meal_components_recognized THEN analyze_combined_nutritional_profile

<!-- V0.1 Performance optimization -->
IF calculation_time > 2_seconds THEN return_basic_math_only
ELSE IF calculation_time > 1_second THEN skip_ai_insights
ELSE provide_full_calculation_with_insights
</decision_trees>

<integration_protocols>
<!-- V0.1 System communication -->
Input Format:
{
  "trigger_type": "meal_logged" | "goal_changed" | "progress_query",
  "user_id": "uuid",
  "nutrition_data": {
    "recognized_foods": [...],
    "total_nutrition": {
      "calories": 420,
      "protein": 45.2,
      "carbs": 8.1,
      "fat": 12.3,
      "fiber": 2.1
    },
    "confidence_overall": 0.91,
    "meal_timestamp": "2025-01-15T12:30:00Z"
  },
  "user_context": {
    "daily_goals": {
      "calories": 1800,
      "protein": 140,
      "carbs": 180,
      "fat": 60
    },
    "todays_meals": [...existing_meals],
    "goal_progress_query": "How's my protein today?"
  }
}

Output Format:
{
  "calculation_results": {
    "daily_totals": {
      "calories": 1456,
      "protein": 89.3,
      "carbs": 145.2,
      "fat": 48.7,
      "fiber": 18.4
    },
    "goal_progress": {
      "calories_percentage": 81,
      "protein_percentage": 64,
      "carbs_percentage": 81,
      "fat_percentage": 81
    },
    "calculation_confidence": 0.97,
    "time_of_day_context": "afternoon"
  },
  "insights_and_recommendations": {
    "primary_insight": "You're 64% to your protein goal with dinner still ahead - right on track!",
    "recommendations": [
      {
        "type": "basic_suggestion",
        "message": "A 6oz chicken breast at dinner would get you to 95% of your protein goal",
        "specific_addition": "chicken breast, 6oz, +42g protein"
      }
    ],
    "celebration_triggers": [],
    "concern_flags": []
  },
  "chat_response": {
    "encouragement": "Great choice! That brings you to 64% of your protein goal 💪",
    "education_note": "Protein helps keep you satisfied between meals",
    "forward_momentum": "How does that feel?"
  },
  "dashboard_data": {
    "macro_rings_update": {
      "calories": {"current": 1456, "goal": 1800, "percentage": 81},
      "protein": {"current": 89, "goal": 140, "percentage": 64},
      "carbs": {"current": 145, "goal": 180, "percentage": 81},
      "fat": {"current": 49, "goal": 60, "percentage": 81}
    },
    "daily_summary": "4 meals logged, 64% protein goal achieved"
  },
  "system_metadata": {
    "calculation_time_ms": 1247,
    "cache_status": "updated",
    "audit_trail_logged": true,
    "next_calculation_trigger": "next_meal_log"
  }
}

Error Handling Protocols:
- Calculation failure → route to Error Handler System → differentiated user messaging
- Goal validation failure → escalate to Crisis Intervention AI
- Database failure → graceful degradation with cached data
- Performance timeout → return basic calculations without AI insights
</integration_protocols>

<task_instructions>
<!-- V0.1 Core calculation behaviors -->
PRIMARY_TASK: Provide accurate daily nutrition progress analysis with goal-oriented insights and encouragement

CALCULATION_FLOW:
1. Validate user goals for safety (dangerous restrictions → Crisis Intervention escalation)
2. Group meals within 5-minute windows for logical meal assessment
3. Calculate precise daily totals from all logged meals
4. Compare against user goals with percentage progress
5. Generate contextual insights based on time of day and progress patterns
6. Provide specific, actionable recommendations when gaps detected
7. Cache results with 5-minute TTL for performance optimization
8. Log all calculations through Data Validation Gateway for audit

GOAL_SETTING_ASSISTANCE:
- Collect: current weight, height, activity level, goal (lose/maintain/bulk)
- Calculate basic calorie needs using simple multipliers
- Suggest macro ratios: Moderate (30p/40c/30f), High Protein (35p/35c/30f), Balanced (25p/45c/30f)
- Validate all goals against healthy ranges before proceeding
- Provide foundation for V0.2+ sophisticated BMR/TDEE calculations

TIME_WINDOW_MEAL_GROUPING:
- If multiple items logged within 5 minutes, treat as single meal for analysis
- Re-analyze on each addition within the window for updated feedback
- Assess combined nutritional profile for recommendations
- Example: "crackers + apple + cheese = 15g protein" → appropriate single meal analysis

RECOMMENDATION_GENERATION:
- Basic macro gap detection: "I notice no protein in this meal"
- Specific suggestions: "6oz chicken breast would add 42g protein"
- Goal-oriented guidance: "That would bring you to 95% of your protein goal"
- Time-aware context: "with dinner still ahead, you're right on track"
- Only provide recommendations when requested in V0.1 (lay hooks for V0.2+ proactive suggestions)

PROGRESS_COMMUNICATION:
- Simple percentage reporting for V0.1: "You're 73% to your protein goal"
- Encouraging context: "Great choice! You're doing awesome with protein today"
- Forward momentum: "How does that feel?" "What's next to log?"
- Avoid time-of-day complexity in V0.1 (save for V0.2+ intelligence)
</task_instructions>

<examples>
<!-- V0.1 Success patterns -->
Good Daily Calculation Response:
Input: User logs "6oz grilled chicken breast" as 4th meal of day
Output: {
  "daily_totals": {"calories": 1456, "protein": 89, "carbs": 145, "fat": 49},
  "goal_progress": {"protein_percentage": 64},
  "primary_insight": "You're 64% to your protein goal with dinner still ahead - right on track!",
  "chat_response": "Great choice! That chicken brings you to 64% of your protein goal 💪"
}

Good Goal Setting Response:
Input: "Help me set my macro goals" - 160lb male, moderate activity, muscle building
Output: {
  "recommended_goals": {"calories": 2400, "protein": 160, "carbs": 240, "fat": 80},
  "rationale": "Based on your stats and muscle-building goal, this provides a moderate surplus with high protein",
  "safety_validation": "All goals within healthy ranges for your profile",
  "chat_response": "These goals will support your muscle-building while keeping you in a healthy range. Want to use these?"
}

Good Time-Window Grouping:
Input: Multiple items logged 2:30-2:33pm: "crackers", "apple", "cheese"
Output: {
  "meal_analysis": "combined_snack",
  "total_nutrition": {"calories": 320, "protein": 12, "carbs": 28, "fat": 18},
  "assessment": "Balanced afternoon snack with good protein content",
  "chat_response": "Nice balanced snack! The cheese added great protein to balance out the crackers and apple"
}

Good Recommendation Response:
User asks: "How much chicken should I add to my salad?"
Output: {
  "recommendation": "6oz chicken breast would be perfect!",
  "nutritional_impact": "You'll get 42g protein and reach 85% of your protein goal",
  "chat_response": "6oz chicken breast would be perfect! You'll get 42g protein and be at 85% of your protein goal. Want me to log that chicken for you?"
}

Good Error Differentiation:
Calculation Error: "Having trouble with the math right now, but your meal is saved! Dashboard will update shortly."
Database Error: "Your meal is logged successfully! Just a small delay updating your progress totals."
Goal Validation Error: "Let's double-check those nutrition goals - some numbers seem outside healthy ranges."

Bad Examples:
- Medical advice: "Based on your diabetes, you should..." (NEVER provide medical dietary advice)
- Dangerous goals: Accepting 800-calorie daily targets without escalation
- Imprecise calculations: "Around 75% of your goal" instead of exact percentages
- Time complexity in V0.1: "You're behind schedule for this time of day" (save for V0.2+)
</examples>
```

---

## 🧮 Mathematical Foundation & Algorithms

### **V0.1 Core Calculation Engine**

#### **Daily Totals Calculation**
```typescript
interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface MealData {
  id: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  logged_at: Date;
  confidence: number;
}

const calculateDailyTotals = (meals: MealData[]): DailyTotals => {
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
};
```

#### **Goal Progress Calculation**
```typescript
interface UserGoals {
  daily_calorie_goal: number;
  protein_goal: number;
  carb_goal: number;
  fat_goal: number;
}

interface GoalProgress {
  calories_percentage: number;
  protein_percentage: number;
  carbs_percentage: number;
  fat_percentage: number;
  overall_balance_score: number;
}

const calculateGoalProgress = (totals: DailyTotals, goals: UserGoals): GoalProgress => {
  const caloriesPercentage = Math.round((totals.calories / goals.daily_calorie_goal) * 100);
  const proteinPercentage = Math.round((totals.protein / goals.protein_goal) * 100);
  const carbsPercentage = Math.round((totals.carbs / goals.carb_goal) * 100);
  const fatPercentage = Math.round((totals.fat / goals.fat_goal) * 100);
  
  // Overall balance score (how evenly user is progressing across all macros)
  const percentages = [caloriesPercentage, proteinPercentage, carbsPercentage, fatPercentage];
  const averageProgress = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
  const variance = percentages.reduce((sum, p) => sum + Math.pow(p - averageProgress, 2), 0) / percentages.length;
  const balanceScore = Math.max(0, 100 - Math.sqrt(variance)); // Higher score = more balanced progress
  
  return {
    calories_percentage: Math.min(caloriesPercentage, 999), // Cap display at 999%
    protein_percentage: Math.min(proteinPercentage, 999),
    carbs_percentage: Math.min(carbsPercentage, 999),
    fat_percentage: Math.min(fatPercentage, 999),
    overall_balance_score: Math.round(balanceScore)
  };
};
```

### **V0.1 Goal Setting Algorithm**

#### **Simple Goal Calculation Formula**
```typescript
interface UserProfile {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'bulk';
}

const calculateBasicGoals = (profile: UserProfile): UserGoals => {
  // Simple BMR estimation (Mifflin-St Jeor)
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
};
```

#### **Goal Safety Validation**
```typescript
const validateGoalSafety = (goals: UserGoals, profile: UserProfile): ValidationResult => {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Critical safety checks
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
};
```

---

## 🕒 Time Window Meal Grouping Implementation

### **V0.1 Meal Grouping Logic**

```typescript
interface MealWindow {
  windowStart: Date;
  windowEnd: Date;
  meals: MealData[];
  isComplete: boolean;
}

class MealWindowGrouper {
  private readonly WINDOW_DURATION_MINUTES = 5;
  private activeMealWindows: Map<string, MealWindow> = new Map();
  
  async processMealLog(userId: string, mealData: MealData): Promise<GroupingResult> {
    const currentTime = new Date();
    const activeWindow = this.getActiveMealWindow(userId, currentTime);
    
    if (activeWindow) {
      // Add to existing window
      activeWindow.meals.push(mealData);
      activeWindow.windowEnd = currentTime;
      
      // Re-analyze combined meal
      const combinedAnalysis = await this.analyzeCombinedMeal(activeWindow.meals);
      
      return {
        groupingType: 'added_to_window',
        mealWindow: activeWindow,
        combinedAnalysis,
        shouldTriggerCalculation: true,
        message: "Added to your current meal"
      };
    } else {
      // Start new window
      const newWindow: MealWindow = {
        windowStart: currentTime,
        windowEnd: new Date(currentTime.getTime() + (this.WINDOW_DURATION_MINUTES * 60 * 1000)),
        meals: [mealData],
        isComplete: false
      };
      
      this.activeMealWindows.set(userId, newWindow);
      
      // Schedule window completion
      this.scheduleWindowCompletion(userId, newWindow);
      
      return {
        groupingType: 'new_window',
        mealWindow: newWindow,
        combinedAnalysis: await this.analyzeCombinedMeal([mealData]),
        shouldTriggerCalculation: true,
        message: "Started tracking this meal"
      };
    }
  }
  
  private getActiveMealWindow(userId: string, currentTime: Date): MealWindow | null {
    const window = this.activeMealWindows.get(userId);
    
    if (!window) return null;
    
    // Check if window is still active (within 5 minutes of last addition)
    const timeSinceLastMeal = currentTime.getTime() - window.windowEnd.getTime();
    const isWithinWindow = timeSinceLastMeal <= (this.WINDOW_DURATION_MINUTES * 60 * 1000);
    
    return isWithinWindow ? window : null;
  }
  
  private async analyzeCombinedMeal(meals: MealData[]): Promise<CombinedMealAnalysis> {
    const totalNutrition = meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + meal.calories,
        protein: totals.protein + meal.protein,
        carbs: totals.carbs + meal.carbs,
        fat: totals.fat + meal.fat,
        fiber: totals.fiber + meal.fiber
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
    
    // Analyze nutritional balance
    const proteinCalories = totalNutrition.protein * 4;
    const carbCalories = totalNutrition.carbs * 4;
    const fatCalories = totalNutrition.fat * 9;
    
    const proteinPercent = Math.round((proteinCalories / totalNutrition.calories) * 100);
    const carbPercent = Math.round((carbCalories / totalNutrition.calories) * 100);
    const fatPercent = Math.round((fatCalories / totalNutrition.calories) * 100);
    
    return {
      totalNutrition,
      macroDistribution: { proteinPercent, carbPercent, fatPercent },
      mealType: this.classifyMealType(totalNutrition),
      nutritionalFlags: this.generateNutritionalFlags(totalNutrition, proteinPercent),
      componentCount: meals.length
    };
  }
  
  private classifyMealType(nutrition: any): string {
    if (nutrition.calories < 150) return 'light_snack';
    if (nutrition.calories < 300) return 'snack';
    if (nutrition.calories < 600) return 'meal';
    return 'large_meal';
  }
  
  private generateNutritionalFlags(nutrition: any, proteinPercent: number): string[] {
    const flags: string[] = [];
    
    if (proteinPercent < 10) flags.push('low_protein');
    if (proteinPercent > 40) flags.push('high_protein');
    if (nutrition.fiber > 8) flags.push('high_fiber');
    if (nutrition.calories > 800) flags.push('high_calorie');
    
    return flags;
  }
  
  private scheduleWindowCompletion(userId: string, window: MealWindow): void {
    setTimeout(() => {
      window.isComplete = true;
      this.activeMealWindows.delete(userId);
      
      // Optional: Trigger final meal analysis or recommendations
      this.onMealWindowComplete(userId, window);
    }, this.WINDOW_DURATION_MINUTES * 60 * 1000);
  }
  
  private async onMealWindowComplete(userId: string, window: MealWindow): Promise<void> {
    // V0.1: Simple completion logging
    // V0.2+: Could trigger pattern analysis or proactive suggestions
    
    console.log(`Meal window completed for user ${userId}: ${window.meals.length} items logged`);
  }
}
```

---

## 🔄 System Integration Patterns

### **V0.1 Event-Driven Integration**

```typescript
// Main Macro Calculator AI Implementation
class MacroCalculatorAI extends BaseAISystem {
  constructor(
    private mealWindowGrouper: MealWindowGrouper,
    private goalValidator: GoalValidator,
    private cacheManager: MacroCacheManager
  ) {
    super('macro_calculator');
  }
  
  async processCalculationRequest(request: CalculationRequest): Promise<CalculationResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Validate request and goals
      const validation = await this.validateRequest(request);
      if (!validation.isValid) {
        return this.handleValidationError(validation);
      }
      
      // 2. Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = await this.cacheManager.get(cacheKey);
      if (cachedResult && !this.isCacheStale(cachedResult)) {
        return this.addPerformanceMetadata(cachedResult, startTime, 'cache_hit');
      }
      
      // 3. Handle meal grouping for new meal logs
      let groupingResult: GroupingResult | null = null;
      if (request.trigger_type === 'meal_logged') {
        groupingResult = await this.mealWindowGrouper.processMealLog(
          request.user_id, 
          request.nutrition_data
        );
      }
      
      // 4. Perform calculations
      const calculations = await this.performCalculations(request, groupingResult);
      
      // 5. Generate insights and recommendations
      const insights = await this.generateInsights(calculations, request.user_context);
      
      // 6. Format response for different consumers
      const response = await this.formatResponse(calculations, insights, groupingResult);
      
      // 7. Cache results
      await this.cacheManager.set(cacheKey, response);
      
      // 8. Log through Data Validation Gateway
      await this.logCalculation(request, response, startTime);
      
      return this.addPerformanceMetadata(response, startTime, 'calculated');
      
    } catch (error) {
      return this.handleCalculationError(error, request, startTime);
    }
  }
  
  private async performCalculations(
    request: CalculationRequest, 
    groupingResult?: GroupingResult
  ): Promise<CalculationResults> {
    
    // Get all meals for today
    const todaysMeals = await this.getTodaysMeals(request.user_id);
    
    // If this is a new meal, add it to the calculation
    if (request.trigger_type === 'meal_logged') {
      // Use grouped meal data if available
      const mealToAdd = groupingResult?.combinedAnalysis?.totalNutrition || request.nutrition_data.total_nutrition;
      todaysMeals.push(mealToAdd);
    }
    
    // Calculate daily totals
    const dailyTotals = calculateDailyTotals(todaysMeals);
    
    // Calculate goal progress
    const goalProgress = calculateGoalProgress(dailyTotals, request.user_context.daily_goals);
    
    // Calculate confidence score based on meal confidence scores
    const overallConfidence = this.calculateOverallConfidence(todaysMeals);
    
    return {
      dailyTotals,
      goalProgress,
      calculationConfidence: overallConfidence,
      mealCount: todaysMeals.length,
      calculationTimestamp: new Date(),
      groupingInfo: groupingResult
    };
  }
  
  private async generateInsights(
    calculations: CalculationResults, 
    userContext: UserContext
  ): Promise<InsightsAndRecommendations> {
    
    // V0.1: Basic template-based insights with simple AI enhancement
    const timeOfDay = this.getTimeOfDayContext();
    const progress = calculations.goalProgress;
    
    // Simple insight generation
    const primaryInsight = this.generatePrimaryInsight(progress, timeOfDay);
    const recommendations = await this.generateBasicRecommendations(calculations, userContext);
    const celebrationTriggers = this.checkCelebrationTriggers(progress);
    const concernFlags = this.checkConcernFlags(calculations, userContext);
    
    return {
      primary_insight: primaryInsight,
      recommendations,
      celebration_triggers: celebrationTriggers,
      concern_flags: concernFlags,
      insight_confidence: 0.9,
      generation_method: 'template_based'
    };
  }
  
  private generatePrimaryInsight(progress: GoalProgress, timeOfDay: string): string {
    // V0.1: Template-based insights focused on most relevant macro
    const macros = [
      { name: 'protein', percentage: progress.protein_percentage },
      { name: 'calories', percentage: progress.calories_percentage },
      { name: 'carbs', percentage: progress.carbs_percentage },
      { name: 'fat', percentage: progress.fat_percentage }
    ];
    
    // Find the macro that's most relevant (closest to goal or most behind)
    const sortedMacros = macros.sort((a, b) => Math.abs(100 - b.percentage) - Math.abs(100 - a.percentage));
    const focusMacro = sortedMacros[0];
    
    if (focusMacro.percentage >= 90) {
      return `Excellent! You're ${focusMacro.percentage}% to your ${focusMacro.name} goal - right on track!`;
    } else if (focusMacro.percentage >= 70) {
      return `You're ${focusMacro.percentage}% to your ${focusMacro.name} goal with ${this.getMealsRemainingContext(timeOfDay)} - looking good!`;
    } else if (focusMacro.percentage >= 50) {
      return `You're ${focusMacro.percentage}% to your ${focusMacro.name} goal - plenty of time to reach it today!`;
    } else {
      return `You're ${focusMacro.percentage}% to your ${focusMacro.name} goal - let's focus on ${focusMacro.name}-rich foods today!`;
    }
  }
  
  private async generateBasicRecommendations(
    calculations: CalculationResults, 
    userContext: UserContext
  ): Promise<Recommendation[]> {
    
    const recommendations: Recommendation[] = [];
    const progress = calculations.goalProgress;
    const remaining = this.calculateRemainingMacros(calculations, userContext);
    
    // V0.1: Simple gap-based recommendations
    if (remaining.protein > 20) {
      recommendations.push({
        type: 'protein_suggestion',
        message: `You need ${remaining.protein}g more protein today`,
        specific_addition: `6oz chicken breast would add ~42g protein`,
        priority: 'high'
      });
    }
    
    if (remaining.calories > 400 && progress.calories_percentage < 80) {
      recommendations.push({
        type: 'calorie_suggestion',
        message: `You have ${remaining.calories} calories remaining for today`,
        specific_addition: `Consider a balanced meal with protein and healthy carbs`,
        priority: 'medium'
      });
    }
    
    // Check for macro imbalances
    if (progress.protein_percentage < 50 && progress.calories_percentage > 70) {
      recommendations.push({
        type: 'balance_suggestion',
        message: `Your protein is behind compared to overall calories`,
        specific_addition: `Focus on protein-rich foods for remaining meals`,
        priority: 'high'
      });
    }
    
    return recommendations;
  }
  
  private checkCelebrationTriggers(progress: GoalProgress): string[] {
    const celebrations: string[] = [];
    
    if (progress.protein_percentage >= 100) celebrations.push('protein_goal_achieved');
    if (progress.calories_percentage >= 90 && progress.calories_percentage <= 110) {
      celebrations.push('calorie_goal_on_track');
    }
    if (progress.overall_balance_score > 85) celebrations.push('balanced_nutrition');
    
    return celebrations;
  }
  
  private checkConcernFlags(calculations: CalculationResults, userContext: UserContext): string[] {
    const concerns: string[] = [];
    const progress = calculations.goalProgress;
    
    if (progress.calories_percentage > 150) concerns.push('significant_overage');
    if (progress.protein_percentage < 30 && calculations.mealCount >= 3) {
      concerns.push('protein_deficiency_risk');
    }
    if (calculations.calculationConfidence < 0.7) concerns.push('low_calculation_confidence');
    
    return concerns;
  }
  
  private async formatResponse(
    calculations: CalculationResults,
    insights: InsightsAndRecommendations,
    groupingResult?: GroupingResult
  ): Promise<CalculationResponse> {
    
    // Format for different consumers
    const chatResponse = this.formatChatResponse(calculations, insights, groupingResult);
    const dashboardData = this.formatDashboardData(calculations);
    
    return {
      calculation_results: {
        daily_totals: calculations.dailyTotals,
        goal_progress: calculations.goalProgress,
        calculation_confidence: calculations.calculationConfidence,
        time_of_day_context: this.getTimeOfDayContext()
      },
      insights_and_recommendations: insights,
      chat_response: chatResponse,
      dashboard_data: dashboardData,
      system_metadata: {
        calculation_time_ms: 0, // Will be set by addPerformanceMetadata
        cache_status: 'updated',
        audit_trail_logged: true,
        next_calculation_trigger: 'next_meal_log',
        grouping_info: groupingResult
      }
    };
  }
  
  private formatChatResponse(
    calculations: CalculationResults,
    insights: InsightsAndRecommendations,
    groupingResult?: GroupingResult
  ): ChatResponse {
    
    let encouragement = "Great choice! ";
    
    // Add grouping context if applicable
    if (groupingResult?.groupingType === 'added_to_window') {
      encouragement += `${groupingResult.message}. `;
    }
    
    // Add primary insight
    encouragement += insights.primary_insight;
    
    // Add celebration if applicable
    if (insights.celebration_triggers.includes('protein_goal_achieved')) {
      encouragement += " 🎉 You hit your protein goal!";
    }
    
    // Simple education note
    let educationNote = "";
    if (calculations.goalProgress.protein_percentage > 80) {
      educationNote = "Protein helps keep you satisfied and supports muscle health";
    } else if (calculations.goalProgress.calories_percentage > 90) {
      educationNote = "You're doing great staying consistent with your nutrition goals";
    }
    
    return {
      encouragement,
      education_note: educationNote,
      forward_momentum: "How does that feel?"
    };
  }
  
  private formatDashboardData(calculations: CalculationResults): DashboardData {
    const progress = calculations.goalProgress;
    
    return {
      macro_rings_update: {
        calories: {
          current: Math.round(calculations.dailyTotals.calories),
          goal: calculations.dailyTotals.calories, // Will be replaced with actual goal
          percentage: progress.calories_percentage
        },
        protein: {
          current: Math.round(calculations.dailyTotals.protein),
          goal: calculations.dailyTotals.protein, // Will be replaced with actual goal
          percentage: progress.protein_percentage
        },
        carbs: {
          current: Math.round(calculations.dailyTotals.carbs),
          goal: calculations.dailyTotals.carbs, // Will be replaced with actual goal
          percentage: progress.carbs_percentage
        },
        fat: {
          current: Math.round(calculations.dailyTotals.fat),
          goal: calculations.dailyTotals.fat, // Will be replaced with actual goal
          percentage: progress.fat_percentage
        }
      },
      daily_summary: `${calculations.mealCount} meals logged, ${progress.protein_percentage}% protein goal achieved`,
      balance_score: progress.overall_balance_score
    };
  }
}

// Goal Setting Integration
class GoalSettingAssistant {
  async processGoalSettingRequest(profile: UserProfile): Promise<GoalSettingResponse> {
    // Calculate basic goals
    const recommendedGoals = calculateBasicGoals(profile);
    
    // Validate for safety
    const validation = validateGoalSafety(recommendedGoals, profile);
    
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        requiresCrisisIntervention: validation.requiresCrisisIntervention
      };
    }
    
    // Format recommendations with rationale
    return {
      success: true,
      recommended_goals: recommendedGoals,
      rationale: this.generateGoalRationale(recommendedGoals, profile),
      alternatives: this.generateAlternativeGoals(recommendedGoals, profile),
      safety_validation: validation,
      next_steps: "These goals provide a healthy foundation. Want to use these or adjust them?"
    };
  }
  
  private generateGoalRationale(goals: UserGoals, profile: UserProfile): string {
    const goalType = profile.goal === 'lose' ? 'weight loss' : 
                    profile.goal === 'bulk' ? 'muscle building' : 'maintenance';
    
    return `Based on your ${profile.weight_kg}kg weight, ${profile.activity_level} activity level, and ${goalType} goal, ` +
           `these targets provide ${goals.daily_calorie_goal} calories with ${goals.protein_goal}g protein to support your objectives safely.`;
  }
  
  private generateAlternativeGoals(goals: UserGoals, profile: UserProfile): AlternativeGoals[] {
    const alternatives: AlternativeGoals[] = [];
    
    // Conservative option (slower progress)
    if (profile.goal === 'lose') {
      alternatives.push({
        name: 'Conservative',
        goals: {
          ...goals,
          daily_calorie_goal: goals.daily_calorie_goal + 200 // Smaller deficit
        },
        description: 'Slower but more sustainable weight loss'
      });
    }
    
    // High protein option
    alternatives.push({
      name: 'High Protein',
      goals: {
        ...goals,
        protein_goal: Math.round(goals.protein_goal * 1.3),
        carb_goal: Math.round(goals.carb_goal * 0.85)
      },
      description: 'Higher protein for muscle preservation and satiety'
    });
    
    return alternatives;
  }
}
```

---

## 🗄️ Caching & Performance Implementation

### **V0.1 Macro Calculation Cache System**

```typescript
interface CacheEntry {
  key: string;
  data: CalculationResponse;
  timestamp: Date;
  ttl_minutes: number;
  user_id: string;
  invalidation_triggers: string[];
}

class MacroCacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL_MINUTES = 5;
  
  generateCacheKey(request: CalculationRequest): string {
    // Create deterministic key based on user and meal state
    const mealIds = request.user_context.todays_meals?.map(m => m.id).sort().join('-') || 'no-meals';
    const goalHash = this.hashGoals(request.user_context.daily_goals);
    const dateKey = new Date().toISOString().split('T')[0]; // Today's date
    
    return `macro_calc_${request.user_id}_${dateKey}_${mealIds}_${goalHash}`;
  }
  
  async get(cacheKey: string): Promise<CalculationResponse | null> {
    const entry = this.cache.get(cacheKey);
    
    if (!entry) return null;
    
    // Check TTL expiration
    const ageMinutes = (Date.now() - entry.timestamp.getTime()) / (1000 * 60);
    if (ageMinutes > entry.ttl_minutes) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.data;
  }
  
  async set(cacheKey: string, data: CalculationResponse, userId: string): Promise<void> {
    const entry: CacheEntry = {
      key: cacheKey,
      data,
      timestamp: new Date(),
      ttl_minutes: this.DEFAULT_TTL_MINUTES,
      user_id: userId,
      invalidation_triggers: ['meal_updated', 'goal_changed', 'meal_deleted']
    };
    
    this.cache.set(cacheKey, entry);
    
    // Schedule automatic cleanup
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, this.DEFAULT_TTL_MINUTES * 60 * 1000);
  }
  
  async invalidateUserCache(userId: string, trigger: string): Promise<void> {
    // Remove all cache entries for user when data changes
    for (const [key, entry] of this.cache.entries()) {
      if (entry.user_id === userId && entry.invalidation_triggers.includes(trigger)) {
        this.cache.delete(key);
      }
    }
  }
  
  private hashGoals(goals: UserGoals): string {
    // Simple hash of goals for cache key
    const goalString = `${goals.daily_calorie_goal}_${goals.protein_goal}_${goals.carb_goal}_${goals.fat_goal}`;
    return Buffer.from(goalString).toString('base64').substring(0, 8);
  }
  
  // Performance monitoring
  getCacheStats(): CacheStats {
    const now = Date.now();
    const activeEntries = Array.from(this.cache.values()).filter(entry => {
      const ageMinutes = (now - entry.timestamp.getTime()) / (1000 * 60);
      return ageMinutes <= entry.ttl_minutes;
    });
    
    return {
      total_entries: this.cache.size,
      active_entries: activeEntries.length,
      memory_usage_kb: this.estimateMemoryUsage(),
      oldest_entry_age_minutes: this.getOldestEntryAge()
    };
  }
}
```

### **V0.1 Performance Monitoring**

```typescript
class PerformanceMonitor {
  private performanceLogs: PerformanceLog[] = [];
  
  async trackCalculation(
    operation: string, 
    duration_ms: number, 
    request: CalculationRequest,
    result: CalculationResponse
  ): Promise<void> {
    
    const performanceLog: PerformanceLog = {
      operation,
      duration_ms,
      timestamp: new Date(),
      user_id: request.user_id,
      trigger_type: request.trigger_type,
      meal_count: request.user_context.todays_meals?.length || 0,
      cache_hit: result.system_metadata.cache_status === 'hit',
      success: true,
      performance_tier: this.classifyPerformance(duration_ms, operation)
    };
    
    this.performanceLogs.push(performanceLog);
    
    // Alert on performance issues
    if (duration_ms > this.getPerformanceSLA(operation)) {
      await this.alertPerformanceIssue(performanceLog);
    }
    
    // Cleanup old logs (keep last 1000 entries)
    if (this.performanceLogs.length > 1000) {
      this.performanceLogs = this.performanceLogs.slice(-1000);
    }
  }
  
  private getPerformanceSLA(operation: string): number {
    const slas = {
      'real_time_calculation': 2000,    // 2 seconds for meal logging
      'dashboard_refresh': 1000,        // 1 second for dashboard
      'background_calculation': 5000,   // 5 seconds for goal changes
      'ai_insight_generation': 3000     // 3 seconds for AI insights
    };
    
    return slas[operation] || 2000;
  }
  
  private classifyPerformance(duration_ms: number, operation: string): string {
    const sla = this.getPerformanceSLA(operation);
    
    if (duration_ms <= sla * 0.5) return 'excellent';
    if (duration_ms <= sla * 0.8) return 'good';
    if (duration_ms <= sla) return 'acceptable';
    return 'poor';
  }
  
  getPerformanceReport(): PerformanceReport {
    const recent = this.performanceLogs.slice(-100); // Last 100 operations
    
    return {
      average_duration_ms: recent.reduce((sum, log) => sum + log.duration_ms, 0) / recent.length,
      cache_hit_rate: recent.filter(log => log.cache_hit).length / recent.length,
      sla_compliance_rate: recent.filter(log => log.performance_tier !== 'poor').length / recent.length,
      operations_by_type: this.groupByOperationType(recent),
      performance_trends: this.calculateTrends(recent)
    };
  }
}
```

---

## 🧪 Testing & Validation Framework

### **V0.1 Accuracy Testing**

```typescript
describe('Macro Calculator AI - Accuracy Tests', () => {
  let macroCalculator: MacroCalculatorAI;
  
  beforeEach(() => {
    macroCalculator = new MacroCalculatorAI(mockDependencies);
  });
  
  describe('Daily Totals Calculation', () => {
    it('should calculate exact macro totals from multiple meals', () => {
      const meals = [
        { calories: 420, protein: 45, carbs: 8, fat: 12, fiber: 2 },
        { calories: 380, protein: 25, carbs: 35, fat: 15, fiber: 5 },
        { calories: 220, protein: 15, carbs: 20, fat: 8, fiber: 3 }
      ];
      
      const totals = calculateDailyTotals(meals);
      
      expect(totals.calories).toBe(1020);
      expect(totals.protein).toBe(85);
      expect(totals.carbs).toBe(63);
      expect(totals.fat).toBe(35);
      expect(totals.fiber).toBe(10);
    });
    
    it('should handle decimal precision correctly', () => {
      const meals = [
        { calories: 123.7, protein: 12.3, carbs: 8.9, fat: 5.1, fiber: 2.4 },
        { calories: 256.3, protein: 18.7, carbs: 15.1, fat: 9.9, fiber: 3.6 }
      ];
      
      const totals = calculateDailyTotals(meals);
      
      expect(totals.calories).toBe(380.0);
      expect(totals.protein).toBe(31.0);
      expect(totals.carbs).toBe(24.0);
      expect(totals.fat).toBe(15.0);
      expect(totals.fiber).toBe(6.0);
    });
  });
  
  describe('Goal Progress Calculation', () => {
    it('should calculate accurate percentages for goal progress', () => {
      const totals = { calories: 1440, protein: 108, carbs: 144, fat: 48, fiber: 24 };
      const goals = { daily_calorie_goal: 1800, protein_goal: 120, carb_goal: 180, fat_goal: 60 };
      
      const progress = calculateGoalProgress(totals, goals);
      
      expect(progress.calories_percentage).toBe(80);
      expect(progress.protein_percentage).toBe(90);
      expect(progress.carbs_percentage).toBe(80);
      expect(progress.fat_percentage).toBe(80);
    });
    
    it('should handle over-goal scenarios correctly', () => {
      const totals = { calories: 2160, protein: 150, carbs: 200, fat: 70, fiber: 30 };
      const goals = { daily_calorie_goal: 1800, protein_goal: 120, carb_goal: 180, fat_goal: 60 };
      
      const progress = calculateGoalProgress(totals, goals);
      
      expect(progress.calories_percentage).toBe(120);
      expect(progress.protein_percentage).toBe(125);
      expect(progress.carbs_percentage).toBe(111);
      expect(progress.fat_percentage).toBe(117);
    });
  });
  
  describe('Goal Setting Validation', () => {
    it('should reject dangerously low calorie goals', () => {
      const profile = { weight_kg: 70, height_cm: 170, age: 30, gender: 'female', activity_level: 'moderate', goal: 'lose' };
      const dangerousGoals = { daily_calorie_goal: 800, protein_goal: 60, carb_goal: 80, fat_goal: 20 };
      
      const validation = validateGoalSafety(dangerousGoals, profile);
      
      expect(validation.isValid).toBe(false);
      expect(validation.requiresCrisisIntervention).toBe(true);
      expect(validation.errors).toContain('Calorie goal too low. Minimum recommended: 1200 calories');
    });
    
    it('should accept reasonable goals with warnings for edge cases', () => {
      const profile = { weight_kg: 80, height_cm: 180, age: 25, gender: 'male', activity_level: 'active', goal: 'bulk' };
      const goals = calculateBasicGoals(profile);
      
      const validation = validateGoalSafety(goals, profile);
      
      expect(validation.isValid).toBe(true);
      expect(validation.requiresCrisisIntervention).toBe(false);
      expect(validation.errors).toHaveLength(0);
    });
  });
});

describe('Time Window Meal Grouping', () => {
  let grouper: MealWindowGrouper;
  
  beforeEach(() => {
    grouper = new MealWindowGrouper();
  });
  
  it('should group meals logged within 5 minutes', async () => {
    const userId = 'test_user';
    const baseTime = new Date();
    
    // Log first item
    const meal1 = { id: '1', calories: 150, protein: 2, carbs: 35, fat: 0, logged_at: baseTime };
    const result1 = await grouper.processMealLog(userId, meal1);
    
    expect(result1.groupingType).toBe('new_window');
    expect(result1.mealWindow.meals).toHaveLength(1);
    
    // Log second item 2 minutes later
    const meal2 = { id: '2', calories: 80, protein: 0, carbs: 20, fat: 0, logged_at: new Date(baseTime.getTime() + 2 * 60 * 1000) };
    const result2 = await grouper.processMealLog(userId, meal2);
    
    expect(result2.groupingType).toBe('added_to_window');
    expect(result2.mealWindow.meals).toHaveLength(2);
    expect(result2.combinedAnalysis.totalNutrition.calories).toBe(230);
  });
  
  it('should start new window after 5-minute gap', async () => {
    const userId = 'test_user';
    const baseTime = new Date();
    
    // Log first item
    const meal1 = { id: '1', calories: 150, protein: 2, carbs: 35, fat: 0, logged_at: baseTime };
    await grouper.processMealLog(userId, meal1);
    
    // Log second item 6 minutes later (outside window)
    const meal2 = { id: '2', calories: 300, protein: 25, carbs: 10, fat: 15, logged_at: new Date(baseTime.getTime() + 6 * 60 * 1000) };
    const result2 = await grouper.processMealLog(userId, meal2);
    
    expect(result2.groupingType).toBe('new_window');
    expect(result2.mealWindow.meals).toHaveLength(1);
  });
});

describe('Performance Testing', () => {
  it('should complete calculations within SLA limits', async () => {
    const request = createMockCalculationRequest();
    const startTime = Date.now();
    
    const result = await macroCalculator.processCalculationRequest(request);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(2000); // 2 second SLA
    expect(result.calculation_results).toBeDefined();
    expect(result.system_metadata.calculation_time_ms).toBeLessThan(2000);
  });
  
  it('should handle concurrent calculation requests efficiently', async () => {
    const requests = Array.from({ length: 10 }, () => createMockCalculationRequest());
    const startTime = Date.now();
    
    const results = await Promise.all(
      requests.map(req => macroCalculator.processCalculationRequest(req))
    );
    
    const totalDuration = Date.now() - startTime;
    
    expect(results).toHaveLength(10);
    expect(results.every(r => r.calculation_results)).toBe(true);
    expect(totalDuration).toBeLessThan(5000); // Should handle 10 concurrent requests in 5 seconds
  });
});
```

### **V0.1 Integration Testing**

```typescript
describe('System Integration Tests', () => {
  let testEnvironment: TestEnvironment;
  
  beforeEach(async () => {
    testEnvironment = await setupTestEnvironment();
  });
  
  it('should integrate with Food Recognition AI output', async () => {
    // Mock Food Recognition AI output
    const foodData = {
      recognized_foods: [
        { food_name: 'chicken breast, grilled', quantity_grams: 170, confidence: 0.95 }
      ],
      total_nutrition: { calories: 350, protein: 54, carbs: 0, fat: 8, fiber: 0 },
      confidence_overall: 0.95
    };
    
    const calculationRequest = {
      trigger_type: 'meal_logged',
      user_id: 'test_user',
      nutrition_data: foodData,
      user_context: {
        daily_goals: { daily_calorie_goal: 1800, protein_goal: 120, carb_goal: 180, fat_goal: 60 },
        todays_meals: []
      }
    };
    
    const result = await testEnvironment.macroCalculator.processCalculationRequest(calculationRequest);
    
    expect(result.calculation_results.daily_totals.calories).toBe(350);
    expect(result.calculation_results.daily_totals.protein).toBe(54);
    expect(result.calculation_results.goal_progress.protein_percentage).toBe(45);
    expect(result.chat_response.encouragement).toContain('Great choice!');
  });
  
  it('should trigger Data Validation Gateway for audit trails', async () => {
    const request = createMockCalculationRequest();
    const auditSpy = jest.spyOn(testEnvironment.dataValidationGateway, 'logCalculation');
    
    await testEnvironment.macroCalculator.processCalculationRequest(request);
    
    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        operation_type: 'macro_calculation',
        user_id: request.user_id,
        input_data: expect.any(Object),
        output_data: expect.any(Object),
        success: true
      })
    );
  });
  
  it('should route errors to Error Handler System', async () => {
    // Force database error
    jest.spyOn(testEnvironment.database, 'getTodaysMeals').mockRejectedValue(new Error('Database unavailable'));
    
    const errorHandlerSpy = jest.spyOn(testEnvironment.errorHandler, 'handleCalculationError');
    const request = createMockCalculationRequest();
    
    const result = await testEnvironment.macroCalculator.processCalculationRequest(request);
    
    expect(errorHandlerSpy).toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error_message).toContain('calculation error');
  });
});
```

---

## 🚀 Deployment & Monitoring

### **V0.1 Production Deployment Checklist**

#### **Performance Monitoring**
- [ ] Set up calculation duration tracking with alerts > 2 seconds
- [ ] Monitor cache hit rates (target: >70% for repeated calculations)
- [ ] Track API cost per calculation (target: <$0.01 per request)
- [ ] Monitor memory usage for cache management

#### **Error Monitoring**
- [ ] Alert on calculation failures >5% rate
- [ ] Monitor goal validation failures requiring crisis intervention
- [ ] Track integration failures with Food Recognition AI
- [ ] Monitor database connection issues

#### **Business Metrics**
- [ ] Track calculation accuracy through user feedback
- [ ] Monitor goal-setting completion rates
- [ ] Track user engagement with recommendations
- [ ] Measure dashboard update responsiveness

### **V0.1 → V0.2 Migration Hooks**

#### **Behavioral Intelligence Integration Points**
```typescript
// V0.2 Enhancement Hook: Pattern-Aware Insights
class BehaviorallyAwareMacroCalculator extends MacroCalculatorAI {
  async generateInsights(calculations: CalculationResults, userContext: UserContext): Promise<InsightsAndRecommendations> {
    // V0.1: Basic template insights
    const basicInsights = await super.generateInsights(calculations, userContext);
    
    // V0.2: Add behavioral pattern awareness
    if (this.behavioralPsychologyAI) {
      const patterns = await this.behavioralPsychologyAI.analyzePatterns(userContext.user_id);
      const contextualInsights = await this.enhanceWithBehavioralContext(basicInsights, patterns);
      return contextualInsights;
    }