import React, { useState, useEffect } from 'react';
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
import { useSearchStore } from '../stores/search-store';
import { useCart } from '../stores/cart-store';
// import BarcodeScanner from '../components/organisms/BarcodeScanner'; // Temporarily disabled until native modules are rebuilt
import { FloatingChatBubbleWrapper } from '../components/atoms/FloatingChatBubble';

export default function SearchScreen() {
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  
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

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Direct USDA API call to bypass complex service layers
      const apiKey = process.env.EXPO_PUBLIC_USDA_API_KEY;
      if (!apiKey) {
        throw new Error('USDA API key not configured');
      }

      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}&query=${query.trim()}&pageSize=10`
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('USDA API response:', data); // Debug log
      
      // Convert USDA response to our FoodLookupResult format
      const foods: FoodLookupResult[] = (data.foods || []).slice(0, 10).map((food: any) => ({
        id: `usda_${food.fdcId}`,
        name: food.description || 'Unknown food',
        brand: food.brandOwner,
        category: food.foodCategory || 'ingredient',
        nutrition: {
          per100g: {
            calories: extractNutrient(food.foodNutrients, 1008) || 0, // Energy
            protein: extractNutrient(food.foodNutrients, 1003) || 0, // Protein
            carbs: extractNutrient(food.foodNutrients, 1005) || 0, // Carbs
            fat: extractNutrient(food.foodNutrients, 1004) || 0, // Fat
            fiber: extractNutrient(food.foodNutrients, 1079) || 0, // Fiber
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
      }));
      
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

  const handleAddToCart = (food: FoodLookupResult) => {
    // Convert FoodLookupResult to the format expected by stores
    const convertedFood = {
      id: food.id,
      name: food.name,
      calories: food.nutrition.per100g.calories,
      protein: food.nutrition.per100g.protein,
      carbs: food.nutrition.per100g.carbs,
      fat: food.nutrition.per100g.fat,
      fiber: food.nutrition.per100g.fiber,
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
    // setShowBarcodeScanner(true); // Temporarily disabled
    alert('Barcode scanner will be available after rebuilding the app with native modules');
  };

  const handleBarcodeProduct = (product: FoodLookupResult) => {
    // Convert and add to recent foods
    const convertedFood = {
      id: product.id,
      name: product.name,
      calories: product.nutrition.per100g.calories,
      protein: product.nutrition.per100g.protein,
      carbs: product.nutrition.per100g.carbs,
      fat: product.nutrition.per100g.fat,
      fiber: product.nutrition.per100g.fiber,
      serving_size: product.nutrition.servingSize || '100g',
      source: product.source.api,
      category: 'ingredient',
      confidence: 1
    };
    addRecentFood(convertedFood);
  };

  const renderFoodItem = ({ item }: { item: FoodLookupResult }) => (
    <TouchableOpacity 
      style={styles.foodItem} 
      onPress={() => handleAddToCart(item)}
    >
      {item.metadata?.image && (
        <Image source={{ uri: item.metadata.image }} style={styles.foodImage} />
      )}
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodNutrition}>
          {item.nutrition.per100g.calories} cal • {item.nutrition.per100g.protein}g protein • {item.nutrition.per100g.carbs}g carbs
        </Text>
        <Text style={styles.servingSize}>{item.nutrition.servingSize || '100g'}</Text>
        <Text style={styles.foodSource}>Source: {item.source.api}</Text>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => handleAddToCart(item)}
      >
        <Ionicons name="add" size={20} color="#4F46E5" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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

  // const recentFoodsList = getRecentFoods(5).map(recent => recent.food);
  // const starredFoodsList = getStarredByCategory().map(starred => starred.food);

  return (
    <FloatingChatBubbleWrapper>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <TouchableOpacity style={styles.barcodeButton} onPress={openBarcodeScanner}>
              <Ionicons name="barcode-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
            <TextInput
              style={styles.searchInput}
              placeholder="Search foods..."
              placeholderTextColor="#9CA3AF"
              value={currentQuery}
              onChangeText={(text) => {
                setCurrentQuery(text);
                handleSearch(text);
              }}
              autoFocus
            />
            <TouchableOpacity style={styles.cartButton}>
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
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F3F4F6',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
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
  foodImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
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