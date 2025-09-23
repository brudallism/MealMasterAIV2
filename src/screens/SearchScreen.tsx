import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FoodLookupResult } from '../services/api/types';
import { Recipe } from '@/types/recipe';
import { useSearchStore } from '../stores/search-store';
import { useUserStore } from '@/stores/user-store';
import { useCart } from '../stores/cart-store';
import { spoonacularClient } from '@/services/api/spoonacular-client';
import FoodDetailModal from '../components/organisms/FoodDetailModal';
import MealBasketModal from '../components/organisms/MealBasketModal';
import BarcodeScanner from '../components/organisms/BarcodeScanner';
// import { FloatingChatBubbleWrapper } from '../components/atoms/FloatingChatBubble'; // Temporarily disabled until AI layer is ready
import { RecipeOverrideModal } from '@/components/modals/RecipeOverrideModal';
import { detectRecipeConflicts, shouldShowOverrideWarning } from '@/services/recipes/conflict-detector';

type RootStackParamList = {
  RecipeDetail: {
    recipeId: number;
    recipe?: Recipe;
  };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function SearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodLookupResult | null>(null);
  const [showBasketModal, setShowBasketModal] = useState(false);
  const [wasOpenedFromBarcode, setWasOpenedFromBarcode] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'recents' | 'favorites'>('search');
  const [searchMode, setSearchMode] = useState<'foods' | 'recipes'>('foods');
  const [recipeResults, setRecipeResults] = useState<Recipe[]>([]);
  const [isSearchingRecipes, setIsSearchingRecipes] = useState(false);
  const [recipeSearchError, setRecipeSearchError] = useState<string | null>(null);

  // Recipe filter state
  const [recipeFilters, setRecipeFilters] = useState({
    maxReadyTime: undefined as number | undefined,
    maxIngredients: undefined as number | undefined,
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Recipe override modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeConflicts, setRecipeConflicts] = useState({
    allergies: [],
    excludedIngredients: [],
    dietConflicts: [],
  });
  
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
    starredFoods,
    getRecentFoods,
    getStarredByCategory,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    getFavoritesByType
  } = useSearchStore();

  const { dietaryPreferences } = useUserStore();
  const { addToCart, itemCount } = useCart();

  // Pre-compute starred state maps to avoid store access during rendering
  const starredFoodsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    starredFoods.forEach(starred => {
      map.set(starred.food.id, true);
    });
    return map;
  }, [starredFoods]);

  // Temporarily disable starred recipes to isolate hooks error
  const starredRecipesMap = useMemo(() => {
    return new Map<string, boolean>();
  }, []);

  // Temporarily disabled conflict computation to isolate hooks error
  // const recipeConflictsMap = useMemo(() => {
  //   const map = new Map<string, { hasWarning: boolean; conflicts: any }>();
  //   if (recipeResults && dietaryPreferences) {
  //     recipeResults.forEach(recipe => {
  //       const hasWarning = shouldShowOverrideWarning(recipe, dietaryPreferences);
  //       const conflicts = hasWarning ? detectRecipeConflicts(recipe, dietaryPreferences) : null;
  //       map.set(recipe.id.toString(), { hasWarning, conflicts });
  //     });
  //   }
  //   return map;
  // }, [recipeResults, dietaryPreferences]);

  // Request cancellation for race condition prevention
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      if (searchMode === 'foods') {
        handleSearch(query);
      } else {
        handleRecipeSearch(query);
      }
    }, 400); // Wait 400ms after user stops typing
  }, [searchMode]);

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

  const handleSearch = useCallback(async (query: string) => {
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
    const signal = abortControllerRef.current.signal;

    setIsSearching(true);
    setSearchError(null);
    
    try {
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
          `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${encodeURIComponent(queryVariation)}&pageSize=20`,
          { signal }
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
        const searchResults = {
          ingredients: [],
          products: [],
          recipes: [],
          total: 0,
          fromCache: false,
          searchTime: 0
        };
        
        setSearchResults(searchResults);
        addToSearchHistory(query, 0);
        return;
      }
      
      // Apply optimization with Foundation food prioritization and cooked/raw logic
      const optimizedFoods = optimizeResults(uniqueFoods, normalizedQuery);
      
      // Get the food IDs for detailed nutrition lookup
      const foodIds = optimizedFoods.map((food: any) => food.fdcId);
      
      if (foodIds.length === 0) {
        const searchResults = {
          ingredients: [],
          products: [],
          recipes: [],
          total: 0,
          fromCache: false,
          searchTime: 0
        };
        
        setSearchResults(searchResults);
        addToSearchHistory(query, 0);
        return;
      }
      
      // Get detailed nutrition data for all foods in one request
      const nutritionResponse = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods?api_key=${apiKey}&fdcIds=${foodIds.join(',')}`,
        { signal }
      );
      
      if (!nutritionResponse.ok) {
        throw new Error(`Nutrition API request failed: ${nutritionResponse.status}`);
      }
      
      const nutritionData = await nutritionResponse.json();
      console.log('USDA Nutrition API response:', nutritionData.length, 'foods with detailed nutrition'); // Debug log
      
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
      
      // Convert to the format the UI expects
      const searchResults = {
        ingredients: foods,
        products: [],
        recipes: [],
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
  }, [setSearchResults, setIsSearching, setSearchError, addToSearchHistory, addRecentFood]);

  // Recipe search function
  const handleRecipeSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setRecipeResults([]);
      setIsSearchingRecipes(false);
      return;
    }

    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsSearchingRecipes(true);
    setRecipeSearchError(null);

    try {
      console.log('[SearchScreen] Searching recipes for:', query, 'with filters:', recipeFilters);

      // Merge dietary preferences with session-based filters
      const searchOptions = {
        query,
        number: 12,
        offset: 0,
        maxReadyTime: recipeFilters.maxReadyTime,
        maxIngredients: recipeFilters.maxIngredients,
      };

      const recipes = await spoonacularClient.searchRecipes(dietaryPreferences, searchOptions);

      console.log('[SearchScreen] Recipe search results:', recipes.length, 'recipes found');
      setRecipeResults(recipes);
      addToSearchHistory(`recipes: ${query}`, recipes.length);

    } catch (error) {
      // Don't show errors for aborted requests
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[SearchScreen] Recipe search aborted - user typed more');
        return;
      }

      console.error('Recipe search error:', error);
      setRecipeSearchError(error instanceof Error ? error.message : 'Recipe search failed');
      setRecipeResults([]);
    } finally {
      setIsSearchingRecipes(false);
    }
  }, [setRecipeResults, setIsSearchingRecipes, setRecipeSearchError, recipeFilters, dietaryPreferences]);

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
    setSelectedFood(food);
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

  const handleAddToMeal = (food: FoodLookupResult, quantity: number, unit: string) => {
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
    
    // Add to cart with specified serving
    addToCart(convertedFood, quantity, unit);

    console.log(`Added to meal: ${food.name} (${quantity} ${unit})`);

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

    // Close barcode scanner and show food detail modal
    setShowBarcodeScanner(false);
    setSelectedFood(product);
    setShowFoodModal(true);
    setWasOpenedFromBarcode(true); // Mark that this was opened from barcode scanner

    console.log('✅ Modal state updated - scanner closed, food modal opened');
  };

  const renderFoodItem = useCallback(({ item }: { item: FoodLookupResult }) => {
    const isItemStarred = starredFoodsMap.get(item.id) || false;

    const handleToggleStar = async (e: any) => {
      e.stopPropagation();
      // Convert back to MealItem format for the store
      const mealItem = {
        id: item.id,
        name: item.name,
        calories: item.nutrition.per100g.calories,
        protein: item.nutrition.per100g.protein,
        carbs: item.nutrition.per100g.carbs,
        fat: item.nutrition.per100g.fat,
        fiber: item.nutrition.per100g.fiber,
        serving_size: item.nutrition.servingSize,
        source: item.source.api,
        category: item.category,
        confidence: item.metadata.confidence
      };
      await toggleStarred(mealItem);
    };

    return (
      <TouchableOpacity
        style={styles.foodItem}
        onPress={() => handleFoodItemClick(item)}
      >
        <View style={styles.foodIconContainer}>
          <Text style={styles.foodIcon}>{item.metadata?.foodIcon || '🍽️'}</Text>
        </View>
        <View style={styles.foodInfo}>
          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodNutrition}>
            {Math.round(item.nutrition.per100g.calories || 0)} cal • {Math.round(item.nutrition.per100g.protein || 0)}g protein • {Math.round(item.nutrition.per100g.carbs || 0)}g carbs
          </Text>
          <Text style={styles.servingSize}>{item.nutrition.servingSize || '100g'}</Text>
          <Text style={styles.foodSource}>Source: {item.source.api}</Text>
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
  }, [starredFoodsMap, toggleStarred, convertMealItemToFoodLookupResult]);

  // Separate component for recipe metrics with React Native engine workarounds
  const RecipeMetrics = React.memo(({ recipe }: { recipe: Recipe }) => {
    // Extra defensive programming for React Native text rendering issues
    const readyTime = React.useMemo(() => {
      const time = recipe.readyInMinutes;
      return typeof time === 'number' && !isNaN(time) && time >= 0 ? time : 0;
    }, [recipe.readyInMinutes]);

    const servings = React.useMemo(() => {
      const srv = recipe.servings;
      return typeof srv === 'number' && !isNaN(srv) && srv > 0 ? srv : null;
    }, [recipe.servings]);

    const healthScore = React.useMemo(() => {
      const score = recipe.healthScore;
      return typeof score === 'number' && !isNaN(score) && score >= 0 ? score : null;
    }, [recipe.healthScore]);

    return (
      <View style={styles.recipeMetrics}>
        <View style={styles.recipeMetric}>
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text style={styles.recipeMetricText} numberOfLines={1}>
            {readyTime}min
          </Text>
        </View>
        {servings && (
          <View style={styles.recipeMetric}>
            <Ionicons name="people-outline" size={14} color="#6B7280" />
            <Text style={styles.recipeMetricText} numberOfLines={1}>
              {servings} servings
            </Text>
          </View>
        )}
        {healthScore && (
          <View style={styles.recipeMetric}>
            <Ionicons name="fitness-outline" size={14} color="#10B981" />
            <Text style={[styles.recipeMetricText, { color: '#10B981' }]} numberOfLines={1}>
              {healthScore}% healthy
            </Text>
          </View>
        )}
      </View>
    );
  });

  const renderRecipeItem = useCallback(({ item }: { item: Recipe }) => {
    const isItemStarred = starredRecipesMap.get(item.id.toString()) || false;

    const handleToggleRecipeStar = async (e: any) => {
      e.stopPropagation();
      const recipeId = item.id.toString();

      if (isItemStarred) {
        // Remove from favorites
        await removeFromFavorites(recipeId);
      } else {
        // Add to favorites using the proper API for recipes
        await addToFavorites(item, 'recipe', 'favorite');
      }
    };

    const handleRecipePress = () => {
      // Temporarily disabled conflict checking to isolate hooks error
      // const conflictData = recipeConflictsMap.get(item.id.toString());
      // if (conflictData?.hasWarning) {
      //   setSelectedRecipe(item);
      //   setRecipeConflicts(conflictData.conflicts);
      //   setShowOverrideModal(true);
      // } else {
        // No conflicts, proceed directly to recipe detail
        console.log('Recipe pressed (no conflicts):', item.title);
        navigation.navigate('RecipeDetail', {
          recipeId: item.id,
          recipe: item, // Pass the existing recipe data to avoid re-fetching basic info
        });
      // }
    };

    // Safely extract title and dishTypes with simple JavaScript (no hooks allowed in render functions)
    const title = item.title;
    const recipeTitle = typeof title === 'string' && title.length > 0 ? title : 'Untitled Recipe';

    const dishTypes = (!item.dishTypes || !Array.isArray(item.dishTypes) || item.dishTypes.length === 0)
      ? ''
      : item.dishTypes
          .slice(0, 2)
          .filter(type => typeof type === 'string' && type.length > 0)
          .join(', ');

    return (
      <TouchableOpacity
        style={styles.recipeItem}
        onPress={handleRecipePress}
      >
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeName} numberOfLines={2}>
            {recipeTitle}
          </Text>
          <RecipeMetrics recipe={item} />
          {dishTypes && (
            <Text style={styles.recipeDishTypes} numberOfLines={1}>
              {dishTypes}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.starButton}
          onPress={handleToggleRecipeStar}
        >
          <Ionicons
            name={isItemStarred ? "star" : "star-outline"}
            size={20}
            color={isItemStarred ? "#F59E0B" : "#6B7280"}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [starredRecipesMap, addToFavorites, removeFromFavorites, navigation]);

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

  const renderRecipeSection = (title: string, data: Recipe[]) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <FlatList
          data={data}
          keyExtractor={(item, index) => `recipe-${item.id || index}`}
          renderItem={renderRecipeItem}
          scrollEnabled={false}
          removeClippedSubviews={false}
        />
      </View>
    );
  };

  // Render quick filter buttons for recipe search
  const renderQuickFilters = () => {
    if (searchMode !== 'recipes') return null;

    const timeOptions = [
      { value: 15, label: '15min', description: 'Quick meals' },
      { value: 30, label: '30min', description: 'Fast cooking' },
      { value: 60, label: '1hr', description: 'Standard' },
    ];

    const complexityOptions = [
      { value: 5, label: 'Simple', description: '≤5 ingredients' },
      { value: 10, label: 'Easy', description: '≤10 ingredients' },
      { value: 15, label: 'Medium', description: '≤15 ingredients' },
    ];

    return (
      <View style={styles.filtersContainer}>
        {/* Quick Time Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>🕐 Max Time:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !recipeFilters.maxReadyTime && styles.filterChipActive
              ]}
              onPress={() => setRecipeFilters(prev => ({ ...prev, maxReadyTime: undefined }))}
            >
              <Text style={[
                styles.filterChipText,
                !recipeFilters.maxReadyTime && styles.filterChipTextActive
              ]}>
                Any
              </Text>
            </TouchableOpacity>
            {timeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterChip,
                  recipeFilters.maxReadyTime === option.value && styles.filterChipActive
                ]}
                onPress={() => setRecipeFilters(prev => ({ ...prev, maxReadyTime: option.value }))}
              >
                <Text style={[
                  styles.filterChipText,
                  recipeFilters.maxReadyTime === option.value && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Complexity Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>📝 Complexity:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !recipeFilters.maxIngredients && styles.filterChipActive
              ]}
              onPress={() => setRecipeFilters(prev => ({ ...prev, maxIngredients: undefined }))}
            >
              <Text style={[
                styles.filterChipText,
                !recipeFilters.maxIngredients && styles.filterChipTextActive
              ]}>
                Any
              </Text>
            </TouchableOpacity>
            {complexityOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterChip,
                  recipeFilters.maxIngredients === option.value && styles.filterChipActive
                ]}
                onPress={() => setRecipeFilters(prev => ({ ...prev, maxIngredients: option.value }))}
              >
                <Text style={[
                  styles.filterChipText,
                  recipeFilters.maxIngredients === option.value && styles.filterChipTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Active Filters Display */}
        {(recipeFilters.maxReadyTime || recipeFilters.maxIngredients) && (
          <View style={styles.activeFiltersContainer}>
            <Text style={styles.activeFiltersLabel}>Active filters:</Text>
            <View style={styles.activeFilters}>
              {recipeFilters.maxReadyTime && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>≤{recipeFilters.maxReadyTime}min</Text>
                  <TouchableOpacity
                    onPress={() => setRecipeFilters(prev => ({ ...prev, maxReadyTime: undefined }))}
                  >
                    <Ionicons name="close" size={14} color="#6366F1" />
                  </TouchableOpacity>
                </View>
              )}
              {recipeFilters.maxIngredients && (
                <View style={styles.activeFilter}>
                  <Text style={styles.activeFilterText}>≤{recipeFilters.maxIngredients} ingredients</Text>
                  <TouchableOpacity
                    onPress={() => setRecipeFilters(prev => ({ ...prev, maxIngredients: undefined }))}
                  >
                    <Ionicons name="close" size={14} color="#6366F1" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  // Handle recipe override confirmation
  const handleRecipeOverride = (reason: string) => {
    if (!selectedRecipe) return;

    console.log('Recipe override confirmed:', selectedRecipe.title, 'Reason:', reason);

    // Add to favorites (as specified in the design)
    const favoriteItem = {
      id: selectedRecipe.id.toString(),
      type: 'recipe' as const,
      recipe: selectedRecipe
    };
    toggleStarred(favoriteItem);

    // Navigate to recipe detail screen
    navigation.navigate('RecipeDetail', {
      recipeId: selectedRecipe.id,
      recipe: selectedRecipe,
    });

    // Close modal
    setShowOverrideModal(false);
    setSelectedRecipe(null);
    setRecipeConflicts({ allergies: [], excludedIngredients: [], dietConflicts: [] });
  };

  const handleRecipeOverrideCancel = () => {
    setShowOverrideModal(false);
    setSelectedRecipe(null);
    setRecipeConflicts({ allergies: [], excludedIngredients: [], dietConflicts: [] });
  };

  // Re-search when recipe filters change
  useEffect(() => {
    if (searchMode === 'recipes' && currentQuery.trim()) {
      debouncedSearch(currentQuery);
    }
  }, [recipeFilters.maxReadyTime, recipeFilters.maxIngredients]);

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
    <React.Fragment>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          {/* Search Mode Toggle */}
          <View style={styles.searchModeContainer}>
            <TouchableOpacity
              style={[styles.searchModeButton, searchMode === 'foods' && styles.searchModeActive]}
              onPress={() => {
                setSearchMode('foods');
                // Clear results when switching modes
                setRecipeResults([]);
                setRecipeSearchError(null);
                if (currentQuery.trim()) {
                  setActiveTab('search');
                  debouncedSearch(currentQuery);
                }
              }}
            >
              <Ionicons
                name="nutrition"
                size={16}
                color={searchMode === 'foods' ? '#FFFFFF' : '#6B7280'}
              />
              <Text style={[
                styles.searchModeText,
                searchMode === 'foods' && styles.searchModeActiveText
              ]}>
                Foods
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.searchModeButton, searchMode === 'recipes' && styles.searchModeActive]}
              onPress={() => {
                setSearchMode('recipes');
                // Clear results when switching modes
                setSearchResults(null);
                setSearchError(null);
                if (currentQuery.trim()) {
                  setActiveTab('search');
                  debouncedSearch(currentQuery);
                }
              }}
            >
              <Ionicons
                name="restaurant"
                size={16}
                color={searchMode === 'recipes' ? '#FFFFFF' : '#6B7280'}
              />
              <Text style={[
                styles.searchModeText,
                searchMode === 'recipes' && styles.searchModeActiveText
              ]}>
                Recipes
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            {searchMode === 'foods' && (
              <TouchableOpacity style={styles.barcodeButton} onPress={openBarcodeScanner}>
                <Ionicons name="barcode-outline" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder={searchMode === 'foods' ? "Search foods..." : "Search recipes..."}
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
                    setRecipeResults([]);
                    setRecipeSearchError(null);
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
          {renderQuickFilters()}
        </View>

        <FlatList
          style={styles.content}
          data={[]}
          keyExtractor={() => 'sections'}
          renderItem={() => null}
          ListHeaderComponent={() => {
            // Show search results when actively searching or have results
            if (activeTab === 'search') {
              if (searchMode === 'foods') {
                return (
                  <View>
                    {isSearching && (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Searching foods...</Text>
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
                        <Text style={styles.emptyText}>Start typing to search for foods</Text>
                        <Text style={styles.emptySubtext}>Search for ingredients, products, or use the barcode scanner</Text>
                      </View>
                    )}

                    {currentQuery !== '' && searchResults && searchResults.total === 0 && !isSearching && (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No food results found</Text>
                        <Text style={styles.emptySubtext}>Try different keywords or scan a barcode</Text>
                      </View>
                    )}
                  </View>
                );
              } else {
                // Recipe search mode
                return (
                  <View>
                    {isSearchingRecipes && (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Searching recipes...</Text>
                      </View>
                    )}

                    {recipeSearchError && (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Error: {recipeSearchError}</Text>
                      </View>
                    )}

                    {recipeResults.length > 0 && (
                      <>
                        {renderRecipeSection('Recipes', recipeResults)}
                      </>
                    )}

                    {currentQuery === '' && (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Start typing to search for recipes</Text>
                        <Text style={styles.emptySubtext}>Find recipes based on your dietary preferences</Text>
                      </View>
                    )}

                    {currentQuery !== '' && recipeResults.length === 0 && !isSearchingRecipes && !recipeSearchError && (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No recipe results found</Text>
                        <Text style={styles.emptySubtext}>Try different keywords or check your dietary settings</Text>
                      </View>
                    )}
                  </View>
                );
              }
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

        {/* Temporarily disabled RecipeOverrideModal to isolate hooks error */}
        {/* <RecipeOverrideModal
          visible={showOverrideModal}
          recipe={selectedRecipe}
          conflicts={recipeConflicts}
          onConfirm={handleRecipeOverride}
          onCancel={handleRecipeOverrideCancel}
        /> */}
      </SafeAreaView>
    </React.Fragment>
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
  },
  searchModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  searchModeActive: {
    backgroundColor: '#6366F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  searchModeActiveText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  recipeInfo: {
    flex: 1,
    paddingRight: 8,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 6,
    lineHeight: 20,
  },
  recipeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  recipeMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recipeMetricText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  recipeDishTypes: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textTransform: 'capitalize',
  },
  filtersContainer: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  activeFiltersContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  activeFiltersLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  activeFilters: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 4,
    gap: 4,
  },
  activeFilterText: {
    fontSize: 11,
    color: '#6366F1',
    fontWeight: '500',
  },
});