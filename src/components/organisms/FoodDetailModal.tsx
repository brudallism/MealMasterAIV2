// src/components/organisms/FoodDetailModal.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodLookupResult } from '../../services/api/types';
import { useCart } from '../../stores/cart-store';
import { colors, typography, spacing, borderRadius, shadows } from '../../utils/theme';

interface FoodDetailModalProps {
  visible: boolean;
  food: FoodLookupResult | null;
  onClose: () => void;
}

export default function FoodDetailModal({
  visible,
  food,
  onClose,
}: FoodDetailModalProps) {
  const { addToCart } = useCart();

  if (!food) return null;

  const handleAddToCart = () => {
    addToCart(food, 1, 'serving');
    Alert.alert('Added to Cart', `${food.description} has been added to your meal basket.`);
    onClose();
  };

  // Extract basic nutrients for display
  const getNutrientValue = (nutrientNumber: string): number => {
    const nutrient = food.foodNutrients?.find(n => n.nutrientNumber === nutrientNumber);
    return nutrient?.value || 0;
  };

  const calories = getNutrientValue('208');
  const protein = getNutrientValue('203');
  const carbs = getNutrientValue('205');
  const fat = getNutrientValue('204');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Food Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Food Name */}
          <View style={styles.section}>
            <Text style={styles.foodName}>{food.description}</Text>
            {food.brandOwner && (
              <Text style={styles.brandName}>{food.brandOwner}</Text>
            )}
          </View>

          {/* Basic Nutrition */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition (per 100g)</Text>
            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{calories.toFixed(0)}</Text>
                <Text style={styles.nutritionLabel}>Calories</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{protein.toFixed(1)}g</Text>
                <Text style={styles.nutritionLabel}>Protein</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{carbs.toFixed(1)}g</Text>
                <Text style={styles.nutritionLabel}>Carbs</Text>
              </View>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionValue}>{fat.toFixed(1)}g</Text>
                <Text style={styles.nutritionLabel}>Fat</Text>
              </View>
            </View>
          </View>

          {/* Food Category */}
          {food.foodCategory && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <Text style={styles.categoryText}>{food.foodCategory}</Text>
            </View>
          )}

          {/* Ingredients */}
          {food.ingredients && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <Text style={styles.ingredientsText}>{food.ingredients}</Text>
            </View>
          )}

          {/* Data Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Source</Text>
            <Text style={styles.dataTypeText}>{food.dataType || 'USDA Food Database'}</Text>
          </View>
        </ScrollView>

        {/* Add to Cart Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
            <Ionicons name="add-circle-outline" size={20} color={colors.theme.white} />
            <Text style={styles.addButtonText}>Add to Meal Basket</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    backgroundColor: colors.background.primary,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[800],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  foodName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    lineHeight: typography.lineHeight.relaxed,
  },
  brandName: {
    fontSize: typography.fontSize.base,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  nutritionGrid: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    ...shadows.sm,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.theme.teal,
  },
  nutritionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  categoryText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    backgroundColor: colors.background.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  ingredientsText: {
    fontSize: typography.fontSize.base,
    color: colors.gray[700],
    lineHeight: typography.lineHeight.relaxed,
    backgroundColor: colors.background.primary,
    padding: spacing.base,
    borderRadius: borderRadius.sm,
  },
  dataTypeText: {
    fontSize: typography.fontSize.sm,
    color: colors.gray[500],
    fontStyle: 'italic',
  },
  footer: {
    backgroundColor: colors.background.primary,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  addButton: {
    backgroundColor: colors.theme.teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  addButtonText: {
    color: colors.theme.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
});