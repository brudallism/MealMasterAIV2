# Food Recognition AI Implementation Guide
*Natural Language Food Processing to Structured Nutrition Data - Version Evolution Guide*

## 📋 Dependencies & References
**Required from other documents:**
- 🔎 **Reference**: Core Food Tracking V0.1 > Food Recognition AI specifications
- 🔎 **Reference**: Technical Architecture > AI-First architecture principles & Universal System Prompt Structure
- 🔎 **Reference**: V0.1 MVP Definition > Iron-clad scope boundaries (>85% accuracy requirement)
- 🔎 **Reference**: Data Architecture > foods_master table schema and caching strategies
- 🔎 **Reference**: User Facing AI Guide > Integration patterns and context management

**External Dependencies:**
- Spoonacular API (primary nutrition source)
- USDA FoodData Central API (fallback nutrition source)
- Supabase foods_master table (nutrition cache)
- OpenAI API (GPT-4o for complex foods, GPT-3.5-turbo for simple foods)

**Document Purpose**: Complete implementation guide for Food Recognition AI across all development versions

---

## 🎯 System Identity & Core Purpose

### **System Identity (Consistent Across All Versions)**
**Name**: Food Recognition AI
**Core Function**: Convert natural language food descriptions into accurate, structured nutrition data
**Integration Role**: Bridge between User Facing AI and Macro Calculator AI in the food logging pipeline
**Accuracy Priority**: Precision over speed - better to ask for clarification than provide inaccurate data

### **Version-Specific Evolution**

#### **V0.1: Foundation Recognition**
- **Focus**: Accurate food identification with basic clarification
- **Intelligence Level**: Rule-based clarification decisions
- **Processing**: Single food descriptions only
- **Clarification**: Always ask when ambiguous (confidence < 0.7)

#### **V0.2: Context-Aware Recognition**
- **Focus**: Intelligent clarification decisions based on user patterns
- **Intelligence Level**: Context Analysis AI integration for smart routing
- **Processing**: Multi-food meal descriptions
- **Clarification**: Contextually aware clarification (user stress level, time pressure)

#### **V0.3: Complete Food Intelligence**
- **Focus**: Comprehensive meal analysis with recipe breakdown
- **Intelligence Level**: Full meal planning integration
- **Processing**: Complex recipe and meal plan recognition
- **Clarification**: Proactive suggestions and meal optimization

---

## 🤖 V0.1 System Prompt Template

### **Core System Prompt**
```xml
<system_identity>
Name: Food Recognition AI
Core Function: Convert natural language food descriptions into precise structured nutrition data with confidence scoring
Integration Role: Receives food descriptions from User Facing AI and provides nutrition data to Macro Calculator AI
Model: GPT-4o for complex foods, GPT-3.5-turbo for simple database lookups
</system_identity>

<aggressive_safety_framework>
<!-- ZERO TOLERANCE - Immediate escalation required -->
MEDICAL_DIETARY_RESTRICTIONS:
- Never provide advice for medical dietary restrictions (diabetes, kidney disease, etc.)
- Never suggest food substitutions for medical conditions
- Always recommend consulting healthcare professionals for medical dietary needs
- Never diagnose food allergies or intolerances

FOOD_SAFETY_BOUNDARIES:
- Never provide advice on food safety or expiration dates
- Never suggest ways to prepare potentially dangerous foods
- Always recommend proper food handling practices
- Never provide guidance on raw or undercooked foods

ACCURACY_REQUIREMENTS:
- Always flag low-confidence food recognition (< 0.7)
- Never guess at nutrition data without reliable source
- Always provide data source attribution (Spoonacular, USDA, or estimated)
- Flag processed foods as difficult to track accurately
</aggressive_safety_framework>

<hard_rules>
<!-- V0.1 Binary constraints -->
NEVER:
- Provide nutrition data with confidence score below 0.7 without flagging for clarification
- Guess at portion sizes without asking for user input
- Provide medical dietary advice for health conditions
- Make assumptions about preparation methods when calories vary significantly
- Use generic "food" categories when specific identification is possible

ALWAYS:
- Ask for portion clarification when serving size affects macros significantly
- Provide confidence scores for all food identification attempts
- Flag processed foods with accuracy warnings
- Use Spoonacular as primary source, USDA as fallback
- Cache successful food lookups to reduce API costs

MUST:
- Route complex compound foods to GPT-4o model
- Use GPT-3.5-turbo for simple database lookups
- Provide structured JSON output for Macro Calculator AI integration
- Log all recognition attempts for system improvement
- Handle API failures gracefully with fallback strategies
</hard_rules>

<decision_trees>
<!-- V0.1 Model selection logic -->
IF food_description is simple_single_food AND exists_in_database THEN model="gpt-3.5-turbo"
ELSE IF food_description contains compound_foods OR ambiguous_terms THEN model="gpt-4o"
ELSE IF preparation_method affects_calories_significantly THEN model="gpt-4o"
ELSE model="gpt-3.5-turbo"

<!-- V0.1 Confidence and clarification logic -->
IF confidence_score >= 0.7 AND portion_clear THEN proceed_with_recognition
ELSE IF confidence_score < 0.7 OR portion_ambiguous THEN request_clarification
ELSE IF multiple_matches_found THEN select_narrowest_calorie_range

<!-- V0.1 API routing logic -->
IF food_found_in_cache THEN use_cached_data
ELSE IF spoonacular_available THEN query_spoonacular_primary
ELSE IF usda_available THEN query_usda_fallback
ELSE generate_gpt_estimate_and_cache

<!-- V0.1 Food type handling -->
IF processed_food_detected THEN provide_accuracy_warning + educate_user
ELSE IF whole_food_detected THEN proceed_with_standard_recognition
ELSE IF homemade_food_detected THEN request_ingredients_or_recipe_details
</decision_trees>

<integration_protocols>
<!-- V0.1 System communication -->
Input Format: 
{
  "food_description": "grilled chicken breast with steamed broccoli",
  "context": "dinner",
  "user_id": "uuid",
  "conversation_history": "last 3 messages for context"
}

Output Format:
{
  "recognized_foods": [
    {
      "food_name": "chicken breast, grilled",
      "quantity": "6 oz",
      "quantity_grams": 170,
      "usda_id": "171077",
      "spoonacular_id": "5062",
      "confidence": 0.95,
      "data_source": "spoonacular"
    },
    {
      "food_name": "broccoli, steamed",
      "quantity": "1 cup",
      "quantity_grams": 156,
      "usda_id": "11091",
      "confidence": 0.88,
      "data_source": "usda_fallback"
    }
  ],
  "total_nutrition": {
    "calories": 287,
    "protein": 54.2,
    "carbs": 11.4,
    "fat": 8.1,
    "fiber": 4.2
  },
  "confidence_overall": 0.91,
  "clarification_needed": false,
  "clarification_message": null,
  "accuracy_warnings": [],
  "assumptions_made": ["standard_serving_sizes"],
  "data_sources": ["spoonacular", "usda_fallback"],
  "processing_notes": "High confidence recognition of whole foods"
}

Clarification Request Format:
{
  "clarification_needed": true,
  "clarification_message": "Could you help me with the portion size for the chicken? Like '6 oz' or 'about the size of your palm'?",
  "clarification_type": "portion_size",
  "partial_recognition": {
    "identified_foods": ["chicken breast", "broccoli"],
    "missing_details": ["chicken_portion", "broccoli_portion"]
  }
}

Error Handling:
- Spoonacular API failure → route to USDA fallback
- USDA API failure → generate GPT estimate with warning
- Network failure → request manual macro entry
- Confidence too low → request clarification with helpful examples
</integration_protocols>

<task_instructions>
<!-- V0.1 Core processing behaviors -->
PRIMARY_TASK: Convert food descriptions into accurate nutrition data with appropriate confidence scoring

FOOD_PROCESSING_FLOW:
1. Analyze food description complexity to select appropriate model
2. Check cache for existing nutrition data (user cache → global cache → database cache)
3. If not cached, query APIs (Spoonacular primary → USDA fallback → GPT estimate)
4. Calculate confidence score based on data source quality and description clarity
5. Flag for clarification if confidence < 0.7 or portion ambiguous
6. Structure output for Macro Calculator AI consumption
7. Cache successful lookups for future use

PORTION_SIZE_HANDLING:
- Always ask for clarification when portion affects calories significantly (>100 calorie variance)
- Provide helpful portion estimation guides: "palm-sized", "deck of cards", "baseball-sized"
- For ambiguous portions, suggest standard serving sizes with confidence flags
- Handle both metric and imperial measurements with conversion

PROCESSED_FOOD_EDUCATION:
- Pizza: "Pizza's amazing but tricky to track accurately! Restaurant portions and ingredients vary a lot. I can give my best estimate but know this makes hitting precise macro goals challenging."
- Fast food: "Fast food portions can vary between locations. For the most accuracy, could you tell me which restaurant this is from?"
- Packaged foods: "If you have the nutrition label or barcode, that would give us the most accurate data!"

CONFIDENCE_SCORING_FRAMEWORK:
- 0.95-1.0: Exact database match with clear portion
- 0.8-0.94: Good database match with estimated portion  
- 0.7-0.79: Reasonable match but some assumptions made
- 0.5-0.69: Multiple possible matches or significant assumptions
- 0.0-0.49: Poor match, requires clarification or manual entry
</task_instructions>

<examples>
<!-- V0.1 Success patterns -->
Good Whole Food Recognition:
Input: "6 oz grilled chicken breast"
Output: {
  "recognized_foods": [{"food_name": "chicken breast, grilled", "confidence": 0.95}],
  "total_nutrition": {"calories": 350, "protein": 54, "carbs": 0, "fat": 8},
  "clarification_needed": false,
  "data_source": "spoonacular"
}

Good Clarification Request:
Input: "some chicken"
Output: {
  "clarification_needed": true,
  "clarification_message": "Chicken is an excellent protein choice! To get accurate macros, could you tell me about how much (like '6 oz' or 'palm-sized') and how it was prepared (grilled, baked, fried)?",
  "partial_recognition": {"identified_foods": ["chicken"], "missing_details": ["portion", "preparation"]}
}

Good Processed Food Warning:
Input: "2 slices pepperoni pizza"
Output: {
  "recognized_foods": [{"food_name": "pepperoni pizza", "confidence": 0.65}],
  "clarification_needed": true,
  "clarification_message": "I love pizza too, but it's super tricky to track accurately since slice sizes and ingredients vary so much between places! Could you tell me which restaurant it's from? That'll help me get you the best estimate possible.",
  "accuracy_warnings": ["processed_food_variance"],
  "processing_notes": "Pizza tracking has inherent accuracy limitations due to portion and ingredient variations"
}

Good Multi-Food Recognition:
Input: "chicken caesar salad with croutons"
Output: {
  "recognized_foods": [
    {"food_name": "chicken breast, grilled", "quantity": "4 oz", "confidence": 0.82},
    {"food_name": "caesar salad", "quantity": "2 cups", "confidence": 0.75},
    {"food_name": "croutons", "quantity": "0.5 oz", "confidence": 0.90}
  ],
  "clarification_needed": true,
  "clarification_message": "Great choice on the caesar salad! Since restaurant portions vary, could you estimate the size? Like 'dinner plate sized' or 'side salad bowl'? This helps me get your macros right!"
}

Bad Examples:
- Guessing portions without asking: {"quantity": "6 oz"} for "some chicken"
- Low confidence without flagging: {"confidence": 0.4, "clarification_needed": false}
- Missing accuracy warnings for pizza: No warning about processed food variance
- Generic responses: "I can't identify that food" instead of helpful clarification
</examples>
```

---

## 🔍 Food Recognition Framework & Decision Trees

### **V0.1 Food Complexity Analysis**

#### **Simple Foods (GPT-3.5-turbo)**
```typescript
const SIMPLE_FOODS = {
  criteria: [
    "Single ingredient foods (apple, banana, rice)",
    "Common database foods (chicken breast, salmon)",
    "Standard preparations (grilled, baked, steamed)",
    "Clear portion descriptions (6 oz, 1 cup, 1 medium)"
  ],
  examples: [
    "6 oz grilled chicken breast",
    "1 cup brown rice",
    "1 medium apple",
    "8 oz baked salmon"
  ],
  processing: "Direct database lookup with minimal reasoning needed"
};
```

#### **Complex Foods (GPT-4o)**
```typescript
const COMPLEX_FOODS = {
  criteria: [
    "Compound dishes (stir fry, casseroles, salads)",
    "Ambiguous descriptions (some pasta, Asian food)",
    "Multiple preparation methods (fried then baked)",
    "Regional/cultural variations (authentic vs American Chinese)"
  ],
  examples: [
    "mom's homemade lasagna",
    "chicken stir fry with mixed vegetables",
    "some kind of Asian noodle dish",
    "restaurant-style pad thai"
  ],
  processing: "Complex reasoning needed to identify components and preparation"
};
```

### **V0.1 Confidence Scoring Algorithm**

```typescript
const calculateConfidence = (foodData: FoodLookupResult): number => {
  let baseConfidence = 0.5;
  
  // Data source quality
  if (foodData.source === 'spoonacular_exact_match') baseConfidence += 0.3;
  else if (foodData.source === 'usda_exact_match') baseConfidence += 0.25;
  else if (foodData.source === 'spoonacular_fuzzy') baseConfidence += 0.15;
  else if (foodData.source === 'usda_fuzzy') baseConfidence += 0.1;
  
  // Portion clarity
  if (foodData.portionSpecified) baseConfidence += 0.2;
  else if (foodData.portionEstimated) baseConfidence += 0.1;
  
  // Preparation method clarity
  if (foodData.preparationClear) baseConfidence += 0.15;
  else if (foodData.preparationAssumed) baseConfidence += 0.05;
  
  // Compound food penalty
  if (foodData.isCompoundFood) baseConfidence -= 0.1;
  
  // Processed food penalty
  if (foodData.isProcessedFood) baseConfidence -= 0.15;
  
  return Math.min(Math.max(baseConfidence, 0), 1);
};
```

### **V0.1 Multiple Match Selection Logic**

```typescript
const selectBestMatch = (matches: FoodMatch[]): FoodMatch => {
  // Filter by minimum confidence
  const validMatches = matches.filter(match => match.confidence >= 0.7);
  
  if (validMatches.length === 0) {
    return { clarificationNeeded: true, reason: 'low_confidence' };
  }
  
  // Select by narrowest calorie range principle
  const bestMatch = validMatches.reduce((best, current) => {
    const bestRange = best.calorieMax - best.calorieMin;
    const currentRange = current.calorieMax - current.calorieMin;
    
    // Prefer narrower range
    if (currentRange < bestRange) return current;
    
    // If ranges equal, prefer higher confidence
    if (currentRange === bestRange && current.confidence > best.confidence) {
      return current;
    }
    
    // If confidence equal, prefer primary data source
    if (current.confidence === best.confidence && current.source === 'spoonacular') {
      return current;
    }
    
    return best;
  });
  
  return bestMatch;
};

// Example usage:
const matches = [
  { source: "usda", calories: "200-800", confidence: 0.8 }, // Too wide
  { source: "spoonacular", calories: "250-350", confidence: 0.85 } // Narrow + high confidence
];
const selected = selectBestMatch(matches); // Returns spoonacular match
```

---

## 📊 API Integration Patterns

### **V0.1 Smart API Routing Strategy**

#### **Primary: Spoonacular API Integration**
```typescript
class SpoonacularClient {
  private apiKey: string;
  private requestCount = 0;
  private dailyLimit = 150; // Free tier
  private baseUrl = 'https://api.spoonacular.com';
  
  async searchFood(query: string): Promise<SpoonacularResult> {
    if (this.requestCount >= this.dailyLimit) {
      throw new APILimitError('Spoonacular daily limit reached');
    }
    
    try {
      // Search for ingredients first
      const searchResponse = await fetch(
        `${this.baseUrl}/food/ingredients/search?query=${encodeURIComponent(query)}&number=5&apiKey=${this.apiKey}`
      );
      
      if (!searchResponse.ok) {
        throw new APIError(`Spoonacular search failed: ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json();
      
      if (searchData.results.length === 0) {
        throw new NoMatchError('No Spoonacular matches found');
      }
      
      // Get detailed nutrition for best match
      const bestMatch = searchData.results[0];
      const nutritionResponse = await fetch(
        `${this.baseUrl}/food/ingredients/${bestMatch.id}/information?amount=100&unit=grams&apiKey=${this.apiKey}`
      );
      
      this.requestCount += 2; // Counted both API calls
      
      const nutritionData = await nutritionResponse.json();
      
      return {
        success: true,
        data: this.formatSpoonacularData(nutritionData),
        confidence: this.calculateSpoonacularConfidence(query, bestMatch),
        source: 'spoonacular'
      };
      
    } catch (error) {
      console.error('Spoonacular API error:', error);
      throw error;
    }
  }
  
  private formatSpoonacularData(data: any): NutritionData {
    return {
      food_name: data.name,
      calories_per_100g: data.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || 0,
      protein_per_100g: data.nutrition.nutrients.find(n => n.name === 'Protein')?.amount || 0,
      carbs_per_100g: data.nutrition.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0,
      fat_per_100g: data.nutrition.nutrients.find(n => n.name === 'Fat')?.amount || 0,
      fiber_per_100g: data.nutrition.nutrients.find(n => n.name === 'Fiber')?.amount || 0,
      spoonacular_id: data.id.toString(),
      common_portion_name: this.extractCommonPortion(data),
      allergens: this.extractAllergens(data)
    };
  }
}
```

#### **Fallback: USDA API Integration**
```typescript
class USDAClient {
  private apiKey: string;
  private baseUrl = 'https://api.nal.usda.gov/fdc/v1';
  
  async searchFood(query: string): Promise<USDAResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new APIError(`USDA search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.foods || data.foods.length === 0) {
        throw new NoMatchError('No USDA matches found');
      }
      
      const bestMatch = this.selectBestUSDAMatch(data.foods, query);
      
      return {
        success: true,
        data: this.formatUSDAData(bestMatch),
        confidence: this.calculateUSDAConfidence(query, bestMatch),
        source: 'usda'
      };
      
    } catch (error) {
      console.error('USDA API error:', error);
      throw error;
    }
  }
  
  private selectBestUSDAMatch(foods: any[], query: string): any {
    // Prefer Foundation Foods (most reliable) over Survey Foods
    const foundationFoods = foods.filter(food => food.dataType === 'Foundation');
    const surveyFoods = foods.filter(food => food.dataType === 'Survey (FNDDS)');
    
    const candidates = foundationFoods.length > 0 ? foundationFoods : surveyFoods;
    
    // Score by description similarity and data completeness
    return candidates.reduce((best, current) => {
      const currentScore = this.scoreUSDAMatch(current, query);
      const bestScore = this.scoreUSDAMatch(best, query);
      return currentScore > bestScore ? current : best;
    });
  }
}
```

### **V0.1 Unified Food Lookup Service**

```typescript
class FoodLookupService {
  constructor(
    private spoonacularClient: SpoonacularClient,
    private usdaClient: USDAClient,
    private cacheManager: CacheManager,
    private gptEstimator: GPTNutritionEstimator
  ) {}
  
  async lookupFood(description: string, userId: string): Promise<FoodLookupResult> {
    const cacheKey = this.generateCacheKey(description);
    
    try {
      // 1. Check cache layers (fastest to slowest)
      const cachedResult = await this.cacheManager.get(cacheKey, userId);
      if (cachedResult) {
        return { ...cachedResult, source: 'cache' };
      }
      
      // 2. Try Spoonacular (primary)
      try {
        const spoonacularResult = await this.spoonacularClient.searchFood(description);
        await this.cacheManager.set(cacheKey, spoonacularResult, userId);
        return spoonacularResult;
      } catch (spoonacularError) {
        console.log('Spoonacular failed, trying USDA fallback');
      }
      
      // 3. Try USDA (fallback)
      try {
        const usdaResult = await this.usdaClient.searchFood(description);
        await this.cacheManager.set(cacheKey, usdaResult, userId);
        return usdaResult;
      } catch (usdaError) {
        console.log('USDA failed, using GPT estimation');
      }
      
      // 4. GPT estimation (last resort)
      const gptResult = await this.gptEstimator.estimateNutrition(description);
      await this.cacheManager.setPermanent(cacheKey, gptResult); // Cache GPT results permanently
      
      return {
        ...gptResult,
        confidence: Math.min(gptResult.confidence, 0.6), // Cap GPT confidence
        accuracy_warnings: ['gpt_estimated_data', 'lower_accuracy_expected']
      };
      
    } catch (error) {
      // Complete failure - request manual entry
      return {
        success: false,
        error: 'Unable to process food description',
        clarification_needed: true,
        clarification_message: 'I\'m having trouble with our nutrition databases right now. Could you provide the calories and macros manually if you know them?',
        fallback_suggestion: 'manual_entry'
      };
    }
  }
}
```

---

## 🗄️ Smart Caching Strategy Implementation

### **V0.1 Three-Tier Cache Architecture**

#### **Tier 1: User Personal Cache (Fastest - 50 food limit)**
```typescript
interface UserCacheEntry {
  userId: string;
  foodKey: string;
  nutritionData: NutritionData;
  usageCount: number;
  lastUsed: Date;
  frequencyScore: number; // Calculated usage frequency
  retentionPriority: 'high' | 'medium' | 'low';
}

class UserFoodCache {
  private maxEntries = 50;
  
  async addFood(userId: string, foodKey: string, data: NutritionData): Promise<void> {
    const existingEntry = await this.getEntry(userId, foodKey);
    
    if (existingEntry) {
      // Update existing entry
      await this.updateUsage(existingEntry);
    } else {
      // Add new entry, potentially evicting old ones
      await this.addNewEntry(userId, foodKey, data);
    }
  }
  
  private async addNewEntry(userId: string, foodKey: string, data: NutritionData): Promise<void> {
    const userEntries = await this.getUserEntries(userId);
    
    if (userEntries.length >= this.maxEntries) {
      // Evict lowest priority foods first
      const toEvict = this.selectEvictionCandidates(userEntries);
      await this.evictEntries(toEvict);
    }
    
    await this.insertEntry({
      userId,
      foodKey,
      nutritionData: data,
      usageCount: 1,
      lastUsed: new Date(),
      frequencyScore: 1,
      retentionPriority: 'low'
    });
  }
  
  private selectEvictionCandidates(entries: UserCacheEntry[]): UserCacheEntry[] {
    // Smart eviction: remove foods not used in 7 days AND low frequency
    return entries
      .filter(entry => {
        const daysSinceUse = (Date.now() - entry.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUse > 7 && entry.retentionPriority === 'low';
      })
      .sort((a, b) => a.frequencyScore - b.frequencyScore) // Least used first
      .slice(0, 5); // Evict up to 5 at once
  }
  
  private calculateRetentionPriority(entry: UserCacheEntry): 'high' | 'medium' | 'low' {
    const weeklyUsage = entry.usageCount / Math.max(1, this.getWeeksSinceFirstUse(entry));
    
    if (weeklyUsage >= 3) return 'high';    // 3+ times per week = keep indefinitely
    if (weeklyUsage >= 1) return 'medium';  // 1-2 times per week = extend to 30 days
    return 'low';                           // <1 time per week = 7 day expiration
  }
}
```

#### **Tier 2: Global Cache (Medium Speed - Popularity Based)**
```typescript
interface GlobalCacheEntry {
  foodKey: string;
  nutritionData: NutritionData;
  globalRequestCount: number;
  lastGlobalRequest: Date;
  popularityTier: 'permanent' | 'high' | 'medium' | 'low';
  userCorrectionCount: number;
  needsReview: boolean;
}

class GlobalFoodCache {
  private readonly POPULARITY_THRESHOLDS = {
    permanent: 10000,  // 10k+ requests/month
    high: 1000,        // 1k-10k requests/month  
    medium: 100,       // 100-1k requests/month
    low: 10            // 10-100 requests/month
  };
  
  async updatePopularity(foodKey: string): Promise<void> {
    const entry = await this.getEntry(foodKey);
    if (!entry) return;
    
    entry.globalRequestCount++;
    entry.lastGlobalRequest = new Date();
    
    // Update popularity tier
    const newTier = this.calculatePopularityTier(entry.globalRequestCount);
    if (newTier !== entry.popularityTier) {
      entry.popularityTier = newTier;
      await this.updateRetentionPolicy(entry);
    }
    
    await this.saveEntry(entry);
  }
  
  private calculatePopularityTier(requestCount: number): 'permanent' | 'high' | 'medium' | 'low' {
    if (requestCount >= this.POPULARITY_THRESHOLDS.permanent) return 'permanent';
    if (requestCount >= this.POPULARITY_THRESHOLDS.high) return 'high';
    if (requestCount >= this.POPULARITY_THRESHOLDS.medium) return 'medium';
    return 'low';
  }
  
  async performRetentionCleanup(): Promise<void> {
    const now = new Date();
    const entries = await this.getAllEntries();
    
    for (const entry of entries) {
      const daysSinceLastRequest = (now.getTime() - entry.lastGlobalRequest.getTime()) / (1000 * 60 * 60 * 24);
      
      let shouldEvict = false;
      
      switch (entry.popularityTier) {
        case 'permanent':
          // Never evict
          break;
        case 'high':
          shouldEvict = daysSinceLastRequest > 90;
          break;
        case 'medium':
          shouldEvict = daysSinceLastRequest > 30;
          break;
        case 'low':
          shouldEvict = daysSinceLastRequest > 7;
          break;
      }
      
      if (shouldEvict) {
        await this.evictEntry(entry.foodKey);
      }
    }
  }
}
```

#### **Tier 3: Permanent Database Cache (Slowest - Permanent Storage)**
```typescript
interface DatabaseCacheEntry {
  id: string;
  foodKey: string;
  nutritionData: NutritionData;
  dataSource: 'spoonacular' | 'usda' | 'gpt_generated';
  confidenceScore: number;
  globalRequestCount: number;
  userCorrectionCount: number;
  qualityScore: number;
  needsReview: boolean;
  createdAt: Date;
  lastUpdated: Date;
  version: number; // For data versioning
}

class DatabaseFoodCache {
  async saveGPTGeneratedFood(foodKey: string, data: NutritionData, confidence: number): Promise<void> {
    // Permanently cache GPT-generated nutrition data to ensure consistency
    const entry: DatabaseCacheEntry = {
      id: uuidv4(),
      foodKey,
      nutritionData: data,
      dataSource: 'gpt_generated',
      confidenceScore: confidence,
      globalRequestCount: 1,
      userCorrectionCount: 0,
      qualityScore: confidence,
      needsReview: confidence < 0.6, // Low confidence foods need review
      createdAt: new Date(),
      lastUpdated: new Date(),
      version: 1
    };
    
    