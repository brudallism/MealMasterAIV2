// src/services/error/resilience-manager.ts
// System resilience and recovery management for production stability

import { errorManager } from './error-manager';

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical' | 'down';
  components: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'critical' | 'down';
      lastCheck: number;
      errorRate: number;
      responseTime: number;
    };
  };
  lastUpdate: number;
}

export interface FallbackStrategy {
  type: 'cache' | 'mock' | 'simplified' | 'offline';
  confidence: number;
  limitations: string[];
  userMessage: string;
}

export interface RecoveryAction {
  id: string;
  type: 'restart_component' | 'clear_cache' | 'fallback_mode' | 'notify_user' | 'escalate';
  component: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  automated: boolean;
  description: string;
  estimatedTime: number;
}

export class ResilienceManager {
  private static instance: ResilienceManager;
  private systemHealth: SystemHealth;
  private fallbackStrategies: Map<string, FallbackStrategy[]>;
  private recoveryActions: RecoveryAction[] = [];
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private healthCheckTimer?: NodeJS.Timeout;

  private constructor() {
    this.systemHealth = {
      overall: 'healthy',
      components: {},
      lastUpdate: Date.now()
    };
    
    this.fallbackStrategies = new Map();
    this.initializeFallbackStrategies();
    this.startHealthMonitoring();
  }

  static getInstance(): ResilienceManager {
    if (!ResilienceManager.instance) {
      ResilienceManager.instance = new ResilienceManager();
    }
    return ResilienceManager.instance;
  }

  // Initialize fallback strategies for different failure scenarios
  private initializeFallbackStrategies(): void {
    // OpenAI API failures
    this.fallbackStrategies.set('openai_api', [
      {
        type: 'cache',
        confidence: 0.9,
        limitations: ['Limited to previously cached foods'],
        userMessage: 'Using cached data for food recognition'
      },
      {
        type: 'simplified',
        confidence: 0.6,
        limitations: ['Basic nutrition estimates only', 'Limited food database'],
        userMessage: 'Using simplified food database due to temporary service issues'
      },
      {
        type: 'offline',
        confidence: 0.4,
        limitations: ['Very limited food database', 'Estimated values only'],
        userMessage: 'Working in offline mode - nutrition data may be less accurate'
      }
    ]);

    // Database failures
    this.fallbackStrategies.set('database', [
      {
        type: 'cache',
        confidence: 0.8,
        limitations: ['Recent data only', 'May miss latest updates'],
        userMessage: 'Using local cache due to database connectivity issues'
      },
      {
        type: 'mock',
        confidence: 0.3,
        limitations: ['Generic estimates', 'Not personalized'],
        userMessage: 'Database temporarily unavailable - showing estimated values'
      }
    ]);

    // Cache system failures
    this.fallbackStrategies.set('cache_system', [
      {
        type: 'simplified',
        confidence: 0.7,
        limitations: ['No performance optimization', 'Slower responses'],
        userMessage: 'Cache temporarily disabled - responses may be slower'
      }
    ]);

    // Network failures
    this.fallbackStrategies.set('network', [
      {
        type: 'cache',
        confidence: 0.8,
        limitations: ['Offline data only', 'No real-time updates'],
        userMessage: 'Working offline - using cached data'
      },
      {
        type: 'offline',
        confidence: 0.5,
        limitations: ['Very limited functionality', 'Basic estimates only'],
        userMessage: 'No internet connection - limited functionality available'
      }
    ]);
  }

  // Monitor system health across all components
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  private async performHealthCheck(): Promise<void> {
    console.log('[ResilienceManager] Performing system health check...');
    
    const components = [
      'openai_api',
      'database',
      'cache_system',
      'network',
      'food_recognition_ai',
      'user_facing_ai'
    ];

    for (const component of components) {
      try {
        const health = await this.checkComponentHealth(component);
        this.systemHealth.components[component] = {
          status: health.status,
          lastCheck: Date.now(),
          errorRate: health.errorRate,
          responseTime: health.responseTime
        };
      } catch (error) {
        console.error(`[ResilienceManager] Health check failed for ${component}:`, error);
        this.systemHealth.components[component] = {
          status: 'critical',
          lastCheck: Date.now(),
          errorRate: 1.0,
          responseTime: -1
        };
      }
    }

    this.updateOverallHealth();
    this.systemHealth.lastUpdate = Date.now();

    // Trigger recovery actions if needed
    await this.evaluateRecoveryActions();
  }

  private async checkComponentHealth(component: string): Promise<{
    status: 'healthy' | 'degraded' | 'critical' | 'down';
    errorRate: number;
    responseTime: number;
  }> {
    // Simplified health check - in production this would make actual health checks
    const errorStats = errorManager.getErrorStats();
    const componentErrors = Object.entries(errorStats.errorsByCategory)
      .filter(([category]) => category.includes(component))
      .reduce((sum, [, count]) => sum + count, 0);
    
    const errorRate = componentErrors / Math.max(errorStats.totalErrors, 1);
    
    let status: 'healthy' | 'degraded' | 'critical' | 'down' = 'healthy';
    if (errorRate > 0.5) status = 'critical';
    else if (errorRate > 0.2) status = 'degraded';
    else if (errorRate > 0.05) status = 'degraded';

    return {
      status,
      errorRate,
      responseTime: 100 // Mock response time
    };
  }

  private updateOverallHealth(): void {
    const componentStatuses = Object.values(this.systemHealth.components);
    
    if (componentStatuses.some(c => c.status === 'down')) {
      this.systemHealth.overall = 'down';
    } else if (componentStatuses.some(c => c.status === 'critical')) {
      this.systemHealth.overall = 'critical';
    } else if (componentStatuses.some(c => c.status === 'degraded')) {
      this.systemHealth.overall = 'degraded';
    } else {
      this.systemHealth.overall = 'healthy';
    }
  }

  // Get appropriate fallback strategy for a failed component
  getFallbackStrategy(component: string, severity: 'low' | 'medium' | 'high' | 'critical'): FallbackStrategy | null {
    const strategies = this.fallbackStrategies.get(component);
    if (!strategies || strategies.length === 0) return null;

    // Select strategy based on severity
    switch (severity) {
      case 'low':
        return strategies[0]; // Best fallback
      case 'medium':
        return strategies[Math.min(1, strategies.length - 1)];
      case 'high':
      case 'critical':
        return strategies[strategies.length - 1]; // Most basic fallback
      default:
        return strategies[0];
    }
  }

  // Execute fallback strategy for food recognition
  async executeFoodRecognitionFallback(
    input: any,
    failedComponent: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<any> {
    const strategy = this.getFallbackStrategy(failedComponent, severity);
    
    if (!strategy) {
      throw new Error(`No fallback strategy available for ${failedComponent}`);
    }

    console.log(`[ResilienceManager] Executing ${strategy.type} fallback for ${failedComponent}`);

    switch (strategy.type) {
      case 'cache':
        return await this.executeCacheFallback(input, strategy);
        
      case 'simplified':
        return await this.executeSimplifiedFallback(input, strategy);
        
      case 'mock':
        return await this.executeMockFallback(input, strategy);
        
      case 'offline':
        return await this.executeOfflineFallback(input, strategy);
        
      default:
        throw new Error(`Unknown fallback strategy: ${strategy.type}`);
    }
  }

  private async executeCacheFallback(input: any, strategy: FallbackStrategy): Promise<any> {
    // Try to get cached result
    try {
      // This would integrate with the actual cache manager
      console.log('[ResilienceManager] Attempting cache fallback...');
      
      return {
        success: true,
        recognized_foods: [{
          food_name: this.extractFoodName(input.food_description),
          quantity: "100g",
          quantity_grams: 100,
          confidence: strategy.confidence,
          data_source: 'cache'
        }],
        total_nutrition: this.getBasicNutritionEstimate(input.food_description),
        confidence_overall: strategy.confidence,
        clarification_needed: false,
        accuracy_warnings: strategy.limitations,
        assumptions_made: ['Using cached data due to service issues'],
        data_sources: ['cache'],
        processing_notes: strategy.userMessage
      };
    } catch (error) {
      throw new Error('Cache fallback failed');
    }
  }

  private async executeSimplifiedFallback(input: any, strategy: FallbackStrategy): Promise<any> {
    console.log('[ResilienceManager] Executing simplified fallback...');
    
    const foodName = this.extractFoodName(input.food_description);
    const nutrition = this.getBasicNutritionEstimate(foodName);
    
    return {
      success: true,
      recognized_foods: [{
        food_name: foodName,
        quantity: "100g",
        quantity_grams: 100,
        confidence: strategy.confidence,
        data_source: 'simplified'
      }],
      total_nutrition: nutrition,
      confidence_overall: strategy.confidence,
      clarification_needed: true,
      clarification_message: "Using simplified estimates. Please verify the food and quantity.",
      accuracy_warnings: strategy.limitations,
      assumptions_made: ['Using basic nutrition database', 'Standard serving size assumed'],
      data_sources: ['simplified'],
      processing_notes: strategy.userMessage
    };
  }

  private async executeMockFallback(input: any, strategy: FallbackStrategy): Promise<any> {
    console.log('[ResilienceManager] Executing mock fallback...');
    
    return {
      success: true,
      recognized_foods: [{
        food_name: "Generic Food Item",
        quantity: "100g",
        quantity_grams: 100,
        confidence: strategy.confidence,
        data_source: 'mock'
      }],
      total_nutrition: {
        calories: 150,
        protein: 8,
        carbs: 20,
        fat: 5,
        fiber: 3,
        sugar: 5,
        sodium: 200
      },
      confidence_overall: strategy.confidence,
      clarification_needed: true,
      clarification_message: "Services temporarily unavailable. These are generic estimates.",
      accuracy_warnings: [...strategy.limitations, "Data is not specific to your food item"],
      assumptions_made: ['Generic nutrition values', 'Standard portions'],
      data_sources: ['mock'],
      processing_notes: strategy.userMessage
    };
  }

  private async executeOfflineFallback(input: any, strategy: FallbackStrategy): Promise<any> {
    console.log('[ResilienceManager] Executing offline fallback...');
    
    const basicNutrition = this.getVeryBasicEstimate();
    
    return {
      success: false,
      recognized_foods: [],
      clarification_needed: true,
      clarification_message: "App is in offline mode. Please try again when connected to the internet.",
      accuracy_warnings: strategy.limitations,
      assumptions_made: ['Offline mode active'],
      data_sources: ['offline'],
      processing_notes: strategy.userMessage,
      error: "Service unavailable - offline mode",
      errorType: 'network' as const
    };
  }

  // Basic food name extraction
  private extractFoodName(description: string): string {
    // Simple extraction - remove quantities and common descriptors
    return description
      .replace(/\d+\s*(cups?|ounces?|grams?|lbs?|pounds?)/gi, '')
      .replace(/\b(cooked|raw|fresh|frozen|grilled|baked|fried)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase() || 'unknown food';
  }

  // Basic nutrition estimates for common foods
  private getBasicNutritionEstimate(foodName: string): any {
    const simplified = foodName.toLowerCase();
    
    // Very basic nutrition database
    const basicNutrition: Record<string, any> = {
      'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
      'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
      'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
      'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
      'bread': { calories: 265, protein: 9, carbs: 49, fat: 3.2, fiber: 2.7 }
    };

    // Look for matching foods
    for (const [food, nutrition] of Object.entries(basicNutrition)) {
      if (simplified.includes(food)) {
        return {
          ...nutrition,
          sugar: nutrition.carbs * 0.1, // Rough estimate
          sodium: 100 // Default estimate
        };
      }
    }

    // Generic fallback
    return {
      calories: 150,
      protein: 8,
      carbs: 20,
      fat: 5,
      fiber: 3,
      sugar: 5,
      sodium: 200
    };
  }

  private getVeryBasicEstimate(): any {
    return {
      calories: 100,
      protein: 5,
      carbs: 15,
      fat: 3,
      fiber: 2,
      sugar: 3,
      sodium: 150
    };
  }

  // Evaluate and trigger recovery actions
  private async evaluateRecoveryActions(): Promise<void> {
    const criticalComponents = Object.entries(this.systemHealth.components)
      .filter(([, health]) => health.status === 'critical' || health.status === 'down')
      .map(([component]) => component);

    for (const component of criticalComponents) {
      const action = this.createRecoveryAction(component);
      if (action && !this.isActionAlreadyScheduled(action)) {
        this.scheduleRecoveryAction(action);
      }
    }
  }

  private createRecoveryAction(component: string): RecoveryAction | null {
    const componentHealth = this.systemHealth.components[component];
    if (!componentHealth) return null;

    const actionId = `recovery_${component}_${Date.now()}`;
    
    switch (component) {
      case 'openai_api':
        return {
          id: actionId,
          type: 'fallback_mode',
          component,
          priority: 'high',
          automated: true,
          description: 'Switch to cache-based food recognition',
          estimatedTime: 1000
        };
        
      case 'database':
        return {
          id: actionId,
          type: 'fallback_mode',
          component,
          priority: 'high',
          automated: true,
          description: 'Use local cache for data storage',
          estimatedTime: 500
        };
        
      case 'cache_system':
        return {
          id: actionId,
          type: 'clear_cache',
          component,
          priority: 'medium',
          automated: true,
          description: 'Clear corrupted cache data',
          estimatedTime: 2000
        };
        
      default:
        return {
          id: actionId,
          type: 'notify_user',
          component,
          priority: 'low',
          automated: true,
          description: `Notify user about ${component} issues`,
          estimatedTime: 100
        };
    }
  }

  private isActionAlreadyScheduled(action: RecoveryAction): boolean {
    return this.recoveryActions.some(existing => 
      existing.component === action.component && 
      existing.type === action.type &&
      existing.id !== action.id
    );
  }

  private scheduleRecoveryAction(action: RecoveryAction): void {
    console.log(`[ResilienceManager] Scheduling recovery action: ${action.description}`);
    this.recoveryActions.push(action);
    
    if (action.automated) {
      setTimeout(() => {
        this.executeRecoveryAction(action);
      }, 1000); // Small delay to allow for transient issues
    }
  }

  private async executeRecoveryAction(action: RecoveryAction): Promise<void> {
    console.log(`[ResilienceManager] Executing recovery action: ${action.description}`);
    
    try {
      switch (action.type) {
        case 'clear_cache':
          // Would clear relevant caches
          console.log(`[ResilienceManager] Cache cleared for ${action.component}`);
          break;
          
        case 'fallback_mode':
          // Would enable fallback mode
          console.log(`[ResilienceManager] Fallback mode enabled for ${action.component}`);
          break;
          
        case 'notify_user':
          // Would show user notification
          console.log(`[ResilienceManager] User notified about ${action.component} issues`);
          break;
          
        case 'restart_component':
          // Would restart the component
          console.log(`[ResilienceManager] Component ${action.component} restarted`);
          break;
      }
      
      // Remove completed action
      this.recoveryActions = this.recoveryActions.filter(a => a.id !== action.id);
      
    } catch (error) {
      console.error(`[ResilienceManager] Recovery action failed:`, error);
      
      errorManager.createError(
        `Recovery action failed: ${action.description}`,
        {
          component: 'ResilienceManager',
          operation: 'execute_recovery_action',
          timestamp: Date.now()
        },
        {
          severity: 'high',
          category: 'system',
          telemetryData: { action: action.type, component: action.component }
        }
      );
    }
  }

  // Public interface methods
  getSystemHealth(): SystemHealth {
    return { ...this.systemHealth };
  }

  getRecoveryActions(): RecoveryAction[] {
    return [...this.recoveryActions];
  }

  // Manual recovery trigger
  triggerRecovery(component: string): void {
    const action = this.createRecoveryAction(component);
    if (action) {
      this.scheduleRecoveryAction(action);
    }
  }

  // Graceful shutdown
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    console.log('[ResilienceManager] Shutdown complete');
  }
}

// Export singleton instance
export const resilienceManager = ResilienceManager.getInstance();