// Data Validation Gateway - Core 3-Tier Validation Engine
import { AuditHelper, type AuditContext, type ValidationResult } from '../audit/audit-helper';

export interface ValidationInput {
  data: any;
  operation: 'insert' | 'update' | 'delete' | 'batch' | 'query';
  context: {
    userId?: string;
    systemName: string;
    tableName: string;
    beforeState?: any;
    afterState?: any;
    businessContext?: any;
  };
}

export interface ValidationConfig {
  enableTier1: boolean;
  enableTier2: boolean;
  enableTier3: boolean;
  tier3Config?: {
    model: 'gpt-3.5-turbo' | 'gpt-4';
    maxTokens: number;
    temperature: number;
    confidenceThreshold: number;
  };
  strictMode: boolean; // Fail on warnings
  maxProcessingTimeMs: number;
}

export interface ValidationResponse {
  success: boolean;
  auditTrailId: string;
  operationId: string;
  overallStatus: 'passed' | 'failed' | 'warning';
  tier1Result?: ValidationResult;
  tier2Result?: ValidationResult;
  tier3Result?: ValidationResult;
  totalProcessingTime: number;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

const DEFAULT_CONFIG: ValidationConfig = {
  enableTier1: true,
  enableTier2: true,
  enableTier3: false, // V0.1 basic detection
  tier3Config: {
    model: 'gpt-3.5-turbo',
    maxTokens: 500,
    temperature: 0.1,
    confidenceThreshold: 0.7
  },
  strictMode: false,
  maxProcessingTimeMs: 30000
};

export class ValidationEngine {
  private config: ValidationConfig;
  
  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async validate(input: ValidationInput): Promise<ValidationResponse> {
    const startTime = Date.now();
    
    // Create audit trail
    const auditResult = await AuditHelper.createAuditTrail({
      userId: input.context.userId,
      systemName: input.context.systemName,
      operationType: input.operation,
      tableName: input.context.tableName,
      beforeState: input.context.beforeState,
      afterState: input.context.afterState,
      businessContext: input.context.businessContext
    });

    if (!auditResult) {
      return {
        success: false,
        auditTrailId: '',
        operationId: '',
        overallStatus: 'failed',
        totalProcessingTime: Date.now() - startTime,
        errors: ['Failed to create audit trail'],
        warnings: [],
        recommendations: ['Check database connectivity']
      };
    }

    const response: ValidationResponse = {
      success: false,
      auditTrailId: auditResult.auditTrailId,
      operationId: auditResult.operationId,
      overallStatus: 'passed',
      totalProcessingTime: 0,
      errors: [],
      warnings: [],
      recommendations: []
    };

    try {
      // Tier 1: Schema Validation
      if (this.config.enableTier1) {
        response.tier1Result = await this.runTier1Validation(input);
        await AuditHelper.logValidationResult(
          auditResult.operationId,
          auditResult.auditTrailId,
          response.tier1Result
        );
        
        if (response.tier1Result.result === 'fail') {
          response.overallStatus = 'failed';
          response.errors.push(...(response.tier1Result.errorMessages || []));
        } else if (response.tier1Result.result === 'warning') {
          response.overallStatus = 'warning';
          response.warnings.push(...(response.tier1Result.warnings || []));
        }
      }

      // Tier 2: Business Rules Validation (only if Tier 1 passed or warnings allowed)
      if (this.config.enableTier2 && (response.overallStatus !== 'failed' || !this.config.strictMode)) {
        response.tier2Result = await this.runTier2Validation(input);
        await AuditHelper.logValidationResult(
          auditResult.operationId,
          auditResult.auditTrailId,
          response.tier2Result
        );
        
        if (response.tier2Result.result === 'fail') {
          response.overallStatus = 'failed';
          response.errors.push(...(response.tier2Result.errorMessages || []));
        } else if (response.tier2Result.result === 'warning' && response.overallStatus !== 'failed') {
          response.overallStatus = 'warning';
          response.warnings.push(...(response.tier2Result.warnings || []));
        }
      }

      // Tier 3: AI Pattern Detection (only if previous tiers passed or warnings allowed)
      if (this.config.enableTier3 && (response.overallStatus !== 'failed' || !this.config.strictMode)) {
        response.tier3Result = await this.runTier3Validation(input);
        await AuditHelper.logValidationResult(
          auditResult.operationId,
          auditResult.auditTrailId,
          response.tier3Result
        );
        
        if (response.tier3Result.result === 'fail') {
          response.overallStatus = 'failed';
          response.errors.push(...(response.tier3Result.errorMessages || []));
        } else if (response.tier3Result.result === 'warning' && response.overallStatus !== 'failed') {
          response.overallStatus = 'warning';
          response.warnings.push(...(response.tier3Result.warnings || []));
        }
        
        response.recommendations.push(...(response.tier3Result.recommendations || []));
      }

      response.success = response.overallStatus !== 'failed';
      response.totalProcessingTime = Date.now() - startTime;

      // Update audit trail with final status
      await AuditHelper.updateAuditTrailStatus(
        auditResult.auditTrailId,
        response.overallStatus,
        response.errors.length > 0 ? { errors: response.errors } : undefined
      );

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      
      await AuditHelper.updateAuditTrailStatus(
        auditResult.auditTrailId,
        'failed',
        { error: errorMessage }
      );

      return {
        success: false,
        auditTrailId: auditResult.auditTrailId,
        operationId: auditResult.operationId,
        overallStatus: 'failed',
        totalProcessingTime: Date.now() - startTime,
        errors: [errorMessage],
        warnings: [],
        recommendations: ['Review validation engine configuration']
      };
    }
  }

  private async runTier1Validation(input: ValidationInput): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic schema validation based on operation type
      switch (input.operation) {
        case 'insert':
          if (!input.data) {
            errors.push('Insert operation requires data');
          }
          break;
          
        case 'update':
          if (!input.data || !input.context.beforeState) {
            errors.push('Update operation requires data and beforeState');
          }
          break;
          
        case 'delete':
          if (!input.context.beforeState) {
            errors.push('Delete operation requires beforeState');
          }
          break;
      }

      // Data type validation for meal logging operations
      if (input.context.tableName === 'daily_meals' && input.data) {
        if (typeof input.data.calories !== 'number' || input.data.calories < 0) {
          errors.push('Calories must be a positive number');
        }
        
        if (typeof input.data.protein !== 'number' || input.data.protein < 0) {
          errors.push('Protein must be a positive number');
        }
        
        if (typeof input.data.carbs !== 'number' || input.data.carbs < 0) {
          errors.push('Carbohydrates must be a positive number');
        }
        
        if (typeof input.data.fat !== 'number' || input.data.fat < 0) {
          errors.push('Fat must be a positive number');
        }

        if (typeof input.data.quantity_grams !== 'number' || input.data.quantity_grams <= 0) {
          errors.push('Quantity must be a positive number');
        }

        if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(input.data.meal_type)) {
          errors.push('Invalid meal type');
        }

        // Warnings for unusual values
        if (input.data.calories > 2000) {
          warnings.push('Unusually high calorie count for single meal');
        }
        
        if (input.data.quantity_grams > 1000) {
          warnings.push('Unusually large portion size');
        }
      }

      const result: ValidationResult = {
        tier: 1,
        type: 'schema',
        result: errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'pass'),
        processingTimeMs: Date.now() - startTime,
        errorMessages: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      return result;
      
    } catch (error) {
      return {
        tier: 1,
        type: 'schema',
        result: 'fail',
        processingTimeMs: Date.now() - startTime,
        errorMessages: ['Tier 1 validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
      };
    }
  }

  private async runTier2Validation(input: ValidationInput): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      const validationDetails: any = {};

      // Business rule validation for meal logging
      if (input.context.tableName === 'daily_meals' && input.data) {
        // Nutritional consistency checks
        const totalMacros = (input.data.protein || 0) + (input.data.carbs || 0) + (input.data.fat || 0);
        const expectedCalories = (input.data.protein || 0) * 4 + (input.data.carbs || 0) * 4 + (input.data.fat || 0) * 9;
        const actualCalories = input.data.calories || 0;
        
        validationDetails.macroBreakdown = {
          protein: input.data.protein,
          carbs: input.data.carbs,
          fat: input.data.fat,
          expectedCalories,
          actualCalories
        };

        // Allow 20% variance in calorie calculations
        const variance = Math.abs(expectedCalories - actualCalories) / expectedCalories;
        if (variance > 0.5) {
          errors.push('Nutritional data inconsistency: calories do not match macronutrients');
        } else if (variance > 0.2) {
          warnings.push('Minor nutritional inconsistency detected');
        }

        // Daily intake limits (business rules)
        const currentHour = new Date().getHours();
        if (input.data.meal_type === 'breakfast' && currentHour > 12) {
          warnings.push('Logging breakfast after noon');
        }
        
        if (input.data.meal_type === 'dinner' && currentHour < 15) {
          warnings.push('Logging dinner before 3 PM');
        }

        // AI confidence validation
        if (input.data.ai_confidence !== undefined && input.data.ai_confidence < 0.6) {
          warnings.push('Low AI confidence score - manual review recommended');
        }
      }

      // User behavior pattern validation
      if (input.context.userId && input.operation === 'insert') {
        validationDetails.userContext = {
          userId: input.context.userId,
          operation: input.operation,
          timestamp: new Date().toISOString()
        };
      }

      const result: ValidationResult = {
        tier: 2,
        type: 'business_rule',
        result: errors.length > 0 ? 'fail' : (warnings.length > 0 ? 'warning' : 'pass'),
        processingTimeMs: Date.now() - startTime,
        validationDetails,
        errorMessages: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      return result;
      
    } catch (error) {
      return {
        tier: 2,
        type: 'business_rule',
        result: 'fail',
        processingTimeMs: Date.now() - startTime,
        errorMessages: ['Tier 2 validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
      };
    }
  }

  private async runTier3Validation(input: ValidationInput): Promise<ValidationResult> {
    const startTime = Date.now();
    
    try {
      // V0.1: Basic hardcoded pattern detection
      const warnings: string[] = [];
      const recommendations: string[] = [];
      const validationDetails: any = {};

      // Simple pattern detection without AI for V0.1
      if (input.context.tableName === 'daily_meals' && input.data) {
        let confidenceScore = 1.0;
        
        // Basic anomaly patterns
        if (input.data.calories > 1500) {
          warnings.push('High calorie single meal detected');
          recommendations.push('Consider portion size review');
          confidenceScore = 0.8;
        }
        
        if (input.data.protein > 100) {
          warnings.push('Very high protein intake detected');
          recommendations.push('Verify protein source accuracy');
          confidenceScore = 0.7;
        }
        
        // Time-based patterns
        const hour = new Date().getHours();
        if (hour < 6 || hour > 23) {
          warnings.push('Unusual eating time detected');
          recommendations.push('Monitor late night eating patterns');
          confidenceScore = 0.9;
        }

        validationDetails.patternAnalysis = {
          timeOfDay: hour,
          anomalyFlags: warnings.length,
          confidenceScore
        };

        const result: ValidationResult = {
          tier: 3,
          type: 'ai_pattern',
          result: warnings.length > 0 ? 'warning' : 'pass',
          processingTimeMs: Date.now() - startTime,
          confidenceScore,
          aiModelUsed: 'hardcoded_v0.1',
          validationDetails,
          warnings: warnings.length > 0 ? warnings : undefined,
          recommendations: recommendations.length > 0 ? recommendations : undefined
        };

        return result;
      }

      // Default pass for non-meal operations
      return {
        tier: 3,
        type: 'ai_pattern',
        result: 'pass',
        processingTimeMs: Date.now() - startTime,
        confidenceScore: 1.0,
        aiModelUsed: 'hardcoded_v0.1'
      };
      
    } catch (error) {
      return {
        tier: 3,
        type: 'ai_pattern',
        result: 'fail',
        processingTimeMs: Date.now() - startTime,
        confidenceScore: 0.0,
        aiModelUsed: 'hardcoded_v0.1',
        errorMessages: ['Tier 3 validation failed: ' + (error instanceof Error ? error.message : 'Unknown error')]
      };
    }
  }
}

// Convenience function for meal validation
export const validateMealData = async (
  mealData: any,
  userId: string,
  operation: 'insert' | 'update' = 'insert',
  beforeState?: any
): Promise<ValidationResponse> => {
  const engine = new ValidationEngine();
  
  return await engine.validate({
    data: mealData,
    operation,
    context: {
      userId,
      systemName: 'food_recognition_ai',
      tableName: 'daily_meals',
      beforeState,
      afterState: mealData
    }
  });
};

// Convenience function for user-facing AI validation
export const validateUserInteraction = async (
  interactionData: any,
  userId: string,
  systemName: 'user_facing_ai' | 'food_recognition_ai'
): Promise<ValidationResponse> => {
  const engine = new ValidationEngine({
    enableTier3: false, // Keep simple for user interactions
    strictMode: false
  });
  
  return await engine.validate({
    data: interactionData,
    operation: 'query',
    context: {
      userId,
      systemName,
      tableName: 'user_interactions',
      afterState: interactionData
    }
  });
};