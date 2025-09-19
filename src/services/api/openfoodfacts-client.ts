// src/services/api/openfoodfacts-client.ts
import { FoodLookupResult } from './types';

interface OpenFoodFactsProduct {
  product: {
    _id: string;
    product_name?: string;
    brands?: string;
    nutriments?: {
      'energy-kcal_100g'?: number;
      'proteins_100g'?: number;
      'carbohydrates_100g'?: number;
      'fat_100g'?: number;
      'fiber_100g'?: number;
    };
    serving_size?: string;
    categories?: string;
    image_url?: string;
  };
  status: number;
  status_verbose: string;
}

class OpenFoodFactsClient {
  private baseUrl = 'https://world.openfoodfacts.org/api/v0';

  async lookupBarcode(barcode: string): Promise<FoodLookupResult | null> {
    try {
      const url = `${this.baseUrl}/product/${barcode}.json`;
      console.log('🌐 OpenFoodFacts API URL:', url);

      const response = await fetch(url);
      console.log('📡 OpenFoodFacts API status:', response.status);

      if (!response.ok) {
        throw new Error(`OpenFoodFacts API error: ${response.status}`);
      }

      const data: OpenFoodFactsProduct = await response.json();
      console.log('📋 OpenFoodFacts raw response:', JSON.stringify(data, null, 2));

      // Check if product was found
      if (data.status === 0 || !data.product) {
        console.log('❌ OpenFoodFacts: Product not found - status:', data.status, 'product exists:', !!data.product);
        return null;
      }

      const product = data.product;

      // Transform OpenFoodFacts data to our FoodLookupResult format
      const result: FoodLookupResult = {
        id: `off_${product._id}`,
        name: product.product_name || 'Unknown Product',
        brand: product.brands || undefined,
        category: 'product',
        nutrition: {
          per100g: {
            calories: product.nutriments?.['energy-kcal_100g'] || 0,
            protein: product.nutriments?.['proteins_100g'] || 0,
            carbs: product.nutriments?.['carbohydrates_100g'] || 0,
            fat: product.nutriments?.['fat_100g'] || 0,
            fiber: product.nutriments?.['fiber_100g'] || 0,
          },
          servingSize: product.serving_size || '100g',
        },
        source: {
          api: 'off',
          id: barcode,
          lastUpdated: new Date().toISOString(),
        },
        metadata: {
          confidence: 0.8,
          warnings: [],
          foodIcon: this.getCategoryIcon(product.categories),
          imageUrl: product.image_url,
        },
      };

      return result;
    } catch (error) {
      console.error('OpenFoodFacts API error:', error);
      return null;
    }
  }

  private getCategoryIcon(categories?: string): string {
    if (!categories) return '🥫';

    const categoryLower = categories.toLowerCase();

    if (categoryLower.includes('beverage') || categoryLower.includes('drink')) return '🥤';
    if (categoryLower.includes('dairy') || categoryLower.includes('milk')) return '🥛';
    if (categoryLower.includes('fruit')) return '🍎';
    if (categoryLower.includes('vegetable')) return '🥬';
    if (categoryLower.includes('meat')) return '🥩';
    if (categoryLower.includes('bread') || categoryLower.includes('cereal')) return '🍞';
    if (categoryLower.includes('snack') || categoryLower.includes('chocolate')) return '🍫';
    if (categoryLower.includes('yogurt')) return '🍨';

    return '🥫'; // Default food icon
  }
}

export const openFoodFactsClient = new OpenFoodFactsClient();