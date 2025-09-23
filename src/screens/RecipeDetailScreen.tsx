// src/screens/RecipeDetailScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Recipe } from '@/types/recipe';
import { spoonacularClient } from '@/services/api/spoonacular-client';
import { useSearchStore } from '@/stores/search-store';
import { detectRecipeConflicts, getConflictSummary } from '@/services/recipes/conflict-detector';
import { useUserStore } from '@/stores/user-store';

type RootStackParamList = {
  RecipeDetail: {
    recipeId: number;
    recipe?: Recipe; // Optional: if we already have basic recipe data
  };
};

type RecipeDetailRouteProp = RouteProp<RootStackParamList, 'RecipeDetail'>;
type RecipeDetailNavigationProp = StackNavigationProp<RootStackParamList>;

export default function RecipeDetailScreen() {
  const route = useRoute<RecipeDetailRouteProp>();
  const navigation = useNavigation<RecipeDetailNavigationProp>();
  const { recipeId, recipe: initialRecipe } = route.params;

  const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe || null);
  const [loading, setLoading] = useState(!initialRecipe);
  const [error, setError] = useState<string | null>(null);

  const { isFavorite, addToFavorites, removeFromFavorites } = useSearchStore();
  const { dietaryPreferences } = useUserStore();

  const isRecipeStarred = recipe ? isFavorite(recipe.id.toString()) : false;

  useEffect(() => {
    if (!initialRecipe) {
      fetchRecipeDetails();
    }
  }, [recipeId, initialRecipe]);

  const fetchRecipeDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const detailedRecipe = await spoonacularClient.getRecipeInfo(recipeId);
      setRecipe(detailedRecipe);
    } catch (err) {
      console.error('Failed to fetch recipe details:', err);
      setError('Failed to load recipe details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!recipe) return;

    if (isRecipeStarred) {
      await removeFromFavorites(recipe.id.toString());
    } else {
      await addToFavorites(recipe, 'recipe', 'favorite');
    }
  };

  const handleShare = () => {
    if (!recipe) return;
    Alert.alert('Share Recipe', `Share "${recipe.title}" feature coming soon!`);
  };

  const handleAddToMealPlan = () => {
    if (!recipe) return;
    Alert.alert('Add to Meal Plan', `Add "${recipe.title}" to meal plan feature coming soon!`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorTitle}>Unable to Load Recipe</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchRecipeDetails}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Check for dietary conflicts
  const conflicts = detectRecipeConflicts(recipe, dietaryPreferences);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
        >
          <Ionicons
            name={isRecipeStarred ? "heart" : "heart-outline"}
            size={24}
            color={isRecipeStarred ? "#EF4444" : "#6B7280"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {recipe.image && (
          <Image
            source={{ uri: recipe.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        {/* Basic Info */}
        <View style={styles.basicInfo}>
          <Text style={styles.recipeTitle} numberOfLines={3}>
            {recipe.title}
          </Text>

          <View style={styles.metaInfo}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={20} color="#6B7280" />
              <Text style={styles.metaText}>{recipe.readyInMinutes || 0} min</Text>
            </View>

            {recipe.servings && (
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={20} color="#6B7280" />
                <Text style={styles.metaText}>{recipe.servings} servings</Text>
              </View>
            )}

            {recipe.healthScore && (
              <View style={styles.metaItem}>
                <Ionicons name="fitness-outline" size={20} color="#10B981" />
                <Text style={[styles.metaText, { color: '#10B981' }]}>
                  {recipe.healthScore}% healthy
                </Text>
              </View>
            )}
          </View>

          {/* Dietary Conflicts Warning */}
          {conflicts.hasConflicts && (
            <View style={styles.conflictWarning}>
              <Ionicons name="warning" size={20} color="#EF4444" />
              <Text style={styles.conflictText}>
                {getConflictSummary(conflicts)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#6366F1" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleAddToMealPlan}>
            <Ionicons name="calendar-outline" size={20} color="#6366F1" />
            <Text style={styles.actionButtonText}>Add to Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Nutrition Summary */}
        {recipe.nutrition && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(recipe.nutrition.per_serving?.calories || 0)}
                </Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(recipe.nutrition.per_serving?.protein || 0)}g
                </Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(recipe.nutrition.per_serving?.carbs || 0)}g
                </Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>
                  {Math.round(recipe.nutrition.per_serving?.fat || 0)}g
                </Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>
        )}

        {/* Ingredients */}
        {recipe.extendedIngredients && recipe.extendedIngredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Ingredients ({recipe.extendedIngredients.length})
            </Text>
            {recipe.extendedIngredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText} numberOfLines={2}>
                  {ingredient.original || `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        {recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.analyzedInstructions[0]?.steps?.map((step, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                <Text style={styles.instructionText}>
                  {step.step}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Dietary Tags */}
        {(recipe.diets && recipe.diets.length > 0) ||
         (recipe.dishTypes && recipe.dishTypes.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>

            {recipe.diets && recipe.diets.length > 0 && (
              <View style={styles.tagContainer}>
                <Text style={styles.tagLabel}>Diets:</Text>
                <View style={styles.tags}>
                  {recipe.diets.map((diet, index) => (
                    <View key={index} style={[styles.tag, styles.dietTag]}>
                      <Text style={styles.tagText}>{diet}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {recipe.dishTypes && recipe.dishTypes.length > 0 && (
              <View style={styles.tagContainer}>
                <Text style={styles.tagLabel}>Dish Types:</Text>
                <View style={styles.tags}>
                  {recipe.dishTypes.map((type, index) => (
                    <View key={index} style={[styles.tag, styles.dishTypeTag]}>
                      <Text style={styles.tagText}>{type}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  favoriteButton: {
    padding: 8,
    marginRight: -8,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  basicInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 32,
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  conflictWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  conflictText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  ingredientBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
    marginTop: 8,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  tagContainer: {
    marginBottom: 16,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dietTag: {
    backgroundColor: '#ECFDF5',
  },
  dishTypeTag: {
    backgroundColor: '#F0F9FF',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
  },
  bottomSpacing: {
    height: 32,
  },
});