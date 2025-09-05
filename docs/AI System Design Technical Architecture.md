# Technical Architecture Decisions Document
*Foundation Technology Stack & Implementation Rationale - Version 1.1*

## 📋 Dependencies & References
**Referenced by other documents:**
- V0.1 MVP Definition will reference these technology choices
- Development Environment Setup Guide will implement these decisions
- All AI System Implementation Guides will follow these patterns

**Decision Authority**: Final technology choices for Meal Master AI V0.1 development

---

## 🎯 Architecture Decision Philosophy

### **Solo Development Optimization**
All technology choices prioritize:
- **Debugging Simplicity**: Easy to troubleshoot when things go wrong
- **Development Speed**: Minimal setup, maximum productivity
- **Cost Control**: Predictable expenses, no surprise bills
- **Scalability Path**: Can grow to V0.2+ without major rewrites
- **Documentation Quality**: Well-documented libraries with good community support

### **AI-First Architecture Principles**
- **Direct Control**: Full visibility into AI system behavior and costs
- **Prompt Iteration**: Easy to modify and test AI prompts
- **Error Transparency**: Clear error paths for AI system failures
- **State Management**: Proper handling of async AI operations
- **Real-time Integration**: Seamless updates when AI systems complete processing

---

## 🧠 AI System Design Standards & Prompt Engineering Framework
*Production-Grade AI System Architecture - CL4R1T4S Research Integration*

### **Core Principle: Defensive-First Design**
**"90% Prevention, 10% Instruction"** - Based on analysis of production systems (Claude 4, ChatGPT, etc.)

All Meal Master AI systems prioritize:
1. **Failure Prevention** over feature optimization
2. **Safety Constraints** over conversational flexibility  
3. **Structured Communication** over natural language between systems
4. **Binary Rules** over subjective guidelines
5. **Context Awareness** over stateless responses

### **Production System Pattern Analysis**
Research from CL4R1T4S repository reveals successful AI systems use:
- **60% of prompt tokens** for failure prevention and constraints
- **25% of prompt tokens** for decision trees and routing logic
- **10% of prompt tokens** for actual task instructions
- **5% of prompt tokens** for identity and core function

### **Standardized Prompt Engineering Framework**

#### **Universal System Prompt Structure**
Every AI system MUST follow this exact template:

```xml
<system_identity>
Name: [System Name] AI
Core Function: [Single sentence purpose]
Integration Role: [How it fits in overall architecture]
Model: [GPT-4o, GPT-4o-mini, GPT-3.5-turbo with rationale]
</system_identity>

<hard_rules>
<!-- Binary constraints - never, always, must -->
NEVER: [Explicit prohibitions with examples]
ALWAYS: [Required behaviors with examples]  
MUST: [Non-negotiable requirements with examples]
</hard_rules>

<decision_trees>
<!-- Structured routing logic -->
IF [condition] THEN [action] ELSE [fallback]
<!-- Include all major decision paths -->
</decision_trees>

<integration_protocols>
<!-- How this system communicates with others -->
Input Format: [JSON schema or XML structure]
Output Format: [JSON schema or XML structure]
Error Handling: [Specific failure responses]
</integration_protocols>

<task_instructions>
<!-- Actual work instructions - keep minimal -->
[Core task behavior and patterns]
</task_instructions>

<examples>
<!-- Success and failure examples -->
Good: [Ideal interaction patterns]
Bad: [What not to do with explanations]
</examples>
```

#### **Inter-System Communication Standards**

**Simple Integration for V0.1:**
```javascript
// Direct function calls between AI systems
const foodData = await foodRecognitionAI.process("chicken and rice");
const response = await macroCalculatorAI.analyze(foodData);
```

**JSON Schema for V0.2+ (Upgrade Path):**
```json
{
  "system_source": "food_recognition_ai",
  "system_target": "macro_calculator_ai", 
  "timestamp": "2025-01-15T10:30:00Z",
  "confidence_score": 0.85,
  "data": {
    // Actual payload
  },
  "metadata": {
    "assumptions_made": ["portion_size_estimated"],
    "data_sources": ["spoonacular", "usda_fallback"]
  }
}
```

#### **XML Tag Standards**
For within-prompt structure, use consistent XML tags:

```xml
<thinking>Step-by-step reasoning process</thinking>
<confidence>0.85</confidence>
<assumptions>portion_size_estimated, preparation_method_grilled</assumptions>
<output>Structured response content</output>
```

### **Safety & Crisis Prevention Framework**

#### **Aggressive Safety Rules (Zero Tolerance)**
```
EATING DISORDERS & MENTAL HEALTH:
- Never diagnose eating disorders or provide treatment advice
- Never suggest dangerous calorie restrictions (<1200 calories)
- Always refer to professional help for serious mental health concerns
- Immediately escalate self-harm language to Crisis Intervention

MEDICAL BOUNDARIES:
- Never provide medical diagnosis or treatment recommendations
- Never suggest specific medical interventions
- Always recommend consulting healthcare professionals for medical concerns
```

#### **Balanced Approach Rules (Common Nutrition)**
```
GENERAL NUTRITION:
- Provide evidence-based nutrition information
- Suggest reasonable portion sizes and meal ideas
- Offer general fitness and wellness guidance
- Support healthy habit formation within normal ranges
```

#### **Basic Crisis Detection (V0.1)**
```
CRISIS_KEYWORDS = [
    "I can't do this anymore",
    "I want to give up", 
    "I hate myself",
    "self harm",
    "suicide",
    "I'm worthless",
    "dangerous restriction"
]

ACTION: Immediate escalation to Crisis Intervention AI + professional referral
```

### **Cost Optimization Standards**

#### **Model Selection for Cost Efficiency**
- **Primary Model**: GPT-4o-mini for most systems (cost-effective, sufficient reasoning)
- **Premium Model**: GPT-4o only for Food Recognition AI (complex nutrition analysis required)
- **Budget Target**: <$50/month during V0.1 development and testing

#### **Token Optimization**
- Keep system prompts under 2,000 tokens when possible
- Use structured outputs to reduce completion tokens
- Monitor and optimize high-cost operations
- Simple direct integration (V0.1) vs complex protocols (V0.2+)

### **Manual Testing Framework (V0.1)**

#### **Testing Process**
```
1. Write initial prompt following universal template
2. Test with 10-20 varied inputs manually
3. Document failures and edge cases
4. Refine prompt and retest
5. Deploy when 90%+ success rate achieved
6. Monitor and iterate based on real usage
```

#### **Success Criteria**
- **Response Time**: <3 seconds for simple queries
- **Accuracy Rate**: >85% for core functions, >95% for safety decisions
- **Cost Efficiency**: Stay within monthly budget targets
- **User Experience**: Conversational and helpful responses

### **Required Logging for All AI Systems**
```json
{
  "system_name": "user_facing_ai",
  "response_time_ms": 2500,
  "model_used": "gpt-4o-mini",
  "tokens_used": {"prompt": 800, "completion": 200},
  "confidence_score": 0.87,
  "success": true,
  "cost_usd": 0.0012,
  "safety_flags": []
}
```

---

## 📱 Frontend Technology Stack

### **React Native with Expo**
**Decision**: Use React Native with Expo managed workflow

**Rationale**:
- **Solo Development**: Expo handles native module complexity
- **Rapid Prototyping**: Can test on device immediately via Expo Go
- **Cross-Platform**: iOS and Android from single codebase
- **AI Integration**: Excellent JavaScript ecosystem for OpenAI SDK
- **Real-time Support**: Works seamlessly with Supabase Realtime

**Alternatives Considered**:
- **Flutter**: Rejected due to Dart learning curve and smaller AI ecosystem
- **Native Development**: Rejected due to time constraints for solo development
- **React Web**: Rejected because mobile-first experience is critical

**Implementation Details**:
```bash
# Expo CLI setup
npx create-expo-app MealMasterAI --template blank-typescript
expo install expo-router expo-constants expo-secure-store
```

**Trade-offs Accepted**:
- Limited to Expo-compatible libraries (acceptable for V0.1 scope)
- Slightly larger bundle size (acceptable for AI-heavy app)

---

## 🪄 State Management Architecture

### **Zustand for Global State**
**Decision**: Use Zustand as primary state management solution

**Rationale**:
- **AI State Management**: Perfect for handling multiple AI system states
- **Simplicity**: Minimal boilerplate, easy to understand and debug
- **Performance**: No unnecessary re-renders, efficient updates
- **Conversation State**: Excellent for managing chat history and context
- **Async Operations**: Clean handling of AI API calls and responses

**Implementation Pattern**:
```javascript
// AI Processing State Store
const useAIStore = create((set, get) => ({
  // AI System States
  isProcessing: false,
  currentSystem: null,
  error: null,
  
  // Actions
  setProcessing: (system) => set({ 
    isProcessing: true, 
    currentSystem: system,
    error: null 
  }),
  setComplete: () => set({ 
    isProcessing: false, 
    currentSystem: null 
  }),
  setError: (error) => set({ 
    error, 
    isProcessing: false,
    currentSystem: null 
  })
}));

// Meal Data Store
const useMealStore = create((set) => ({
  todaysMeals: [],
  dailyTotals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
  
  addMeal: (meal) => set((state) => ({
    todaysMeals: [...state.todaysMeals, meal],
    dailyTotals: calculateDailyTotals([...state.todaysMeals, meal])
  })),
  
  updateMeal: (mealId, updates) => set((state) => ({
    todaysMeals: state.todaysMeals.map(meal => 
      meal.id === mealId ? { ...meal, ...updates } : meal
    )
  }))
}));
```

**Alternatives Considered**:
- **Redux Toolkit**: Rejected due to boilerplate overhead for solo development
- **React Context**: Rejected due to performance concerns with frequent AI updates
- **Jotai**: Rejected due to smaller ecosystem and learning curve

**Store Architecture**:
- **useAIStore**: AI system processing states and errors
- **useMealStore**: Meal data and daily nutrition totals
- **useUserStore**: User preferences and authentication state
- **useConversationStore**: Chat history and conversation context

---

## 🤖 AI Integration Architecture

### **Direct OpenAI SDK Integration**
**Decision**: Use OpenAI SDK directly, no framework abstractions

**Rationale**:
- **Cost Control**: Direct visibility into token usage and API costs
- **Prompt Control**: Full control over prompt engineering and iteration
- **Error Handling**: Clear error paths and custom handling strategies
- **Debugging**: Can log exact requests/responses for troubleshooting
- **Performance**: No additional framework overhead or abstraction layers

**Implementation Pattern**:
```javascript
// Centralized AI Client
class AIClient {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
    });
  }

  async callSystem(systemType, prompt, model = 'gpt-4o-mini') {
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: AIPrompts[systemType].system },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      return {
        success: true,
        data: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        system: systemType
      };
    }
  }
}

// AI System Manager
class AISystemManager {
  constructor() {
    this.client = new AIClient();
    this.systems = {
      userFacing: new UserFacingAI(this.client),
      foodRecognition: new FoodRecognitionAI(this.client),
      macroCalculator: new MacroCalculatorAI(this.client),
      dataValidation: new DataValidationGateway(),
      errorHandler: new ErrorHandlerSystem()
    };
  }

  async processUserInput(input, context) {
    const aiStore = useAIStore.getState();
    
    try {
      aiStore.setProcessing('user_facing');
      
      // Route to appropriate AI system
      const intent = await this.systems.userFacing.detectIntent(input);
      
      if (intent === 'food_logging') {
        aiStore.setProcessing('food_recognition');
        const foodData = await this.systems.foodRecognition.process(input);
        
        aiStore.setProcessing('macro_calculator');
        const macros = await this.systems.macroCalculator.calculate(foodData);
        
        aiStore.setProcessing('data_validation');
        await this.systems.dataValidation.save(macros);
        
        aiStore.setComplete();
        return this.systems.userFacing.formatResponse(macros);
      }
    } catch (error) {
      aiStore.setError(error.message);
      return this.systems.errorHandler.handle(error);
    }
  }
}
```

**Alternatives Considered**:
- **LangChain**: Rejected due to complexity overhead and reduced debugging visibility
- **Custom AI Framework**: Rejected due to development time constraints
- **Anthropic Claude**: Considered for some systems but OpenAI chosen for ecosystem maturity

**Model Selection Strategy**:
- **GPT-4o**: Complex reasoning (Food Recognition only)
- **GPT-4o-mini**: Most systems (cost-optimized)
- **GPT-3.5-turbo**: Fallback option if needed

---

## 🗄️ Database & Real-time Architecture

### **Supabase PostgreSQL with Realtime**
**Decision**: Use Supabase as primary database with Realtime subscriptions

**Rationale**:
- **Real-time Updates**: Built-in subscriptions for dashboard updates
- **Authentication**: Integrated auth system reduces complexity
- **Row-Level Security**: Built-in data protection for user privacy
- **API Generation**: Automatic REST and GraphQL APIs
- **Scaling Path**: Can handle growth through V0.3+ without migration

**Real-time Implementation Pattern**:
```javascript
// Real-time subscription for meal updates
const setupRealtimeSubscriptions = () => {
  const mealStore = useMealStore.getState();
  
  const channel = supabase
    .channel('meal_updates')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'daily_meals',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        // Update local state when AI systems add meals
        mealStore.addMeal(payload.new);
        
        // Show success notification
        showToast('Meal logged successfully!');
      }
    )
    .on('postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'daily_meals',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        // Update meal when user confirms AI recognition
        mealStore.updateMeal(payload.new.id, payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
```

**Data Fetching Strategy**:
```javascript
// React Query for caching and synchronization
const { data: todaysMeals, isLoading } = useQuery({
  queryKey: ['meals', 'today', user.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('daily_meals')
      .select('*')
      .eq('user_id', user.id)
      .eq('meal_date', new Date().toISOString().split('T')[0])
      .order('logged_at', { ascending: false });
    return data;
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

**Alternatives Considered**:
- **Firebase**: Rejected due to preference for PostgreSQL and better pricing model
- **Custom Backend**: Rejected due to infrastructure maintenance overhead
- **AWS Amplify**: Rejected due to complexity for solo development

---

## 🔌 External API Integration

### **Spoonacular API (Primary) + USDA (Fallback)**
**Decision**: Use Spoonacular as primary nutrition source with USDA fallback

**Integration Pattern**:
```javascript
// API Client with fallback strategy
class NutritionAPIClient {
  constructor() {
    this.spoonacularKey = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
    this.requestCount = 0;
    this.dailyLimit = 150; // Free tier limit
  }

  async searchFood(query) {
    try {
      // Check rate limit
      if (this.requestCount >= this.dailyLimit) {
        return this.fallbackToUSDA(query);
      }

      // Try Spoonacular first
      const response = await fetch(`https://api.spoonacular.com/food/ingredients/search?query=${query}&apiKey=${this.spoonacularKey}`);
      
      if (response.ok) {
        this.requestCount++;
        return await response.json();
      } else {
        throw new Error('Spoonacular API failed');
      }
    } catch (error) {
      // Fallback to USDA
      return this.fallbackToUSDA(query);
    }
  }

  async fallbackToUSDA(query) {
    // USDA FoodData Central is free but more complex
    const response = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?query=${query}`);
    return response.json();
  }
}
```

**Caching Strategy**:
```javascript
// Cache nutrition data to reduce API calls
const nutritionCache = new Map();

const getCachedNutrition = async (foodId, source) => {
  const cacheKey = `${source}_${foodId}`;
  
  if (nutritionCache.has(cacheKey)) {
    return nutritionCache.get(cacheKey);
  }
  
  // Fetch from API
  const data = await fetchNutritionData(foodId, source);
  
  // Cache for 24 hours
  nutritionCache.set(cacheKey, data);
  setTimeout(() => nutritionCache.delete(cacheKey), 24 * 60 * 60 * 1000);
  
  return data;
};
```

---

## 🎨 UI Component Architecture

### **React Native + Expo Components**
**Decision**: Use native React Native components with selective third-party libraries

**Core Libraries**:
```bash
# Essential UI libraries
expo install react-native-reanimated
expo install react-native-gesture-handler
expo install @react-navigation/native
expo install @react-navigation/bottom-tabs
expo install react-native-gifted-chat

# Optional for enhanced UX
expo install react-native-svg
expo install expo-haptics
expo install expo-notifications
```

**Component Architecture**:
```javascript
// Atomic design pattern for reusability
components/
├── atoms/
│   ├── Button.tsx
│   ├── Input.tsx
│   └── MacroRing.tsx
├── molecules/
│   ├── MealCard.tsx
│   ├── ChatMessage.tsx
│   └── ProgressBar.tsx
├── organisms/
│   ├── DashboardHeader.tsx
│   ├── ChatInterface.tsx
│   └── MealList.tsx
└── screens/
    ├── DashboardScreen.tsx
    ├── ChatScreen.tsx
    └── PlansScreen.tsx
```

**Theme System**:
```javascript
// Consistent design system
const theme = {
  colors: {
    primary: '#4F46E5',
    secondary: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    text: '#111827'
  },
  typography: {
    heading: { fontSize: 24, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '400' },
    caption: { fontSize: 14, fontWeight: '400' }
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32
  }
};
```

---

## 🔧 Development Tools & Environment

### **Development Workflow**
```bash
# Primary development tools
npm install -g @expo/cli
npm install -g eas-cli
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
```

**Code Quality Tools**:
```json
// package.json scripts
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "test": "jest",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

**Testing Strategy**:
```javascript
// Jest + React Native Testing Library
import { render, fireEvent } from '@testing-library/react-native';

// AI System testing pattern
describe('FoodRecognitionAI', () => {
  it('should recognize common foods with high confidence', async () => {
    const result = await foodRecognitionAI.process('grilled chicken breast');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.recognized_foods).toHaveLength(1);
  });
});
```

---

## 💰 Cost Management & Monitoring

### **API Cost Tracking**
```javascript
// Cost monitoring for AI usage
class CostTracker {
  constructor() {
    this.dailyBudget = 5; // $5/day limit for V0.1
    this.currentSpend = 0;
  }

  trackAICall(usage, model) {
    const costs = {
      'gpt-4o': { input: 0.005, output: 0.015 }, // per 1K tokens
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
    };
    
    const cost = (usage.prompt_tokens * costs[model].input + 
                  usage.completion_tokens * costs[model].output) / 1000;
    
    this.currentSpend += cost;
    
    if (this.currentSpend > this.dailyBudget) {
      throw new Error('Daily AI budget exceeded');
    }
    
    return cost;
  }
}
```

**Budget Alerts**:
- Daily spending notifications at 50%, 80%, 100% of budget
- Weekly spending reports
- Automatic fallback to cheaper models when approaching limits

---

## 🎯 Architecture Decision Summary

### **Final Technology Stack**
- **Frontend**: React Native + Expo (TypeScript)
- **State Management**: Zustand
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime subscriptions
- **AI Integration**: Direct OpenAI SDK
- **API Integration**: Spoonacular + USDA fallback
- **Navigation**: React Navigation
- **Styling**: StyleSheet with theme system
- **Testing**: Jest + React Native Testing Library + Manual AI Testing

### **Key Architectural Principles**
1. **Direct Control Over AI**: No abstraction frameworks that hide behavior
2. **Real-time User Experience**: Immediate feedback and updates
3. **Cost-Conscious Development**: Built-in monitoring and limits
4. **Solo Developer Optimized**: Simple debugging and maintenance
5. **Scalable Foundation**: Can grow through V0.2+ without rewrites
6. **Safety-First AI Design**: Aggressive protection on serious issues, balanced on common ones

### **Trade-offs Accepted**
- **Expo Limitations**: Acceptable for V0.1 scope, can eject later if needed
- **No Backend Framework**: Direct API calls vs framework abstractions
- **Manual AI Testing**: More work upfront, better understanding and control
- **Simple Integration**: V0.1 direct calls vs V0.2+ structured protocols
- **Limited Offline Support**: Real-time features require connectivity

This architecture provides a solid foundation for rapid V0.1 development while maintaining the flexibility to scale through future versions with production-grade AI safety and cost optimization.