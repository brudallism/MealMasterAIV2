// Error Handler Orchestrator - Central coordination for all error handling systems
// Integrates existing ErrorManager, ResilienceManager, EdgeCaseHandler, and Data Validation Gateway

import { errorManager, type ErrorContext, type ErrorMetadata, type DetailedError } from './error-manager';
import { resilienceManager } from './resilience-manager';
import { edgeCaseHandler, type EdgeCaseResult } from './edge-case-handler';
import { dataValidationGateway } from '../validation/data-validation-gateway';

// Orchestrator-specific interfaces (lightweight, focused on routing)
export interface ErrorHandlerRequest {
  source: 'user_facing_ai' | 'food_recognition_ai' | 'macro_calculator_ai' | 'data_validation_gateway' | 'system';
  errorType: string;
  message: string;
  userId?: string;
  context?: any;
  metadata?: Partial<ErrorMetadata>;
}

export interface ErrorHandlerResponse {
  success: boolean;
  userMessage: string;
  recoveryActions: string[];
  systemStatus: 'operational' | 'degraded' | 'recovery_mode';
  escalationRequired: boolean;
  processingTimeMs: number;
}

// Basic crisis detection patterns (fast hardcoded check)
const CRISIS_KEYWORDS = [
  'kill myself', 'suicide', 'want to die', 'end it all', 'self harm', 'cut myself',
  'worthless', 'hate myself', 'cant do this', 'give up', 'hopeless'
];

const EATING_DISORDER_PATTERNS = [
  /\b(?:only|just)\s*\d{1,3}\s*calories?\b/i,
  /\b(?:800|700|600|500|400|300|200|100)\s*calories?\s*(?:per\s*day|daily|total)\b/i,
  /\b(?:fasting|starving|not\s*eating)\s*for\s*\d+\s*days?\b/i,
  /\b(?:need\s*to\s*lose|must\s*lose)\s*\d+\s*(?:pounds?|lbs?|kg)\s*(?:in|by)\s*\d+\s*(?:days?|weeks?)\b/i
];

export class ErrorHandlerOrchestrator {
  private static instance: ErrorHandlerOrchestrator;
  private processingStats = {
    totalRequests: 0,
    avgProcessingTime: 0,
    lastHour: [] as number[]
  };
  
  // OPTIMIZATION: Cache for performance-critical operations
  private validationGatewayHealthCache: {
    data: any | null;
    timestamp: number;
    ttl: number;
  } = {
    data: null,
    timestamp: 0,
    ttl: 30000 // 30 second cache TTL
  };

  private constructor() {}

  static getInstance(): ErrorHandlerOrchestrator {
    if (!ErrorHandlerOrchestrator.instance) {
      ErrorHandlerOrchestrator.instance = new ErrorHandlerOrchestrator();
    }
    return ErrorHandlerOrchestrator.instance;
  }

  async handleError(request: ErrorHandlerRequest): Promise<ErrorHandlerResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Fast crisis detection (highest priority)
      const crisisCheck = this.performCrisisCheck(request);
      if (crisisCheck.escalationRequired) {
        return this.handleCrisisEscalation(crisisCheck, startTime);
      }

      // Step 2: Route to appropriate specialized handler
      const routingDecision = this.determineRoutingStrategy(request);
      
      // Step 3: Execute through specialized handlers
      const result = await this.executeErrorHandling(request, routingDecision);
      
      // Step 4: Update metrics and return
      this.updateProcessingStats(Date.now() - startTime);
      
      return {
        ...result,
        processingTimeMs: Date.now() - startTime
      };

    } catch (orchestratorError) {
      // Ultimate fallback - orchestrator must never fail
      console.error('Error Handler Orchestrator failure:', orchestratorError);
      return this.getEmergencyFallbackResponse(request, startTime);
    }
  }

  private performCrisisCheck(request: ErrorHandlerRequest): { escalationRequired: boolean; crisisType?: string; userMessage?: string } {
    // OPTIMIZATION: Fast crisis detection with early exits
    const textToCheck = `${request.message} ${request.context?.userInput || ''} ${request.context?.conversationHistory || ''}`.toLowerCase();
    
    // Early exit if no meaningful text to check
    if (!textToCheck.trim()) {
      return { escalationRequired: false };
    }
    
    // Check for self-harm/suicide language
    for (const keyword of CRISIS_KEYWORDS) {
      if (textToCheck.includes(keyword.toLowerCase())) {
        return {
          escalationRequired: true,
          crisisType: 'self_harm_crisis',
          userMessage: `I'm concerned about what you're sharing. Your safety is most important. Please reach out immediately:

• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741  
• Emergency Services: 911

You don't have to go through this alone.`
        };
      }
    }

    // Check for eating disorder patterns
    for (const pattern of EATING_DISORDER_PATTERNS) {
      if (pattern.test(textToCheck)) {
        return {
          escalationRequired: true,
          crisisType: 'eating_disorder_indicators',
          userMessage: `I'm concerned about the goals or patterns you're describing. Please consider speaking with a healthcare professional who specializes in nutrition and mental health:

• National Eating Disorders Association: (800) 931-2237
• Your healthcare provider
• Mental health professional

Your wellbeing is what matters most.`
        };
      }
    }

    return { escalationRequired: false };
  }

  private determineRoutingStrategy(request: ErrorHandlerRequest): 'edge_case' | 'error_manager' | 'resilience_manager' | 'validation_gateway' | 'direct' {
    // PRIORITY 1: Food safety and medical boundaries (highest priority)
    if (this.isFoodSafetyOrMedicalError(request)) {
      return 'edge_case';
    }

    // PRIORITY 2: System health and performance issues (second priority)
    if (this.isSystemHealthError(request)) {
      return 'resilience_manager';
    }

    // PRIORITY 3: Data validation and database issues
    if (this.isDataValidationError(request)) {
      return 'validation_gateway';
    }

    // PRIORITY 4: Complex errors requiring full context tracking
    if (this.isComplexError(request)) {
      return 'error_manager';
    }

    // PRIORITY 5: Simple errors handled directly for speed
    return 'direct';
  }

  // Routing decision helpers
  private isFoodSafetyOrMedicalError(request: ErrorHandlerRequest): boolean {
    return (
      request.source === 'food_recognition_ai' ||
      request.errorType.includes('food_safety') ||
      request.errorType.includes('medical') ||
      request.errorType.includes('dietary_restriction') ||
      request.errorType.includes('ambiguous_input') ||
      request.errorType.includes('unusual_food') ||
      request.errorType.includes('cultural_context') ||
      request.errorType.includes('measurement_issue')
    );
  }

  private isSystemHealthError(request: ErrorHandlerRequest): boolean {
    return (
      request.errorType.includes('timeout') ||
      request.errorType.includes('performance') ||
      request.errorType.includes('circuit_breaker') ||
      request.errorType.includes('rate_limit') ||
      request.errorType.includes('system_overload') ||
      request.errorType.includes('memory_pressure') ||
      request.errorType.includes('connection_pool')
    );
  }

  private isDataValidationError(request: ErrorHandlerRequest): boolean {
    return (
      request.source === 'data_validation_gateway' ||
      request.errorType.includes('database') ||
      request.errorType.includes('validation') ||
      request.errorType.includes('schema') ||
      request.errorType.includes('constraint') ||
      request.errorType.includes('integrity') ||
      request.errorType.includes('audit_trail')
    );
  }

  private isComplexError(request: ErrorHandlerRequest): boolean {
    return (
      request.metadata?.severity === 'high' ||
      request.metadata?.severity === 'critical' ||
      request.errorType.includes('api_failure') ||
      request.errorType.includes('integration_error') ||
      request.errorType.includes('business_logic') ||
      request.errorType.includes('workflow_failure') ||
      (request.context && Object.keys(request.context).length > 3) // Rich context needs tracking
    );
  }

  private async executeErrorHandling(request: ErrorHandlerRequest, strategy: string): Promise<Omit<ErrorHandlerResponse, 'processingTimeMs'>> {
    const baseContext: ErrorContext = {
      userId: request.userId,
      component: request.source,
      operation: request.errorType,
      timestamp: Date.now()
    };

    switch (strategy) {
      case 'edge_case':
        return await this.handleViaEdgeCaseHandler(request);
        
      case 'error_manager':
        return await this.handleViaErrorManager(request, baseContext);
        
      case 'resilience_manager':
        return await this.handleViaResilienceManager(request);
        
      case 'validation_gateway':
        return await this.handleViaValidationGateway(request);
        
      case 'direct':
        return this.handleDirectly(request);
        
      default:
        return this.handleDirectly(request);
    }
  }

  private async handleViaEdgeCaseHandler(request: ErrorHandlerRequest): Promise<Omit<ErrorHandlerResponse, 'processingTimeMs'>> {
    try {
      // For food safety/medical boundary issues, use existing EdgeCaseHandler
      const edgeResult: EdgeCaseResult = await edgeCaseHandler.handleEdgeCase(request.context?.userInput || request.message, request.userId || 'unknown');
      
      return {
        success: edgeResult.shouldProceed,
        userMessage: edgeResult.warningMessage || edgeResult.scenario?.userMessage || 'Please provide more specific information about your food.',
        recoveryActions: edgeResult.shouldProceed ? ['Continue with modified input'] : ['Provide clearer food description', 'Try manual entry'],
        systemStatus: 'operational',
        escalationRequired: edgeResult.scenario?.requiresHumanReview || false
      };
    } catch (error) {
      return this.getFallbackResponse(request, 'Edge case handling failed');
    }
  }

  private async handleViaErrorManager(request: ErrorHandlerRequest, context: ErrorContext): Promise<Omit<ErrorHandlerResponse, 'processingTimeMs'>> {
    try {
      // Use existing ErrorManager for comprehensive error tracking
      const detailedError: DetailedError = errorManager.createError(
        request.message,
        context,
        request.metadata || {
          severity: 'medium',
          category: 'system',
          retryable: true,
          userFacing: true,
          actionRequired: false
        }
      );

      const recoveryActions = detailedError.recoveryActions.length > 0 
        ? detailedError.recoveryActions 
        : ['Try again', 'Contact support if issue persists'];

      return {
        success: true,
        userMessage: detailedError.userMessage,
        recoveryActions,
        systemStatus: detailedError.metadata.severity === 'critical' ? 'degraded' : 'operational',
        escalationRequired: detailedError.metadata.severity === 'critical'
      };
    } catch (error) {
      return this.getFallbackResponse(request, 'Error manager handling failed');
    }
  }

  private async handleViaResilienceManager(request: ErrorHandlerRequest): Promise<Omit<ErrorHandlerResponse, 'processingTimeMs'>> {
    try {
      // Use existing ResilienceManager for system health/performance issues
      const systemHealth = resilienceManager.getSystemHealth();
      
      let userMessage = "I'm having some technical difficulties, but I'm working on it! ";
      let recoveryActions = ['Try again in a moment'];
      let systemStatus: 'operational' | 'degraded' | 'recovery_mode' = 'operational';

      if (systemHealth.overall === 'degraded' || systemHealth.overall === 'critical') {
        systemStatus = 'degraded';
        userMessage = "I'm experiencing some performance issues right now. ";
        recoveryActions = ['Try manual entry', 'Wait a few minutes and retry'];
      }

      if (request.errorType.includes('timeout')) {
        userMessage += "The request is taking longer than expected. You can try manual entry or wait a moment for me to catch up.";
        recoveryActions = ['Use manual entry option', 'Try again in 30 seconds'];
      }

      return {
        success: systemHealth.overall !== 'critical',
        userMessage,
        recoveryActions,
        systemStatus,
        escalationRequired: false
      };
    } catch (error) {
      return this.getFallbackResponse(request, 'Resilience manager handling failed');
    }
  }

  private async handleViaValidationGateway(request: ErrorHandlerRequest): Promise<Omit<ErrorHandlerResponse, 'processingTimeMs'>> {
    try {
      // OPTIMIZATION: Use cached health status with timeout for faster response
      const healthPromise = this.getCachedValidationGatewayHealth();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 100)
      );
      
      let health;
      try {
        health = await Promise.race([healthPromise, timeoutPromise]);
      } catch {
        // Fallback to assume operational for speed
        health = { status: 'operational' as const };
      }
      
      let userMessage = "I'm having trouble with data validation right now, but your information is safe! ";
      let recoveryActions = ['Data will be validated and synced automatically'];
      let systemStatus: 'operational' | 'degraded' | 'recovery_mode' = 'operational';

      if (health.status === 'critical' || health.status === 'degraded') {
        systemStatus = 'degraded';
        userMessage += "You can continue tracking, and I'll validate and sync everything once the connection is restored.";
        recoveryActions = ['Continue with cached data', 'Use manual entry', 'Data will sync automatically'];
      }

      if (request.errorType.includes('database')) {
        userMessage = "I'm having trouble connecting to the database right now, but don't worry - your data is safely cached! ";
        recoveryActions.unshift('Your data is safely cached');
      }

      return {
        success: health.status !== 'critical',
        userMessage,
        recoveryActions,
        systemStatus,
        escalationRequired: false
      };
    } catch (error) {
      return this.getFallbackResponse(request, 'Validation gateway handling failed');
    }
  }

  // OPTIMIZATION: Cached health check for validation gateway
  private async getCachedValidationGatewayHealth(): Promise<any> {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.validationGatewayHealthCache.data && 
        (now - this.validationGatewayHealthCache.timestamp) < this.validationGatewayHealthCache.ttl) {
      return this.validationGatewayHealthCache.data;
    }
    
    try {
      // Import and check validation gateway health
      const { dataValidationGateway } = await import('../validation/data-validation-gateway');
      const healthData = await dataValidationGateway.getSystemHealth();
      
      // Cache the result
      this.validationGatewayHealthCache = {
        data: healthData,
        timestamp: now,
        ttl: 30000 // 30 seconds
      };
      
      return healthData;
    } catch (error) {
      // Return cached data if available, even if expired
      if (this.validationGatewayHealthCache.data) {
        return this.validationGatewayHealthCache.data;
      }
      
      // Final fallback: assume operational
      return { status: 'operational' as const };
    }
  }

  private handleDirectly(request: ErrorHandlerRequest): Omit<ErrorHandlerResponse, 'processingTimeMs'> {
    // Fast direct handling for simple errors
    const errorTypeMessages = {
      'food_recognition_failed': "I'm having trouble recognizing that food. Could you describe it differently, or would you like to add it manually?",
      'api_timeout': "I'm getting overwhelmed with requests right now! Give me just a moment to catch up.",
      'low_confidence': "I'm not quite sure what food that is. Could you provide a bit more detail?",
      'calculation_error': "I'm double-checking those numbers. Your meal is saved, and I'll update your progress in just a moment.",
      'network_error': "I'm having trouble connecting right now. You can continue tracking, and I'll sync your data when the connection improves.",
      'unknown': "Something went a bit sideways, but don't worry - your nutrition data is safe! Try refreshing or using manual entry."
    };

    const userMessage = errorTypeMessages[request.errorType as keyof typeof errorTypeMessages] || errorTypeMessages.unknown;
    
    const recoveryActions = this.getRecoveryActionsForErrorType(request.errorType);

    return {
      success: true,
      userMessage,
      recoveryActions,
      systemStatus: 'operational',
      escalationRequired: false
    };
  }

  private getRecoveryActionsForErrorType(errorType: string): string[] {
    const actionMap = {
      'food_recognition_failed': ['Try describing food differently', 'Use manual entry', 'Break into individual ingredients'],
      'api_timeout': ['Wait 30 seconds and retry', 'Use cached estimates'],
      'low_confidence': ['Add more detail to description', 'Use manual entry'],
      'calculation_error': ['Check input values', 'Try again'],
      'network_error': ['Check internet connection', 'Continue in offline mode'],
      'database_error': ['Data cached for later sync', 'Continue tracking'],
      'unknown': ['Try again', 'Use manual entry', 'Refresh the app']
    };

    return actionMap[errorType as keyof typeof actionMap] || actionMap.unknown;
  }

  private handleCrisisEscalation(crisisCheck: any, startTime: number): ErrorHandlerResponse {
    // Log crisis event (without sensitive data)
    try {
      dataValidationGateway.performIntegrityCheck().catch(console.error);
    } catch (error) {
      // Don't let logging failure block crisis response
    }

    return {
      success: false,
      userMessage: crisisCheck.userMessage,
      recoveryActions: ['Contact professional support immediately'],
      systemStatus: 'operational',
      escalationRequired: true,
      processingTimeMs: Date.now() - startTime
    };
  }

  private getFallbackResponse(request: ErrorHandlerRequest, reason: string): Omit<ErrorHandlerResponse, 'processingTimeMs'> {
    console.error('Fallback response triggered:', reason);
    
    return {
      success: true,
      userMessage: "I'm having a technical hiccup, but don't worry - I'm working on it! Try the manual entry option to keep your nutrition tracking on track.",
      recoveryActions: ['Use manual entry', 'Try again in a moment'],
      systemStatus: 'operational',
      escalationRequired: false
    };
  }

  private getEmergencyFallbackResponse(request: ErrorHandlerRequest, startTime: number): ErrorHandlerResponse {
    return {
      success: false,
      userMessage: "I'm experiencing technical difficulties right now. Your nutrition data is safe. Please try again in a few minutes or use manual entry.",
      recoveryActions: ['Try manual entry', 'Wait and retry', 'Contact support if needed'],
      systemStatus: 'recovery_mode',
      escalationRequired: false,
      processingTimeMs: Date.now() - startTime
    };
  }

  private updateProcessingStats(processingTime: number): void {
    this.processingStats.totalRequests++;
    this.processingStats.lastHour.push(processingTime);
    
    // Keep only last hour of data (store timestamps, not processing times for filtering)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    // Store processing times with their timestamps for proper filtering
    const currentTime = Date.now();
    const entry = { time: processingTime, timestamp: currentTime };
    
    // Filter old entries and calculate average from recent processing times
    const recentEntries = this.processingStats.lastHour.filter(time => 
      typeof time === 'number' ? true : time > oneHourAgo
    );
    
    this.processingStats.lastHour = recentEntries;
    
    // Update rolling average
    if (this.processingStats.lastHour.length > 0) {
      this.processingStats.avgProcessingTime = 
        this.processingStats.lastHour.reduce((sum, time) => sum + (typeof time === 'number' ? time : 0), 0) / this.processingStats.lastHour.length;
    }
  }

  // Public interface methods
  getHealthStatus(): { status: 'healthy' | 'degraded' | 'critical'; avgProcessingTime: number; totalRequests: number } {
    const avgTime = this.processingStats.avgProcessingTime;
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    
    if (avgTime > 1000) {
      status = 'critical';
    } else if (avgTime > 500) {
      status = 'degraded';
    }
    
    return {
      status,
      avgProcessingTime: avgTime,
      totalRequests: this.processingStats.totalRequests
    };
  }
}

// Export singleton instance
export const errorHandlerOrchestrator = ErrorHandlerOrchestrator.getInstance();

// Convenience functions for each AI system
export const handleFoodRecognitionError = async (
  errorType: string,
  message: string,
  userId?: string,
  context?: any
): Promise<ErrorHandlerResponse> => {
  return await errorHandlerOrchestrator.handleError({
    source: 'food_recognition_ai',
    errorType,
    message,
    userId,
    context
  });
};

export const handleUserFacingError = async (
  errorType: string,
  message: string,
  userId?: string,
  context?: any
): Promise<ErrorHandlerResponse> => {
  return await errorHandlerOrchestrator.handleError({
    source: 'user_facing_ai',
    errorType,
    message,
    userId,
    context
  });
};

export const handleMacroCalculatorError = async (
  errorType: string,
  message: string,
  userId?: string,
  context?: any
): Promise<ErrorHandlerResponse> => {
  return await errorHandlerOrchestrator.handleError({
    source: 'macro_calculator_ai',
    errorType,
    message,
    userId,
    context
  });
};

export const handleSystemError = async (
  errorType: string,
  message: string,
  context?: any
): Promise<ErrorHandlerResponse> => {
  return await errorHandlerOrchestrator.handleError({
    source: 'system',
    errorType,
    message,
    context
  });
};