// src/services/error/edge-case-handler.ts
// Specialized handling for edge cases and unusual scenarios in food recognition

import { errorManager } from './error-manager';

export interface EdgeCaseScenario {
  type: 'food_safety' | 'dietary_restriction' | 'ambiguous_input' | 'unusual_food' | 'measurement_issue' | 'cultural_context';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  handlingStrategy: 'block' | 'warn' | 'clarify' | 'fallback';
  userMessage: string;
  requiresHumanReview: boolean;
}

export interface EdgeCaseResult {
  shouldProceed: boolean;
  scenario?: EdgeCaseScenario;
  modifiedInput?: string;
  warningMessage?: string;
  fallbackResponse?: any;
}

export class EdgeCaseHandler {
  private static instance: EdgeCaseHandler;
  
  // Patterns that indicate potentially problematic food descriptions
  private readonly FOOD_SAFETY_PATTERNS = [
    /raw\s+(chicken|pork|beef|fish|egg)/i,
    /expired|spoiled|moldy|rotten/i,
    /mushroom.*wild|wild.*mushroom/i,
    /home.*canned|canning.*home/i,
    /undercooked|rare.*chicken|raw.*ground/i,
    /leftover.*\d+\s*days?/i
  ];

  private readonly MEDICAL_DIETARY_PATTERNS = [
    /diabetic|diabetes/i,
    /kidney.*disease|renal/i,
    /heart.*disease|cardiac/i,
    /blood.*pressure|hypertension/i,
    /celiac|gluten.*free.*medical/i,
    /allergy.*severe|anaphylaxis/i,
    /medication.*interaction/i,
    /doctor.*recommended|prescribed.*diet/i
  ];

  private readonly AMBIGUOUS_PATTERNS = [
    /^food$/i,
    /^meal$/i,
    /^something$/i,
    /^stuff$/i,
    /^thing$/i,
    /^dinner|lunch|breakfast$/i,
    /^snack$/i,
    /homemade.*(?!specific ingredient)/i,
    /restaurant.*(?!specific dish)/i
  ];

  private readonly UNUSUAL_FOOD_PATTERNS = [
    /dog.*food|pet.*food/i,
    /inedible|not.*edible/i,
    /poison|toxic/i,
    /alcohol.*\d+.*proof/i,
    /supplement.*(?!food)/i,
    /medication|medicine|pill/i,
    /cleaning.*product|detergent/i
  ];

  private readonly MEASUREMENT_ISSUES = [
    /^\d+$/,  // Just a number with no unit
    /enormous|huge|massive|giant/i,
    /tiny|microscopic|minuscule/i,
    /\d+\s*pounds?\s*of/i,  // Unreasonably large quantities
    /\d+\s*kilograms?\s*of/i
  ];

  private readonly CULTURAL_CONTEXT_PATTERNS = [
    /traditional.*(?!specific dish)/i,
    /authentic.*(?!specific dish)/i,
    /ethnic.*food/i,
    /foreign.*food/i,
    /weird.*food|strange.*food/i
  ];

  private constructor() {}

  static getInstance(): EdgeCaseHandler {
    if (!EdgeCaseHandler.instance) {
      EdgeCaseHandler.instance = new EdgeCaseHandler();
    }
    return EdgeCaseHandler.instance;
  }

  // Main edge case evaluation method
  evaluateInput(foodDescription: string, userId: string): EdgeCaseResult {
    console.log(`[EdgeCaseHandler] Evaluating: "${foodDescription}"`);

    // Check for food safety concerns
    const safetyCheck = this.checkFoodSafety(foodDescription, userId);
    if (!safetyCheck.shouldProceed) return safetyCheck;

    // Check for medical dietary restrictions
    const medicalCheck = this.checkMedicalDietary(foodDescription, userId);
    if (!medicalCheck.shouldProceed) return medicalCheck;

    // Check for unusual/inedible items
    const unusualCheck = this.checkUnusualFood(foodDescription, userId);
    if (!unusualCheck.shouldProceed) return unusualCheck;

    // Check for ambiguous input that needs clarification
    const ambiguousCheck = this.checkAmbiguousInput(foodDescription, userId);
    if (!ambiguousCheck.shouldProceed) return ambiguousCheck;

    // Check for measurement issues
    const measurementCheck = this.checkMeasurementIssues(foodDescription, userId);
    if (!measurementCheck.shouldProceed) return measurementCheck;

    // Check for cultural context issues
    const culturalCheck = this.checkCulturalContext(foodDescription, userId);
    if (!culturalCheck.shouldProceed) return culturalCheck;

    return { shouldProceed: true };
  }

  private checkFoodSafety(foodDescription: string, userId: string): EdgeCaseResult {
    for (const pattern of this.FOOD_SAFETY_PATTERNS) {
      if (pattern.test(foodDescription)) {
        const scenario: EdgeCaseScenario = {
          type: 'food_safety',
          description: `Potentially unsafe food detected: ${foodDescription}`,
          severity: 'critical',
          handlingStrategy: 'block',
          userMessage: "I cannot provide nutritional information for foods that may pose safety risks. Please ensure your food is properly prepared and safe to consume.",
          requiresHumanReview: true
        };

        // Log the safety concern
        errorManager.createError(
          `Food safety concern: ${foodDescription}`,
          {
            userId,
            component: 'EdgeCaseHandler',
            operation: 'food_safety_check',
            timestamp: Date.now()
          },
          {
            severity: 'critical',
            category: 'validation',
            userFacing: true,
            actionRequired: true,
            telemetryData: { safetyPattern: pattern.source, foodDescription }
          }
        );

        return {
          shouldProceed: false,
          scenario,
          warningMessage: scenario.userMessage
        };
      }
    }
    return { shouldProceed: true };
  }

  private checkMedicalDietary(foodDescription: string, userId: string): EdgeCaseResult {
    for (const pattern of this.MEDICAL_DIETARY_PATTERNS) {
      if (pattern.test(foodDescription)) {
        const scenario: EdgeCaseScenario = {
          type: 'dietary_restriction',
          description: `Medical dietary context detected: ${foodDescription}`,
          severity: 'high',
          handlingStrategy: 'block',
          userMessage: "I cannot provide dietary advice for medical conditions. Please consult with your healthcare provider or a registered dietitian for medical dietary guidance.",
          requiresHumanReview: true
        };

        errorManager.createError(
          `Medical dietary restriction mentioned: ${foodDescription}`,
          {
            userId,
            component: 'EdgeCaseHandler',
            operation: 'medical_dietary_check',
            timestamp: Date.now()
          },
          {
            severity: 'high',
            category: 'validation',
            userFacing: true,
            actionRequired: false,
            telemetryData: { medicalPattern: pattern.source }
          }
        );

        return {
          shouldProceed: false,
          scenario,
          warningMessage: scenario.userMessage
        };
      }
    }
    return { shouldProceed: true };
  }

  private checkUnusualFood(foodDescription: string, userId: string): EdgeCaseResult {
    for (const pattern of this.UNUSUAL_FOOD_PATTERNS) {
      if (pattern.test(foodDescription)) {
        const scenario: EdgeCaseScenario = {
          type: 'unusual_food',
          description: `Non-food or unusual item detected: ${foodDescription}`,
          severity: 'medium',
          handlingStrategy: 'block',
          userMessage: "I can only provide nutritional information for edible food items. Please describe a food that you're planning to eat.",
          requiresHumanReview: false
        };

        return {
          shouldProceed: false,
          scenario,
          warningMessage: scenario.userMessage
        };
      }
    }
    return { shouldProceed: true };
  }

  private checkAmbiguousInput(foodDescription: string, userId: string): EdgeCaseResult {
    for (const pattern of this.AMBIGUOUS_PATTERNS) {
      if (pattern.test(foodDescription.trim())) {
        const scenario: EdgeCaseScenario = {
          type: 'ambiguous_input',
          description: `Ambiguous food description: ${foodDescription}`,
          severity: 'medium',
          handlingStrategy: 'clarify',
          userMessage: "That description is too general. Could you be more specific about what food you're asking about?",
          requiresHumanReview: false
        };

        return {
          shouldProceed: false,
          scenario,
          warningMessage: this.generateClarificationPrompt(foodDescription)
        };
      }
    }
    return { shouldProceed: true };
  }

  private checkMeasurementIssues(foodDescription: string, userId: string): EdgeCaseResult {
    // Check for unreasonable quantities
    const poundsMatch = foodDescription.match(/(\d+)\s*pounds?\s*of/i);
    if (poundsMatch && parseInt(poundsMatch[1]) > 5) {
      const scenario: EdgeCaseScenario = {
        type: 'measurement_issue',
        description: `Unusually large quantity: ${foodDescription}`,
        severity: 'low',
        handlingStrategy: 'warn',
        userMessage: `${poundsMatch[1]} pounds seems like a very large quantity. Are you sure that's correct?`,
        requiresHumanReview: false
      };

      return {
        shouldProceed: true,
        scenario,
        warningMessage: scenario.userMessage
      };
    }

    // Check for just numbers without context
    for (const pattern of this.MEASUREMENT_ISSUES) {
      if (pattern.test(foodDescription.trim()) && foodDescription.trim().length < 5) {
        const scenario: EdgeCaseScenario = {
          type: 'measurement_issue',
          description: `Unclear measurement: ${foodDescription}`,
          severity: 'medium',
          handlingStrategy: 'clarify',
          userMessage: "I need more information. Could you tell me what food you're asking about and how much?",
          requiresHumanReview: false
        };

        return {
          shouldProceed: false,
          scenario,
          warningMessage: "Please provide both the food name and quantity (e.g., '1 cup of rice' or '2 apples')."
        };
      }
    }

    return { shouldProceed: true };
  }

  private checkCulturalContext(foodDescription: string, userId: string): EdgeCaseResult {
    for (const pattern of this.CULTURAL_CONTEXT_PATTERNS) {
      if (pattern.test(foodDescription)) {
        const scenario: EdgeCaseScenario = {
          type: 'cultural_context',
          description: `Cultural context needs clarification: ${foodDescription}`,
          severity: 'low',
          handlingStrategy: 'clarify',
          userMessage: "Could you be more specific about the dish? Traditional foods can vary significantly between regions.",
          requiresHumanReview: false
        };

        return {
          shouldProceed: true, // Allow processing but request clarification
          scenario,
          warningMessage: "I'll do my best to estimate, but could you provide more specific details about the dish for better accuracy?"
        };
      }
    }
    return { shouldProceed: true };
  }

  // Generate helpful clarification prompts
  private generateClarificationPrompt(input: string): string {
    const lower = input.toLowerCase();
    
    if (lower.includes('breakfast')) {
      return "What did you have for breakfast? For example: 'scrambled eggs and toast' or 'oatmeal with banana'.";
    }
    if (lower.includes('lunch')) {
      return "What did you have for lunch? For example: 'turkey sandwich' or 'chicken caesar salad'.";
    }
    if (lower.includes('dinner')) {
      return "What did you have for dinner? For example: 'grilled salmon with rice' or 'spaghetti with meat sauce'.";
    }
    if (lower.includes('snack')) {
      return "What was your snack? For example: 'apple slices' or 'handful of almonds'.";
    }
    if (lower.includes('homemade')) {
      return "What homemade dish are you asking about? Please describe the main ingredients.";
    }
    if (lower.includes('restaurant')) {
      return "What dish did you order at the restaurant? Please describe it as specifically as possible.";
    }
    
    return "Could you be more specific? For example, instead of 'food', try 'grilled chicken breast' or 'chocolate chip cookie'.";
  }

  // Handle specific edge cases with custom logic
  handleSpecificEdgeCases(foodDescription: string, userId: string): {
    modifiedDescription?: string;
    additionalWarnings?: string[];
    confidenceAdjustment?: number;
  } {
    const result: any = {};
    
    // Handle commonly misspelled foods
    const correctedDescription = this.correctCommonMisspellings(foodDescription);
    if (correctedDescription !== foodDescription) {
      result.modifiedDescription = correctedDescription;
      result.additionalWarnings = [`Did you mean "${correctedDescription}"?`];
    }
    
    // Handle portion size extremes
    if (this.hasExtremePortion(foodDescription)) {
      result.confidenceAdjustment = -0.2; // Reduce confidence for extreme portions
      result.additionalWarnings = result.additionalWarnings || [];
      result.additionalWarnings.push("Portion size seems unusual - please verify the quantity.");
    }
    
    // Handle alcohol content
    if (this.containsAlcohol(foodDescription)) {
      result.additionalWarnings = result.additionalWarnings || [];
      result.additionalWarnings.push("Nutritional data includes alcohol calories. Please consume responsibly.");
    }
    
    return result;
  }

  private correctCommonMisspellings(description: string): string {
    const corrections: Record<string, string> = {
      'brocoli': 'broccoli',
      'broccolli': 'broccoli',
      'tomatoe': 'tomato',
      'potatoe': 'potato',
      'bannana': 'banana',
      'strawberrys': 'strawberries',
      'chiken': 'chicken',
      'chickin': 'chicken',
      'salmond': 'salmon',
      'avacado': 'avocado',
      'avacodo': 'avocado'
    };
    
    let corrected = description;
    for (const [wrong, right] of Object.entries(corrections)) {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      corrected = corrected.replace(regex, right);
    }
    
    return corrected;
  }

  private hasExtremePortion(description: string): boolean {
    // Check for very large quantities
    const largeQuantityPatterns = [
      /\d{2,}\s*(cups?|ounces?|pounds?)/i,
      /[5-9]\d+\s*grams?/i,
      /\d+\s*(gallons?|liters?)/i
    ];
    
    return largeQuantityPatterns.some(pattern => pattern.test(description));
  }

  private containsAlcohol(description: string): boolean {
    const alcoholPatterns = [
      /beer|wine|vodka|whiskey|rum|gin|bourbon|scotch/i,
      /alcohol|alcoholic/i,
      /cocktail|mixed.*drink/i,
      /\d+.*proof|\d+.*abv|\d+.*alcohol/i
    ];
    
    return alcoholPatterns.some(pattern => pattern.test(description));
  }

  // Validate input length and characters
  validateInputFormat(input: string): { valid: boolean; error?: string } {
    if (!input || input.trim().length === 0) {
      return { valid: false, error: "Food description cannot be empty" };
    }
    
    if (input.length > 500) {
      return { valid: false, error: "Food description is too long (max 500 characters)" };
    }
    
    // Check for suspicious patterns (potential injection attempts)
    const suspiciousPatterns = [
      /<script|javascript:|data:|vbscript:/i,
      /\beval\s*\(|\bexec\s*\(/i,
      /\${.*}|\#\{.*\}/,
      /\b(drop|delete|update|insert|select)\s+(table|from|into)\b/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        return { valid: false, error: "Invalid characters or format in food description" };
      }
    }
    
    return { valid: true };
  }

  // Get edge case statistics for monitoring
  getEdgeCaseStats(): {
    totalEdgeCases: number;
    edgeCasesByType: Record<string, number>;
    blockedRequests: number;
    clarificationRequests: number;
  } {
    // This would be implemented with actual tracking
    return {
      totalEdgeCases: 0,
      edgeCasesByType: {},
      blockedRequests: 0,
      clarificationRequests: 0
    };
  }
}

// Export singleton instance
export const edgeCaseHandler = EdgeCaseHandler.getInstance();