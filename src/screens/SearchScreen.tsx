import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FoodLookupResult } from '../services/api/types';
import { useSearchStore } from '../stores/search-store';
import { useCart } from '../stores/cart-store';
import FoodDetailModal from '../components/organisms/FoodDetailModal';
import MealBasketModal from '../components/organisms/MealBasketModal';
// import BarcodeScanner from '../components/organisms/BarcodeScanner'; // Temporarily disabled until native modules are rebuilt

export default function SearchScreen() {
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodLookupResult | null>(null);
  const [showBasketModal, setShowBasketModal] = useState(false);
  
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
    getStarredByCategory
  } = useSearchStore();
  
  const { addToCart, itemCount } = useCart();

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
      const uniqueFoods = allFoods.reduce((acc, food) => {
        if (!acc.find(f => f.fdcId === food.fdcId)) {
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
      
      // Convert optimized USDA response to the format expected by our stores
      const foods: FoodLookupResult[] = optimizedFoods.map((food: any) => {
        const detailedFood = nutritionMap.get(food.fdcId);
        const nutrients = detailedFood?.foodNutrients || [];

        // Create display name with brand for branded foods
        const baseName = food.description || 'Unknown food';
        const brandName = food.brandOwner;
        const displayName = brandName ? `${baseName} - ${brandName}` : baseName;

        // Helper function to extract nutrient values by nutrient number (string)
        const getNutrientValue = (nutrientNumber: string): number => {
          const nutrient = nutrients.find((n: any) => n.nutrient?.number === nutrientNumber);
          return nutrient?.amount || 0;
        };

        return {
          fdcId: food.fdcId,
          description: displayName,
          brandOwner: brandName,
          dataType: food.dataType,
          foodCategory: food.foodCategory || 'ingredient',
          foodNutrients: nutrients.map((n: any) => ({
            nutrientId: n.nutrient?.id,
            nutrientNumber: n.nutrient?.number,
            nutrientName: n.nutrient?.name,
            value: n.amount || 0,
            unitName: n.nutrient?.unitName || 'g'
          })),
          ingredients: detailedFood?.ingredients,
          // Legacy format for backward compatibility
          id: `usda_${food.fdcId}`,
          name: displayName,
          brand: brandName,
          category: food.foodCategory || 'ingredient',
          nutrition: {
            per100g: {
              calories: getNutrientValue('208') || 0, // Energy (kcal)
              protein: getNutrientValue('203') || 0, // Protein
              carbs: getNutrientValue('205') || 0, // Carbs
              fat: getNutrientValue('204') || 0, // Fat
              fiber: getNutrientValue('291') || 0, // Fiber
            },
            servingSize: '100g'
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
  };

  // Helper function to extract nutrient values from USDA response
  const extractNutrient = (nutrients: any[], nutrientId: number): number => {
    const nutrient = nutrients?.find(n => n.nutrient?.id === nutrientId);
    return nutrient?.amount || 0;
  };

  const handleFoodItemClick = (food: FoodLookupResult) => {
    setSelectedFood(food);
    setShowFoodModal(true);
  };

  const handleCloseFoodModal = () => {
    setShowFoodModal(false);
    setSelectedFood(null);
  };

  const handleAddToMeal = (food: FoodLookupResult, quantity: number, unit: string) => {
    // Add to cart directly using the FoodLookupResult format
    addToCart(food, quantity, unit);

    console.log(`Added to meal: ${food.description} (${quantity} ${unit})`);
  };

  const handleAddToCart = (food: FoodLookupResult) => {
    // Add to cart directly using the FoodLookupResult format
    addToCart(food, 1, 'serving');

    console.log('Added to cart:', food.description);
  };

  const openBarcodeScanner = () => {
    // setShowBarcodeScanner(true); // Temporarily disabled
    alert('Barcode scanner will be available after rebuilding the app with native modules');
  };

  const handleBarcodeProduct = (product: FoodLookupResult) => {
    // This will be used when barcode scanner is implemented
    console.log('Barcode product found:', product.description);
  };

  const renderFoodItem = ({ item }: { item: FoodLookupResult }) => (
    <TouchableOpacity 
      style={styles.foodItem} 
      onPress={() => handleFoodItemClick(item)}
    >
      <View style={styles.foodIconContainer}>
        <Text style={styles.foodIcon}>{item.metadata?.foodIcon || '🍽️'}</Text>
      </View>
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.description}</Text>
        <Text style={styles.foodNutrition}>
          {Math.round(item.nutrition?.per100g?.calories || 0)} cal • {Math.round(item.nutrition?.per100g?.protein || 0)}g protein • {Math.round(item.nutrition?.per100g?.carbs || 0)}g carbs
        </Text>
        <Text style={styles.servingSize}>{item.nutrition?.servingSize || '100g'}</Text>
        <Text style={styles.foodSource}>Source: {item.source?.api || 'USDA'}</Text>
        {item.metadata?.warnings && item.metadata.warnings.length > 0 && (
          <Text style={styles.warningText}>⚠️ {item.metadata.warnings[0]}</Text>
        )}
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={(e) => {
          e.stopPropagation();
          handleAddToCart(item);
        }}
      >
        <Ionicons name="add" size={20} color="#4F46E5" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSection = (title: string, data: FoodLookupResult[]) => {
    if (!data || data.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item.fdcId?.toString() || item.id}
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
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <TouchableOpacity style={styles.barcodeButton} onPress={openBarcodeScanner}>
              <Ionicons name="barcode-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search foods..."
                placeholderTextColor="#9CA3AF"
                value={currentQuery}
                onChangeText={(text) => {
                  setCurrentQuery(text);
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
        </View>

        <FlatList
          style={styles.content}
          data={[]}
          keyExtractor={() => 'sections'}
          renderItem={() => null}
          ListHeaderComponent={() => (
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
                  {renderSection('Ingredients', searchResults.ingredients || [])}
                  {renderSection('Products', searchResults.products || [])}
                  {renderSection('Recipes', searchResults.recipes || [])}
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
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.emptySubtext}>Try different keywords or scan a barcode</Text>
                </View>
              )}
            </View>
          )}
        />

        {/* <BarcodeScanner
          visible={showBarcodeScanner}
          onClose={() => setShowBarcodeScanner(false)}
          onProductFound={handleBarcodeProduct}
        /> */}
        {/* Barcode scanner temporarily disabled until native modules are rebuilt */}
        
        <FoodDetailModal
          visible={showFoodModal}
          food={selectedFood}
          onClose={handleCloseFoodModal}
        />

        <MealBasketModal
          visible={showBasketModal}
          onClose={() => setShowBasketModal(false)}
        />
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  addButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4F46E5',
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