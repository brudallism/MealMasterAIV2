// src/services/api/spoonacular-client.ts
import Constants from 'expo-constants';

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
}

export const spoonacularClient = new SpoonacularClient();