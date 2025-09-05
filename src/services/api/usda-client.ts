// src/services/api/usda-client.ts
import Constants from 'expo-constants';

class USDAClient {
  private apiKey: string;
  private baseUrl = 'https://api.nal.usda.gov/fdc/v1';
  
  constructor() {
    const apiKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_USDA_API_KEY;
    if (!apiKey) {
      throw new Error('USDA API key not found');
    }
    this.apiKey = apiKey;
  }
  
  async searchFoods(query: string) {
    try {
      const url = `${this.baseUrl}/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('USDA API error:', error);
      throw error;
    }
  }
  
  async getFoodDetails(fdcId: number) {
    try {
      const url = `${this.baseUrl}/food/${fdcId}?api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`USDA API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('USDA food details error:', error);
      throw error;
    }
  }
}

export const usdaClient = new USDAClient();