// Stage 2 Integration Test - AI Systems with Error Handler Orchestrator
// Tests end-to-end integration of AI systems with the Error Handler Orchestrator

import { foodRecognitionAI } from '../../ai/food-recognition-ai';
import { userFacingAI } from '../../ai/user-facing-ai';
import { 
  FoodRecognitionErrorIntegration,
  UserFacingErrorIntegration,
  HealthCheckIntegration 
} from '../ai-integration-points';

// Mock the error handling dependencies
jest.mock('../error-manager');
jest.mock('../resilience-manager');
jest.mock('../edge-case-handler');
jest.mock('../../validation/data-validation-gateway');

describe('Stage 2: AI Systems Integration with Error Handler Orchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up any open handles
    try {
      const { resilienceManager } = await import('../resilience-manager');
      if (resilienceManager && typeof resilienceManager.shutdown === 'function') {
        await resilienceManager.shutdown();
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Food Recognition AI Integration', () => {
    it('should handle validation errors through orchestrator', async () => {
      const response = await FoodRecognitionErrorIntegration.handleValidationError(
        'invalid input test',
        'test-user',
        'Test validation error'
      );

      expect(response).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.recoveryActions).toBeInstanceOf(Array);
      expect(response.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle low confidence scenarios through orchestrator', async () => {
      const response = await FoodRecognitionErrorIntegration.handleLowConfidence(
        'some weird food',
        'test-user',
        0.3
      );

      expect(response).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.recoveryActions).toBeInstanceOf(Array);
      expect(response.systemStatus).toMatch(/operational|degraded|recovery_mode/);
    });

    it('should integrate with Food Recognition AI processFood method', async () => {
      // Test with invalid input to trigger orchestrator validation
      const result = await foodRecognitionAI.processFood({
        food_description: '', // Empty description should trigger validation error
        context: 'test',
        user_id: 'test-user'
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.metadata?.processingTime).toBeGreaterThan(0);
    });
  });

  describe('User Facing AI Integration', () => {
    it('should handle conversation errors through orchestrator', async () => {
      const response = await UserFacingErrorIntegration.handleConversationError(
        'test user message',
        'test-user',
        'API timeout error'
      );

      expect(response).toBeDefined();
      expect(response.userMessage).toBeDefined();
      expect(response.systemStatus).toMatch(/operational|degraded|recovery_mode/);
    });

    it('should detect crisis situations and escalate appropriately', async () => {
      const response = await UserFacingErrorIntegration.handleCrisisDetection(
        'I want to kill myself',
        'test-user',
        'self_harm_crisis'
      );

      expect(response).toBeDefined();
      expect(response.escalationRequired).toBe(true);
      expect(response.userMessage).toContain('988'); // Suicide prevention hotline
    });

    it('should integrate with User Facing AI processMessage method', async () => {
      // Test with empty message to trigger validation through orchestrator
      const result = await userFacingAI.processMessage('', 'test-user');

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle crisis messages in User Facing AI', async () => {
      // This should trigger crisis detection through the orchestrator
      const result = await userFacingAI.processMessage(
        'I hate myself and want to end it all', 
        'crisis-test-user'
      );

      expect(result).toBeDefined();
      // Crisis responses may still return success=true with appropriate message
      expect(result.response || result.error).toBeDefined();
    });
  });

  describe('System Health Integration', () => {
    it('should provide comprehensive system health status', async () => {
      const healthStatus = await HealthCheckIntegration.getSystemHealthStatus();

      expect(healthStatus).toBeDefined();
      expect(healthStatus).toHaveProperty('orchestrator');
      expect(healthStatus).toHaveProperty('errorManager');
      expect(healthStatus).toHaveProperty('resilience');
      expect(healthStatus).toHaveProperty('validationGateway');
    });

    it('should perform system diagnostics', async () => {
      const diagnostics = await HealthCheckIntegration.performSystemDiagnostics();

      expect(diagnostics).toBeDefined();
      expect(diagnostics).toHaveProperty('status');
      expect(diagnostics).toHaveProperty('components');
      expect(diagnostics).toHaveProperty('recommendations');
      expect(['healthy', 'degraded', 'critical']).toContain(diagnostics.status);
    });
  });

  describe('End-to-End Integration Scenarios', () => {
    it('should handle complete food logging workflow with error recovery', async () => {
      // Test complete workflow: User message -> Food Recognition -> Error handling
      const userMessage = 'I ate something weird';
      
      // Step 1: User Facing AI processes the message
      const userFacingResponse = await userFacingAI.processMessage(userMessage, 'workflow-test-user');
      expect(userFacingResponse).toBeDefined();

      // Step 2: If it involves food logging, Food Recognition AI should be called
      // (This would normally be handled internally by User Facing AI)
      const foodRecognitionResponse = await foodRecognitionAI.processFood({
        food_description: 'something weird',
        context: 'user_request',
        user_id: 'workflow-test-user'
      });
      
      expect(foodRecognitionResponse).toBeDefined();
    });

    it('should maintain performance under concurrent AI system errors', async () => {
      const startTime = Date.now();
      
      // Create multiple concurrent error scenarios
      const promises = [
        userFacingAI.processMessage('', 'concurrent-user-1'), // Validation error
        userFacingAI.processMessage('test', 'concurrent-user-2'), // Normal processing
        foodRecognitionAI.processFood({
          food_description: '',
          context: 'test',
          user_id: 'concurrent-user-3'
        }), // Validation error
        UserFacingErrorIntegration.handleConversationError(
          'test message',
          'concurrent-user-4',
          'timeout error'
        ),
        FoodRecognitionErrorIntegration.handleLowConfidence(
          'unknown food',
          'concurrent-user-5',
          0.2
        )
      ];

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(5);
      expect(totalTime).toBeLessThan(3000); // All processing within 3 seconds
      
      // All should have valid responses
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      });
    });

    it('should maintain crisis detection priority across AI systems', async () => {
      const crisisMessage = 'I only eat 200 calories per day and want to die';
      
      // Test crisis detection in User Facing AI
      const userFacingResult = await userFacingAI.processMessage(crisisMessage, 'crisis-priority-user');
      
      // Test crisis detection in Food Recognition AI (through validation)
      const foodResult = await foodRecognitionAI.processFood({
        food_description: 'I only eat 200 calories per day',
        context: crisisMessage,
        user_id: 'crisis-priority-user'
      });

      // At least one should detect the crisis
      const crisisDetected = (
        (userFacingResult.response && userFacingResult.response.includes('988')) ||
        (userFacingResult.error && userFacingResult.error.includes('crisis')) ||
        (foodResult.error && foodResult.error.includes('988'))
      );

      expect(crisisDetected).toBe(true);
    });
  });

  describe('Error Recovery and Fallback', () => {
    it('should gracefully fall back to legacy error handling if orchestrator fails', async () => {
      // This test ensures resilience when the orchestrator itself has issues
      
      // Mock orchestrator failure
      const originalMethod = UserFacingErrorIntegration.handleConversationError;
      UserFacingErrorIntegration.handleConversationError = jest.fn().mockRejectedValue(
        new Error('Orchestrator failure test')
      );

      try {
        const result = await userFacingAI.processMessage('test message', 'fallback-test-user');
        
        // Should still get a valid response via fallback
        expect(result).toBeDefined();
        expect(result.response || result.error).toBeDefined();
        
      } finally {
        // Restore original method
        UserFacingErrorIntegration.handleConversationError = originalMethod;
      }
    });
  });
});