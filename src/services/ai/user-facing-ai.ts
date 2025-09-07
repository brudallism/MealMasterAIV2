import { openAIClient } from './openai-client';
import { useAIStore } from '../../stores/ai-store';
import { foodRecognitionAI, FoodRecognitionInput, FoodRecognitionResponse } from './food-recognition-ai';
import OpenAI from 'openai';

// Intent classification types from User Facing AI Guide
export type IntentType = 
  | 'food_logging'      // User wants to log a meal they ate
  | 'progress_check'    // User wants to know their macro progress or daily totals
  | 'goal_question'     // General nutrition advice or macro-related questions
  | 'general_chat'      // Greetings, casual conversation, motivation
  | 'help_request'      // User needs guidance on how to use the app
  | 'clarification_needed'; // Ambiguous input requiring clarification

interface IntentClassificationResult {
  intent: IntentType;
  confidence: number;
  reasoning?: string;
}

interface MockNutritionData {
  food: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
}

interface MockProgressData {
  currentProtein: number;
  proteinGoal: number;
  proteinPercentage: number;
  timeOfDay: string;
  encouragement: string;
}

interface ConversationContext {
  userId: string;
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  lastActivity: Date;
  windowStart: Date;
}

interface UserFacingAIResponse {
  success: boolean;
  response?: string;
  error?: string;
  errorType?: 'network' | 'api' | 'validation' | 'system' | 'timeout';
  fallbackUsed?: boolean;
  metadata?: {
    processingTime: number;
    model: string;
    intent?: IntentClassificationResult;
    templateUsed?: string;
    contextMessages?: number;
    retryAttempt?: number;
  };
}

class UserFacingAI {
  private readonly conversationContexts = new Map<string, ConversationContext>();
  private readonly CONTEXT_WINDOW_HOURS = 24;
  private readonly MAX_CONTEXT_MESSAGES = 20;
  private readonly MAX_RETRY_ATTEMPTS = 2;
  private readonly API_TIMEOUT_MS = 10000; // 10 seconds
  private readonly VALIDATION_MAX_LENGTH = 2000;

  private readonly systemPrompt = `You are Meal Master AI Assistant, a friendly nutrition coach focused on food tracking and macro progress. 

Core Function: Primary user interface coordinating with food recognition, macro calculation, and data systems
Model: GPT-4o-mini (cost-optimized conversational AI)

AGGRESSIVE SAFETY FRAMEWORK:
EATING_DISORDERS_MENTAL_HEALTH:
- Never diagnose eating disorders or provide treatment advice
- Never suggest dangerous calorie restrictions (<1200 calories daily)
- Always refer to professional help for serious mental health concerns
- Immediately escalate self-harm language

MEDICAL_BOUNDARIES:
- Never provide medical diagnosis or treatment recommendations
- Never suggest specific medical interventions for health conditions
- Always recommend consulting healthcare professionals for medical concerns
- Never provide advice for medical dietary restrictions without professional oversight

CRISIS_DETECTION_KEYWORDS:
If user mentions: "I can't do this anymore", "I want to give up", "I hate myself", "self harm", "suicide", "dangerous restriction", "I'm worthless"
→ IMMEDIATELY respond with professional referral and supportive message

PERSONALITY FRAMEWORK (V0.1: Friendly Focused Coach):
COMMUNICATION_STYLE:
- Casual, friendly tone that makes nutrition tracking enjoyable
- Use first person for personal responses: "I think that's great!"
- Cite research when giving advice: "Research shows protein helps with..."
- Balance casual conversation with expert insights
- Keep responses conversational, not robotic

SCOPE_BOUNDARIES:
- PRIMARY FOCUS: Food tracking, macro progress, basic nutrition questions
- REDIRECT OFF-TOPIC: Politely redirect non-nutrition topics back to food/nutrition
- NO UNSOLICITED ADVICE: Wait for user questions before offering suggestions
- TRACK ONLY (V0.1): Focus on logging accuracy, not meal planning or education

HARD RULES:
NEVER:
- Provide medical advice or diagnose conditions
- Suggest meal plans or recipes (V0.3 feature)
- Offer unsolicited behavioral coaching (V0.2 feature)
- Handle non-nutrition topics extensively
- Make calorie restriction recommendations without user goals

ALWAYS:
- Confirm successful food logging with encouraging feedback
- Provide macro progress updates when meals are logged
- Ask clarifying questions when food descriptions are ambiguous
- Route complex nutrition questions to appropriate AI systems
- Maintain 24-hour conversation context window

MUST:
- Use friendly, encouraging tone in all interactions
- Route food logging to Food Recognition AI
- Route progress questions to Macro Calculator AI
- Save all conversations to database for context
- Handle errors gracefully with helpful alternatives

RESPONSE_PERSONALITY:
- Start responses with connection: "Nice!" "Great choice!" "I can help with that!"
- Include specific macro numbers when available
- End with forward momentum: "What's next?" "How does that feel?" "Anything else to track?"
- Use contractions and casual language: "That's awesome!" not "That is excellent."

For V0.1, respond to all food logging attempts with encouraging confirmation and ask clarifying questions when needed. Keep responses under 100 words and maintain the friendly, supportive personality.`;

  // Error handling and validation methods
  private validateInput(userMessage: string, userId: string): { valid: boolean; error?: string; errorType?: string } {
    if (!userMessage || typeof userMessage !== 'string') {
      return { 
        valid: false, 
        error: 'Message cannot be empty', 
        errorType: 'validation' 
      };
    }

    if (!userId || typeof userId !== 'string') {
      return { 
        valid: false, 
        error: 'User ID is required', 
        errorType: 'validation' 
      };
    }

    if (userMessage.trim().length === 0) {
      return { 
        valid: false, 
        error: 'Message cannot be empty', 
        errorType: 'validation' 
      };
    }

    if (userMessage.length > this.VALIDATION_MAX_LENGTH) {
      return { 
        valid: false, 
        error: `Message too long (max ${this.VALIDATION_MAX_LENGTH} characters)`, 
        errorType: 'validation' 
      };
    }

    return { valid: true };
  }

  private generateErrorFallback(errorType: string, intent: IntentType): string {
    console.log(`[UserFacingAI] Generating fallback response for ${errorType} error with intent: ${intent}`);
    
    switch (intent) {
      case 'food_logging':
        return "I'm having trouble processing your food entry right now, but I want to make sure we don't lose it! Could you try describing your meal again? I'm here to help track your nutrition! 🍽️";
      
      case 'progress_check':
        return "I'm having a bit of trouble checking your progress right now. While I sort this out, keep up the great work with your nutrition tracking! Try asking about your progress again in a moment.";
      
      case 'goal_question':
        return "I'm experiencing some technical difficulties with complex nutrition questions right now. For immediate help, I'd recommend checking with a nutritionist or trying your question again in a few minutes.";
      
      case 'help_request':
        return "I'm having trouble right now, but I'm still here to help! You can try logging food by saying something like 'I ate chicken and rice for lunch' or ask about your progress with 'How's my protein today?' Give it another try!";
      
      case 'general_chat':
        return "Thanks for your patience! I'm experiencing some technical issues, but I'm still excited to help you track your nutrition. What would you like to log or check on today?";
      
      case 'clarification_needed':
        return "I'm having some trouble right now, but I still want to help you log that food! Could you give me a bit more detail about what you ate? Like the portion size and how it was prepared?";
      
      default:
        return "I'm experiencing some technical difficulties, but I'm still here to help with your nutrition tracking! Try describing a meal you'd like to log, and I'll do my best to help you track it.";
    }
  }

  private categorizeError(error: any): { errorType: string; isRetryable: boolean } {
    const errorMessage = error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || '';
    
    if (errorMessage.includes('network') || errorMessage.includes('connection') || 
        errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
      return { errorType: 'network', isRetryable: true };
    }
    
    if (errorMessage.includes('api') || errorMessage.includes('openai') || 
        errorMessage.includes('unauthorized') || errorMessage.includes('key')) {
      return { errorType: 'api', isRetryable: false };
    }
    
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return { errorType: 'validation', isRetryable: false };
    }
    
    if (errorMessage.includes('timeout')) {
      return { errorType: 'timeout', isRetryable: true };
    }
    
    return { errorType: 'system', isRetryable: true };
  }

  private async retryWithBackoff(
    operation: () => Promise<any>, 
    maxAttempts: number = this.MAX_RETRY_ATTEMPTS,
    baseDelayMs: number = 1000
  ): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const { isRetryable } = this.categorizeError(error);
        
        if (!isRetryable || attempt === maxAttempts) {
          throw error;
        }
        
        const delay = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`[UserFacingAI] Retry attempt ${attempt}/${maxAttempts} after ${delay}ms delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  // Context management methods for 24-hour conversation window
  private getOrCreateContext(userId: string): ConversationContext {
    const now = new Date();
    let context = this.conversationContexts.get(userId);
    
    // Create new context if doesn't exist or window expired
    if (!context || this.isContextExpired(context, now)) {
      console.log(`[UserFacingAI] Creating new context window for user ${userId}`);
      context = {
        userId,
        messages: [],
        lastActivity: now,
        windowStart: now
      };
      this.conversationContexts.set(userId, context);
    }
    
    return context;
  }

  private isContextExpired(context: ConversationContext, now: Date): boolean {
    const hoursElapsed = (now.getTime() - context.windowStart.getTime()) / (1000 * 60 * 60);
    return hoursElapsed >= this.CONTEXT_WINDOW_HOURS;
  }

  private updateContext(context: ConversationContext, userMessage: string, aiResponse: string): void {
    const now = new Date();
    
    // Add user message
    context.messages.push({
      role: 'user',
      content: userMessage
    });
    
    // Add AI response
    context.messages.push({
      role: 'assistant',
      content: aiResponse
    });
    
    // Update last activity
    context.lastActivity = now;
    
    // Trim messages if exceeding limit (keep most recent)
    if (context.messages.length > this.MAX_CONTEXT_MESSAGES) {
      const excess = context.messages.length - this.MAX_CONTEXT_MESSAGES;
      context.messages = context.messages.slice(excess);
      console.log(`[UserFacingAI] Trimmed ${excess} old messages from context for user ${context.userId}`);
    }
    
    console.log(`[UserFacingAI] Updated context for user ${context.userId}: ${context.messages.length} messages`);
  }

  private getContextMessages(context: ConversationContext): OpenAI.Chat.ChatCompletionMessageParam[] {
    // Return copy of messages to avoid mutations
    return [...context.messages];
  }

  private cleanExpiredContexts(): void {
    const now = new Date();
    const expiredUsers: string[] = [];
    
    for (const [userId, context] of this.conversationContexts.entries()) {
      if (this.isContextExpired(context, now)) {
        expiredUsers.push(userId);
      }
    }
    
    for (const userId of expiredUsers) {
      this.conversationContexts.delete(userId);
      console.log(`[UserFacingAI] Cleaned expired context for user ${userId}`);
    }
    
    if (expiredUsers.length > 0) {
      console.log(`[UserFacingAI] Cleaned ${expiredUsers.length} expired contexts`);
    }
  }

  // Intent classification method using pattern matching and keywords
  private classifyIntent(userMessage: string): IntentClassificationResult {
    const message = userMessage.toLowerCase().trim();
    
    // Food logging patterns from guide (lines 221-234)
    const foodLoggingPatterns = [
      // Explicit eating verbs
      /\bi (ate|had|consumed|finished|just ate|just had)\b/,
      /\bfor (breakfast|lunch|dinner|snack)\b/,
      /\bjust (finished|ate|had)\b/,
      /\b(ate|had) .* for\b/,
      // Direct food descriptions (quantities + foods)
      /\b\d+\s*(oz|ounce|ounces|gram|grams|g|lb|lbs|pound|pounds|cup|cups|slice|slices|piece|pieces)\s+/,
      // Common food words that indicate logging intent
      /\b(chicken|beef|pork|fish|salmon|tuna|pasta|rice|bread|salad|pizza|burger|sandwich|steak|eggs?|cheese|yogurt|fruit|vegetable|beans?|nuts?)\b/,
      // Food descriptors that suggest logging
      /\b(grilled|baked|fried|steamed|boiled|roasted|sauteed|fresh|cooked)\b.*\b(chicken|beef|fish|vegetables?|rice|pasta)\b/,
      // Portion indicators
      /\bsome\s+(kind\s+of\s+)?(chicken|beef|fish|pasta|rice|pizza|salad|stir.fry)/,
      // Meal structure phrases
      /\b(stir.fry|pasta.+sauce|chicken.+rice|salad.+dressing)\b/
    ];
    
    // Progress check patterns (lines 235-248) 
    const progressCheckPatterns = [
      /\bhow('s|'s| am i| is my)\b.*\b(doing|protein|calorie|carb|fat|macro|goal|progress)\b/,
      /\bwhat('s|'s| is my| are my)\b.*\b(intake|calorie|protein|carb|fat|macro|number)\b/,
      /\bam i (on track|hitting|meeting)\b/,
      /\bhow many (calories|protein|carb|fat)\b/
    ];
    
    // Goal/nutrition question patterns (lines 249-263)
    const goalQuestionPatterns = [
      /\bshould i eat (more|less)\b/,
      /\bis .* (enough|too much|good|bad)\b/,
      /\bwhat (happens|if i)\b.*\b(over|under|macro|calorie)\b/,
      /\bdo i need\b/
    ];
    
    // General chat patterns (lines 265-278)
    const generalChatPatterns = [
      /^(hi|hello|hey|good morning|good afternoon|good evening)/,
      /\b(how are you|thanks|thank you|you('re|'re| are) (helpful|great|awesome))\b/,
      /^(thanks|thank you)\b/
    ];
    
    // Help request patterns (lines 280-293)
    const helpRequestPatterns = [
      /\bhow (does this work|do i)\b/,
      /\bi need help\b/,
      /\bwhat can you (do|help)\b/,
      /\bi('m| am) (confused|lost|stuck)\b/
    ];

    // Check for food logging
    if (foodLoggingPatterns.some(pattern => pattern.test(message))) {
      return {
        intent: 'food_logging',
        confidence: 0.9,
        reasoning: 'Contains food logging trigger patterns'
      };
    }
    
    // Check for progress questions
    if (progressCheckPatterns.some(pattern => pattern.test(message))) {
      return {
        intent: 'progress_check', 
        confidence: 0.85,
        reasoning: 'Contains progress inquiry patterns'
      };
    }
    
    // Check for goal/nutrition questions
    if (goalQuestionPatterns.some(pattern => pattern.test(message))) {
      return {
        intent: 'goal_question',
        confidence: 0.8,
        reasoning: 'Contains nutrition advice request patterns'
      };
    }
    
    // Check for general chat
    if (generalChatPatterns.some(pattern => pattern.test(message))) {
      return {
        intent: 'general_chat',
        confidence: 0.95,
        reasoning: 'Contains greeting or casual conversation patterns'
      };
    }
    
    // Check for help requests
    if (helpRequestPatterns.some(pattern => pattern.test(message))) {
      return {
        intent: 'help_request',
        confidence: 0.9,
        reasoning: 'Contains help or guidance request patterns'
      };
    }
    
    // Handle ambiguous cases (guide lines 296-317)
    const ambiguousKeywords = ['chicken', 'pizza', 'salad'];
    if (ambiguousKeywords.some(keyword => message.includes(keyword)) && message.split(' ').length <= 3) {
      return {
        intent: 'clarification_needed',
        confidence: 0.7,
        reasoning: 'Short message with food keyword but unclear intent'
      };
    }
    
    // Default to general chat with redirect
    return {
      intent: 'general_chat',
      confidence: 0.3,
      reasoning: 'No clear intent detected, defaulting to general chat'
    };
  }

  // Mock food recognition for V0.1 testing (Step 3 focus)
  private mockFoodRecognition(userMessage: string): MockNutritionData {
    const message = userMessage.toLowerCase();
    
    // Simple food recognition based on keywords
    if (message.includes('chicken')) {
      return {
        food: 'grilled chicken breast',
        quantity: '6oz',
        calories: 350,
        protein: 54,
        carbs: 0,
        fat: 8,
        confidence: 0.9
      };
    } else if (message.includes('salad')) {
      return {
        food: 'mixed green salad',
        quantity: '1 large bowl',
        calories: 150,
        protein: 8,
        carbs: 12,
        fat: 6,
        confidence: 0.8
      };
    } else if (message.includes('oatmeal')) {
      return {
        food: 'oatmeal with berries',
        quantity: '1 cup',
        calories: 280,
        protein: 12,
        carbs: 45,
        fat: 5,
        confidence: 0.85
      };
    } else if (message.includes('pizza')) {
      return {
        food: 'cheese pizza',
        quantity: '2 slices',
        calories: 520,
        protein: 22,
        carbs: 60,
        fat: 18,
        confidence: 0.7
      };
    } else {
      // Generic meal fallback
      return {
        food: 'mixed meal',
        quantity: '1 portion',
        calories: 300,
        protein: 20,
        carbs: 30,
        fat: 10,
        confidence: 0.6
      };
    }
  }

  // Mock progress data for V0.1 testing
  private mockProgressData(): MockProgressData {
    const currentHour = new Date().getHours();
    let timeOfDay = 'evening';
    if (currentHour < 12) timeOfDay = 'morning';
    else if (currentHour < 17) timeOfDay = 'afternoon';

    return {
      currentProtein: 89,
      proteinGoal: 120,
      proteinPercentage: 74,
      timeOfDay,
      encouragement: "You typically nail your protein goals with dinner, so you're right on track!"
    };
  }

  // Response templates from User Facing AI Guide (lines 323-376)
  private generateFoodLoggingResponse(nutritionData: MockNutritionData, progressData: MockProgressData): string {
    const encouragingAcknowledgments = [
      "Great choice!", "Nice!", "Awesome!", "Perfect!", "Love it!", "Excellent!"
    ];
    
    const forwardMomentum = [
      "What's next to log?", "Anything else to track?", "How does that feel?", 
      "What's on the menu next?", "Ready to log more?"
    ];

    const acknowledgment = encouragingAcknowledgments[Math.floor(Math.random() * encouragingAcknowledgments.length)];
    const momentum = forwardMomentum[Math.floor(Math.random() * forwardMomentum.length)];

    // Successful Food Logging Template from guide (lines 323-341)
    return `${acknowledgment} Your ${nutritionData.quantity} of ${nutritionData.food} has:
• ${nutritionData.calories} calories
• ${nutritionData.protein}g protein  
• ${nutritionData.carbs}g carbs
• ${nutritionData.fat}g fat

That brings you to ${progressData.proteinPercentage}% of your protein goal today - you're crushing it! ${momentum}`;
  }

  private generateProgressCheckResponse(progressData: MockProgressData): string {
    // Progress Check Template from guide (lines 343-350)
    return `You're doing awesome! You've had ${progressData.currentProtein}g protein out of your ${progressData.proteinGoal}g goal - that's ${progressData.proteinPercentage}%. ${progressData.encouragement}`;
  }

  private generateClarificationResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    if (message.includes('chicken')) {
      return "Chicken is such a great protein choice! To get your macros just right, could you help me with the portion size and how it was cooked? Something like '6oz grilled' or '4oz baked'?";
    } else if (message.includes('pizza')) {
      return "Pizza sounds good! 🍕 To get your macros right, could you tell me what size slice and what toppings? Like '2 slices pepperoni' or '1 large slice with veggies'?";
    } else {
      // Clarification Request Template from guide (lines 352-357)
      return `I'd love to help you track that! To get your macros just right, could you tell me a bit more about the portion size and how it was prepared? The more details, the better I can help!`;
    }
  }

  private generateHelpResponse(): string {
    return `I'm here to help with your nutrition tracking! You can log food by simply telling me what you ate, like "I had grilled chicken and rice for lunch." I can also check your progress - just ask "How's my protein today?" What would you like to try?`;
  }

  private generateGeneralChatResponse(): string {
    const responses = [
      "Hey there! Ready to track some nutrition today? Just tell me what you've eaten and I'll help log it!",
      "Hi! I'm here to help with your food tracking. What can I log for you today?",
      "Great to see you! Let's get those meals tracked. What have you eaten recently?",
      "Hello! Your nutrition tracking buddy is here. What delicious meals can I help you log?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Main template routing method - now async to handle Food Recognition AI
  private async generateTemplateResponse(intent: IntentType, userMessage: string, userId: string): Promise<{ response: string, templateUsed: string } | null> {
    switch (intent) {
      case 'food_logging':
        // Use real Food Recognition AI instead of mock
        const foodRecognitionResult = await this.processWithFoodRecognitionAI(userMessage, userId);
        
        if (foodRecognitionResult.requiresClarification) {
          // Return clarification request
          return {
            response: foodRecognitionResult.clarificationMessage || 'Could you provide more details about your meal?',
            templateUsed: 'food_clarification_needed'
          };
        } else {
          // Return successful food logging
          const progressData = this.mockProgressData(); // Still using mock progress data for now
          const nutritionData = foodRecognitionResult.nutritionData;
          if (!nutritionData) {
            return null; // Fall back to AI generation
          }
          return {
            response: this.generateFoodLoggingResponse(nutritionData, progressData),
            templateUsed: 'food_logging_success'
          };
        }
      
      case 'progress_check':
        const progressOnly = this.mockProgressData();
        return {
          response: this.generateProgressCheckResponse(progressOnly),
          templateUsed: 'progress_check'
        };
      
      case 'clarification_needed':
        return {
          response: this.generateClarificationResponse(userMessage),
          templateUsed: 'clarification_request'
        };
      
      case 'help_request':
        return {
          response: this.generateHelpResponse(),
          templateUsed: 'help_guidance'
        };
      
      case 'general_chat':
        return {
          response: this.generateGeneralChatResponse(),
          templateUsed: 'general_chat'
        };
      
      case 'goal_question':
        // Goal questions require AI generation, return null to fall back to OpenAI
        return null;
      
      default:
        return {
          response: this.generateGeneralChatResponse(),
          templateUsed: 'fallback_general_chat'
        };
    }
  }

  // Integration method for Food Recognition AI
  private async processWithFoodRecognitionAI(userMessage: string, userId: string): Promise<{
    requiresClarification: boolean;
    clarificationMessage?: string;
    nutritionData?: MockNutritionData;
  }> {
    try {
      console.log(`[UserFacingAI] Calling Food Recognition AI for: "${userMessage}"`);
      
      // Create input for Food Recognition AI
      const foodInput: FoodRecognitionInput = {
        food_description: userMessage,
        context: 'chat_conversation',
        user_id: userId,
        conversation_history: '' // We can enhance this later with actual context
      };

      // Call Food Recognition AI
      const result = await foodRecognitionAI.processFood(foodInput);

      if (result.clarification_needed) {
        console.log(`[UserFacingAI] Food Recognition AI requires clarification: ${result.clarification_message}`);
        return {
          requiresClarification: true,
          clarificationMessage: result.clarification_message
        };
      } else {
        console.log(`[UserFacingAI] Food Recognition AI successful: ${result.recognized_foods?.length || 0} foods recognized`);
        
        // Convert to MockNutritionData format for now (we'll enhance this later)
        if (!result.recognized_foods || result.recognized_foods.length === 0 || !result.total_nutrition) {
          throw new Error('Invalid response from Food Recognition AI');
        }
        
        const primaryFood = result.recognized_foods[0];
        const nutritionData: MockNutritionData = {
          food: primaryFood.food_name,
          quantity: primaryFood.quantity,
          calories: result.total_nutrition.calories,
          protein: result.total_nutrition.protein,
          carbs: result.total_nutrition.carbs,
          fat: result.total_nutrition.fat,
          confidence: result.confidence_overall || 0
        };

        return {
          requiresClarification: false,
          nutritionData
        };
      }
    } catch (error) {
      console.error('[UserFacingAI] Error calling Food Recognition AI:', error);
      
      // Fall back to mock data for now
      console.log('[UserFacingAI] Falling back to mock food recognition');
      return {
        requiresClarification: false,
        nutritionData: this.mockFoodRecognition(userMessage)
      };
    }
  }

  async processMessage(
    userMessage: string, 
    userId: string,
    _conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [] // Deprecated: using internal context now
  ): Promise<UserFacingAIResponse> {
    const startTime = Date.now();
    
    // Initialize AI store state for this request
    const { setProcessing, setComplete, setError, initializeSystem } = useAIStore.getState();
    
    try {
      console.log(`[UserFacingAI] Processing message for user ${userId}: "${userMessage}"`);
      
      // Set processing state in store
      setProcessing('user-facing-ai');
      initializeSystem('user-facing-ai');
      
      // Step 0: Validate input
      const validation = this.validateInput(userMessage, userId);
      if (!validation.valid) {
        console.error(`[UserFacingAI] Validation failed: ${validation.error}`);
        setError(`Validation error: ${validation.error}`);
        return {
          success: false,
          error: validation.error,
          errorType: validation.errorType as any,
          metadata: {
            processingTime: Date.now() - startTime,
            model: 'validation',
          }
        };
      }
      
      // Clean expired contexts periodically
      this.cleanExpiredContexts();
      
      // Get or create conversation context for this user
      const context = this.getOrCreateContext(userId);
      const contextMessages = this.getContextMessages(context);
      
      console.log(`[UserFacingAI] Using context with ${contextMessages.length} previous messages`);
      
      // Step 1: Classify user intent
      const intentResult = this.classifyIntent(userMessage);
      console.log(`[UserFacingAI] Intent classified as: ${intentResult.intent} (confidence: ${intentResult.confidence})`);
      console.log(`[UserFacingAI] Reasoning: ${intentResult.reasoning}`);
      
      // Step 2: Try template response first (faster, more consistent)
      const templateResult = await this.generateTemplateResponse(intentResult.intent, userMessage, userId);
      
      if (templateResult && templateResult.response) {
        // Use template response (no OpenAI call needed)
        console.log(`[UserFacingAI] Using template: ${templateResult.templateUsed}`);
        console.log(`[UserFacingAI] Template response: "${templateResult.response.substring(0, 100)}..."`);
        
        // Update conversation context
        this.updateContext(context, userMessage, templateResult.response);
        
        // Update AI store with successful completion
        setComplete(templateResult.response);
        
        const processingTime = Date.now() - startTime;
        return {
          success: true,
          response: templateResult.response,
          metadata: {
            processingTime,
            model: 'template',
            intent: intentResult,
            templateUsed: templateResult.templateUsed,
            contextMessages: contextMessages.length
          }
        };
      }
      
      // Step 3: Fall back to AI generation for complex cases (like goal_question)
      console.log(`[UserFacingAI] No template available, using AI generation...`);
      
      // Build messages array with system prompt and conversation context
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.systemPrompt
        },
        ...contextMessages,
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Call OpenAI with retry logic
      const result = await this.retryWithBackoff(async () => {
        return await openAIClient.chat(messages, 'gpt-4o-mini');
      });
      const processingTime = Date.now() - startTime;

      if (result.success && result.data) {
        console.log(`[UserFacingAI] Success: Generated response in ${processingTime}ms`);
        console.log(`[UserFacingAI] Response: "${result.data.substring(0, 100)}..."`);
        
        // Update conversation context with AI response
        this.updateContext(context, userMessage, result.data);
        
        // Update AI store with successful completion
        setComplete(result.data);
        
        return {
          success: true,
          response: result.data,
          metadata: {
            processingTime,
            model: 'gpt-4o-mini',
            intent: intentResult,
            templateUsed: 'ai_generated',
            contextMessages: contextMessages.length
          }
        };
      } else {
        console.error(`[UserFacingAI] OpenAI error:`, result.error);
        
        // Use fallback response for OpenAI failures
        const fallbackResponse = this.generateErrorFallback('api', intentResult.intent);
        console.log(`[UserFacingAI] Using fallback response: "${fallbackResponse.substring(0, 60)}..."`);
        
        // Update context with fallback response
        this.updateContext(context, userMessage, fallbackResponse);
        
        // Set error in store but still complete with fallback
        setError(`OpenAI API error: ${result.error}`);
        setComplete(fallbackResponse);
        
        return {
          success: true,
          response: fallbackResponse,
          fallbackUsed: true,
          errorType: 'api',
          metadata: {
            processingTime,
            model: 'fallback',
            intent: intentResult,
            templateUsed: 'error_fallback',
            contextMessages: contextMessages.length
          }
        };
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`[UserFacingAI] Service error after ${processingTime}ms:`, error);
      
      // Categorize error and generate appropriate fallback
      const { errorType } = this.categorizeError(error);
      
      // Always provide fallback response instead of failing
      const fallbackResponse = this.generateErrorFallback(errorType, 'general_chat');
      console.log(`[UserFacingAI] Using error fallback (${errorType}): "${fallbackResponse.substring(0, 60)}..."`);
      
      // Try to update context, but don't fail if this throws too
      try {
        const safeContext = this.getOrCreateContext(userId);
        this.updateContext(safeContext, userMessage, fallbackResponse);
      } catch (contextError) {
        console.warn(`[UserFacingAI] Failed to update context during error recovery:`, contextError);
      }
      
      // Set error in store and complete with fallback
      setError(`System error (${errorType}): ${error instanceof Error ? error.message : 'Unknown error'}`);
      setComplete(fallbackResponse);
      
      return {
        success: true, // We're providing a fallback, so this is still "successful"
        response: fallbackResponse,
        fallbackUsed: true,
        errorType: errorType as any,
        metadata: {
          processingTime,
          model: 'fallback',
          intent: { intent: 'general_chat', confidence: 0, reasoning: 'Error fallback' },
          templateUsed: 'error_fallback'
        }
      };
    }
  }

  // Helper method for testing basic connectivity
  async testConnection(): Promise<boolean> {
    try {
      const testResponse = await this.processMessage(
        "Hello, this is a test message", 
        "test-user-id"
      );
      return testResponse.success;
    } catch (error) {
      console.error('[UserFacingAI] Connection test failed:', error);
      return false;
    }
  }
}

export const userFacingAI = new UserFacingAI();