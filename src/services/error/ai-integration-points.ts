// AI Integration Points for Error Handler Orchestrator
// Provides type-safe integration methods for each AI system

import { 
  errorHandlerOrchestrator, 
  type ErrorHandlerRequest, 
  type ErrorHandlerResponse,
  handleFoodRecognitionError,
  handleUserFacingError,
  handleMacroCalculatorError,
  handleSystemError
} from './error-handler-orchestrator';

// Food Recognition AI Integration
export class FoodRecognitionErrorIntegration {
  static async handleValidationError(
    foodDescription: string,
    userId: string,
    validationError: string
  ): Promise<ErrorHandlerResponse> {
    return await handleFoodRecognitionError(
      'food_recognition_validation_failed',
      validationError,
      userId,
      { userInput: foodDescription, operation: 'validation' }
    );
  }

  static async handleProcessingError(
    foodDescription: string,
    userId: string,
    processingError: string
  ): Promise<ErrorHandlerResponse> {
    return await handleFoodRecognitionError(
      'food_recognition_processing_failed',
      processingError,
      userId,
      { userInput: foodDescription, operation: 'processing' }
    );
  }

  static async handleAPITimeout(
    foodDescription: string,
    userId: string,
    apiProvider: string
  ): Promise<ErrorHandlerResponse> {
    return await handleFoodRecognitionError(
      'api_timeout',
      `${apiProvider} API timeout during food recognition`,
      userId,
      { userInput: foodDescription, apiProvider }
    );
  }

  static async handleLowConfidence(
    foodDescription: string,
    userId: string,
    confidence: number
  ): Promise<ErrorHandlerResponse> {
    return await handleFoodRecognitionError(
      'low_confidence',
      `Low confidence recognition result: ${confidence}`,
      userId,
      { userInput: foodDescription, confidence }
    );
  }
}

// User Facing AI Integration
export class UserFacingErrorIntegration {
  static async handleConversationError(
    userMessage: string,
    userId: string,
    errorDetails: string
  ): Promise<ErrorHandlerResponse> {
    return await handleUserFacingError(
      'conversation_processing_error',
      errorDetails,
      userId,
      { userInput: userMessage, operation: 'conversation' }
    );
  }

  static async handleResponseGenerationError(
    userMessage: string,
    userId: string,
    errorDetails: string
  ): Promise<ErrorHandlerResponse> {
    return await handleUserFacingError(
      'response_generation_error',
      errorDetails,
      userId,
      { userInput: userMessage, operation: 'response_generation' }
    );
  }

  static async handleCrisisDetection(
    userMessage: string,
    userId: string,
    crisisType: string
  ): Promise<ErrorHandlerResponse> {
    return await handleUserFacingError(
      'crisis_detection',
      `Crisis indicators detected: ${crisisType}`,
      userId,
      { 
        userInput: userMessage, 
        crisisType,
        conversationHistory: 'truncated_for_safety'
      }
    );
  }
}

// Macro Calculator AI Integration
export class MacroCalculatorErrorIntegration {
  static async handleCalculationError(
    nutritionData: any,
    userId: string,
    errorDetails: string
  ): Promise<ErrorHandlerResponse> {
    return await handleMacroCalculatorError(
      'calculation_error',
      errorDetails,
      userId,
      { nutritionData: { ...nutritionData, sensitiveFields: 'redacted' } }
    );
  }

  static async handleDataValidationError(
    nutritionData: any,
    userId: string,
    validationError: string
  ): Promise<ErrorHandlerResponse> {
    return await handleMacroCalculatorError(
      'data_validation_error',
      validationError,
      userId,
      { operation: 'macro_calculation', dataType: typeof nutritionData }
    );
  }

  static async handleMissingNutritionData(
    foodItem: string,
    userId: string
  ): Promise<ErrorHandlerResponse> {
    return await handleMacroCalculatorError(
      'missing_nutrition_data',
      `Nutrition data not available for: ${foodItem}`,
      userId,
      { foodItem }
    );
  }
}

// System-level Integration
export class SystemErrorIntegration {
  static async handleDatabaseError(
    operation: string,
    errorDetails: string,
    context?: any
  ): Promise<ErrorHandlerResponse> {
    return await handleSystemError(
      'database_error',
      errorDetails,
      { operation, database: 'supabase', ...context }
    );
  }

  static async handleCacheError(
    operation: string,
    errorDetails: string,
    cacheType: string
  ): Promise<ErrorHandlerResponse> {
    return await handleSystemError(
      'cache_error',
      errorDetails,
      { operation, cacheType }
    );
  }

  static async handleNetworkError(
    operation: string,
    errorDetails: string,
    endpoint?: string
  ): Promise<ErrorHandlerResponse> {
    return await handleSystemError(
      'network_error',
      errorDetails,
      { operation, endpoint }
    );
  }
}

// Health Check Integration
export class HealthCheckIntegration {
  static async getSystemHealthStatus(): Promise<{
    orchestrator: any;
    errorManager: any;
    resilience: any;
    validationGateway: any;
  }> {
    // Get health from all integrated systems
    const orchestratorHealth = errorHandlerOrchestrator.getHealthStatus();
    
    // Import other health checks
    const { errorManager } = await import('./error-manager');
    const { resilienceManager } = await import('./resilience-manager');
    const { dataValidationGateway } = await import('../validation/data-validation-gateway');
    
    return {
      orchestrator: orchestratorHealth,
      errorManager: errorManager.getErrorStats(),
      resilience: resilienceManager.getSystemHealth(),
      validationGateway: await dataValidationGateway.getSystemHealth()
    };
  }

  static async performSystemDiagnostics(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    components: Record<string, any>;
    recommendations: string[];
  }> {
    const health = await this.getSystemHealthStatus();
    
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    const recommendations: string[] = [];
    
    // Check orchestrator performance
    if (health.orchestrator.avgProcessingTime > 1000) {
      overallStatus = 'critical';
      recommendations.push('Orchestrator response time is too high - investigate system load');
    } else if (health.orchestrator.avgProcessingTime > 500) {
      overallStatus = 'degraded';
      recommendations.push('Orchestrator performance degraded - monitor system resources');
    }
    
    // Check error rates
    if (health.errorManager.totalErrors > 100) {
      overallStatus = 'degraded';
      recommendations.push('High error rate detected - investigate recurring issues');
    }
    
    // Check resilience system
    if (health.resilience.overall_status === 'critical') {
      overallStatus = 'critical';
      recommendations.push('Critical resilience issues - immediate attention required');
    } else if (health.resilience.overall_status === 'degraded') {
      overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
      recommendations.push('Resilience system degraded - monitor closely');
    }
    
    return {
      status: overallStatus,
      components: health,
      recommendations
    };
  }
}

// Macro Calculator AI Error Integration
export class MacroCalculatorAIErrorIntegration {
  static async handleCalculationError(
    request: any,
    userId: string,
    errorDetails: string,
    context?: any
  ): Promise<ErrorHandlerResponse> {
    return await handleMacroCalculatorError(
      'calculation_error',
      errorDetails,
      userId,
      { 
        triggerType: request.trigger_type,
        operation: 'macro_calculation',
        ...context
      }
    );
  }

  static async handleValidationError(
    goals: any,
    userId: string,
    validationError: string,
    profile?: any
  ): Promise<ErrorHandlerResponse> {
    return await handleMacroCalculatorError(
      'goal_validation_error',
      validationError,
      userId,
      { 
        goals: { ...goals, sensitiveFields: 'redacted' },
        userProfile: profile ? { ...profile, sensitiveFields: 'redacted' } : undefined,
        operation: 'goal_validation'
      }
    );
  }

  static async handleCrisisDetection(
    goals: any,
    userId: string,
    crisisType: string,
    profile?: any
  ): Promise<ErrorHandlerResponse> {
    return await handleMacroCalculatorError(
      'crisis_detection',
      `Crisis indicators detected in goal setting: ${crisisType}`,
      userId,
      { 
        crisisType,
        goalValues: { calories: goals.daily_calorie_goal },
        userProfile: profile ? { age: profile.age, gender: profile.gender } : undefined,
        requiresIntervention: true
      }
    );
  }

  static async handleCachingError(
    cacheKey: string,
    userId: string,
    errorDetails: string
  ): Promise<ErrorHandlerResponse> {
    return await handleMacroCalculatorError(
      'caching_error',
      errorDetails,
      userId,
      { cacheKey, operation: 'cache_management' }
    );
  }

  static async handlePerformanceError(
    calculationTime: number,
    userId: string,
    threshold: number
  ): Promise<ErrorHandlerResponse> {
    return await handleMacroCalculatorError(
      'performance_error',
      `Calculation exceeded performance threshold: ${calculationTime}ms > ${threshold}ms`,
      userId,
      { calculationTime, threshold, operation: 'performance_monitoring' }
    );
  }
}

// Integration points are already exported as classes above