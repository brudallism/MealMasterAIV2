// src/services/api/spoonacular-client.ts
import Constants from 'expo-constants';
import { buildSpoonacularQuery } from "@/services/preferences/translate-to-spoonacular";
import { DietaryPreferences } from "@/types/dietary";
import { RecipeSearchResult } from "@/types/recipe";

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
  
  getRemainingRequests() {
    return this.dailyLimit - this.requestCount;
  }

  // Recipe search with dietary preferences
  async searchRecipes(prefs: DietaryPreferences, opts: {
    query?: string;
    number?: number;
    offset?: number;
    maxReadyTime?: number;
    maxIngredients?: number;
  } = {}) {
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Spoonacular daily limit reached');
    }

    try {
      const query = buildSpoonacularQuery(prefs, opts);
      const params = new URLSearchParams(
        Object.entries(query).reduce((acc, [k, v]) => {
          if (v == null || v === "") return acc;
          acc[k] = String(v);
          return acc;
        }, {} as Record<string, string>)
      );

      const url = `${this.baseUrl}/recipes/complexSearch?${params.toString()}&apiKey=${this.apiKey}`;
      console.log('[Spoonacular] Request URL:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Spoonacular] API Response:', data);

      this.requestCount++;

      // Spoonacular returns { results: Recipe[], offset: number, number: number, totalResults: number }
      return data.results || [];
    } catch (error) {
      console.error('Spoonacular recipe search error:', error);
      throw error;
    }
  }

  // Get detailed recipe information
  async getRecipeInfo(id: number) {
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Spoonacular daily limit reached');
    }

    try {
      const url = `${this.baseUrl}/recipes/${id}/information?includeNutrition=true&apiKey=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      this.requestCount++;
      return await response.json();
    } catch (error) {
      console.error('Spoonacular recipe info error:', error);
      throw error;
    }
  }

  // Autocomplete ingredients for custom exclusions
  async autocompleteIngredients(query: string) {
    if (this.requestCount >= this.dailyLimit) {
      throw new Error('Spoonacular daily limit reached');
    }

    try {
      const url = `${this.baseUrl}/food/ingredients/autocomplete?query=${encodeURIComponent(query)}&number=8&apiKey=${this.apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      this.requestCount++;
      const items = await response.json();

      // Return array of ingredient names
      return items.map((item: any) => String(item.name || "").toLowerCase()).filter(Boolean);
    } catch (error) {
      console.error('Spoonacular autocomplete error:', error);
      throw error;
    }
  }
}

export const spoonacularClient = new SpoonacularClient();