// src/components/molecules/QuickAddFoods.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodLookupResult } from '../../services/api/types';

interface QuickAddFoodsProps {
  onFoodSelect: (food: FoodLookupResult) => void;
  categoryFilter?: string;
}

interface QuickFood {
  id: string;
  name: string;
  emoji: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  commonPortions: Array<{ name: string; grams: number }>;
}

const QuickAddFoods: React.FC<QuickAddFoodsProps> = ({
  onFoodSelect,
  categoryFilter,
}) => {
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All', icon: '🍽️' },
    { id: 'proteins', name: 'Proteins', icon: '🥩' },
    { id: 'carbs', name: 'Carbs', icon: '🍞' },
    { id: 'fruits', name: 'Fruits', icon: '🍎' },
    { id: 'vegetables', name: 'Vegetables', icon: '🥬' },
    { id: 'dairy', name: 'Dairy', icon: '🥛' },
    { id: 'snacks', name: 'Snacks', icon: '🍿' },
  ];

  const quickFoods: QuickFood[] = [
    // Proteins
    {
      id: 'chicken_breast',
      name: 'Chicken Breast',
      emoji: '🐔',
      category: 'proteins',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      servingSize: '100g',
      commonPortions: [
        { name: 'Small breast', grams: 85 },
        { name: 'Medium breast', grams: 120 },
        { name: 'Large breast', grams: 150 },
      ],
    },
    {
      id: 'salmon',
      name: 'Salmon',
      emoji: '🐟',
      category: 'proteins',
      calories: 208,
      protein: 20,
      carbs: 0,
      fat: 13,
      servingSize: '100g',
      commonPortions: [
        { name: 'Fillet', grams: 140 },
        { name: 'Serving', grams: 85 },
      ],
    },
    {
      id: 'eggs',
      name: 'Eggs',
      emoji: '🥚',
      category: 'proteins',
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      servingSize: '100g',
      commonPortions: [
        { name: '1 large egg', grams: 50 },
        { name: '2 eggs', grams: 100 },
        { name: '3 eggs', grams: 150 },
      ],
    },

    // Carbs
    {
      id: 'brown_rice',
      name: 'Brown Rice',
      emoji: '🍚',
      category: 'carbs',
      calories: 111,
      protein: 2.6,
      carbs: 23,
      fat: 0.9,
      servingSize: '100g cooked',
      commonPortions: [
        { name: '1/2 cup cooked', grams: 90 },
        { name: '1 cup cooked', grams: 180 },
      ],
    },
    {
      id: 'oats',
      name: 'Oats',
      emoji: '🥣',
      category: 'carbs',
      calories: 389,
      protein: 16.9,
      carbs: 66.3,
      fat: 6.9,
      servingSize: '100g dry',
      commonPortions: [
        { name: '1/2 cup dry', grams: 40 },
        { name: '1 cup dry', grams: 80 },
      ],
    },
    {
      id: 'quinoa',
      name: 'Quinoa',
      emoji: '🌾',
      category: 'carbs',
      calories: 120,
      protein: 4.4,
      carbs: 22,
      fat: 1.9,
      servingSize: '100g cooked',
      commonPortions: [
        { name: '1/2 cup cooked', grams: 90 },
        { name: '1 cup cooked', grams: 180 },
      ],
    },

    // Fruits
    {
      id: 'banana',
      name: 'Banana',
      emoji: '🍌',
      category: 'fruits',
      calories: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      servingSize: '100g',
      commonPortions: [
        { name: 'Small banana', grams: 80 },
        { name: 'Medium banana', grams: 120 },
        { name: 'Large banana', grams: 140 },
      ],
    },
    {
      id: 'apple',
      name: 'Apple',
      emoji: '🍎',
      category: 'fruits',
      calories: 52,
      protein: 0.3,
      carbs: 14,
      fat: 0.2,
      servingSize: '100g',
      commonPortions: [
        { name: 'Small apple', grams: 140 },
        { name: 'Medium apple', grams: 180 },
        { name: 'Large apple', grams: 220 },
      ],
    },
    {
      id: 'blueberries',
      name: 'Blueberries',
      emoji: '🫐',
      category: 'fruits',
      calories: 57,
      protein: 0.7,
      carbs: 14,
      fat: 0.3,
      servingSize: '100g',
      commonPortions: [
        { name: '1/2 cup', grams: 75 },
        { name: '1 cup', grams: 150 },
      ],
    },

    // Vegetables
    {
      id: 'broccoli',
      name: 'Broccoli',
      emoji: '🥦',
      category: 'vegetables',
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      servingSize: '100g',
      commonPortions: [
        { name: '1 cup chopped', grams: 90 },
        { name: '1 spear', grams: 30 },
      ],
    },
    {
      id: 'spinach',
      name: 'Spinach',
      emoji: '🥬',
      category: 'vegetables',
      calories: 23,
      protein: 2.9,
      carbs: 3.6,
      fat: 0.4,
      servingSize: '100g',
      commonPortions: [
        { name: '1 cup fresh', grams: 30 },
        { name: '1 cup cooked', grams: 180 },
      ],
    },

    // Dairy
    {
      id: 'greek_yogurt',
      name: 'Greek Yogurt',
      emoji: '🥛',
      category: 'dairy',
      calories: 59,
      protein: 10,
      carbs: 3.6,
      fat: 0.4,
      servingSize: '100g',
      commonPortions: [
        { name: 'Small container', grams: 150 },
        { name: 'Large container', grams: 200 },
      ],
    },
    {
      id: 'milk',
      name: 'Milk (2%)',
      emoji: '🥛',
      category: 'dairy',
      calories: 50,
      protein: 3.3,
      carbs: 5,
      fat: 2,
      servingSize: '100ml',
      commonPortions: [
        { name: '1 cup', grams: 240 },
        { name: '1/2 cup', grams: 120 },
      ],
    },

    // Snacks
    {
      id: 'almonds',
      name: 'Almonds',
      emoji: '🥜',
      category: 'snacks',
      calories: 579,
      protein: 21,
      carbs: 22,
      fat: 50,
      servingSize: '100g',
      commonPortions: [
        { name: '1 oz (23 almonds)', grams: 28 },
        { name: 'Small handful', grams: 15 },
      ],
    },
    {
      id: 'dark_chocolate',
      name: 'Dark Chocolate',
      emoji: '🍫',
      category: 'snacks',
      calories: 546,
      protein: 7.9,
      carbs: 61,
      fat: 31,
      servingSize: '100g',
      commonPortions: [
        { name: '1 square', grams: 10 },
        { name: '1 oz', grams: 28 },
      ],
    },
  ];

  const filteredFoods = quickFoods.filter(food => {
    const matchesCategory = selectedCategory === 'all' || food.category === selectedCategory;
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const convertToFoodLookupResult = (quickFood: QuickFood): FoodLookupResult => ({
    id: quickFood.id,
    name: quickFood.name,
    category: 'quick-add',
    nutrition: {
      per100g: {
        calories: quickFood.calories,
        protein: quickFood.protein,
        carbs: quickFood.carbs,
        fat: quickFood.fat,
        fiber: 0,
      },
      servingSize: quickFood.servingSize,
    },
    source: {
      api: 'quick-add',
      id: quickFood.id,
      lastUpdated: new Date().toISOString(),
    },
    metadata: {
      confidence: 1.0,
      warnings: [],
      foodIcon: quickFood.emoji,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Add</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search foods..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor="#9CA3AF"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Text style={styles.categoryEmoji}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.foodsList} showsVerticalScrollIndicator={false}>
        {filteredFoods.map((food) => (
          <TouchableOpacity
            key={food.id}
            style={styles.foodItem}
            onPress={() => onFoodSelect(convertToFoodLookupResult(food))}
          >
            <View style={styles.foodIconContainer}>
              <Text style={styles.foodIcon}>{food.emoji}</Text>
            </View>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.foodServing}>{food.servingSize}</Text>
              <View style={styles.macroRow}>
                <Text style={styles.macroText}>{food.calories} cal</Text>
                <Text style={styles.macroText}>P: {food.protein}g</Text>
                <Text style={styles.macroText}>C: {food.carbs}g</Text>
                <Text style={styles.macroText}>F: {food.fat}g</Text>
              </View>
            </View>
            <View style={styles.addButtonContainer}>
              <TouchableOpacity style={styles.addButton}>
                <Ionicons name="add" size={20} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContainer: {
    gap: 8,
  },
  categoryButton: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    minWidth: 60,
  },
  categoryButtonActive: {
    backgroundColor: '#4F46E5',
  },
  categoryEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  foodsList: {
    flex: 1,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  foodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  foodIcon: {
    fontSize: 20,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  foodServing: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  addButtonContainer: {
    marginLeft: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default QuickAddFoods;