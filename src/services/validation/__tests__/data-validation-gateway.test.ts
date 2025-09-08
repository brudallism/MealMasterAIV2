// Data Validation Gateway Test Suite
import { dataValidationGateway, validateFoodRecognitionInput, validateFoodRecognitionOutput } from '../data-validation-gateway';
import type { FoodRecognitionInput, FoodRecognitionResponse } from '../../ai/food-recognition-ai';

// Mock dependencies
jest.mock('../audit-trail-manager', () => ({
  auditTrailManager: {
    validateAndAudit: jest.fn(),
    getSystemHealthStatus: jest.fn(),
    getAuditMetrics: jest.fn(),
    performIntegrityCheck: jest.fn()
  }
}));

describe('DataValidationGateway', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Food Recognition AI Integration', () => {
    const mockFoodInput: FoodRecognitionInput = {
      food_description: '2 slices of whole wheat bread with peanut butter',
      context: 'breakfast',
      user_id: 'test-user-123',
      conversation_history: 'User is logging breakfast meal'
    };

    const mockFoodOutput: FoodRecognitionResponse = {
      success: true,
      recognized_foods: [
        {
          food_name: 'Whole Wheat Bread',
          quantity: '2 slices',
          quantity_grams: 56,
          confidence: 0.95,
          data_source: 'spoonacular'
        },
        {
          food_name: 'Peanut Butter',
          quantity: '2 tablespoons',
          quantity_grams: 32,
          confidence: 0.92,
          data_source: 'usda'
        }
      ],
      total_nutrition: {
        calories: 350,
        protein: 16,
        carbs: 38,
        fat: 18
      },
      confidence_overall: 0.935,
      clarification_needed: false,
      accuracy_warnings: [],
      assumptions_made: [],
      data_sources: ['spoonacular', 'usda'],
      processing_notes: 'Successfully processed 2 food items'
    };

    it('should validate food recognition input successfully', async () => {
      const mockResponse = {
        success: true,
        auditTrailId: 'audit-123',
        operationId: 'op-123',
        overallStatus: 'passed' as const,
        totalProcessingTime: 150,
        errors: [],
        warnings: [],
        recommendations: []
      };

      const { auditTrailManager } = require('../audit-trail-manager');
      auditTrailManager.validateAndAudit.mockResolvedValue(mockResponse);

      const result = await validateFoodRecognitionInput(
        mockFoodInput,
        'test-user-123',
        'request-123'
      );

      expect(result.success).toBe(true);
      expect(result.overallStatus).toBe('passed');
      expect(auditTrailManager.validateAndAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          food_description: mockFoodInput.food_description,
          user_id: mockFoodInput.user_id
        }),
        'query',
        expect.objectContaining({
          userId: 'test-user-123',
          systemName: 'food_recognition_ai'
        })
      );
    });

    it('should validate food recognition output with nutritional consistency', async () => {
      const mockResponse = {
        success: true,
        auditTrailId: 'audit-124',
        operationId: 'op-124',
        overallStatus: 'passed' as const,
        totalProcessingTime: 200,
        errors: [],
        warnings: [],
        recommendations: []
      };

      const { auditTrailManager } = require('../audit-trail-manager');
      auditTrailManager.validateAndAudit.mockResolvedValue(mockResponse);

      const result = await validateFoodRecognitionOutput(
        mockFoodInput,
        mockFoodOutput,
        'test-user-123',
        'request-124'
      );

      expect(result.success).toBe(true);
      expect(auditTrailManager.validateAndAudit).toHaveBeenCalledWith(
        mockFoodOutput,
        'insert',
        expect.objectContaining({
          systemName: 'food_recognition_ai',
          operationType: 'output_validation'
        })
      );
    });

    it('should handle validation failures appropriately', async () => {
      const mockFailureResponse = {
        success: false,
        auditTrailId: 'audit-125',
        operationId: 'op-125',
        overallStatus: 'failed' as const,
        totalProcessingTime: 100,
        errors: ['Invalid food description format'],
        warnings: [],
        recommendations: ['Provide more specific food description']
      };

      const { auditTrailManager } = require('../audit-trail-manager');
      auditTrailManager.validateAndAudit.mockResolvedValue(mockFailureResponse);

      const invalidInput: FoodRecognitionInput = {
        food_description: '',
        context: '',
        user_id: 'test-user-123'
      };

      const result = await validateFoodRecognitionInput(invalidInput, 'test-user-123');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid food description format');
      expect(result.recommendations).toContain('Provide more specific food description');
    });
  });

  describe('User Facing AI Integration', () => {
    it('should validate user input messages', async () => {
      const mockResponse = {
        success: true,
        auditTrailId: 'audit-200',
        operationId: 'op-200',
        overallStatus: 'passed' as const,
        totalProcessingTime: 50,
        errors: [],
        warnings: [],
        recommendations: []
      };

      const { auditTrailManager } = require('../audit-trail-manager');
      auditTrailManager.validateAndAudit.mockResolvedValue(mockResponse);

      const result = await dataValidationGateway.validateUserFacing(
        {
          input: {
            message: 'I had a chicken salad for lunch',
            userId: 'test-user-123'
          },
          validationType: 'input_validation'
        },
        {
          systemName: 'user_facing_ai',
          operationType: 'input_validation',
          userId: 'test-user-123'
        }
      );

      expect(result.success).toBe(true);
      expect(auditTrailManager.validateAndAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'I had a chicken salad for lunch',
          userId: 'test-user-123'
        }),
        'query',
        expect.objectContaining({
          systemName: 'user_facing_ai',
          tableName: 'user_interactions'
        })
      );
    });

    it('should validate intent classification results', async () => {
      const mockResponse = {
        success: true,
        auditTrailId: 'audit-201',
        operationId: 'op-201',
        overallStatus: 'passed' as const,
        totalProcessingTime: 75,
        errors: [],
        warnings: [],
        recommendations: []
      };

      const { auditTrailManager } = require('../audit-trail-manager');
      auditTrailManager.validateAndAudit.mockResolvedValue(mockResponse);

      const result = await dataValidationGateway.validateUserFacing(
        {
          input: {
            message: 'How much protein have I eaten today?',
            userId: 'test-user-123'
          },
          output: {
            response: 'You have consumed 45g of protein today, which is 75% of your goal.',
            intent: 'progress_check',
            confidence: 0.92
          },
          validationType: 'intent_classification'
        },
        {
          systemName: 'user_facing_ai',
          operationType: 'business_logic_validation',
          userId: 'test-user-123'
        }
      );

      expect(result.success).toBe(true);
      expect(auditTrailManager.validateAndAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'How much protein have I eaten today?',
          classified_intent: 'progress_check',
          confidence: 0.92
        }),
        'query',
        expect.any(Object)
      );
    });
  });

  describe('Macro Calculator AI Integration', () => {
    const mockMacroInput = {
      userId: 'test-user-123',
      dailyMeals: [
        {
          food_name: 'Chicken Breast',
          calories: 250,
          protein: 46,
          carbs: 0,
          fat: 6
        },
        {
          food_name: 'Brown Rice',
          calories: 220,
          protein: 5,
          carbs: 45,
          fat: 2
        }
      ],
      goals: {
        calories: 2000,
        protein: 150,
        carbs: 200,
        fat: 65
      }
    };

    const mockMacroOutput = {
      currentTotals: {
        calories: 470,
        protein: 51,
        carbs: 45,
        fat: 8
      },
      remaining: {
        calories: 1530,
        protein: 99,
        carbs: 155,
        fat: 57
      },
      percentages: {
        calories: 23.5,
        protein: 34.0,
        carbs: 22.5,
        fat: 12.3
      }
    };

    it('should validate macro calculations', async () => {
      const mockResponse = {
        success: true,
        auditTrailId: 'audit-300',
        operationId: 'op-300',
        overallStatus: 'passed' as const,
        totalProcessingTime: 100,
        errors: [],
        warnings: [],
        recommendations: []
      };

      const { auditTrailManager } = require('../audit-trail-manager');
      auditTrailManager.validateAndAudit.mockResolvedValue(mockResponse);

      const result = await dataValidationGateway.validateMacroCalculator(
        {
          input: mockMacroInput,
          output: mockMacroOutput,
          validationType: 'calculation_validation'
        },
        {
          systemName: 'macro_calculator_ai',
          operationType: 'business_logic_validation',
          userId: 'test-user-123'
        }
      );

      expect(result.success).toBe(true);
      expect(auditTrailManager.validateAndAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          daily_meals: mockMacroInput.dailyMeals,
          calculated_totals: mockMacroOutput.currentTotals,
          goals: mockMacroInput.goals
        }),
        'update',
        expect.objectContaining({
          systemName: 'macro_calculator_ai',
          tableName: 'daily_meals'
        })
      );
    });

    it('should validate goal consistency', async () => {
      const mockResponse = {
        success: true,
        auditTrailId: 'audit-301',
        operationId: 'op-301',
        overallStatus: 'warning' as const,
        totalProcessingTime: 50,
        errors: [],
        warnings: ['Protein goal seems unusually high'],
        recommendations: ['Review protein requirements with nutritionist']
      };

      const { auditTrailManager } = require('../audit-trail-manager');
      auditTrailManager.validateAndAudit.mockResolvedValue(mockResponse);

      const highProteinGoals = {
        ...mockMacroInput,
        goals: {
          calories: 2000,
          protein: 300, // Unusually high
          carbs: 150,
          fat: 65
        }
      };

      const result = await dataValidationGateway.validateMacroCalculator(
        {
          input: highProteinGoals,
          validationType: 'goal_consistency'
        },
        {
          systemName: 'macro_calculator_ai',
          operationType: 'input_validation',
          userId: 'test-user-123'
        }
      );

      expect(result.overallStatus).toBe('warning');
      expect(result.warnings).toContain('Protein goal seems unusually high');
      expect(result.recommendations).toContain('Review protein requirements with nutritionist');
    });
  });

  describe('System Health and Monitoring', () => {
    it('should return system health status', async () => {
      const mockHealthStatus = {
        status: 'healthy' as const,
        uptime: 100,
        recentErrorRate: 2.1,
        avgResponseTime: 150,
        issues: [],
        recommendations: []
      };

      const { auditTrailManager } = require('../audit-trail-manager');
      auditTrailManager.getSystemHealthStatus.mockResolvedValue(mockHealthStatus);

      const health = await dataValidationGateway.getSystemHealth();

      expect(health.status).toBe('healthy');
      expect(health.recentErrorRate).toBe(2.1);
      expect(health.avgResponseTime).toBe(150);
    });

    it('should return validation metrics', async () => {
      const mockMetrics = {
        totalOperations: 1000,
        successRate: 96.5,
        avgProcessingTime: 200,
        errorCount: 35,
        warningCount: 89,
        tierBreakdown: {
          tier1: { pass: 950, fail: 30, warning: 20 },
          tier2: { pass: 920, fail: 40, warning: 40 },
          tier3: { pass: 900, fail: 45, warning: 55 }
        },
        systemBreakdown: {
          food_recognition_ai: { operations: 600, successRate: 97.2, avgTime: 180 },
          user_facing_ai: { operations: 300, successRate: 94.8, avgTime: 120 },
          macro_calculator_ai: { operations: 100, successRate: 98.0, avgTime: 50 }
        }
      };

      const { auditTrailManager } = require('../audit-trail-manager');
      auditTrailManager.getAuditMetrics.mockResolvedValue(mockMetrics);

      const metrics = await dataValidationGateway.getValidationMetrics('test-user-123', 24);

      expect(metrics.totalOperations).toBe(1000);
      expect(metrics.successRate).toBe(96.5);
      expect(metrics.systemBreakdown).toHaveProperty('food_recognition_ai');
      expect(metrics.systemBreakdown.food_recognition_ai.operations).toBe(600);
    });

    it('should perform integrity checks', async () => {
      const mockCheckResult = {
        checkId: 'check-123',
        status: 'healthy' as const,
        issuesFound: 0,
        details: {
          orphanedLogs: 0,
          missingAudits: 0,
          totalChecked: 1000
        }
      };

      const { auditTrailManager } = require('../audit-trail-manager');
      auditTrailManager.performIntegrityCheck.mockResolvedValue(mockCheckResult);

      const result = await dataValidationGateway.performIntegrityCheck();

      expect(result.status).toBe('healthy');
      expect(result.issuesFound).toBe(0);
      expect(result.details.totalChecked).toBe(1000);
    });
  });

  describe('Configuration and Error Handling', () => {
    it('should handle disabled system integration', async () => {
      const gatewayWithDisabledValidation = new (require('../data-validation-gateway').DataValidationGateway)({
        systemIntegration: {
          validateFoodRecognition: false,
          validateUserFacing: true,
          validateMacroCalculator: true
        }
      });

      const result = await gatewayWithDisabledValidation.validateFoodRecognition(
        {
          input: {
            food_description: 'test',
            context: 'test',
            user_id: 'test'
          },
          validationType: 'input_validation'
        },
        {
          systemName: 'food_recognition_ai',
          operationType: 'input_validation'
        }
      );

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('System validation disabled - passthrough mode');
    });

    it('should handle validation errors gracefully', async () => {
      const { auditTrailManager } = require('../audit-trail-manager');
      auditTrailManager.validateAndAudit.mockRejectedValue(new Error('Database connection failed'));

      try {
        await validateFoodRecognitionInput({
          food_description: 'test',
          context: 'test',
          user_id: 'test-user'
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Database connection failed');
      }
    });
  });
});

// Performance test
describe('DataValidationGateway Performance', () => {
  it('should complete validation within reasonable time limits', async () => {
    const mockResponse = {
      success: true,
      auditTrailId: 'audit-perf',
      operationId: 'op-perf',
      overallStatus: 'passed' as const,
      totalProcessingTime: 100,
      errors: [],
      warnings: [],
      recommendations: []
    };

    const { auditTrailManager } = require('../audit-trail-manager');
    auditTrailManager.validateAndAudit.mockResolvedValue(mockResponse);

    const startTime = Date.now();
    
    await validateFoodRecognitionInput({
      food_description: 'Large chicken breast with sweet potato',
      context: 'dinner',
      user_id: 'test-user-perf'
    });

    const executionTime = Date.now() - startTime;
    
    // Should complete within 1 second (including test overhead)
    expect(executionTime).toBeLessThan(1000);
  });
});