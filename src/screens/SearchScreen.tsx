import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodLookupResult } from '../services/api/types';
import { UnifiedMealItem } from '../types/unified-meal-item';
import { DietaryPreferences, createDietaryPreferences } from '../types/dietary';
import { useSearchStore } from '../stores/search-store';
import { useCart } from '../stores/cart-store';
import { useUnifiedFavoritesStore } from '../stores/unified-favorites-store';
import { unifiedSearchService } from '../services/unified-search-service';
import FoodDetailModal from '../components/organisms/FoodDetailModal';
import MealBasketModal from '../components/organisms/MealBasketModal';
import BarcodeScanner from '../components/organisms/BarcodeScanner';
import { FloatingChatBubbleWrapper } from '../components/atoms/FloatingChatBubble';

export default function SearchScreen() {
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<UnifiedMealItem | null>(null);
  const [showBasketModal, setShowBasketModal] = useState(false);
  const [wasOpenedFromBarcode, setWasOpenedFromBarcode] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'recents' | 'favorites'>('search');
  const [searchMode, setSearchMode] = useState<'foods' | 'recipes'>('foods');
  
  const {
    currentQuery,
    searchResults,
    isSearching,
    searchError,
    setCurrentQuery,
    setSearchResults,
    setIsSearching,
    setSearchError,
    addToSearchHistory,
    addRecentFood,
    recentFoods,
    getRecentFoods,
    getStarredByCategory
  } = useSearchStore();
  
  const { addToCart, itemCount } = useCart();

  // Unified favorites store
  const {
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavoritesByType,
    migrateLegacyFavorites
  } = useUnifiedFavoritesStore();

  // Default dietary preferences (TODO: get from user settings)
  const defaultDietaryPreferences = createDietaryPreferences();

  // Request cancellation for race condition prevention
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Migration from legacy favorites system to unified favorites on app startup
  useEffect(() => {
    const performMigration = async () => {
      try {
        // Get legacy starred foods from the search store
        const legacyStarredFoods = getStarredByCategory();

        console.log('[SearchScreen] Performing favorites migration:', {
          legacyStarredCount: legacyStarredFoods.length
        });

        // Migrate to unified favorites store
        await migrateLegacyFavorites(legacyStarredFoods, []);

        console.log('[SearchScreen] Favorites migration completed');
      } catch (error) {
        console.error('[SearchScreen] Migration error:', error);
      }
    };

    performMigration();
  }, []); // Run once on component mount

  // Re-search when search mode changes
  useEffect(() => {
    if (currentQuery.trim()) {
      console.log('[SearchScreen] Search mode changed, re-searching:', searchMode);
      handleSearch(currentQuery);
    }
  }, [searchMode]); // Re-search when mode changes

  // Smart query normalization for consistent results
  const normalizeQuery = (query: string): string => {
    const words = query.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
    
    if (words.length <= 1) return query.trim();
    
    // Common food terms that should come first for better USDA API results
    const foodTerms = ['beef', 'chicken', 'pork', 'fish', 'turkey', 'lamb', 'salmon', 'tuna', 'cod'];
    const descriptors = ['organic', 'ground', 'raw', 'cooked', 'fresh', 'frozen', 'lean', 'boneless'];
    const cuts = ['breast', 'thigh', 'wing', 'leg', 'tenderloin', 'sirloin', 'ribeye'];
    
    // Separate words into categories
    const foods = words.filter(w => foodTerms.some(ft => w.includes(ft) || ft.includes(w)));
    const cutWords = words.filter(w => cuts.some(c => w.includes(c) || c.includes(w)));
    const descWords = words.filter(w => descriptors.some(d => w.includes(d) || d.includes(w)));
    const others = words.filter(w => 
      !foods.includes(w) && !cutWords.includes(w) && !descWords.includes(w)
    );
    
    // Reorder: food terms first, then cuts, then descriptors, then others
    const normalized = [...foods, ...cutWords, ...descWords, ...others].join(' ');
    
    if (normalized !== query.trim()) {
      console.log('[SearchScreen] Query normalized:', `"${query.trim()}" → "${normalized}"`);
    }
    
    return normalized;
  };

  // Debounced search function to prevent search spam
  const debouncedSearch = useCallback((query: string) => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 400); // Wait 400ms after user stops typing
  }, []);

  // Smart query processing with cooked/raw variations for simple ingredients
  const generateSmartQueries = (baseQuery: string): string[] => {
    const trimmed = baseQuery.trim().toLowerCase();
    const queries = [trimmed]; // Always include the original query first
    
    // Foods that need cooked/raw distinction for accurate nutrition
    const cookableIngredients = [
      'rice', 'quinoa', 'oats', 'pasta', 'noodles', 'beans', 'lentils', 
      'chickpeas', 'barley', 'bulgur', 'couscous', 'farro', 'millet',
      'potatoes', 'sweet potato', 'yams', 'corn', 'peas'
    ];
    
    // Check if query contains cookable ingredients
    const hasCookableIngredient = cookableIngredients.some(ingredient => 
      trimmed.includes(ingredient)
    );
    
    // Only add variations if it's a simple ingredient and doesn't already specify preparation
    if (hasCookableIngredient && 
        !trimmed.includes('cooked') && 
        !trimmed.includes('raw') && 
        !trimmed.includes('uncooked') &&
        !trimmed.includes('prepared')) {
      
      // Add cooked and raw variations
      queries.push(`${trimmed} cooked`);
      queries.push(`${trimmed} raw`);
    }
    
    return queries;
  };

  const processQuery = (baseQuery: string): string => {
    return baseQuery.trim();
  };

  const optimizeResults = (allFoods: any[], originalQuery: string): any[] => {
    console.log('[SearchScreen] Optimizing results from', allFoods.length, 'total foods');
    
    // Priority 1: Foundation foods first (simple ingredients)
    const foundationFoods = allFoods.filter(f => f.dataType === 'Foundation');
    const nonFoundationFoods = allFoods.filter(f => f.dataType !== 'Foundation');
    
    // For cookable ingredients, prioritize cooked/raw variations within Foundation foods
    const cookableIngredients = [
      'rice', 'quinoa', 'oats', 'pasta', 'noodles', 'beans', 'lentils', 
      'chickpeas', 'barley', 'bulgur', 'couscous', 'farro', 'millet',
      'potatoes', 'sweet potato', 'yams', 'corn', 'peas'
    ];
    
    const hasCookableIngredient = cookableIngredients.some(ingredient => 
      originalQuery.toLowerCase().includes(ingredient)
    );
    
    let prioritizedFoods: any[] = [];
    
    if (hasCookableIngredient && foundationFoods.length > 0) {
      // For cookable ingredients, prioritize cooked/raw variations
      const rawFoods = foundationFoods.filter(f => 
        f.description.toLowerCase().includes('raw') || 
        f.description.toLowerCase().includes('uncooked')
      );
      const cookedFoods = foundationFoods.filter(f => 
        f.description.toLowerCase().includes('cooked') || 
        f.description.toLowerCase().includes('boiled') ||
        f.description.toLowerCase().includes('prepared')
      );
      const neutralFoods = foundationFoods.filter(f => 
        !rawFoods.includes(f) && !cookedFoods.includes(f)
      );
      
      // Prioritize: raw first, then cooked, then neutral Foundation foods
      prioritizedFoods = [
        ...rawFoods.slice(0, 1),      // Top 1 raw
        ...cookedFoods.slice(0, 1),   // Top 1 cooked  
        ...neutralFoods.slice(0, 1),  // Top 1 neutral Foundation
      ].filter(Boolean);
      
      console.log('[SearchScreen] Cookable ingredient detected - prioritizing:', {
        raw: rawFoods.length,
        cooked: cookedFoods.length,
        neutral: neutralFoods.length,
        selected: prioritizedFoods.length
      });
    } else {
      // For non-cookable ingredients, just take top 3 Foundation foods
      prioritizedFoods = foundationFoods.slice(0, 3);
    }
    
    // Fill remaining slots with most relevant results from all data types
    const remainingSlots = 12 - prioritizedFoods.length;
    const usedIds = new Set(prioritizedFoods.map(f => f.fdcId));
    const remainingFoods = allFoods.filter(f => !usedIds.has(f.fdcId));
    
    const finalResults = [
      ...prioritizedFoods,
      ...remainingFoods.slice(0, remainingSlots)
    ];
    
    console.log('[SearchScreen] Final optimization results:', {
      total: finalResults.length,
      foundation: finalResults.filter(f => f.dataType === 'Foundation').length,
      dataTypes: finalResults.reduce((acc, f) => {
        acc[f.dataType] = (acc[f.dataType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
    
    return finalResults;
  };

  // Legacy USDA search function - preserves all existing search logic
  const legacyUSDASearch = async (query: string) => {
    // Get API key
    const apiKey = process.env.EXPO_PUBLIC_USDA_API_KEY;
    if (!apiKey) {
      throw new Error('USDA API key not configured');
    }

    const normalizedQuery = query.trim();
    const smartQueries = generateSmartQueries(normalizedQuery);

    console.log('[SearchScreen] Smart queries generated:', smartQueries);

    // Execute searches for all query variations
    let allFoods: any[] = [];

    for (const queryVariation of smartQueries) {
      console.log('[SearchScreen] Searching for:', queryVariation);

      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(queryVariation)}&pageSize=20`
      );

      if (!response.ok) {
        console.warn(`Query "${queryVariation}" failed:`, response.status);
        continue;
      }

      const data = await response.json();
      if (data.foods && data.foods.length > 0) {
        allFoods.push(...data.foods);
      }
    }

    // Remove duplicates by fdcId
    const uniqueFoods = allFoods.reduce((acc: any[], food: any) => {
      if (!acc.find((f: any) => f.fdcId === food.fdcId)) {
        acc.push(food);
      }
      return acc;
    }, [] as any[]);

    console.log('[SearchScreen] Total unique foods from all queries:', uniqueFoods.length);

    if (uniqueFoods.length === 0) {
      return {
        ingredients: [],
        products: [],
        recipes: [],
        total: 0,
        fromCache: false,
        searchTime: 0
      };
    }

    // Apply optimization with Foundation food prioritization and cooked/raw logic
    const optimizedFoods = optimizeResults(uniqueFoods, normalizedQuery);

    // Get the food IDs for detailed nutrition lookup
    const foodIds = optimizedFoods.map((food: any) => food.fdcId);

    if (foodIds.length === 0) {
      return {
        ingredients: [],
        products: [],
        recipes: [],
        total: 0,
        fromCache: false,
        searchTime: 0
      };
    }

    // Get detailed nutrition data for all foods in one request
    const nutritionResponse = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods?api_key=${apiKey}&fdcIds=${foodIds.join(',')}`
    );

    if (!nutritionResponse.ok) {
      throw new Error(`Nutrition API request failed: ${nutritionResponse.status}`);
    }

    const nutritionData = await nutritionResponse.json();
    console.log('USDA Nutrition API response:', nutritionData.length, 'foods with detailed nutrition');

    // Create a map for quick nutrition lookup
    const nutritionMap = new Map();
    nutritionData.forEach((food: any) => {
      nutritionMap.set(food.fdcId, food);
    });

    // Convert optimized USDA response to our FoodLookupResult format
    const foods: FoodLookupResult[] = optimizedFoods.map((food: any) => {
      const detailedFood = nutritionMap.get(food.fdcId);
      const nutrients = detailedFood?.foodNutrients || [];

      // Create display name with brand for branded foods
      const baseName = food.description || 'Unknown food';
      const brandName = food.brandOwner;
      const displayName = brandName ? `${baseName} - ${brandName}` : baseName;

      // Extract micronutrients from USDA data
      const micronutrients: { [id: number]: { amount: number; unit: string } } = {};
      nutrients.forEach((nutrient: any) => {
        if (nutrient.nutrient?.id && nutrient.amount !== undefined) {
          micronutrients[nutrient.nutrient.id] = {
            amount: nutrient.amount,
            unit: nutrient.nutrient.unitName || 'g'
          };
        }
      });

      return {
        id: `usda_${food.fdcId}`,
        name: displayName,
        brand: brandName,
        category: food.foodCategory || 'ingredient',
        nutrition: {
          per100g: {
            calories: extractNutrient(nutrients, 1008) || 0, // Energy
            protein: extractNutrient(nutrients, 1003) || 0, // Protein
            carbs: extractNutrient(nutrients, 1005) || 0, // Carbs
            fat: extractNutrient(nutrients, 1004) || 0, // Fat
            fiber: extractNutrient(nutrients, 1079) || 0, // Fiber
          },
          servingSize: '100g',
          micronutrients: Object.keys(micronutrients).length > 0 ? micronutrients : undefined
        },
        source: {
          api: 'usda' as const,
          id: food.fdcId.toString(),
          dataType: food.dataType,
          lastUpdated: new Date().toISOString()
        },
        metadata: {
          confidence: 0.8,
          warnings: []
        }
      };
    });

    // Log final optimized results
    console.log('[SearchScreen] Final optimized results:', foods.map((f, i) =>
      `${i+1}. ${f.name} (${f.source.dataType})`
    ).join(', '));

    // Return in the format expected by unified search service
    return {
      ingredients: foods,
      products: [],
      recipes: [],
      total: foods.length,
      fromCache: false,
      searchTime: 0
    };
  };

  // New unified search handler
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsSearching(true);
    setSearchError(null);

    try {
      console.log('[SearchScreen] Using unified search service for query:', query, 'mode:', searchMode);

      let unifiedResults;

      if (searchMode === 'recipes') {
        // Search for recipes using Spoonacular
        unifiedResults = await unifiedSearchService.searchRecipes(
          query,
          defaultDietaryPreferences,
          {
            number: 12,
            offset: 0
          }
        );
      } else {
        // Search for foods using USDA (existing functionality)
        unifiedResults = await unifiedSearchService.searchFoods(query, legacyUSDASearch);
      }

      // Convert UnifiedMealItem[] back to legacy SearchResults format for backward compatibility
      const foods: FoodLookupResult[] = unifiedResults.items.map((unifiedItem: UnifiedMealItem) => ({
        id: unifiedItem.id,
        name: unifiedItem.title,
        brand: unifiedItem.brandOwner || (unifiedItem.type === 'recipe' ? 'Recipe' : undefined),
        category: unifiedItem.type === 'ingredient' ? 'ingredient' :
                 unifiedItem.type === 'product' ? 'product' :
                 unifiedItem.type === 'recipe' ? 'recipe' : 'food',
        nutrition: {
          per100g: {
            calories: unifiedItem.nutrition?.per_serving.calories || 0,
            protein: unifiedItem.nutrition?.per_serving.protein || 0,
            carbs: unifiedItem.nutrition?.per_serving.carbs || 0,
            fat: unifiedItem.nutrition?.per_serving.fat || 0,
            fiber: unifiedItem.nutrition?.per_serving.fiber || 0,
          },
          servingSize: unifiedItem.type === 'recipe' ? `${unifiedItem.servings || 1} servings` : '100g'
        },
        source: {
          api: unifiedItem.source,
          id: unifiedItem.originalId.toString(),
          lastUpdated: unifiedItem.metadata?.lastUpdated || new Date().toISOString()
        },
        metadata: {
          confidence: unifiedItem.metadata?.searchRelevance || 0.8,
          warnings: [],
          // Add recipe-specific metadata for UI
          readyInMinutes: unifiedItem.readyInMinutes,
          healthScore: unifiedItem.healthScore,
          foodIcon: unifiedItem.type === 'recipe' ? '🍽️' : undefined
        }
      }));

      // Organize results by type for proper section rendering
      const ingredients = foods.filter(item => item.category === 'ingredient');
      const products = foods.filter(item => item.category === 'product');
      const recipes = foods.filter(item => item.category === 'recipe');
      const otherFoods = foods.filter(item => !['ingredient', 'product', 'recipe'].includes(item.category));

      const searchResults = {
        ingredients: searchMode === 'recipes' ? [] : [...ingredients, ...otherFoods],
        products: searchMode === 'recipes' ? [] : products,
        recipes: searchMode === 'recipes' ? recipes : [],
        total: foods.length,
        fromCache: false,
        searchTime: 0
      };

      setSearchResults(searchResults);
      addToSearchHistory(query, searchResults.total);

    } catch (error) {
      // Don't show errors for aborted requests (user typed more)
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[SearchScreen] Search aborted - user typed more');
        return;
      }

      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Helper function to extract nutrient values from USDA response
  const extractNutrient = (nutrients: any[], nutrientId: number): number => {
    const nutrient = nutrients?.find(n => n.nutrient?.id === nutrientId);
    return nutrient?.amount || 0;
  };

  // Convert MealItem to FoodLookupResult for consistent UI
  const convertMealItemToFoodLookupResult = (mealItem: any): FoodLookupResult => {
    return {
      id: mealItem.id,
      name: mealItem.name,
      brand: undefined,
      category: mealItem.category || 'ingredient',
      nutrition: {
        per100g: {
          calories: mealItem.calories || 0,
          protein: mealItem.protein || 0,
          carbs: mealItem.carbs || 0,
          fat: mealItem.fat || 0,
          fiber: mealItem.fiber || 0,
        },
        servingSize: mealItem.serving_size || '100g'
      },
      source: {
        api: mealItem.source || 'usda' as const,
        id: mealItem.id,
        dataType: 'Stored',
        lastUpdated: new Date().toISOString()
      },
      metadata: {
        confidence: mealItem.confidence || 0.8,
        warnings: []
      }
    };
  };

  // Get data for current tab
  const getTabData = (): FoodLookupResult[] => {
    switch (activeTab) {
      case 'recents':
        return getRecentFoods(20).map(recent => convertMealItemToFoodLookupResult(recent.food));
      case 'favorites':
        return getStarredByCategory().map(starred => convertMealItemToFoodLookupResult(starred.food));
      case 'search':
      default:
        return [];
    }
  };

  // Render tab bar
  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'search' && styles.activeTab]}
        onPress={() => setActiveTab('search')}
      >
        <Text style={[styles.tabText, activeTab === 'search' && styles.activeTabText]}>
          Search
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'recents' && styles.activeTab]}
        onPress={() => setActiveTab('recents')}
      >
        <Text style={[styles.tabText, activeTab === 'recents' && styles.activeTabText]}>
          Recents
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
        onPress={() => setActiveTab('favorites')}
      >
        <Text style={[styles.tabText, activeTab === 'favorites' && styles.activeTabText]}>
          Favorites
        </Text>
      </TouchableOpacity>
    </View>
  );

  const handleFoodItemClick = (food: FoodLookupResult) => {
    // Convert FoodLookupResult to UnifiedMealItem for FoodDetailModal
    const isRecipe = food.category === 'recipe';

    const unifiedFood: UnifiedMealItem = {
      id: food.id,
      source: food.source.api as 'usda' | 'spoonacular',
      originalId: food.id.replace(/^(usda_|spoonacular_)/, ''),
      title: food.name,
      type: food.category === 'ingredient' ? 'ingredient' :
            food.category === 'product' ? 'product' :
            food.category === 'recipe' ? 'recipe' : 'food',
      brandOwner: food.brand,
      // Recipe-specific properties
      ...(isRecipe && {
        readyInMinutes: food.metadata?.readyInMinutes,
        healthScore: food.metadata?.healthScore,
        servings: food.nutrition.servingSize ? parseInt(food.nutrition.servingSize) : undefined
      }),
      nutrition: {
        per_serving: {
          calories: food.nutrition.per100g.calories,
          protein: food.nutrition.per100g.protein,
          carbs: food.nutrition.per100g.carbs,
          fat: food.nutrition.per100g.fat,
          fiber: food.nutrition.per100g.fiber,
        }
      },
      metadata: {
        searchRelevance: food.metadata.confidence,
        lastUpdated: food.source.lastUpdated,
        tags: [food.source.api]
      }
    };

    setSelectedFood(unifiedFood);
    setShowFoodModal(true);
    setWasOpenedFromBarcode(false); // Not from barcode scanner
  };

  const handleCloseFoodModal = () => {
    setShowFoodModal(false);
    setSelectedFood(null);
    // Only reopen barcode scanner if it was originally opened from barcode scanner
    if (wasOpenedFromBarcode) {
      setShowBarcodeScanner(true);
    }
  };

  const handleAddToMeal = (food: UnifiedMealItem, quantity: number, unit: string) => {
    // Convert UnifiedMealItem to the format expected by stores with safety guards
    const convertedFood = {
      id: food.id,
      name: food.title,
      calories: food.nutrition?.per_serving.calories || 0,
      protein: food.nutrition?.per_serving.protein || 0,
      carbs: food.nutrition?.per_serving.carbs || 0,
      fat: food.nutrition?.per_serving.fat || 0,
      fiber: food.nutrition?.per_serving.fiber || 0,
      serving_size: '100g', // UnifiedMealItem uses per_serving basis
      source: food.source,
      category: food.type,
      confidence: food.metadata?.searchRelevance || 0.8
    };
    
    // Add to recent foods for quick access
    addRecentFood(convertedFood);
    
    // Add to cart with specified serving
    addToCart(convertedFood, quantity, unit);

    console.log(`Added to meal: ${food.title} (${quantity} ${unit})`);

    // Close food modal and only reopen scanner if it was originally opened from barcode scanner
    setShowFoodModal(false);
    setSelectedFood(null);
    if (wasOpenedFromBarcode) {
      setShowBarcodeScanner(true);
    }
  };

  const handleAddToCart = (food: FoodLookupResult) => {
    // Convert FoodLookupResult to the format expected by stores with safety guards
    const convertedFood = {
      id: food.id,
      name: food.name,
      calories: food.nutrition.per100g.calories || 0,
      protein: food.nutrition.per100g.protein || 0,
      carbs: food.nutrition.per100g.carbs || 0,
      fat: food.nutrition.per100g.fat || 0,
      fiber: food.nutrition.per100g.fiber || 0,
      serving_size: food.nutrition.servingSize || '100g',
      source: food.source.api,
      category: 'ingredient',
      confidence: 1
    };
    
    // Add to recent foods for quick access
    addRecentFood(convertedFood);
    
    // Add to cart with default serving
    addToCart(convertedFood, 1, convertedFood.serving_size);
    
    console.log('Added to cart:', food.name);
  };

  const openBarcodeScanner = () => {
    setShowBarcodeScanner(true);
  };

  const handleBarcodeProduct = (product: FoodLookupResult) => {
    console.log('🎯 handleBarcodeProduct called with product:', product.name);

    // Convert and add to recent foods with safety guards
    const convertedFood = {
      id: product.id,
      name: product.name,
      calories: product.nutrition.per100g.calories || 0,
      protein: product.nutrition.per100g.protein || 0,
      carbs: product.nutrition.per100g.carbs || 0,
      fat: product.nutrition.per100g.fat || 0,
      fiber: product.nutrition.per100g.fiber || 0,
      serving_size: product.nutrition.servingSize || '100g',
      source: product.source.api,
      category: 'ingredient',
      confidence: 1
    };
    addRecentFood(convertedFood);

    console.log('📝 Setting selectedFood to:', product.name);
    console.log('📱 Closing barcode scanner and showing food modal');

    // Convert FoodLookupResult to UnifiedMealItem for FoodDetailModal
    const unifiedProduct: UnifiedMealItem = {
      id: product.id,
      source: 'usda',
      originalId: product.id.replace('usda_', ''),
      title: product.name,
      type: product.category === 'ingredient' ? 'ingredient' :
            product.category === 'product' ? 'product' : 'food',
      brandOwner: product.brand,
      nutrition: {
        per_serving: {
          calories: product.nutrition.per100g.calories,
          protein: product.nutrition.per100g.protein,
          carbs: product.nutrition.per100g.carbs,
          fat: product.nutrition.per100g.fat,
          fiber: product.nutrition.per100g.fiber,
        }
      },
      metadata: {
        searchRelevance: product.metadata.confidence,
        lastUpdated: product.source.lastUpdated,
        tags: ['usda', 'barcode']
      }
    };

    // Close barcode scanner and show food detail modal
    setShowBarcodeScanner(false);
    setSelectedFood(unifiedProduct);
    setShowFoodModal(true);
    setWasOpenedFromBarcode(true); // Mark that this was opened from barcode scanner

    console.log('✅ Modal state updated - scanner closed, food modal opened');
  };

  const renderFoodItem = ({ item }: { item: FoodLookupResult }) => {
    const isItemStarred = isFavorite(item.id);
    const isRecipe = item.category === 'recipe';

    const handleToggleStar = async (e: any) => {
      e.stopPropagation();

      if (isItemStarred) {
        await removeFromFavorites(item.id);
      } else {
        // Convert FoodLookupResult to UnifiedMealItem for unified favorites store
        const unifiedItem: UnifiedMealItem = {
          id: item.id,
          source: item.source.api as 'usda' | 'spoonacular',
          originalId: item.id.replace(/^(usda_|spoonacular_)/, ''),
          title: item.name,
          type: item.category === 'ingredient' ? 'ingredient' :
                item.category === 'product' ? 'product' :
                item.category === 'recipe' ? 'recipe' : 'food',
          brandOwner: item.brand,
          // Recipe-specific properties
          ...(isRecipe && {
            readyInMinutes: item.metadata?.readyInMinutes,
            healthScore: item.metadata?.healthScore,
            servings: item.nutrition.servingSize ? parseInt(item.nutrition.servingSize) : undefined
          }),
          nutrition: {
            per_serving: {
              calories: item.nutrition.per100g.calories,
              protein: item.nutrition.per100g.protein,
              carbs: item.nutrition.per100g.carbs,
              fat: item.nutrition.per100g.fat,
              fiber: item.nutrition.per100g.fiber,
            }
          },
          metadata: {
            searchRelevance: item.metadata.confidence,
            lastUpdated: item.source.lastUpdated,
            tags: [item.source.api]
          }
        };
        await addToFavorites(unifiedItem, 'starred');
      }
    };

    return (
      <TouchableOpacity
        style={styles.foodItem}
        onPress={() => handleFoodItemClick(item)}
      >
        <View style={styles.foodIconContainer}>
          <Text style={styles.foodIcon}>
            {isRecipe ? '👨‍🍳' : (item.metadata?.foodIcon || '🍽️')}
          </Text>
        </View>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          {isRecipe ? (
            // Recipe-specific display
            <>
              <Text style={styles.foodNutrition}>
                {Math.round(item.nutrition.per100g.calories || 0)} cal per serving
                {item.metadata?.readyInMinutes && ` • ${item.metadata.readyInMinutes} min`}
                {item.metadata?.healthScore && ` • ${Math.round(item.metadata.healthScore)}/100 health`}
              </Text>
              <Text style={styles.servingSize}>{item.nutrition.servingSize}</Text>
              <Text style={styles.foodSource}>Recipe • Source: {item.source.api}</Text>
            </>
          ) : (
            // Food/ingredient display
            <>
              <Text style={styles.foodNutrition}>
                {Math.round(item.nutrition.per100g.calories || 0)} cal • {Math.round(item.nutrition.per100g.protein || 0)}g protein • {Math.round(item.nutrition.per100g.carbs || 0)}g carbs
              </Text>
              <Text style={styles.servingSize}>{item.nutrition.servingSize || '100g'}</Text>
              <Text style={styles.foodSource}>Source: {item.source.api}</Text>
            </>
          )}
          {item.metadata?.warnings && item.metadata.warnings.length > 0 && (
            <Text style={styles.warningText}>⚠️ {item.metadata.warnings[0]}</Text>
          )}
        </View>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.starButton}
            onPress={handleToggleStar}
          >
            <Ionicons
              name={isItemStarred ? "star" : "star-outline"}
              size={20}
              color={isItemStarred ? "#F59E0B" : "#6B7280"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={(e) => {
              e.stopPropagation();
              handleAddToCart(item);
            }}
          >
            <Ionicons name="add" size={20} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, data: FoodLookupResult[]) => {
    if (data.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderFoodItem}
          scrollEnabled={false}
        />
      </View>
    );
  };

  // Cleanup timeouts and requests on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // const recentFoodsList = getRecentFoods(5).map(recent => recent.food);
  // const starredFoodsList = getStarredByCategory().map(starred => starred.food);

  return (
    <FloatingChatBubbleWrapper>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {/* Search Mode Toggle */}
          <View style={styles.searchModeContainer}>
            <TouchableOpacity
              style={[styles.searchModeButton, searchMode === 'foods' && styles.searchModeButtonActive]}
              onPress={() => setSearchMode('foods')}
            >
              <Ionicons name="nutrition-outline" size={16} color={searchMode === 'foods' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.searchModeText, searchMode === 'foods' && styles.searchModeTextActive]}>
                Foods
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.searchModeButton, searchMode === 'recipes' && styles.searchModeButtonActive]}
              onPress={() => setSearchMode('recipes')}
            >
              <Ionicons name="restaurant-outline" size={16} color={searchMode === 'recipes' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.searchModeText, searchMode === 'recipes' && styles.searchModeTextActive]}>
                Recipes
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TouchableOpacity style={styles.barcodeButton} onPress={openBarcodeScanner}>
              <Ionicons name="barcode-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={searchMode === 'foods' ? 'Search foods...' : 'Search recipes...'}
                placeholderTextColor="#9CA3AF"
                value={currentQuery}
                onChangeText={(text) => {
                  setCurrentQuery(text);
                  if (text.trim()) {
                    setActiveTab('search');
                  }
                  debouncedSearch(text);
                }}
                autoFocus
              />
              {currentQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    setCurrentQuery('');
                    setSearchResults(null);
                    setSearchError(null);
                  }}
                >
                  <Ionicons name="close" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => setShowBasketModal(true)}
            >
              <Ionicons name="basket-outline" size={20} color="#6B7280" />
              {itemCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{itemCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          {renderTabBar()}
        </View>

        <FlatList
          style={styles.content}
          data={[]}
          keyExtractor={() => 'sections'}
          renderItem={() => null}
          ListHeaderComponent={() => {
            // Show search results when actively searching or have results
            if (activeTab === 'search') {
              return (
                <View>
                  {isSearching && (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Searching...</Text>
                    </View>
                  )}

                  {searchError && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>Error: {searchError}</Text>
                    </View>
                  )}

                  {searchResults && (
                    <>
                      {renderSection('Ingredients', searchResults.ingredients)}
                      {renderSection('Products', searchResults.products)}
                      {renderSection('Recipes', searchResults.recipes)}
                    </>
                  )}

                  {currentQuery === '' && (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>
                        Start typing to search for {searchMode === 'foods' ? 'foods' : 'recipes'}
                      </Text>
                      <Text style={styles.emptySubtext}>
                        {searchMode === 'foods'
                          ? 'Search for ingredients, products, or use the barcode scanner'
                          : 'Search for recipes by name, ingredients, or cuisine type'
                        }
                      </Text>
                    </View>
                  )}

                  {currentQuery !== '' && searchResults && searchResults.total === 0 && !isSearching && (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No results found</Text>
                      <Text style={styles.emptySubtext}>Try different keywords or scan a barcode</Text>
                    </View>
                  )}
                </View>
              );
            }

            // Show recents or favorites
            const tabData = getTabData();
            const tabTitle = activeTab === 'recents' ? 'Recent Foods' : 'Favorite Foods';
            const emptyMessage = activeTab === 'recents'
              ? 'No recent foods yet'
              : 'No favorite foods yet';
            const emptySubMessage = activeTab === 'recents'
              ? 'Foods you search for and add will appear here'
              : 'Star foods to add them to your favorites';

            return (
              <View>
                {tabData.length > 0 ? (
                  renderSection(tabTitle, tabData)
                ) : (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{emptyMessage}</Text>
                    <Text style={styles.emptySubtext}>{emptySubMessage}</Text>
                  </View>
                )}
              </View>
            );
          }}
        />

        <BarcodeScanner
          visible={showBarcodeScanner}
          onClose={() => setShowBarcodeScanner(false)}
          onProductFound={handleBarcodeProduct}
        />
        
        <FoodDetailModal
          visible={showFoodModal}
          food={selectedFood}
          onClose={handleCloseFoodModal}
          onAddToMeal={handleAddToMeal}
        />


        <MealBasketModal
          visible={showBasketModal}
          onClose={() => setShowBasketModal(false)}
        />
      </SafeAreaView>
    </FloatingChatBubbleWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
    alignSelf: 'center',
  },
  searchModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  searchModeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  searchModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  searchModeTextActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  barcodeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  cartButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  foodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodIcon: {
    fontSize: 24,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  foodNutrition: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  servingSize: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  foodSource: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: 10,
    color: '#F59E0B',
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 0,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});