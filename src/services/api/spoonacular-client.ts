// src/services/api/spoonacular-client.ts
import Constants from 'expo-constants';
import { Recipe } from '@/types/recipe';
import { DietaryPreferences } from '@/types/dietary';

class SpoonacularClient {
  private apiKey: string;
  private baseUrl = 'https://api.spoonacular.com';
  private requestCount = 0;
  private dailyLimit = 150;
  
  constructor() {
    const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SPOONACULAR_API_KEY;
    if (!apiKey) {
      throw new Error('Spoonacular API key not found');
    }
    this.apiKey = apiKey;
  }
  
  async searchIngredients(query: string) {
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Spoonacular daily limit reached');
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/food/ingredients/search?query=${encodeURIComponent(query)}&number=10&apiKey=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }
      
      this.requestCount++;
      return await response.json();
    } catch (error) {
      console.error('Spoonacular API error:', error);
      throw error;
    }
  }
  
  async getIngredientInfo(id: number) {
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Spoonacular daily limit reached');
    }
    
    try {
      const response = await fetch(
        `${this.baseUrl}/food/ingredients/${id}/information?apiKey=${this.apiKey}&amount=100&unit=grams`
      );
      
      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }
      
      this.requestCount++;
      return await response.json();
    } catch (error) {
      console.error('Spoonacular ingredient info error:', error);
      throw error;
    }
  }
  
  /**
   * Search for recipes based on dietary preferences and comprehensive filters
   */
  async searchRecipes(
    dietaryPreferences: DietaryPreferences,
    options: {
      query?: string;
      number?: number;
      offset?: number;
      // Time constraints
      maxReadyTime?: number;
      minReadyTime?: number;
      // Ingredient constraints
      maxIngredients?: number;
      includeIngredients?: string;
      excludeIngredients?: string;
      // Meal context
      type?: string; // breakfast, lunch, dinner, snack, dessert
      cuisine?: string;
      // Nutritional constraints
      minCalories?: number;
      maxCalories?: number;
      minProtein?: number;
      maxProtein?: number;
      minCarbs?: number;
      maxCarbs?: number;
      minFat?: number;
      maxFat?: number;
      minFiber?: number;
      // Scoring and sorting
      sort?: string; // popularity, healthiness, price, time, random
      sortDirection?: 'asc' | 'desc';
      // Additional filters
      equipment?: string;
      ignorePantry?: boolean;
      addRecipeInstructions?: boolean;
    } = {}
  ): Promise<Recipe[]> {
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Spoonacular daily limit reached');
    }

    try {
      const params = new URLSearchParams({
        apiKey: this.apiKey,
        number: (options.number || 12).toString(),
        offset: (options.offset || 0).toString(),
        addRecipeInformation: 'true',
        fillIngredients: 'false',
        addRecipeNutrition: 'true',
        addRecipeInstructions: (options.addRecipeInstructions || false).toString()
      });

      // Add query if provided
      if (options.query) {
        params.append('query', options.query);
      }

      // Add dietary filters
      if (dietaryPreferences.diets.length > 0) {
        params.append('diet', dietaryPreferences.diets.join(','));
      }

      if (dietaryPreferences.allergens.length > 0) {
        // Convert allergens to intolerances format
        const intolerances = dietaryPreferences.allergens.map(allergen => {
          const allergenMap: Record<string, string> = {
            'gluten': 'gluten',
            'dairy': 'dairy',
            'eggs': 'egg',
            'fish': 'seafood',
            'shellfish': 'shellfish',
            'tree-nuts': 'tree nut',
            'peanuts': 'peanut',
            'soy': 'soy',
            'sesame': 'sesame'
          };
          return allergenMap[allergen] || allergen;
        });
        params.append('intolerances', intolerances.join(','));
      }

      // Add time constraints
      if (options.maxReadyTime) {
        params.append('maxReadyTime', options.maxReadyTime.toString());
      }

      if (options.minReadyTime) {
        params.append('minReadyTime', options.minReadyTime.toString());
      }

      // Add ingredient constraints
      if (options.maxIngredients) {
        params.append('maxIngredients', options.maxIngredients.toString());
      }

      if (options.includeIngredients) {
        params.append('includeIngredients', options.includeIngredients);
      }

      if (options.excludeIngredients) {
        params.append('excludeIngredients', options.excludeIngredients);
      }

      // Add meal context
      if (options.type) {
        params.append('type', options.type);
      }

      if (options.cuisine) {
        params.append('cuisine', options.cuisine);
      }

      // Add nutritional constraints
      if (options.maxCalories || dietaryPreferences.maxCalories) {
        params.append('maxCalories', (options.maxCalories || dietaryPreferences.maxCalories!).toString());
      }

      if (options.minCalories) {
        params.append('minCalories', options.minCalories.toString());
      }

      if (options.minProtein || dietaryPreferences.minProtein) {
        params.append('minProtein', (options.minProtein || dietaryPreferences.minProtein!).toString());
      }

      if (options.maxProtein) {
        params.append('maxProtein', options.maxProtein.toString());
      }

      if (options.maxCarbs || dietaryPreferences.maxCarbs) {
        params.append('maxCarbs', (options.maxCarbs || dietaryPreferences.maxCarbs!).toString());
      }

      if (options.minCarbs) {
        params.append('minCarbs', options.minCarbs.toString());
      }

      if (options.maxFat || dietaryPreferences.maxFat) {
        params.append('maxFat', (options.maxFat || dietaryPreferences.maxFat!).toString());
      }

      if (options.minFat) {
        params.append('minFat', options.minFat.toString());
      }

      if (options.minFiber) {
        params.append('minFiber', options.minFiber.toString());
      }

      // Add sorting
      if (options.sort) {
        params.append('sort', options.sort);
        if (options.sortDirection) {
          params.append('sortDirection', options.sortDirection);
        }
      }

      // Add additional filters
      if (options.equipment) {
        params.append('equipment', options.equipment);
      }

      if (options.ignorePantry !== undefined) {
        params.append('ignorePantry', options.ignorePantry.toString());
      }

      const url = `${this.baseUrl}/recipes/complexSearch?${params.toString()}`;

      console.log('[SpoonacularClient] Searching recipes:', {
        query: options.query,
        diets: dietaryPreferences.diets,
        allergens: dietaryPreferences.allergens,
        url: url.replace(this.apiKey, '[API_KEY]')
      });

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      this.requestCount++;
      const data = await response.json();

      // Return the results array
      return data.results || [];

    } catch (error) {
      console.error('Spoonacular recipe search error:', error);
      throw error;
    }
  }

  /**
   * Get detailed recipe information by ID with full nutrition data
   */
  async getRecipeById(id: number, includeInstructions: boolean = true): Promise<Recipe | null> {
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Spoonacular daily limit reached');
    }

    try {
      const params = new URLSearchParams({
        apiKey: this.apiKey,
        includeNutrition: 'true',
        addWinePairing: 'false',
        addTasteData: 'false'
      });

      const url = `${this.baseUrl}/recipes/${id}/information?${params.toString()}`;

      console.log('[SpoonacularClient] Fetching recipe details for ID:', id);

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[SpoonacularClient] Recipe ${id} not found`);
          return null;
        }
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      this.requestCount++;
      const recipeData = await response.json();

      // If instructions weren't included and we need them, fetch separately
      if (includeInstructions && (!recipeData.analyzedInstructions || recipeData.analyzedInstructions.length === 0)) {
        try {
          const instructionsData = await this.getRecipeInstructions(id);
          recipeData.analyzedInstructions = instructionsData;
        } catch (error) {
          console.warn(`[SpoonacularClient] Failed to fetch instructions for recipe ${id}:`, error);
        }
      }

      return recipeData;

    } catch (error) {
      console.error('Spoonacular recipe details error:', error);
      throw error;
    }
  }

  /**
   * Get recipe instructions separately if needed
   */
  async getRecipeInstructions(id: number): Promise<any> {
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Spoonacular daily limit reached');
    }

    try {
      const url = `${this.baseUrl}/recipes/${id}/analyzedInstructions?apiKey=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      this.requestCount++;
      return await response.json();

    } catch (error) {
      console.error('Spoonacular instructions error:', error);
      throw error;
    }
  }

  /**
   * Get recipe nutrition information separately
   */
  async getRecipeNutrition(id: number): Promise<any> {
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Spoonacular daily limit reached');
    }

    try {
      const url = `${this.baseUrl}/recipes/${id}/nutritionWidget.json?apiKey=${this.apiKey}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      this.requestCount++;
      return await response.json();

    } catch (error) {
      console.error('Spoonacular nutrition error:', error);
      throw error;
    }
  }

  getRemainingRequests() {
    return this.dailyLimit - this.requestCount;
  }
}

export const spoonacularClient = new SpoonacularClient();