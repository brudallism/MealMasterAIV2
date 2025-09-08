// Data Validation Gateway - AI System Integration Hub
import { auditTrailManager } from './audit-trail-manager';
import { ValidationEngine, type ValidationResponse } from './validation-engine';
import type { FoodRecognitionInput, FoodRecognitionResponse } from '../ai/food-recognition-ai';
import type { IntentType } from '../ai/user-facing-ai';

export interface DataValidationConfig {
  enableTier1: boolean;
  enableTier2: boolean;
  enableTier3: boolean;
  strictMode: boolean;
  maxProcessingTimeMs: number;
  systemIntegration: {
    validateFoodRecognition: boolean;
    validateUserFacing: boolean;
    validateMacroCalculator: boolean;
  };
}

export interface SystemValidationContext {
  systemName: 'food_recognition_ai' | 'user_facing_ai' | 'macro_calculator_ai';
  operationType: 'input_validation' | 'output_validation' | 'business_logic_validation';
  userId?: string;
  requestId?: string;
}

// Integration interfaces for each AI system
export interface FoodRecognitionValidation {
  input: FoodRecognitionInput;
  output?: FoodRecognitionResponse;
  validationType: 'input_validation' | 'output_validation' | 'nutritional_consistency';
}

export interface UserFacingValidation {
  input: {
    message: string;
    userId: string;
    intent?: IntentType;
    context?: string;
  };
  output?: {
    response: string;
    intent: IntentType;
    confidence: number;
  };
  validationType: 'input_validation' | 'output_validation' | 'intent_classification';
}

export interface MacroCalculatorValidation {
  input: {
    userId: string;
    dailyMeals: any[];
    goals: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  output?: {
    currentTotals: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    remaining: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    percentages: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  validationType: 'calculation_validation' | 'goal_consistency' | 'progress_tracking';
}

const DEFAULT_CONFIG: DataValidationConfig = {
  enableTier1: true,
  enableTier2: true,
  enableTier3: false, // V0.1 basic detection
  strictMode: false,
  maxProcessingTimeMs: 10000,
  systemIntegration: {
    validateFoodRecognition: true,
    validateUserFacing: true,
    validateMacroCalculator: true
  }
};

export class DataValidationGateway {
  private config: DataValidationConfig;
  private validationEngine: ValidationEngine;
  
  constructor(config: Partial<DataValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.validationEngine = new ValidationEngine({
      enableTier1: this.config.enableTier1,
      enableTier2: this.config.enableTier2,
      enableTier3: this.config.enableTier3,
      strictMode: this.config.strictMode,
      maxProcessingTimeMs: this.config.maxProcessingTimeMs
    });
  }

  // Food Recognition AI Integration
  async validateFoodRecognition(
    validation: FoodRecognitionValidation,
    context: SystemValidationContext
  ): Promise<ValidationResponse> {
    if (!this.config.systemIntegration.validateFoodRecognition) {
      return this.createPassthroughResponse(context);
    }

    const auditContext = {
      userId: context.userId,
      systemName: 'food_recognition_ai',
      operationType: context.operationType,
      tableName: validation.validationType === 'nutritional_consistency' ? 'daily_meals' : 'food_recognition_cache',
      beforeState: validation.validationType === 'output_validation' ? validation.input : undefined,
      afterState: validation.output,
      businessContext: {
        validationType: validation.validationType,
        requestId: context.requestId
      }
    };

    switch (validation.validationType) {
      case 'input_validation':
        return await this.validateFoodRecognitionInput(validation.input, auditContext);
        
      case 'output_validation':
        return await this.validateFoodRecognitionOutput(validation.output!, validation.input, auditContext);
        
      case 'nutritional_consistency':
        return await this.validateNutritionalConsistency(validation.output!, auditContext);
        
      default:
        throw new Error(`Unknown food recognition validation type: ${validation.validationType}`);
    }
  }

  // User Facing AI Integration
  async validateUserFacing(
    validation: UserFacingValidation,
    context: SystemValidationContext
  ): Promise<ValidationResponse> {
    if (!this.config.systemIntegration.validateUserFacing) {
      return this.createPassthroughResponse(context);
    }

    const auditContext = {
      userId: validation.input.userId,
      systemName: 'user_facing_ai',
      operationType: context.operationType,
      tableName: 'user_interactions',
      beforeState: validation.validationType === 'output_validation' ? validation.input : undefined,
      afterState: validation.output,
      businessContext: {
        validationType: validation.validationType,
        requestId: context.requestId,
        intent: validation.input.intent || validation.output?.intent
      }
    };

    switch (validation.validationType) {
      case 'input_validation':
        return await this.validateUserInput(validation.input, auditContext);
        
      case 'output_validation':
        return await this.validateUserResponse(validation.output!, validation.input, auditContext);
        
      case 'intent_classification':
        return await this.validateIntentClassification(validation.output!, validation.input, auditContext);
        
      default:
        throw new Error(`Unknown user facing validation type: ${validation.validationType}`);
    }
  }

  // Macro Calculator AI Integration
  async validateMacroCalculator(
    validation: MacroCalculatorValidation,
    context: SystemValidationContext
  ): Promise<ValidationResponse> {
    if (!this.config.systemIntegration.validateMacroCalculator) {
      return this.createPassthroughResponse(context);
    }

    const auditContext = {
      userId: validation.input.userId,
      systemName: 'macro_calculator_ai',
      operationType: context.operationType,
      tableName: 'daily_meals',
      beforeState: validation.input,
      afterState: validation.output,
      businessContext: {
        validationType: validation.validationType,
        requestId: context.requestId,
        mealsCount: validation.input.dailyMeals.length
      }
    };

    switch (validation.validationType) {
      case 'calculation_validation':
        return await this.validateMacroCalculations(validation.output!, validation.input, auditContext);
        
      case 'goal_consistency':
        return await this.validateGoalConsistency(validation.input, auditContext);
        
      case 'progress_tracking':
        return await this.validateProgressTracking(validation.output!, validation.input, auditContext);
        
      default:
        throw new Error(`Unknown macro calculator validation type: ${validation.validationType}`);
    }
  }

  // Private validation methods for Food Recognition AI
  private async validateFoodRecognitionInput(
    input: FoodRecognitionInput,
    auditContext: any
  ): Promise<ValidationResponse> {
    const validationData = {
      food_description: input.food_description,
      context: input.context,
      user_id: input.user_id,
      conversation_history: input.conversation_history
    };

    return await auditTrailManager.validateAndAudit(
      validationData,
      'query',
      auditContext
    );
  }

  private async validateFoodRecognitionOutput(
    output: FoodRecognitionResponse,
    input: FoodRecognitionInput,
    auditContext: any
  ): Promise<ValidationResponse> {
    return await auditTrailManager.validateAndAudit(
      output,
      'insert',
      auditContext
    );
  }

  private async validateNutritionalConsistency(
    output: FoodRecognitionResponse,
    auditContext: any
  ): Promise<ValidationResponse> {
    // Extract nutrition data for consistency validation
    if (output.recognized_foods && output.total_nutrition) {
      const nutritionData = {
        recognized_foods: output.recognized_foods.map(food => ({
          food_name: food.food_name,
          quantity_grams: food.quantity_grams,
          confidence: food.confidence
        })),
        total_nutrition: output.total_nutrition,
        confidence_overall: output.confidence_overall
      };

      return await auditTrailManager.validateAndAudit(
        nutritionData,
        'insert',
        auditContext
      );
    }

    return await auditTrailManager.validateAndAudit(
      output,
      'insert',
      auditContext
    );
  }

  // Private validation methods for User Facing AI
  private async validateUserInput(
    input: UserFacingValidation['input'],
    auditContext: any
  ): Promise<ValidationResponse> {
    return await auditTrailManager.validateAndAudit(
      input,
      'query',
      auditContext
    );
  }

  private async validateUserResponse(
    output: UserFacingValidation['output'],
    input: UserFacingValidation['input'],
    auditContext: any
  ): Promise<ValidationResponse> {
    return await auditTrailManager.validateAndAudit(
      { input, output },
      'insert',
      auditContext
    );
  }

  private async validateIntentClassification(
    output: UserFacingValidation['output'],
    input: UserFacingValidation['input'],
    auditContext: any
  ): Promise<ValidationResponse> {
    const classificationData = {
      message: input.message,
      classified_intent: output?.intent,
      confidence: output?.confidence,
      expected_intent: input.intent
    };

    return await auditTrailManager.validateAndAudit(
      classificationData,
      'query',
      auditContext
    );
  }

  // Private validation methods for Macro Calculator AI
  private async validateMacroCalculations(
    output: MacroCalculatorValidation['output'],
    input: MacroCalculatorValidation['input'],
    auditContext: any
  ): Promise<ValidationResponse> {
    const calculationData = {
      daily_meals: input.dailyMeals,
      calculated_totals: output?.currentTotals,
      remaining_macros: output?.remaining,
      progress_percentages: output?.percentages,
      goals: input.goals
    };

    return await auditTrailManager.validateAndAudit(
      calculationData,
      'update',
      auditContext
    );
  }

  private async validateGoalConsistency(
    input: MacroCalculatorValidation['input'],
    auditContext: any
  ): Promise<ValidationResponse> {
    return await auditTrailManager.validateAndAudit(
      input.goals,
      'query',
      auditContext
    );
  }

  private async validateProgressTracking(
    output: MacroCalculatorValidation['output'],
    input: MacroCalculatorValidation['input'],
    auditContext: any
  ): Promise<ValidationResponse> {
    const progressData = {
      user_id: input.userId,
      current_totals: output?.currentTotals,
      goals: input.goals,
      percentages: output?.percentages,
      meals_logged: input.dailyMeals.length
    };

    return await auditTrailManager.validateAndAudit(
      progressData,
      'insert',
      auditContext
    );
  }

  private createPassthroughResponse(context: SystemValidationContext): ValidationResponse {
    return {
      success: true,
      auditTrailId: 'passthrough',
      operationId: context.requestId || crypto.randomUUID(),
      overallStatus: 'passed',
      totalProcessingTime: 0,
      errors: [],
      warnings: ['System validation disabled - passthrough mode'],
      recommendations: []
    };
  }

  // System health and monitoring
  async getSystemHealth() {
    return await auditTrailManager.getSystemHealthStatus();
  }

  async getValidationMetrics(userId?: string, hoursBack: number = 24) {
    return await auditTrailManager.getAuditMetrics(userId, undefined, hoursBack);
  }

  async performIntegrityCheck() {
    return await auditTrailManager.performIntegrityCheck();
  }
}

// Export singleton instance
export const dataValidationGateway = new DataValidationGateway();

// Convenience functions for each AI system
export const validateFoodRecognitionInput = async (
  input: FoodRecognitionInput,
  userId?: string,
  requestId?: string
): Promise<ValidationResponse> => {
  return await dataValidationGateway.validateFoodRecognition(
    {
      input,
      validationType: 'input_validation'
    },
    {
      systemName: 'food_recognition_ai',
      operationType: 'input_validation',
      userId,
      requestId
    }
  );
};

export const validateFoodRecognitionOutput = async (
  input: FoodRecognitionInput,
  output: FoodRecognitionResponse,
  userId?: string,
  requestId?: string
): Promise<ValidationResponse> => {
  return await dataValidationGateway.validateFoodRecognition(
    {
      input,
      output,
      validationType: 'output_validation'
    },
    {
      systemName: 'food_recognition_ai',
      operationType: 'output_validation',
      userId,
      requestId
    }
  );
};

export const validateUserFacingInput = async (
  message: string,
  userId: string,
  requestId?: string
): Promise<ValidationResponse> => {
  return await dataValidationGateway.validateUserFacing(
    {
      input: { message, userId },
      validationType: 'input_validation'
    },
    {
      systemName: 'user_facing_ai',
      operationType: 'input_validation',
      userId,
      requestId
    }
  );
};

export const validateMacroCalculations = async (
  input: MacroCalculatorValidation['input'],
  output: MacroCalculatorValidation['output'],
  requestId?: string
): Promise<ValidationResponse> => {
  return await dataValidationGateway.validateMacroCalculator(
    {
      input,
      output,
      validationType: 'calculation_validation'
    },
    {
      systemName: 'macro_calculator_ai',
      operationType: 'business_logic_validation',
      userId: input.userId,
      requestId
    }
  );
};