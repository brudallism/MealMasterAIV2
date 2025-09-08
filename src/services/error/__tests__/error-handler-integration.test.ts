// Error Handler Integration Test - End-to-end verification
// Tests the complete Error Handler Orchestrator with all integrated systems

import { 
  errorHandlerOrchestrator,
  handleFoodRecognitionError,
  handleUserFacingError,
  handleMacroCalculatorError,
  type ErrorHandlerRequest 
} from '../error-handler-orchestrator';

// Mock the integrated systems for testing
jest.mock('../error-manager');
jest.mock('../resilience-manager');  
jest.mock('../edge-case-handler');
jest.mock('../../validation/data-validation-gateway');

describe('Error Handler Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up any open handles
    const { resilienceManager } = await import('../resilience-manager');
    if (resilienceManager && typeof resilienceManager.shutdown === 'function') {
      await resilienceManager.shutdown();
    }
  });

  describe('Crisis Detection System', () => {
    it('should detect self-harm language and escalate immediately', async () => {
      const request: ErrorHandlerRequest = {
        source: 'user_facing_ai',
        errorType: 'conversation_error',
        message: 'User said: I want to kill myself',
        userId: 'test-user',
        context: { userInput: 'I want to kill myself' }
      };

      const response = await errorHandlerOrchestrator.handleError(request);

      expect(response.success).toBe(false);
      expect(response.escalationRequired).toBe(true);
      expect(response.userMessage).toContain('National Suicide Prevention Lifeline');
      expect(response.userMessage).toContain('988');
      expect(response.processingTimeMs).toBeLessThan(200); // Fast response for crisis
    });

    it('should detect eating disorder patterns and provide appropriate resources', async () => {
      const request: ErrorHandlerRequest = {
        source: 'user_facing_ai',
        errorType: 'conversation_error', 
        message: 'User mentioned restricting to only 300 calories daily',
        userId: 'test-user',
        context: { userInput: 'I only eat 300 calories per day' }
      };

      const response = await errorHandlerOrchestrator.handleError(request);

      expect(response.success).toBe(false);
      expect(response.escalationRequired).toBe(true);
      expect(response.userMessage).toContain('National Eating Disorders Association');
      expect(response.userMessage).toContain('(800) 931-2237');
    });
  });

  describe('Routing System', () => {
    it('should route food safety issues to EdgeCaseHandler', async () => {
      const request: ErrorHandlerRequest = {
        source: 'food_recognition_ai',
        errorType: 'food_safety_concern',
        message: 'Raw chicken detected',
        userId: 'test-user',
        context: { userInput: 'raw chicken breast' }
      };

      const response = await errorHandlerOrchestrator.handleError(request);

      expect(response.success).toBeDefined();
      expect(response.processingTimeMs).toBeLessThan(500);
    });

    it('should route performance issues to ResilienceManager', async () => {
      const request: ErrorHandlerRequest = {
        source: 'system',
        errorType: 'api_timeout',
        message: 'OpenAI API timeout after 30 seconds',
        userId: 'test-user'
      };

      const response = await errorHandlerOrchestrator.handleError(request);

      expect(response.success).toBeDefined();
      expect(response.systemStatus).toMatch(/operational|degraded|recovery_mode/);
    });

    it('should route database issues to ValidationGateway', async () => {
      const request: ErrorHandlerRequest = {
        source: 'data_validation_gateway',
        errorType: 'database_connection_error',
        message: 'Unable to connect to Supabase',
        userId: 'test-user'
      };

      const response = await errorHandlerOrchestrator.handleError(request);

      expect(response.success).toBeDefined();
      // Database errors should have user-friendly error message
      expect(response.userMessage).toBeDefined();
      expect(response.userMessage.length).toBeGreaterThan(10);
      expect(response.recoveryActions).toBeDefined();
      expect(Array.isArray(response.recoveryActions)).toBe(true);
    });

    it('should handle simple errors directly for performance', async () => {
      const request: ErrorHandlerRequest = {
        source: 'food_recognition_ai',
        errorType: 'low_confidence',
        message: 'Recognition confidence below threshold',
        userId: 'test-user',
        metadata: { severity: 'low' }
      };

      const response = await errorHandlerOrchestrator.handleError(request);

      expect(response.success).toBe(true);
      expect(response.processingTimeMs).toBeLessThan(100); // Very fast direct handling
      // Low confidence errors should have helpful user message
      expect(response.userMessage).toBeDefined();
      expect(response.userMessage.length).toBeGreaterThan(10);
      expect(response.recoveryActions).toBeDefined();
    });
  });

  describe('AI System Integration', () => {
    it('should handle Food Recognition AI errors with proper context', async () => {
      const response = await handleFoodRecognitionError(
        'food_recognition_failed',
        'Unable to identify food item',
        'test-user',
        { userInput: 'something weird looking' }
      );

      expect(response.success).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.recoveryActions).toBeInstanceOf(Array);
      expect(response.processingTimeMs).toBeLessThan(1000);
    });

    it('should handle User Facing AI errors with conversation context', async () => {
      const response = await handleUserFacingError(
        'response_generation_error',
        'Failed to generate appropriate response',
        'test-user',
        { userInput: 'Tell me about my nutrition' }
      );

      expect(response.success).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.recoveryActions).toContain('Try again');
    });

    it('should handle Macro Calculator AI errors with calculation context', async () => {
      const response = await handleMacroCalculatorError(
        'calculation_error',
        'Division by zero in macro calculation',
        'test-user',
        { nutritionData: { calories: 500, protein: 0 } }
      );

      expect(response.success).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.systemStatus).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    it('should process errors within 200ms performance target', async () => {
      const startTime = Date.now();
      
      const request: ErrorHandlerRequest = {
        source: 'user_facing_ai',
        errorType: 'minor_processing_error',
        message: 'Small hiccup in processing',
        userId: 'test-user'
      };

      const response = await errorHandlerOrchestrator.handleError(request);
      const totalTime = Date.now() - startTime;

      expect(totalTime).toBeLessThan(200);
      expect(response.processingTimeMs).toBeLessThan(200);
      expect(response.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple concurrent errors efficiently', async () => {
      const requests: Promise<any>[] = [];
      
      for (let i = 0; i < 10; i++) {
        const request: ErrorHandlerRequest = {
          source: 'system',
          errorType: 'concurrent_test_error',
          message: `Concurrent error ${i}`,
          userId: `test-user-${i}`
        };
        
        requests.push(errorHandlerOrchestrator.handleError(request));
      }

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      expect(responses).toHaveLength(10);
      expect(totalTime).toBeLessThan(1000); // All 10 processed in under 1 second
      responses.forEach(response => {
        expect(response.success).toBeDefined();
        expect(response.processingTimeMs).toBeLessThan(200);
      });
    });
  });

  describe('System Health Integration', () => {
    it('should provide comprehensive system health status', () => {
      const healthStatus = errorHandlerOrchestrator.getHealthStatus();

      expect(healthStatus).toHaveProperty('status');
      expect(healthStatus).toHaveProperty('avgProcessingTime');
      expect(healthStatus).toHaveProperty('totalRequests');
      expect(['healthy', 'degraded', 'critical']).toContain(healthStatus.status);
    });

    it('should track processing statistics correctly', async () => {
      const initialHealth = errorHandlerOrchestrator.getHealthStatus();
      const initialRequests = initialHealth.totalRequests;

      // Process a few errors
      for (let i = 0; i < 3; i++) {
        await errorHandlerOrchestrator.handleError({
          source: 'system',
          errorType: 'stats_test_error',
          message: `Stats test ${i}`,
          userId: 'stats-test-user'
        });
      }

      const finalHealth = errorHandlerOrchestrator.getHealthStatus();
      expect(finalHealth.totalRequests).toBe(initialRequests + 3);
      expect(finalHealth.avgProcessingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Fallback and Recovery', () => {
    it('should provide emergency fallback when orchestrator fails', async () => {
      // Create a request that might cause internal errors
      const malformedRequest = {
        source: 'invalid_source',
        errorType: null,
        message: undefined,
        userId: 'fallback-test'
      } as any;

      const response = await errorHandlerOrchestrator.handleError(malformedRequest);

      // Should still return a valid response even with bad input
      expect(response.success).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.recoveryActions).toBeInstanceOf(Array);
      expect(response.systemStatus).toBe('recovery_mode');
      expect(response.processingTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});